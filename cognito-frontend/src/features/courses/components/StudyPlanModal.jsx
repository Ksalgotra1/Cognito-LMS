import React, { useState } from 'react';
import client from '../../../lib/axios';
import { 
  X, Calendar, Clock, CheckCircle, TrendingUp, 
  Loader2, ArrowRight, BookOpen, AlertTriangle 
} from 'lucide-react';

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const StudyPlanModal = ({ courseId, onClose }) => {
  const [step, setStep] = useState(1); // 1 = Input, 2 = Loading, 3 = Result
  const [targetDate, setTargetDate] = useState('');
  const [availability, setAvailability] = useState({
    Mon: 60, Tue: 60, Wed: 60, Thu: 60, Fri: 60, Sat: 120, Sun: 120
  });
  const [schedule, setSchedule] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    setStep(2);
    setError(null);
    try {
      // ✅ CORRECT URL (Includes /api prefix)
      const response = await client.post(`/api/courses/${courseId}/generate-plan/`, {
        target_date: targetDate,
        availability: availability
      });
      setSchedule(response.data);
      setStep(3);
    } catch (err) {
      console.error(err);
      
      // Clean, user-friendly error message extraction
      let message = "Failed to generate plan. Please check your network.";
      if (err.response && err.response.data) {
          // Prefer 'error' key, fallback to 'detail' or generic message
          message = err.response.data.error || err.response.data.detail || "Server error occurred.";
      }
      
      setError(message);
      setStep(1);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col ring-1 ring-gray-900/5">
        
        {/* HEADER */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">AI Study Scheduler</h2>
              <p className="text-xs text-gray-500">Optimized via Greedy Allocation Algorithm</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-8 overflow-y-auto flex-1 bg-white">
          
          {/* USER FRIENDLY ERROR MESSAGE */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
               <AlertTriangle className="w-5 h-5 flex-shrink-0" />
               <span className="font-medium text-sm">{error}</span>
            </div>
          )}

          {/* STEP 1: INPUTS */}
          {step === 1 && (
            <div className="space-y-8">
              {/* Target Date Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-500" />
                  Target Completion Date
                </label>
                <input 
                  type="date" 
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-gray-700 font-medium"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </div>

              {/* Availability Matrix */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  Weekly Availability (Minutes per day)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {DAYS.map(day => (
                    <div key={day} className="bg-gray-50 p-3 rounded-xl border border-gray-100 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">{day}</span>
                      <div className="flex items-center gap-1">
                        <input 
                          type="number" 
                          min="0"
                          max="1440"
                          className="w-full bg-transparent font-bold text-gray-900 outline-none text-lg p-0"
                          value={availability[day]}
                          onChange={(e) => setAvailability({...availability, [day]: parseInt(e.target.value) || 0})}
                        />
                        <span className="text-xs text-gray-400 font-medium">min</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: LOADING */}
          {step === 2 && (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <div className="relative">
                 <div className="w-16 h-16 border-4 border-indigo-100 rounded-full"></div>
                 <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
              </div>
              <div className="text-center">
                <p className="text-gray-900 font-semibold text-lg">Calculating Optimal Path...</p>
                <p className="text-gray-500 text-sm mt-1">Analyzing dependencies & time constraints</p>
              </div>
            </div>
          )}

          {/* STEP 3: RESULTS (THE SCHEDULE) */}
          {step === 3 && schedule && (
            <div className="space-y-6">
              <div className="bg-green-50 text-green-900 p-4 rounded-xl text-sm border border-green-200 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Plan Generated!</strong>
                  <p className="text-green-800/80 mt-1">
                    We fit {schedule.reduce((acc, day) => acc + day.lessons.length, 0)} lessons into {schedule.length} active study days.
                  </p>
                </div>
              </div>
              
              <div className="space-y-0 relative pl-4">
                <div className="absolute left-[5.5rem] top-2 bottom-2 w-0.5 bg-gray-100"></div>

                {schedule.map((day, idx) => (
                  <div key={idx} className="flex gap-6 relative py-4 first:pt-0 last:pb-0 group">
                    
                    {/* Date Column */}
                    <div className="w-16 flex-shrink-0 text-right pt-1">
                      <div className="font-bold text-gray-900 text-sm">{new Date(day.date).toLocaleDateString(undefined, {weekday: 'short'})}</div>
                      <div className="text-xs text-gray-400">{new Date(day.date).getDate()} {new Date(day.date).toLocaleDateString(undefined, {month: 'short'})}</div>
                    </div>
                    
                    {/* Timeline Dot */}
                    <div className="relative flex flex-col items-center pt-2 z-10">
                      <div className="w-3 h-3 rounded-full bg-white border-2 border-indigo-600 group-hover:scale-125 transition-transform shadow-sm"></div>
                    </div>

                    {/* Lessons Card */}
                    <div className="flex-1">
                      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group-hover:border-indigo-200">
                        <div className="space-y-3">
                          {day.lessons.map(lesson => (
                            <div key={lesson.id} className="flex justify-between items-start gap-3">
                              <div className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <span className="text-sm font-medium text-gray-700 leading-tight">{lesson.title}</span>
                              </div>
                              <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-full whitespace-nowrap">
                                {lesson.duration}m
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-50 flex justify-end">
                           <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                             Total: {day.lessons.reduce((sum, l) => sum + l.duration, 0)} mins
                           </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
          {step === 3 ? (
            <button onClick={onClose} className="px-6 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-black font-medium transition flex items-center gap-2 shadow-lg shadow-gray-200">
              Start Learning <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <>
              <button onClick={onClose} className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition">
                Cancel
              </button>
              {step === 1 && (
                <button 
                  onClick={handleGenerate}
                  disabled={!targetDate}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition flex items-center gap-2 shadow-lg shadow-indigo-200"
                >
                  <Loader2 className={`w-4 h-4 ${step === 2 ? 'animate-spin' : 'hidden'}`} />
                  Generate Plan
                </button>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default StudyPlanModal;