import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getCourse, toggleLessonCompletion } from '../slices/coursesSlice';

const CourseDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  
  const { currentCourse: course, loading, error } = useSelector((state) => state.courses);
  const [activeLesson, setActiveLesson] = useState(null);

  useEffect(() => {
    dispatch(getCourse(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (course?.modules?.[0]?.lessons?.[0]) {
      setActiveLesson(course.modules[0].lessons[0]);
    }
  }, [course]);

  // Clean Handler: Toggles completion without debug logs
  const handleToggleComplete = () => {
    if (activeLesson) {
      dispatch(toggleLessonCompletion(activeLesson.id));
    }
  };

  // Helper: Check status from Redux to ensure UI syncs with store
  const isLessonCompleted = (lessonId) => {
    if (!course) return false;
    for (const module of course.modules) {
      const lesson = module.lessons.find(l => l.id === lessonId);
      if (lesson && lesson.is_completed) return true;
    }
    return false;
  };

  // SECURITY LAYER: Sanitization
  const getYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  if (loading) return <div className="p-8">Loading classroom...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  if (!course) return null;

  return (
    <div className="flex h-screen bg-gray-100">
      
      {/* LEFT SIDEBAR */}
      <div className="w-80 bg-white border-r overflow-y-auto flex-shrink-0">
        <div className="p-4 border-b">
          <Link to="/dashboard" className="text-sm text-gray-500 hover:text-black">← Back to Dashboard</Link>
          <h2 className="text-xl font-bold mt-2">{course.title}</h2>
        </div>

        <div>
          {course.modules?.map((module) => (
            <div key={module.id} className="border-b">
              <div className="p-3 bg-gray-50 font-semibold text-gray-700">
                {module.title}
              </div>
              <div>
                {module.lessons?.map((lesson) => (
                  <button
                    key={lesson.id}
                    onClick={() => setActiveLesson(lesson)}
                    className={`w-full text-left p-3 text-sm hover:bg-indigo-50 transition-colors flex items-center justify-between
                      ${activeLesson?.id === lesson.id ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600' : 'text-gray-600'}
                    `}
                  >
                    <span className="flex items-center">
                       <span className="mr-2">▶</span> {lesson.title}
                    </span>
                    {/* Checkmark Indicator */}
                    {lesson.is_completed && <span className="text-green-500 text-xs font-bold">✅</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT MAIN AREA */}
      <div className="flex-1 p-8 overflow-y-auto">
        {activeLesson ? (
          <div className="max-w-4xl mx-auto">
            
            {/* VIDEO PLAYER */}
            <div className="aspect-video bg-black rounded-lg mb-6 overflow-hidden shadow-lg">
              {getYouTubeId(activeLesson.content) ? (
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${getYouTubeId(activeLesson.content)}`}
                  title={activeLesson.title}
                  referrerPolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  sandbox="allow-scripts allow-same-origin allow-presentation"
                  className="w-full h-full border-0"
                ></iframe>
              ) : (
                <div className="flex items-center justify-center h-full text-white bg-gray-900">
                  <p className="p-4">
                    No video content found. (Content: {activeLesson.content})
                  </p>
                </div>
              )}
            </div>

            {/* HEADER WITH COMPLETION BUTTON */}
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h1 className="text-2xl font-bold">{activeLesson.title}</h1>
              
              <button
                onClick={handleToggleComplete}
                className={`px-4 py-2 rounded-lg font-semibold transition-all shadow-sm flex items-center gap-2
                  ${isLessonCompleted(activeLesson.id)
                    ? "bg-green-100 text-green-700 border border-green-200 cursor-default"
                    : "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md"
                  }`}
              >
                {isLessonCompleted(activeLesson.id) ? (
                  <>
                    <span>Completed</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  </>
                ) : (
                  "Mark as Complete"
                )}
              </button>
            </div>
            
            <div className="prose bg-white p-6 rounded shadow max-w-none">
               <p className="text-gray-600">
                 {getYouTubeId(activeLesson.content) 
                   ? "Watch the video above to complete this lesson." 
                   : activeLesson.content}
               </p>
            </div>

          </div>
        ) : (
          <div className="text-center mt-20 text-gray-500">
            Select a lesson to start learning.
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetail;