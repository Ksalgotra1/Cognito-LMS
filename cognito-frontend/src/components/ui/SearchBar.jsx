import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useDebounce } from '../../hooks/useDebounce';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, BookOpen, FileVideo, X } from 'lucide-react'; // ✨ New Icons

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // To toggle dropdown visibility

  const debouncedQuery = useDebounce(query, 300);
  const navigate = useNavigate();

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      setIsOpen(true);
      try {
        const response = await axios.get(`http://127.0.0.1:8000/api/courses/search/?q=${debouncedQuery}`);
        setResults(response.data);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  // Helper to handle navigation
  const handleSelect = (url) => {
    navigate(url);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto font-sans">
      
      {/* --- Search Input Field --- */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
        </div>
        
        <input
          type="text"
          className="block w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl leading-5 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ease-in-out shadow-sm"
          placeholder="Search for courses, lessons..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if(results.length > 0) setIsOpen(true) }}
          // Close dropdown on blur (delayed to allow clicks)
          onBlur={() => setTimeout(() => setIsOpen(false), 200)} 
        />

        {/* Right Side Icons (Loading or Clear) */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {isLoading ? (
            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
          ) : query ? (
             <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600">
               <X className="h-4 w-4" />
             </button>
          ) : (
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-xs font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-md">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {/* --- Dropdown Results --- */}
      {isOpen && (results.length > 0 || query.length > 1) && (
        <div className="absolute z-50 mt-2 w-full bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden ring-1 ring-black ring-opacity-5 transition-all">
          
          {/* Header */}
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {results.length} results found
          </div>

          <div className="max-h-80 overflow-y-auto">
            {results.length > 0 ? (
              results.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleSelect(item.url)}
                  className="flex items-center px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors group border-b border-gray-50 last:border-none"
                >
                  {/* Icon Badge */}
                  <div className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${
                    item.type === 'course' ? 'bg-indigo-100 text-indigo-600' : 'bg-teal-100 text-teal-600'
                  }`}>
                    {item.type === 'course' ? <BookOpen className="h-5 w-5" /> : <FileVideo className="h-5 w-5" />}
                  </div>

                  {/* Text Content */}
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.type === 'lesson' ? `In: ${item.course}` : 'Full Course'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              // Empty State
              !isLoading && (
                <div className="px-4 py-8 text-center text-gray-500">
                  <p className="text-sm">No results found for "{query}"</p>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;