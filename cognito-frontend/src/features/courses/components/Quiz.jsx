import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import client from '../../../lib/axios';
import { useToast } from '../../../components/ui/Toast';
import { PartyPopper, XCircle, CheckCircle2, ArrowLeft, RotateCcw } from 'lucide-react';

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
      } catch (_err) {
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
      addToast(response.data.passed ? 'Quiz passed!' : 'Quiz submitted', response.data.passed ? 'success' : 'error');
    } catch (_err) {
      // Error toast handled by axios interceptor
    }
  };

  if (loading) return <div className="p-8 text-center">Loading Quiz...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  // --- RESULT SCREEN ---
  if (result) {
    const passed = result.passed;
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          
          {/* Hero Header */}
          <div className={`px-8 pt-10 pb-8 text-center ${passed ? 'bg-gradient-to-b from-green-50 to-white' : 'bg-gradient-to-b from-red-50 to-white'}`}>
            <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-5 shadow-lg ${passed ? 'bg-green-100 ring-4 ring-green-200' : 'bg-red-100 ring-4 ring-red-200'}`}>
              {passed 
                ? <CheckCircle2 size={40} className="text-green-600" /> 
                : <XCircle size={40} className="text-red-500" />
              }
            </div>

            {/* Score */}
            <div className={`text-5xl font-extrabold tracking-tight mb-1 ${passed ? 'text-green-600' : 'text-red-600'}`}>
              {result.score}%
            </div>
            <p className="text-sm text-gray-500 font-medium">
              {result.correct} of {result.total} correct
            </p>
          </div>

          {/* Message Card */}
          <div className="px-8 pb-8">
            <div className={`rounded-xl p-5 mb-6 ${passed ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
              <div className="flex items-start gap-3">
                {passed 
                  ? <PartyPopper size={22} className="text-green-600 mt-0.5 shrink-0" />
                  : <RotateCcw size={22} className="text-red-500 mt-0.5 shrink-0" />
                }
                <div>
                  <h3 className={`font-bold text-base mb-1 ${passed ? 'text-green-800' : 'text-red-800'}`}>
                    {passed ? 'Great job!' : 'Not quite there'}
                  </h3>
                  <p className={`text-sm leading-relaxed ${passed ? 'text-green-700' : 'text-red-700'}`}>
                    {passed 
                      ? 'You passed this quiz. Your progress has been saved — keep going!' 
                      : 'Review the lesson material and give it another shot. You can retake this quiz anytime.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button 
              onClick={() => navigate(-1)}
              className={`w-full py-3 px-6 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-md ${
                passed 
                  ? 'bg-green-600 hover:bg-green-700 shadow-green-200' 
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
              }`}
            >
              <ArrowLeft size={18} />
              {passed ? 'Back to Lesson' : 'Review & Retry'}
            </button>
          </div>

        </div>
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