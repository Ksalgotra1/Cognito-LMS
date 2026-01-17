import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getCourse, toggleLessonCompletion } from '../slices/coursesSlice';

// Custom Components
import CourseGraph from './CourseGraph';
import StudyPlanModal from './StudyPlanModal';
import AiTutor from './AiTutor'; //  Import AI Tutor
import CodeEditor from '../../../components/ui/CodeEditor'; //  Import Code Editor

//  Icons
import { 
  ArrowLeft, Calendar, CheckCircle, Circle, PlayCircle, 
  FileText, FileQuestion, Layout, Video, Check, GitMerge,
  Code, Sparkles //  Icons for Tabs
} from 'lucide-react';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // --- REDUX STATE ---
  const { currentCourse: course, loading, error } = useSelector((state) => state.courses);
  
  // --- LOCAL STATE ---
  const [activeLesson, setActiveLesson] = useState(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [activeTab, setActiveTab] = useState('video'); //  'video' | 'lab'

  // --- 1. FETCH DATA ---
  useEffect(() => {
    dispatch(getCourse(id));
  }, [dispatch, id]);

  // --- 2. AUTO-SELECT FIRST LESSON ---
  useEffect(() => {
    if (course?.modules?.[0]?.lessons?.[0] && !activeLesson) {
      setActiveLesson(course.modules[0].lessons[0]);
    }
  }, [course]);

  // --- HANDLERS ---
  const handleToggleComplete = () => {
    if (activeLesson) {
      dispatch(toggleLessonCompletion(activeLesson.id));
    }
  };

  const isLessonCompleted = (lessonId) => {
    if (!course) return false;
    for (const module of course.modules) {
      const lesson = module.lessons.find(l => l.id === lessonId);
      if (lesson && lesson.is_completed) return true;
    }
    return false;
  };

  const getYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  if (loading) return <div className="h-screen flex items-center justify-center text-indigo-600 font-medium">Loading classroom...</div>;
  if (error) return <div className="p-8 text-red-500 font-bold text-center">Error loading course: {error}</div>;
  if (!course) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold text-gray-800">Course Not Found</h1>
        <button 
          onClick={() => navigate('/dashboard')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 font-sans relative overflow-hidden">
      
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
        <div className="p-5 border-b border-gray-100 bg-white sticky top-0 z-20">
          <Link to="/dashboard" className="text-xs font-semibold text-gray-500 hover:text-indigo-600 uppercase tracking-wide transition flex items-center gap-1 mb-3">
            <ArrowLeft className="w-3 h-3" /> Back to Dashboard
          </Link>
          <h2 className="text-lg font-bold text-gray-900 leading-tight line-clamp-2">{course.title}</h2>
          
          <button 
             onClick={() => setShowScheduler(true)}
             className="mt-4 w-full text-xs bg-indigo-50 text-indigo-700 py-2.5 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition font-medium flex items-center justify-center gap-2 group"
          >
            <Calendar className="w-3.5 h-3.5 group-hover:text-indigo-800" /> 
            Generate Study Plan
          </button>
        </div>

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
                  const isComplete = lesson.is_completed;

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => setActiveLesson(lesson)}
                      className={`w-full text-left p-3 text-sm transition-all flex items-center justify-between border-l-[3px]
                        ${isActive 
                          ? 'bg-indigo-50 text-indigo-900 border-indigo-600 font-medium' 
                          : 'text-gray-600 border-transparent hover:bg-gray-50 hover:text-gray-900'}
                      `}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                         {isComplete ? (
                           <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                         ) : isActive ? (
                           <PlayCircle className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                         ) : (
                           <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                         )}
                         <span className="truncate">{lesson.title}</span>
                      </div>
                      
                      <span className="text-[10px] text-gray-400">
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
          <div className="max-w-6xl mx-auto space-y-6"> {/* Expanded width for Split View */}
            
            {/*  TAB SWITCHER */}
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
              <button
                onClick={() => setActiveTab('lab')}
                className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === 'lab' 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Code size={18} /> Coding Lab & AI
              </button>
            </div>

            {/*  CONDITIONAL RENDERING BASED ON TAB */}
            {activeTab === 'video' ? (
              // --- 1. VIDEO TAB (Original Content) ---
              <div className="animate-in fade-in duration-300 space-y-8">
                {/* VIDEO PLAYER */}
                <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-black/10 relative group">
                  {getYouTubeId(activeLesson.content) ? (
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
                  )}
                </div>

                {/* CONTROLS */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{activeLesson.title}</h1>
                  </div>
                  <div className="flex gap-3 w-full md:w-auto">
                    <button onClick={handleToggleComplete} disabled={isLessonCompleted(activeLesson.id)} 
                      className={`flex-1 md:flex-none px-5 py-2.5 rounded-lg font-semibold transition-all shadow-sm flex items-center justify-center gap-2 
                      ${isLessonCompleted(activeLesson.id) ? "bg-green-50 text-green-700 border border-green-200 cursor-default" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}>
                      {isLessonCompleted(activeLesson.id) ? <><Check className="w-4 h-4" /> Completed</> : <><CheckCircle className="w-4 h-4" /> Mark Complete</>}
                    </button>
                    <button onClick={() => navigate(`/courses/lessons/${activeLesson.id}/quiz`)} className="flex-1 md:flex-none px-5 py-2.5 rounded-lg font-semibold bg-white text-gray-700 border border-gray-200 hover:bg-purple-50 hover:text-purple-700 transition-all shadow-sm flex items-center justify-center gap-2 group">
                      <FileQuestion className="w-4 h-4 text-gray-400 group-hover:text-purple-600" /> Take Quiz
                    </button>
                  </div>
                </div>

                {/* NOTES */}
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200/60 prose prose-indigo max-w-none">
                   <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4"><FileText className="w-5 h-5 text-gray-400" /> Lesson Notes</h3>
                   <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{getYouTubeId(activeLesson.content) ? "Watch the video..." : activeLesson.content}</p>
                </div>

                {/* GRAPH */}
                {course.prerequisites && course.prerequisites.length > 0 && (
                  <div className="mt-8"><CourseGraph currentCourse={course} prerequisites={course.prerequisites} /></div>
                )}
              </div>
            ) : (
              // --- 2. LAB TAB (Code + AI) ---
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-2 duration-500 h-[600px]">
                 {/* LEFT: Code Editor (Takes 2/3 width) */}
                 <div className="lg:col-span-2 flex flex-col gap-4">
                    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm flex justify-between items-center">
                       <span className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Code className="w-4 h-4 text-blue-500"/> Python Sandbox</span>
                       <span className="text-xs text-gray-400">Automated Environment</span>
                    </div>
                    <div className="flex-1 min-h-0">
                      <CodeEditor language="python" initialCode={`# Practice code for: ${activeLesson.title}\n\ndef solve():\n    print("Hello Cognito!")\n\nsolve()`} />
                    </div>
                 </div>

                 {/* RIGHT: AI Tutor (Takes 1/3 width) */}
                 <div className="flex flex-col gap-4">
                    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm flex justify-between items-center">
                       <span className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Sparkles className="w-4 h-4 text-yellow-500"/> AI Tutor</span>
                       <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Online</span>
                    </div>
                    <div className="flex-1 min-h-0">
                       <AiTutor courseId={course.id} />
                    </div>
                 </div>
              </div>
            )}

          </div>
        ) : (
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