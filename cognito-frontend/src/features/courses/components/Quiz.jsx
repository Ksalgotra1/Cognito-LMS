import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import client from '../../../lib/axios';
import { useToast } from '../../../components/ui/Toast';

const Quiz = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  const { addToast } = useToast();

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await client.get(`api/courses/lessons/${lessonId}/quiz/`, config);
        setQuestions(response.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load quiz. Please try again.");
        setLoading(false);
      }
    };

    if (token && lessonId) fetchQuiz();
  }, [lessonId, token]);

  const handleOptionChange = (questionId, choiceId) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: choiceId
    }));
  };

  const handleSubmit = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await client.post(
        `api/courses/lessons/${lessonId}/quiz/submit/`,
        answers,
        config
      );
      setResult(response.data);
      addToast(response.data.passed ? '🎉 Quiz passed!' : 'Quiz submitted', response.data.passed ? 'success' : 'error');
    } catch (err) {
      // Error toast handled by axios interceptor
    }
  };

  if (loading) return <div className="p-8 text-center">Loading Quiz...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  // --- RESULT SCREEN ---
  if (result) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-lg shadow mt-10 text-center">
        <h2 className="text-3xl font-bold mb-4">Quiz Results</h2>
        
        <div className={`text-6xl font-bold mb-6 ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
          {result.score}%
        </div>
        
        <p className="text-xl mb-6">
          You got <span className="font-bold">{result.correct}</span> out of <span className="font-bold">{result.total}</span> correct.
        </p>

        {/* --- MESSAGE --- */}
        {result.passed ? (
           <div className="bg-green-100 text-green-800 p-4 rounded mb-6">
             🎉 Congratulations! You passed this lesson.
           </div>
        ) : (
           <div className="bg-red-100 text-red-800 p-4 rounded mb-6">
             ❌ You didn't pass. Review the lesson and try again!
           </div>
        )}
        {/* ------------------------------------- */}

        <button 
          onClick={() => navigate(-1)}
          className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700"
        >
          Back to Lesson
        </button>
      </div>
    );
  }

  // --- QUESTIONS SCREEN ---
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Lesson Quiz</h1>
      {questions.map((q, index) => (
        <div key={q.id} className="mb-8 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">{index + 1}. {q.text}</h3>
          <div className="space-y-3">
            {q.choices.map((choice) => (
              <label key={choice.id} className={`flex items-center p-3 rounded cursor-pointer border hover:bg-indigo-50 transition-colors ${answers[q.id] === choice.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}>
                <input
                  type="radio"
                  name={`question-${q.id}`}
                  value={choice.id}
                  checked={answers[q.id] === choice.id}
                  onChange={() => handleOptionChange(q.id, choice.id)}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-3 text-gray-700">{choice.text}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
      <button onClick={handleSubmit} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-lg">
        Submit Quiz
      </button>
    </div>
  );
};

export default Quiz;