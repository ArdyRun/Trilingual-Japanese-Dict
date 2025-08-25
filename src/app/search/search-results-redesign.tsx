"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Search, BookOpen, Globe } from "lucide-react"
import { GlassSurface } from "@/components/ui/GlassSurface"

interface DictionaryEntry {
  term: string;
  reading: string;
  pos: string;
  frequency: number;
  definitions: string[];
  example?: string;
  exampleTranslation?: string;
}

interface LanguageButtonProps {
  language: string;
  isSelected: boolean;
  onClick: () => void;
}

const LanguageButton = ({ 
  language, 
  isSelected, 
  onClick 
}: LanguageButtonProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [ripples, setRipples] = useState<{x: number, y: number, id: number}[]>([]);
  const rippleId = useRef(0);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const newRipple = { x, y, id: rippleId.current++ };
      setRipples(prev => [...prev, newRipple]);
      
      // Remove ripple after animation completes
      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
      }, 600);
    }
    
    onClick();
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      className="relative overflow-hidden px-4 py-2 rounded-full font-medium transition-all duration-300 transform hover:scale-105 border border-transparent flex items-center justify-center"
      style={{
        background: isSelected 
          ? "rgba(255, 100, 100, 0.3)"  // Lighter red when selected
          : "rgba(255, 255, 255, 0.1)", // Transparent when not selected
        border: "1px solid rgba(255, 255, 255, 0.2)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.2)",
        height: "48px",
        minWidth: "110px"
      }}
    >
      {/* Ripple effects */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: "0",
            height: "0",
            transform: "translate(-50%, -50%)",
            background: "rgba(255, 100, 100, 0.5)", // Lighter red ripple
          }}
        />
      ))}
      
      <span className="relative z-10" style={{ color: isSelected ? "white" : "rgba(255, 255, 255, 0.7)" }}>
        {language}
      </span>
    </button>
  );
};

export default function SearchResultsRedesign() {
  const searchParams = useSearchParams()
  const query = searchParams ? searchParams.get('q') || '' : ''
  const lang = searchParams ? searchParams.get('lang') || 'english' : 'english'
  
  const [results, setResults] = useState<DictionaryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState(query)
  const [selectedLanguage, setSelectedLanguage] = useState(lang)

  // Add animation styles to document head
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes ripple {
        to {
          width: 200px;
          height: 200px;
          opacity: 0;
        }
      }
      
      .animate-ripple {
        animation: ripple 0.6s linear;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    if (query) {
      performSearch(query, lang)
    }
  }, [query, lang])

  const performSearch = async (searchQuery: string, language: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&lang=${encodeURIComponent(language)}`)
      
      if (!response.ok) {
        throw new Error(`Search failed with status ${response.status}`)
      }
      
      const data: DictionaryEntry[] = await response.json()
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      performSearch(searchTerm, selectedLanguage)
    }
  }

  const handleLanguageChange = (languageCode: string) => {
    setSelectedLanguage(languageCode)
    if (searchTerm.trim()) {
      performSearch(searchTerm, languageCode)
    }
  }

  // Language display names
  const languages = [
    { code: "english", name: "English" },
    { code: "indonesia", name: "Indonesia" },
    { code: "japanese", name: "Japanese" },
  ];

  return (
    <div className="min-h-screen bg-black flex flex-col items-center p-4 pt-8">
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Back button */}
        <div className="flex items-center">
          <Link 
            href="/" 
            className="flex items-center text-gray-300 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Home
          </Link>
        </div>
        
        {/* Search Bar */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <GlassSurface
            width="100%"
            height={60}
            borderRadius={30}
          >
            <div className="relative w-full">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Japanese dictionary..."
                className="w-full pl-6 pr-12 py-4 text-lg rounded-full bg-transparent text-white placeholder-gray-300 focus:outline-none"
              />
              <button 
                type="submit"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <Search className="text-gray-300" size={24} />
              </button>
            </div>
          </GlassSurface>
          
          {/* Language Selector */}
          <div className="flex justify-center gap-3">
            {languages.map((lang) => (
              <LanguageButton
                key={lang.code}
                language={lang.name}
                isSelected={selectedLanguage === lang.code}
                onClick={() => handleLanguageChange(lang.code)}
              />
            ))}
          </div>
        </form>
        
        {/* Results Header */}
        <div>
          <h2 className="text-2xl font-semibold text-white">
            {query ? `Results for &quot;${query}&quot;` : "Search Results"}
          </h2>
          <p className="text-gray-400">
            {loading ? "Searching..." : error ? "Error occurred" : `${results.length} results found`}
          </p>
        </div>
        
        {/* Results */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-400">Searching...</p>
          </div>
        ) : error ? (
          <GlassSurface
            width="100%"
            height={150}
            borderRadius={20}
            className="p-6"
          >
            <div className="text-center py-8">
              <p className="text-red-400">Error: {error}</p>
            </div>
          </GlassSurface>
        ) : results.length === 0 ? (
          <GlassSurface
            width="100%"
            height={150}
            borderRadius={20}
            className="p-6"
          >
            <div className="text-center py-8">
              <p className="text-gray-400">No results found for &quot;{query}&quot;</p>
            </div>
          </GlassSurface>
        ) : (
          <div className="space-y-4">
            {results.map((entry, index) => (
              <GlassSurface
                key={index}
                width="100%"
                height={200}
                borderRadius={20}
                className="p-6"
                style={{ minHeight: "150px" }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-2xl font-bold text-white">{entry.term}</h3>
                    {entry.reading && (
                      <p className="text-lg text-gray-300">{entry.reading}</p>
                    )}
                  </div>
                  <span 
                    className="text-sm text-gray-400 px-3 py-1 rounded-full"
                    style={{ background: "rgba(255, 100, 100, 0.2)" }}
                  >
                    {entry.pos}
                  </span>
                </div>
                
                <div className="mb-4">
                  {entry.definitions.map((def, idx) => (
                    <p key={idx} className="text-lg text-blue-400 mb-2">
                      • {def}
                    </p>
                  ))}
                </div>
                
                {entry.example && entry.exampleTranslation && (
                  <div className="border-t border-white/20 pt-4">
                    <div className="flex items-start space-x-2 mb-2">
                      <BookOpen size={18} className="text-gray-500 mt-1 flex-shrink-0" />
                      <p className="text-lg text-gray-200 italic">{entry.example}</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Globe size={16} className="text-gray-500 mt-1 flex-shrink-0" />
                      <p className="text-md text-gray-400">{entry.exampleTranslation}</p>
                    </div>
                  </div>
                )}
              </GlassSurface>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}