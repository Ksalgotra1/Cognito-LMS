import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import client from '../../../lib/axios';
import { Play, BookOpen, Compass, Sparkles, Rocket, User, CheckCircle } from 'lucide-react';
import { MarketplaceSkeleton } from '../../../components/ui/Skeletons';

const CourseMarketplace = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [courses, setCourses] = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set()); // Store IDs for fast lookup
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Fetch All Courses (Catalog)
        const coursesRes = await client.get('/api/courses/');
        
        // 2. Fetch User's Enrolled Courses (from Dashboard endpoint)
        // We use this to figure out which ones they already own.
        let myIds = new Set();
        if (user) {
            try {
                const dashboardRes = await client.get('/api/courses/dashboard/stats/');
                // Assuming dashboardRes.data.enrolled_courses is the list
                dashboardRes.data.enrolled_courses.forEach(c => myIds.add(c.id));
            } catch (err) {
                console.warn("Could not fetch enrollment status", err);
            }
        }

        setCourses(coursesRes.data);
        setEnrolledCourseIds(myIds);

      } catch (err) {
        console.error("Failed to load marketplace:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleCardClick = (courseId) => {
     navigate(`/courses/${courseId}`);
  };

  if (loading) return <MarketplaceSkeleton />;

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans max-w-7xl mx-auto relative">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4 animate-fade-in">
        <div>
          <h1 className="text-4xl font-extrabold text-blue-700 tracking-tight flex items-center gap-3">
             Explore Catalog <Rocket size={32} className="text-blue-600" />
          </h1>
          <p className="text-gray-600 mt-3 flex items-center gap-2 text-lg font-medium">
             <Compass size={20} className="text-blue-500" />
             Discover new skills and master advanced topics.
          </p>
        </div>
      </div>

      {/* GRID SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {courses.map((course) => {
          // CHECK: Is the user enrolled?
          const isEnrolled = enrolledCourseIds.has(course.id);

          return (
            <div 
                key={course.id} 
                onClick={() => handleCardClick(course.id)}
                className={`group bg-white rounded-2xl shadow-sm border hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col overflow-hidden h-full 
                    ${isEnrolled ? 'border-green-200 ring-1 ring-green-100' : 'border-gray-100'}
                `}
            >
                {/* Thumbnail Area */}
                <div className="h-48 w-full bg-gray-200 relative overflow-hidden">
                {course.thumbnail_url ? (
                    <img 
                        src={course.thumbnail_url} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        alt={course.title} 
                        onError={(e) => {e.target.style.display='none'}} 
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <BookOpen className="text-gray-300 h-12 w-12"/>
                    </div>
                )}
                
                {/* Badge Overlay */}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-blue-800 shadow-sm flex items-center gap-1">
                    {isEnrolled ? (
                        <span className="text-green-700 flex items-center gap-1"><CheckCircle size={12}/> Enrolled</span>
                    ) : (
                        <span className="flex items-center gap-1"><Sparkles size={12} className="text-yellow-500" fill="currentColor"/> Pro Series</span>
                    )}
                </div>
                </div>

                {/* Content Area */}
                <div className="p-5 flex flex-col flex-1">
                    <h4 className="font-bold text-xl text-gray-900 line-clamp-1 group-hover:text-blue-700 transition-colors mb-2">
                        {course.title}
                    </h4>

                    <p className="text-sm text-gray-500 line-clamp-2 mb-6 leading-relaxed">
                        {course.description || "Unlock your potential with this comprehensive course."}
                    </p>

                    {/* Modern Footer */}
                    <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                        {/* Instructor */}
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                                <User size={14} className="text-blue-600" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Instructor</span>
                                <span className="text-xs font-bold text-gray-700">
                                    {course.instructor_name || "Cognito Team"}
                                </span>
                            </div>
                        </div>

                        {/* DYNAMIC BUTTON */}
                        {isEnrolled ? (
                            <button className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-200 transition-all flex items-center gap-2">
                                Resume <Play size={10} fill="currentColor"/> 
                            </button>
                        ) : (
                            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 transition-all flex items-center gap-2">
                                Enroll Now <Play size={10} fill="currentColor"/> 
                            </button>
                        )}
                    </div>
                </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CourseMarketplace;