import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import client from '../../../lib/axios';
import { Play, BookOpen, Award, Zap, ChevronLeft, ChevronRight, CheckCircle, X } from 'lucide-react';
import { DashboardSkeleton } from '../../../components/ui/Skeletons';

const Dashboard = () => {
  const navigate = useNavigate();
  // Get user from Redux (This updates instantly when SettingsModal dispatches changes)
  const { user, token } = useSelector((state) => state.auth);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Carousel State
  const [currentSlide, setCurrentSlide] = useState(0); 
  const [imgError, setImgError] = useState(false);

  // Modal State
  const [showCertModal, setShowCertModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // --- 1. FETCH DATA ---
  useEffect(() => {
    if (!token) return;

    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await client.get('/api/courses/dashboard/stats/');
        setData(response.data);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  // --- 2. FILTER LOGIC ---
  const allCourses = data?.enrolled_courses || [];
  
  // Active = In Progress (<100%). Sorted by most recent activity first.
  const activeCourses = allCourses
    .filter(course => course.progress < 100)
    .sort((a, b) => {
      if (!a.last_activity && !b.last_activity) return 0;
      if (!a.last_activity) return 1;
      if (!b.last_activity) return -1;
      return new Date(b.last_activity) - new Date(a.last_activity);
    });
  const heroCourse = activeCourses[currentSlide];

  useEffect(() => { setImgError(false); }, [currentSlide]);

  const nextSlide = () => setCurrentSlide((prev) => (prev === activeCourses.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? activeCourses.length - 1 : prev - 1));

  // --- 3. INTERACTION HANDLERS ---
  
  const handleCardClick = (course) => {
    if (course.progress === 100) {
      setSelectedCourse(course);
      setShowCertModal(true);
    } else {
      const index = activeCourses.findIndex(c => c.id === course.id);
      if (index !== -1) {
        setCurrentSlide(index);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
         navigate(`/courses/${course.id}`);
      }
    }
  };

  const handleCertYes = async () => {
    if (!selectedCourse) return;
    
    try {
      console.log(`Downloading certificate for: ${selectedCourse.title}`);

      const response = await client.get(`/api/courses/${selectedCourse.id}/certificate/`, {
        responseType: 'blob', 
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Certificate-${selectedCourse.title.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setShowCertModal(false);
      navigate(`/courses/${selectedCourse.id}`);

    } catch (err) {
      console.error("CERTIFICATE ERROR:", err);
      
      if (err.response) {
        const status = err.response.status;
        const data = err.response.data; 

        if (status === 403) {
            alert(`⛔️ ACCESS DENIED (403)\n\nReason: ${JSON.stringify(data)}\n\nYou must mark all lessons complete and pass all quizzes.`);
        } else if (status === 404) {
            alert(`❌ 404 NOT FOUND\n\nThe URL is wrong. Backend expects: /api/courses/${selectedCourse.id}/certificate/`);
        } else if (status === 500) {
            alert("🔥 SERVER ERROR (500)\n\nCheck your Python Terminal for error logs.");
        } else {
            alert(`Error ${status}: ${err.response.statusText}`);
        }
      } else {
        alert(`Network Error: ${err.message}`);
      }
    }
  };

  const handleCertNo = () => {
    // Just navigate without downloading
    setShowCertModal(false);
    if (selectedCourse) navigate(`/courses/${selectedCourse.id}`);
  };

  if (loading && !data) return <DashboardSkeleton />;

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans max-w-7xl mx-auto relative">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          {/* ✅ UPDATED: Uses First Name if available, otherwise fallback to Username */}
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.first_name || user?.username}!
          </h1>
          <p className="text-gray-500 mt-1">
             {activeCourses.length > 0 
               ? `You have ${activeCourses.length} courses in progress.` 
               : "All caught up! Check your completed courses below."}
          </p>
        </div>
      </div>

      {/* HERO CAROUSEL (Active Courses Only) */}
      {activeCourses.length > 0 && heroCourse && (
        <div className="relative mb-12 group">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col md:flex-row min-h-[350px] transition-all duration-300">
             
             {/* Left: Image */}
             <div className="md:w-5/12 relative overflow-hidden bg-gray-900">
               {heroCourse.thumbnail && !imgError ? (
                 <img key={heroCourse.id} src={heroCourse.thumbnail} alt={heroCourse.title} className="w-full h-full object-cover opacity-90 animate-fade-in" onError={() => setImgError(true)} />
               ) : (
                 <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                   <BookOpen className="text-white/20 h-24 w-24" />
                 </div>
               )}
               <div className="absolute top-4 left-4 bg-black/60 backdrop-blur border border-white/20 px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1 z-10">
                 <Zap size={12} className="text-yellow-400" fill="currentColor" /> IN PROGRESS
               </div>
             </div>

             {/* Right: Content */}
             <div className="p-8 md:w-7/12 flex flex-col justify-center relative">
               <div className="mb-6 animate-fade-in">
                 <h2 className="text-3xl font-bold text-gray-900 mb-2">{heroCourse.title}</h2>
                 <p className="text-gray-500 text-sm mb-4">{heroCourse.total_lessons} Lessons • Keep going!</p>
                 
                 <div className="w-full bg-gray-100 rounded-full h-4 mb-2 overflow-hidden shadow-inner">
                   <div 
                     className="bg-blue-600 h-full rounded-full transition-all duration-700 ease-out relative" 
                     style={{ width: `${heroCourse.progress}%` }}
                   >
                      <div className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                   </div>
                 </div>

                 <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {heroCourse.progress}% Completed
                    </span>
                    <span className="text-xs text-gray-400">
                      {heroCourse.completed_lessons || 0}/{heroCourse.total_lessons} Steps
                    </span>
                 </div>

               </div>
               
               <button onClick={() => navigate(heroCourse.next_lesson_url || `/courses/${heroCourse.id}`)} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all flex items-center gap-2 w-fit">
                   <Play size={20} fill="currentColor" /> Continue Lesson
               </button>
             </div>
          </div>

          {activeCourses.length > 1 && (
            <>
              <button onClick={prevSlide} className="absolute left-[-20px] top-1/2 -translate-y-1/2 bg-white p-3 rounded-full shadow-lg border border-gray-100 text-gray-700 hover:text-blue-600 hover:scale-110 transition-all z-10 hidden md:block"><ChevronLeft size={24}/></button>
              <button onClick={nextSlide} className="absolute right-[-20px] top-1/2 -translate-y-1/2 bg-white p-3 rounded-full shadow-lg border border-gray-100 text-gray-700 hover:text-blue-600 hover:scale-110 transition-all z-10 hidden md:block"><ChevronRight size={24}/></button>
            </>
          )}
        </div>
      )}

      {/* IN-PROGRESS COURSES */}
      <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <BookOpen className="text-gray-400" size={20}/> Your Learning Library
      </h3>
      
      {activeCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeCourses.map((course) => (
            <div 
              key={course.id} 
              onClick={() => handleCardClick(course)}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer flex flex-col gap-4 relative group"
            >
              <div className="h-40 w-full rounded-xl bg-gray-200 overflow-hidden relative">
                 {course.thumbnail ? (
                    <img src={course.thumbnail} className="w-full h-full object-cover" alt="" onError={(e) => {e.target.style.display='none'}} />
                 ) : <div className="w-full h-full flex items-center justify-center"><BookOpen className="text-gray-400"/></div>}
              </div>

              <div className="flex flex-col justify-between flex-1">
                  <div>
                     <h4 className="font-bold text-gray-900 line-clamp-1">{course.title}</h4>
                     <p className="text-xs text-gray-500 mt-1">{course.total_lessons} Lessons</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                      <Zap size={12} fill="currentColor"/> {course.progress}% Progress
                    </div>
                  </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-sm mb-8">No courses in progress. Browse the marketplace to enroll!</p>
      )}

      {/* COMPLETED COURSES */}
      {allCourses.filter(c => c.progress === 100).length > 0 && (
        <>
          <h3 className="text-xl font-bold text-gray-800 mt-12 mb-6 flex items-center gap-2">
            <Award className="text-green-500" size={20}/> Completed Courses
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allCourses.filter(c => c.progress === 100).map((course) => (
              <div 
                key={course.id} 
                onClick={() => handleCardClick(course)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-green-200 bg-green-50/30 hover:shadow-md transition-all cursor-pointer flex flex-col gap-4 relative group"
              >
                <div className="h-40 w-full rounded-xl bg-gray-200 overflow-hidden relative">
                   {course.thumbnail ? (
                      <img src={course.thumbnail} className="w-full h-full object-cover" alt="" onError={(e) => {e.target.style.display='none'}} />
                   ) : <div className="w-full h-full flex items-center justify-center"><BookOpen className="text-gray-400"/></div>}
                   
                   <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white font-bold flex items-center gap-2"><Award/> Certificate Ready</span>
                   </div>
                </div>

                <div className="flex flex-col justify-between flex-1">
                    <div>
                       <h4 className="font-bold text-gray-900 line-clamp-1">{course.title}</h4>
                       <p className="text-xs text-gray-500 mt-1">{course.total_lessons} Lessons</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div className="text-xs font-bold text-green-700 flex items-center gap-1 w-full">
                         <CheckCircle size={14} /> Completed. <span className="underline ml-1">Get Certificate</span>
                      </div>
                    </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* MODAL */}
      {showCertModal && selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
              <button onClick={() => setShowCertModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>

              <div className="text-center">
                 <div className="mx-auto bg-green-100 h-16 w-16 rounded-full flex items-center justify-center mb-4">
                    <Award size={32} className="text-green-600" />
                 </div>
                 
                 <h2 className="text-2xl font-bold text-gray-900 mb-2">Congratulations! 🎉</h2>
                 <p className="text-gray-600 mb-6">
                   You have successfully completed <strong>{selectedCourse.title}</strong>.
                 </p>
                 
                 <p className="text-lg font-semibold text-gray-800 mb-6">
                   Do you want to download your Certificate?
                 </p>

                 <div className="flex gap-3">
                    <button onClick={handleCertNo} className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">
                      No, just view
                    </button>
                    <button onClick={handleCertYes} className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200 transition-colors">
                      Yes, Download!
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;