import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { askAiTutor } from '../api/coursesApi';

const AiTutor = ({ courseId }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi! I'm your AI Tutor. I know the context of this entire course. Ask me anything!", sender: 'ai' }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { id: Date.now(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const data = await askAiTutor(courseId, userMsg.text);
      const aiMsg = { id: Date.now() + 1, text: data.answer, sender: 'ai' };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg = { id: Date.now() + 1, text: "Sorry, I couldn't reach the server.", sender: 'ai', isError: true };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      
      {/* Header */}
      <div className="bg-indigo-600 p-4 flex items-center gap-2 text-white shadow-md">
        <Sparkles size={18} className="text-yellow-300" />
        <h3 className="font-bold text-sm tracking-wide">AI Context Tutor</h3>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
            
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.sender === 'ai' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-600'
            }`}>
              {msg.sender === 'ai' ? <Bot size={16} /> : <User size={16} />}
            </div>

            {/* Bubble */}
            <div className={`p-3 rounded-2xl text-sm max-w-[80%] leading-relaxed ${
              msg.sender === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'
            } ${msg.isError ? 'bg-red-50 text-red-600 border-red-200' : ''}`}>
              {msg.text}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex gap-3">
             <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
               <Bot size={16} />
             </div>
             <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
               <Loader2 size={14} className="animate-spin text-indigo-500" />
               <span className="text-xs text-gray-400">Thinking...</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this lesson..."
          className="flex-1 bg-gray-100 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded-lg px-4 py-2 text-sm transition-all outline-none"
        />
        <button 
          type="submit" 
          disabled={loading || !input.trim()}
          className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default AiTutor;