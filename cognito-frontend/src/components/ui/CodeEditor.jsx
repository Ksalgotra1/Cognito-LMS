import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Play, RotateCcw, Terminal, Loader2 } from 'lucide-react';
import client from '../../lib/axios';

const CodeEditor = ({ 
  initialCode = "# Write your Python code here\nprint('Hello Cognito!')", 
  language = "python" 
}) => {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  // Execute code via backend proxy (enables logging/rate limiting)
  const handleRun = async () => {
    setIsRunning(true);
    setOutput(""); // Clear old output

    try {
      // 1. Send code to backend proxy (which forwards to Piston)
      const response = await client.post('/api/courses/execute/', {
        code: code,
        language: language
      });

      const data = response.data;

      // 2. Display Output
      if (data.run) {
        // stdout = Print statements | stderr = Errors
        // We handle both so the user sees errors if their code fails
        const result = data.run.stdout || data.run.stderr || "Process finished with no output.";
        setOutput(result);
      } else if (data.error) {
        setOutput(`Error: ${data.error}`);
      } else {
        setOutput("Error: Could not communicate with the execution engine.");
      }

    } catch (error) {
      if (error.response?.status === 429) {
        setOutput("Rate limit exceeded. Please wait before running code again.");
      } else if (error.response?.status === 408) {
        setOutput("Execution timed out. Your code took too long to run.");
      } else {
        setOutput(`System Error: ${error.message}`);
      }
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-full border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-[#1e1e1e]">
      
      {/* 1. TOOLBAR */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#333]">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs font-mono bg-[#3e3e42] px-2 py-1 rounded">main.py</span>
        </div>
        
        <div className="flex items-center gap-2">
           <button 
             onClick={() => setCode(initialCode)} 
             title="Reset Code"
             className="p-1.5 text-gray-400 hover:text-white hover:bg-[#3e3e42] rounded transition-all"
           >
             <RotateCcw size={14}/>
           </button>
           
           <button 
             onClick={handleRun} 
             disabled={isRunning} 
             className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded transition-all
               ${isRunning 
                 ? 'bg-gray-600 cursor-not-allowed text-gray-300' 
                 : 'bg-green-700 hover:bg-green-600 text-white shadow-lg shadow-green-900/20'
               }`}
           >
             {isRunning ? <Loader2 size={12} className="animate-spin"/> : <Play size={12} fill="currentColor" />}
             {isRunning ? 'Running...' : 'Run Code'}
           </button>
        </div>
      </div>

      {/* 2. MAIN AREA (Split View) */}
      <div className="flex flex-col flex-1 min-h-0">
        
        {/* TOP: The Editor */}
        <div className="flex-1">
           <Editor 
             height="100%" 
             defaultLanguage={language} 
             theme="vs-dark" 
             value={code} 
             onChange={(value) => setCode(value || "")} 
             options={{ 
               minimap: { enabled: false }, 
               fontSize: 13, 
               scrollBeyondLastLine: false,
               automaticLayout: true,
               padding: { top: 16 }
             }} 
           />
        </div>

        {/* BOTTOM: The Terminal */}
        <div className="h-1/3 min-h-[120px] bg-[#1e1e1e] border-t border-[#333] flex flex-col font-mono text-xs">
           <div className="px-3 py-1.5 bg-[#252526] text-gray-400 border-b border-[#333] flex items-center gap-2 uppercase tracking-wider font-bold text-[10px]">
             <Terminal size={10}/> Terminal Output
           </div>
           <div className="p-3 text-gray-300 whitespace-pre-wrap font-mono overflow-y-auto flex-1 leading-relaxed">
             {output || <span className="text-gray-600 italic">Ready to execute...</span>}
           </div>
        </div>

      </div>
    </div>
  );
};

export default CodeEditor;