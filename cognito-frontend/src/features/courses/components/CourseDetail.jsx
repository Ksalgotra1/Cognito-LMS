import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { 
  ArrowLeft, Calendar, CheckCircle, Circle, PlayCircle, 
  FileText, FileQuestion, Layout, Video, Check, 
  Code, Sparkles, Lock, Clock 
} from 'lucide-react';

// --- API & ACTIONS ---
import { fetchCourseById, enrollCourse } from '../api/coursesApi'; // Uses our new API
import { toggleLessonCompletion } from '../slices/coursesSlice';

// --- COMPONENTS ---
import CourseGraph from './CourseGraph';
import StudyPlanModal from './StudyPlanModal';
import AiTutor from './AiTutor'; 
import CodeEditor from '../../../components/ui/CodeEditor'; 

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // --- STATE ---
  const [course, setCourse] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // UI State
  const [showScheduler, setShowScheduler] = useState(false);
  const [activeTab, setActiveTab] = useState('video'); // 'video' | 'lab'
  const [enrolling, setEnrolling] = useState(false); // Loading state for Enroll button

  // --- 1. FETCH DATA ---
  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const data = await fetchCourseById(id);
      setCourse(data);
      
      // Auto-select first lesson if none active
      if (!activeLesson && data.modules?.[0]?.lessons?.[0]) {
        setActiveLesson(data.modules[0].lessons[0]);
      }
    } catch (err) {
      setError("Failed to load course details.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseData();
  }, [id]);

  // --- 2. HANDLERS ---
  
  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await enrollCourse(id);
      // Refresh data to update "is_enrolled" flag and unlock content immediately
      await fetchCourseData(); 
      alert("🎉 Enrollment Successful! The course is now unlocked.");
    } catch (error) {
      alert("Enrollment failed. Please try again.");
    } finally {
      setEnrolling(false);
    }
  };

  const handleToggleComplete = async () => {
    if (!activeLesson) return;

    // 1. Calculate new status
    const previousStatus = activeLesson.is_completed;
    const newStatus = !previousStatus;

    // 2. OPTIMISTIC UPDATE: Update UI immediately
    
    // Update the active lesson view (Right side)
    setActiveLesson(prev => ({ ...prev, is_completed: newStatus }));
    
    //  FIX: Update the Sidebar List immediately (Left side)
    setCourse((prevCourse) => {
        if (!prevCourse) return prevCourse;
        return {
            ...prevCourse,
            modules: prevCourse.modules.map((module) => ({
                ...module,
                lessons: module.lessons.map((lesson) => {
                    // Find the specific lesson and flip its status
                    if (lesson.id === activeLesson.id) {
                        return { ...lesson, is_completed: newStatus };
                    }
                    return lesson;
                }),
            })),
        };
    });

    // 3. SEND TO SERVER: Sync with backend
    try {
        await dispatch(toggleLessonCompletion(activeLesson.id)).unwrap();
        // Success! UI is already updated.
    } catch (error) {
        console.error("Sync failed, rolling back UI");
        
        // 4. ROLLBACK: If server failed, revert everything
        setActiveLesson(prev => ({ ...prev, is_completed: previousStatus }));
        setCourse((prevCourse) => {
            return {
                ...prevCourse,
                modules: prevCourse.modules.map((module) => ({
                    ...module,
                    lessons: module.lessons.map((lesson) => {
                        if (lesson.id === activeLesson.id) {
                            return { ...lesson, is_completed: previousStatus };
                        }
                        return lesson;
                    }),
                })),
            };
        });
        alert("Failed to save progress. Please check your connection.");
    }
  };

  // Helper to extract YouTube ID
  const getYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // --- RENDER HELPERS ---
  if (loading) return <div className="h-screen flex items-center justify-center text-indigo-600 font-medium">Loading classroom...</div>;
  if (error || !course) return <div className="p-8 text-center text-red-500 font-bold">Course not found or access denied.</div>;

  const isEnrolled = course.is_enrolled;

  return (
    <div className="flex h-screen bg-gray-50 font-sans relative overflow-hidden">
      
      {/* ===================================================
          MODAL LAYER: STUDY PLAN SCHEDULER
      =================================================== */}
      {showScheduler && (
        <StudyPlanModal 
          courseId={id} 
          onClose={() => setShowScheduler(false)} 
        />
      )}

      {/* ===================================================
          LEFT SIDEBAR: CURRICULUM
      =================================================== */}
      <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0 shadow-sm z-10 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-5 border-b border-gray-100 bg-white sticky top-0 z-20">
          <Link to="/dashboard" className="text-xs font-semibold text-gray-500 hover:text-indigo-600 uppercase tracking-wide transition flex items-center gap-1 mb-3">
            <ArrowLeft className="w-3 h-3" /> Back to Dashboard
          </Link>
          <h2 className="text-lg font-bold text-gray-900 leading-tight line-clamp-2">{course.title}</h2>
          
          {/* Show Scheduler ONLY if Enrolled */}
          {isEnrolled && (
            <button 
               onClick={() => setShowScheduler(true)}
               className="mt-4 w-full text-xs bg-indigo-50 text-indigo-700 py-2.5 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition font-medium flex items-center justify-center gap-2 group"
            >
              <Calendar className="w-3.5 h-3.5 group-hover:text-indigo-800" /> 
              Generate Study Plan
            </button>
          )}
        </div>

        {/* Lesson List */}
        <div className="flex-1 overflow-y-auto pb-10">
          {course.modules?.map((module) => (
            <div key={module.id} className="border-b border-gray-100 last:border-0">
              <div className="px-4 py-3 bg-gray-50/80 backdrop-blur-sm font-semibold text-gray-700 text-xs flex justify-between items-center sticky top-0 z-10 border-b border-gray-100/50">
                <span className="flex items-center gap-2">
                  <Layout className="w-3 h-3 text-gray-400" />
                  {module.title}
                </span>
              </div>
              <div>
                {module.lessons?.map((lesson) => {
                  const isActive = activeLesson?.id === lesson.id;
                  const isLocked = !isEnrolled; // Lock all lessons if not enrolled

                  return (
                    <button
                      key={lesson.id}
                      disabled={isLocked} // Disable click if locked
                      onClick={() => setActiveLesson(lesson)}
                      className={`w-full text-left p-3 text-sm transition-all flex items-center justify-between border-l-[3px]
                        ${isActive 
                          ? 'bg-indigo-50 text-indigo-900 border-indigo-600 font-medium' 
                          : 'text-gray-600 border-transparent hover:bg-gray-50 hover:text-gray-900'}
                        ${isLocked ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''}
                      `}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                         {/* Status Icon Logic */}
                         {isLocked ? (
                            <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                         ) : lesson.is_completed ? (
                           <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                         ) : isActive ? (
                           <PlayCircle className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                         ) : (
                           <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                         )}
                         <span className="truncate">{lesson.title}</span>
                      </div>
                      
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Clock size={10} />
                        {lesson.duration_minutes ? `${lesson.duration_minutes}m` : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===================================================
          RIGHT MAIN AREA: CONTENT PLAYER
      =================================================== */}
      <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-gray-50 scroll-smooth">
        {activeLesson ? (
          <div className="max-w-6xl mx-auto space-y-6"> 
            
            {/* --- HEADER & ENROLL BANNER --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <div>
                  <h1 className="text-2xl font-bold text-gray-900">{activeLesson.title}</h1>
                  {!isEnrolled && (
                    <p className="text-sm text-red-500 font-medium flex items-center gap-2 mt-1">
                       <Lock size={14}/> This content is locked.
                    </p>
                  )}
               </div>

               {/* Enroll Button (Visible only if NOT enrolled) */}
               {!isEnrolled && (
                  <button 
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="bg-blue-600 text-white px-6 py-2.5 rounded-lg shadow-lg hover:bg-blue-700 transition font-bold flex items-center gap-2 animate-pulse"
                  >
                    {enrolling ? "Unlocking..." : "Enroll Now to Unlock"}
                  </button>
               )}
            </div>

            {/* --- TAB SWITCHER --- */}
            <div className="flex gap-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('video')}
                className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === 'video' 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Video size={18} /> Video Lesson
              </button>
              
              {/* Lab Tab is DISABLED if not enrolled */}
              <button
                disabled={!isEnrolled}
                onClick={() => setActiveTab('lab')}
                className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === 'lab' 
                    ? 'border-indigo-600 text-indigo-600' 
                    : !isEnrolled 
                      ? 'border-transparent text-gray-300 cursor-not-allowed' 
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Code size={18} /> 
                {isEnrolled ? "Coding Lab & AI" : <span className="flex items-center gap-1">Coding Lab <Lock size={10}/></span>}
              </button>
            </div>

            {/* --- CONTENT AREA --- */}
            {activeTab === 'video' ? (
              // 🎥 VIDEO TAB
              <div className="animate-in fade-in duration-300 space-y-8">
                
                {/* VIDEO PLAYER CONTAINER */}
                <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-black/10 relative group">
                  {isEnrolled ? (
                    /* UNLOCKED: Show Video */
                    getYouTubeId(activeLesson.content) ? (
                      <iframe
                        width="100%" height="100%"
                        src={`https://www.youtube.com/embed/${getYouTubeId(activeLesson.content)}`}
                        title={activeLesson.title} allowFullScreen className="w-full h-full border-0"
                      ></iframe>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-900">
                        <FileText className="w-16 h-16 mb-4 opacity-50" />
                        <p className="font-medium text-lg text-gray-300">Text-based Lesson</p>
                      </div>
                    )
                  ) : (
                    /* LOCKED: Show Overlay */
                    <div className="absolute inset-0 bg-gray-900/95 flex flex-col items-center justify-center text-center p-6 z-20 backdrop-blur-sm">
                        <div className="bg-gray-800 p-4 rounded-full mb-4 ring-1 ring-gray-700">
                           <Lock size={40} className="text-gray-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Lesson Locked</h2>
                        <p className="text-gray-400 mb-6 max-w-md">
                          Enroll in <strong>{course.title}</strong> to access all video lessons, coding labs, and the AI Tutor.
                        </p>
                        <button 
                          onClick={handleEnroll}
                          disabled={enrolling}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-blue-500/30 transition-transform hover:scale-105"
                        >
                          {enrolling ? "Processing..." : "Unlock Full Course"}
                        </button>
                    </div>
                  )}
                </div>

                {/* CONTROLS (Mark Complete / Quiz) - Only if Enrolled */}
                {isEnrolled && (
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200/60 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-gray-500 text-sm">Completed this lesson?</p>
                    <div className="flex gap-3 w-full md:w-auto">
                      <button onClick={handleToggleComplete} 
                        className={`flex-1 md:flex-none px-5 py-2.5 rounded-lg font-semibold transition-all shadow-sm flex items-center justify-center gap-2 
                        ${activeLesson.is_completed ? "bg-green-50 text-green-700 border border-green-200" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}>
                        {activeLesson.is_completed ? <><Check className="w-4 h-4" /> Completed</> : <><CheckCircle className="w-4 h-4" /> Mark Complete</>}
                      </button>
                      
                      <button onClick={() => navigate(`/courses/lessons/${activeLesson.id}/quiz`)} className="flex-1 md:flex-none px-5 py-2.5 rounded-lg font-semibold bg-white text-gray-700 border border-gray-200 hover:bg-purple-50 hover:text-purple-700 transition-all shadow-sm flex items-center justify-center gap-2 group">
                        <FileQuestion className="w-4 h-4 text-gray-400 group-hover:text-purple-600" /> Take Quiz
                      </button>
                    </div>
                  </div>
                )}

                {/* NOTES AREA - Only if Enrolled */}
                {isEnrolled && (
                  <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200/60 prose prose-indigo max-w-none">
                     <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4"><FileText className="w-5 h-5 text-gray-400" /> Lesson Notes</h3>
                     <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{getYouTubeId(activeLesson.content) ? "Watch the video above to master this concept." : activeLesson.content}</p>
                  </div>
                )}

                {/* DEPENDENCY GRAPH - Shows even if locked to preview structure */}
                {course.prerequisites && course.prerequisites.length > 0 && (
                  <div className="mt-8"><CourseGraph currentCourse={course} prerequisites={course.prerequisites} /></div>
                )}
              </div>
            ) : (
              // 💻 LAB TAB (Only renders if Enrolled)
              isEnrolled && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-2 duration-500 h-[600px]">
                   {/* LEFT: Code Editor */}
                   <div className="lg:col-span-2 flex flex-col gap-4">
                      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm flex justify-between items-center">
                         <span className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Code className="w-4 h-4 text-blue-500"/> Python Sandbox</span>
                      </div>
                      <div className="flex-1 min-h-0">
                        <CodeEditor language="python" initialCode={`# Practice code for: ${activeLesson.title}\n\ndef solve():\n    print("Hello Cognito!")\n\nsolve()`} />
                      </div>
                   </div>

                   {/* RIGHT: AI Tutor */}
                   <div className="flex flex-col gap-4">
                      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm flex justify-between items-center">
                         <span className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Sparkles className="w-4 h-4 text-yellow-500"/> AI Tutor</span>
                         <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Online</span>
                      </div>
                      <div className="flex-1 min-h-0 bg-white border border-gray-200 rounded-lg overflow-hidden">
                         <AiTutor courseId={course.id} currentLessonContext={activeLesson.content} />
                      </div>
                   </div>
                </div>
              )
            )}

          </div>
        ) : (
          /* EMPTY STATE */
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="w-16 h-16 bg-gray-200 rounded-full mb-4 flex items-center justify-center animate-pulse"><PlayCircle className="w-8 h-8 text-gray-400" /></div>
            <p className="text-lg font-medium">Select a lesson to start learning</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetail;