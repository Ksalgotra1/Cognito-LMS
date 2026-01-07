import React from 'react';
import { Link } from 'react-router-dom';

const CourseCard = ({ course }) => {
  // Default to 0 if progress is missing or null
  const progress = course.progress || 0;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
      {/* Thumbnail Section */}
      <div className="h-48 bg-gray-200 relative">
        {course.thumbnail_url ? (
          <img 
            src={course.thumbnail_url} 
            alt={course.title} 
            className="w-full h-full object-cover"
          />
        ) : (
          // Fallback placeholder if no image exists
          <div className="flex items-center justify-center h-full bg-indigo-100 text-indigo-400">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
          {course.title}
        </h3>
        
        <p className="text-sm text-gray-500 mb-4">
          By {course.instructor_name || "Instructor"}
        </p>
        
        {/* PROGRESS BAR */}
        <div className="mt-auto">
          <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <Link 
            to={`/courses/${course.id}`} 
            className="mt-4 block w-full text-center bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            {progress > 0 ? "Continue Learning" : "Start Course"}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;