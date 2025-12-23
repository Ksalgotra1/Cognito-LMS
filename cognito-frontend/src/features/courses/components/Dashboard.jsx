import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getCourses } from '../slices/coursesSlice'; // Adjusted import path

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
        <h1 className="text-3xl font-bold text-gray-800">Welcome, {user?.username}!</h1>
        <p className="text-gray-600">Here are your available courses.</p>
      </header>

      {loading && <div className="text-center py-10">Loading courses...</div>}

      {error && (
        <div className="text-red-500 bg-red-100 p-4 rounded mb-6">
            Error loading content. Please try again.
        </div>
      )}

      {!loading && courses.length === 0 && (
        <div className="text-center py-10 bg-white rounded shadow">
            <h3 className="text-xl text-gray-500">No courses found.</h3>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="h-40 bg-indigo-600 flex items-center justify-center">
                <span className="text-white text-4xl font-bold">{course.title[0]}</span>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">{course.title}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>
              <div className="flex justify-between items-center mt-4">
                <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                    Instructor: {course.instructor_name}
                </span>
                <button className="text-indigo-600 font-semibold hover:text-indigo-800">
                    View Course →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;