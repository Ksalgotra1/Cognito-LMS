import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { askAiTutor } from '../api/coursesApi';

// Reusable code block with language header + copy button (ChatGPT-style)
const CodeBlock = ({ lang, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2 rounded-lg overflow-hidden border border-gray-700">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#2d2d2d] text-gray-400 text-[11px] font-mono">
        <span>{lang || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition-colors"
        >
          {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
        </button>
      </div>
      {/* Code body */}
      <pre className="bg-[#1e1e1e] text-gray-100 p-3 overflow-x-auto text-xs leading-relaxed">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
};

const AiTutor = ({ courseId }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi! I'm your AI Tutor. I know the context of this entire course. Ask me anything!", sender: 'ai' }
  ]);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Thinking...');
  
  // Track which message was just copied to show the "Check" icon briefly
  const [copiedId, setCopiedId] = useState(null);
  
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
    setLoadingMessage('AI is thinking...');

    try {
      // Use the new async API with progress callback
      const data = await askAiTutor(courseId, userMsg.text, (progressMsg) => {
        setLoadingMessage(progressMsg);
      });
      const aiMsg = { id: Date.now() + 1, text: data.answer, sender: 'ai' };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      const errorText = error.message || "Sorry, I couldn't reach the server.";
      const errorMsg = { id: Date.now() + 1, text: errorText, sender: 'ai', isError: true };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setLoadingMessage('Thinking...');
    }
  };

  //  Copy Logic
  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000); // Reset icon after 2 seconds
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
          <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''} group`}>
            
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.sender === 'ai' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-600'
            }`}>
              {msg.sender === 'ai' ? <Bot size={16} /> : <User size={16} />}
            </div>

            {/* Bubble Container */}
            <div className={`relative max-w-[80%] ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                
                {/* The Bubble */}
                <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'
                } ${msg.isError ? 'bg-red-50 text-red-600 border-red-200' : ''}`}>
                  {msg.sender === 'ai' && !msg.isError ? (
                    <ReactMarkdown
                      components={{
                        code({ inline, className, children, ...props }) {
                          const lang = className?.replace('language-', '') || '';
                          const codeText = String(children).replace(/\n$/, '');

                          if (inline) {
                            return (
                              <code className="bg-gray-100 text-indigo-700 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>{children}</code>
                            );
                          }

                          return <CodeBlock lang={lang} code={codeText} />;
                        },
                        pre({ children }) {
                          // Let the code component handle everything
                          return <>{children}</>;
                        },
                        p({ children }) {
                          return <p className="mb-2 last:mb-0">{children}</p>;
                        },
                        ul({ children }) {
                          return <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>;
                        },
                        ol({ children }) {
                          return <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>;
                        },
                        strong({ children }) {
                          return <strong className="font-bold text-gray-900">{children}</strong>;
                        },
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  ) : (
                    msg.text
                  )}
                </div>

                {/*  Copy Button (Only for AI messages) */}
                {msg.sender === 'ai' && !msg.isError && (
                    <button 
                        onClick={() => handleCopy(msg.text, msg.id)}
                        className="absolute -bottom-6 left-0 text-gray-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs font-medium"
                        title="Copy to clipboard"
                    >
                        {copiedId === msg.id ? (
                            <><Check size={12} /> Copied!</>
                        ) : (
                            <><Copy size={12} /> Copy</>
                        )}
                    </button>
                )}
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
               <span className="text-xs text-gray-400">{loadingMessage}</span>
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