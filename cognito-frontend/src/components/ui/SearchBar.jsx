import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, Loader2, BookOpen, FileVideo, Brain, Zap } from 'lucide-react';

const SearchBar = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    
    const navigate = useNavigate();
    const wrapperRef = useRef(null);

    // 1. Close Dropdown on Click Outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    // 2. Hybrid Search Logic (Debounced)
    useEffect(() => {
        let isCancelled = false;
        
        // Wait 800ms to avoid overloading your local Llama 3
        const delayDebounceFn = setTimeout(async () => {
            if (query.trim().length < 2) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            setShowDropdown(true);

            try {
                const response = await axios.get(`http://127.0.0.1:8000/api/courses/search/?q=${query}`);
                if (!isCancelled) setResults(response.data);
            } catch (error) {
                console.error("Search Error:", error);
                if (!isCancelled) setResults([]);
            } finally {
                if (!isCancelled) setIsLoading(false);
            }
        }, 800); 

        return () => {
            isCancelled = true;
            clearTimeout(delayDebounceFn);
        };
    }, [query]);

    const handleSelect = (url) => {
        navigate(url);
        setShowDropdown(false);
        setQuery('');
    };

    return (
        <div ref={wrapperRef} className="relative w-full max-w-2xl mx-auto z-50">
            {/* Input Field */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-12 pr-12 py-4 bg-[#1e1e1e] border border-gray-700 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg"
                    placeholder="Search 'React' (Fast) or 'how to center div' (Smart)..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setShowDropdown(true)}
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    {isLoading && <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />}
                </div>
            </div>

            {/* Dropdown Results */}
            {showDropdown && results.length > 0 && (
                <div className="absolute w-full mt-2 bg-[#1a1a1a] border border-gray-800 rounded-xl shadow-2xl overflow-hidden">
                    <ul className="max-h-96 overflow-y-auto custom-scrollbar">
                        {results.map((item, idx) => (
                            <li key={`${item.type}-${item.id}-${idx}`} className="border-b border-gray-800/50 last:border-0">
                                <button
                                    onClick={() => handleSelect(item.url)}
                                    className="w-full text-left px-5 py-4 hover:bg-[#252525] transition-colors flex items-start gap-4 group"
                                >
                                    {/* ICON LOGIC: Brain vs Book vs Video */}
                                    <div className={`p-3 rounded-lg shrink-0 mt-0.5 
                                        ${item.source === 'ai_semantic' ? 'bg-purple-500/10 text-purple-400' : 
                                          item.type === 'course' ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'}`
                                    }>
                                        {item.source === 'ai_semantic' ? <Brain size={20} /> : 
                                         item.type === 'course' ? <BookOpen size={20} /> : <FileVideo size={20} />}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold text-gray-200 group-hover:text-white truncate">
                                                {item.title}
                                            </h4>
                                            {/* AI Badge */}
                                            {item.source === 'ai_semantic' && (
                                                <span className="text-[10px] uppercase font-bold bg-purple-500/20 text-purple-300 px-2 rounded-full">
                                                    AI Match
                                                </span>
                                            )}
                                        </div>
                                        
                                        {/* CONTEXT LINE: Shows "In: Course Name" */}
                                        <p className="text-sm text-gray-500 truncate">
                                            {item.type === 'lesson' && item.course_title 
                                                ? <span className="text-gray-400">In: {item.course_title}</span> 
                                                : item.description || "Course Overview"
                                            }
                                        </p>
                                    </div>
                                    
                                    {/* Lightning Bolt for Trie matches */}
                                    <div className="text-gray-600">
                                         {item.source === 'trie_fast' && <Zap size={14} className="opacity-50" />}
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SearchBar;