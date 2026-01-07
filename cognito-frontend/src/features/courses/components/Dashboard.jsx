import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getCourses } from '../slices/coursesSlice';

import CourseCard from './CourseCard'; 

const Dashboard = () => {
  const dispatch = useDispatch();
  
  const { user } = useSelector((state) => state.auth);
  const { list: courses, loading, error } = useSelector((state) => state.courses);

  useEffect(() => {
    dispatch(getCourses());
  }, [dispatch]);

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

      {/* 4. NEW CLEAN GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          // We pass the entire course object to the card
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;