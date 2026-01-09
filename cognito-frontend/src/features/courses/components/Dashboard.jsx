import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getCourses } from '../slices/coursesSlice';
import client from '../../../lib/axios'; // <--- Import Axios client

import CourseCard from './CourseCard'; 

const Dashboard = () => {
  const dispatch = useDispatch();
  
  // Need token for secure download
  const { user, token } = useSelector((state) => state.auth);
  const { list: courses, loading, error } = useSelector((state) => state.courses);

  useEffect(() => {
    dispatch(getCourses());
  }, [dispatch]);

  // --- NEW: Certificate Download Logic ---
  const handleDownloadCertificate = async (courseId, courseTitle) => {
    try {
      const response = await client.get(`api/courses/${courseId}/certificate/`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob', // Important: Treat response as a file, not JSON
      });

      // Create download link dynamically
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Certificate-${courseTitle.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      // Handle the 403 Forbidden error (Course not 100% complete)
      if (err.response && err.response.status === 403) {
        alert("🔒 Access Denied: You must complete 100% of the lessons to unlock this certificate.");
      } else {
        alert("Could not download certificate. Please try again later.");
      }
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Welcome, {user?.username || 'Learner'}!
        </h1>
        <p className="text-gray-600">Here are your available courses.</p>
      </header>

      {/* 1. Loading State */}
      {loading && <div className="text-center py-10">Loading courses...</div>}

      {/* 2. Error State */}
      {error && (
        <div className="text-red-500 bg-red-100 p-4 rounded mb-6">
            Error loading content: {typeof error === 'string' ? error : 'Unknown error'}
        </div>
      )}

      {/* 3. Empty State */}
      {!loading && courses.length === 0 && (
        <div className="text-center py-10 bg-white rounded shadow">
            <h3 className="text-xl text-gray-500">No courses available yet.</h3>
        </div>
      )}

      {/* 4. CLEAN GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          // We pass the entire course object AND the download handler
          <CourseCard 
            key={course.id} 
            course={course} 
            onDownloadCertificate={() => handleDownloadCertificate(course.id, course.title)}
          />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;