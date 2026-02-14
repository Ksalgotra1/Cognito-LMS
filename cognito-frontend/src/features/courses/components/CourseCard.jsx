import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, PlayCircle } from 'lucide-react';

const CourseCard = ({ course, onDownloadCertificate }) => {
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
            <PlayCircle className="w-16 h-16" />
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

          {/* BUTTON GROUP: Continue + Certificate */}
          <div className="mt-4 flex gap-2">
            <Link 
              to={`/courses/${course.id}`} 
              className="flex-1 text-center bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              {progress > 0 ? "Continue" : "Start"}
            </Link>

            {/* GOLD CERTIFICATE BUTTON */}
            <button
              onClick={onDownloadCertificate}
              className="px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors shadow-sm flex items-center justify-center"
              title="Download Certificate (Requires 100% Completion)"
            >
              <Trophy size={18} />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CourseCard;