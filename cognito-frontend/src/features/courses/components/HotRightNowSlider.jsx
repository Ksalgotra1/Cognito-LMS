import React, { useEffect, useState } from 'react';
import { Flame, Play, Users, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchHotCourses } from '../api/coursesApi';

const HotRightNowSlider = () => {
  const [hotCourses, setHotCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [imgError, setImgError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadHotCourses = async () => {
      try {
        const data = await fetchHotCourses();
        setHotCourses(data);
      } catch (err) {
        console.error("Failed to load hot courses", err);
      } finally {
        setLoading(false);
      }
    };
    loadHotCourses();
  }, []);

  useEffect(() => { setImgError(false); }, [currentSlide]);

  // Auto-scroll logic (pauses on hover)
  useEffect(() => {
    if (hotCourses.length <= 1 || isHovered) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev === hotCourses.length - 1 ? 0 : prev + 1));
    }, 4000); // 4 seconds per slide

    return () => clearInterval(interval);
  }, [hotCourses.length, isHovered]);

  if (loading || hotCourses.length === 0) return null;

  const nextSlide = () => setCurrentSlide((prev) => (prev === hotCourses.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? hotCourses.length - 1 : prev - 1));

  const course = hotCourses[currentSlide];

  return (
    <div className="mb-12 animate-fade-in relative group">
      <div className="flex items-center gap-2 mb-6">
        <Flame size={28} className="text-orange-500 animate-pulse" fill="currentColor" />
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Hot Right Now</h2>
        <span className="ml-2 text-xs font-bold uppercase tracking-wider bg-red-100 text-red-600 px-2 py-1 rounded-full">Trending</span>
      </div>
      
      {/* Hero Carousel Container */}
      <div 
        className="bg-gradient-to-br from-gray-900 to-black rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[350px] transition-all duration-300 border border-gray-800"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
         
         {/* Left: Image */}
         <div className="md:w-5/12 relative overflow-hidden bg-black/50">
           {course.thumbnail_url && !imgError ? (
             <img key={course.id} src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover opacity-80 animate-fade-in" onError={() => setImgError(true)} />
           ) : (
             <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-900 to-red-900 opacity-80">
               <BookOpen className="text-white/20 h-24 w-24" />
             </div>
           )}
           <div className="absolute top-4 left-4 bg-white/10 backdrop-blur border border-white/20 px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1 z-10">
             <Users size={12} className="text-blue-300" /> SURGING
           </div>
         </div>

         {/* Right: Content */}
         <div className="p-8 md:w-7/12 flex flex-col justify-center relative">
           <div className="mb-6 animate-fade-in">
             <h2 className="text-4xl font-bold text-white mb-3 tracking-tight">{course.title}</h2>
             <p className="text-gray-300 text-lg mb-6 line-clamp-3">
               {course.description}
             </p>
             
             <div className="flex items-center gap-4">
                <button onClick={() => navigate(`/courses/${course.id}`)} className="px-8 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold shadow-lg shadow-orange-900/50 transition-all flex items-center gap-2 w-fit">
                    <Play size={20} fill="currentColor" /> Explore Course
                </button>
             </div>
           </div>
         </div>
      </div>

      {hotCourses.length > 1 && (
        <>
          <button onClick={prevSlide} className="absolute left-[-20px] top-[65%] -translate-y-1/2 bg-white p-3 rounded-full shadow-lg border border-gray-100 text-gray-700 hover:text-orange-600 hover:scale-110 transition-all z-10 hidden md:block"><ChevronLeft size={24}/></button>
          <button onClick={nextSlide} className="absolute right-[-20px] top-[65%] -translate-y-1/2 bg-white p-3 rounded-full shadow-lg border border-gray-100 text-gray-700 hover:text-orange-600 hover:scale-110 transition-all z-10 hidden md:block"><ChevronRight size={24}/></button>
        </>
      )}
    </div>
  );
};

export default HotRightNowSlider;
