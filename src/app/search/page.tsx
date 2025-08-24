"use client"

import React, { useState, useEffect } from "react"
import { Search, Volume2, BookOpen, ArrowLeft, Globe } from "lucide-react"
import Link from "next/link"
import jmdictService from "@/lib/jmdict-service"
import { useRouter } from "next/navigation"

interface DictionaryEntry {
  term: string
  reading: string
  pos: string
  frequency: number
  definitions: string[]
  example?: string
  exampleTranslation?: string
}

export default function SearchResultsPage({ searchParams }: { searchParams: { q?: string, lang?: string } }) {
  const router = useRouter()
  const [results, setResults] = useState<DictionaryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Fix for Next.js 15 - unwrap searchParams with React.use()
  const unwrappedParams = React.use(searchParams)
  const initialSearchTerm = unwrappedParams?.q || ""
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm)
  const [selectedLanguage, setSelectedLanguage] = useState(unwrappedParams?.lang || "english")

  const executeSearch = async (term: string, lang: string) => {
    if (!term) {
      setResults([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const searchResults = await jmdictService.search(term, lang)
      setResults(searchResults)
    } catch (err) {
      setError("Failed to fetch results. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Execute search on initial load if q param is present
    if (initialSearchTerm) {
      executeSearch(initialSearchTerm, selectedLanguage)
    } else {
      setLoading(false)
    }
  }, []) // Empty dependency array ensures this runs only once on mount

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang)
    const url = new URL(window.location.href)
    url.searchParams.set('lang', lang)
    // We might not want to trigger a new search on language change alone
    // but just update the state and URL. The user can then initiate the search.
    window.history.pushState({}, '', url.toString())
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const url = new URL(window.location.href)
    url.searchParams.set('q', searchTerm)
    url.searchParams.set('lang', selectedLanguage)
    window.history.pushState({}, '', url.toString())
    executeSearch(searchTerm, selectedLanguage)
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center space-x-2 text-white hover:text-gray-300 transition-colors">
            <ArrowLeft size={20} />
            <span>Back to Search</span>
          </Link>
          <h1 className="text-3xl font-bold">JIDict</h1>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="w-full">
            <div className="relative rounded-full bg-white/5 border border-white/10 backdrop-blur-lg p-1 shadow-lg">
              <div className="flex items-center">
                <input
                  type="text"
                  placeholder={`Search in ${selectedLanguage} dictionary...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 text-base rounded-full bg-transparent text-white placeholder-gray-300 focus:outline-none"
                />
                <button 
                  type="submit"
                  className="absolute right-3 p-1 rounded-full hover:bg-white/10 transition-colors"
                >
                  <Search className="text-gray-300" size={20} />
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Search Results Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">
            {searchTerm ? `Results for "${searchTerm}"` : "Search Results"}
          </h2>
          <p className="text-gray-400">
            {loading ? "Searching..." : `${results.length} results found`}
          </p>
        </div>

        {/* Language Filter */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <Globe size={20} className="text-gray-400" />
            <span className="text-gray-400">Dictionary Language:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleLanguageChange("english")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors backdrop-blur-lg border ${
                selectedLanguage === "english"
                  ? "bg-blue-500/20 border-blue-400/30 text-blue-300"
                  : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
              }`}
            >
              English
            </button>
            <button
              onClick={() => handleLanguageChange("japanese")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors backdrop-blur-lg border ${
                selectedLanguage === "japanese"
                  ? "bg-blue-500/20 border-blue-400/30 text-blue-300"
                  : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
              }`}
            >
              Japanese (Monolingual)
            </button>
            <button
              onClick={() => handleLanguageChange("indonesian")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors backdrop-blur-lg border ${
                selectedLanguage === "indonesian"
                  ? "bg-blue-500/20 border-blue-400/30 text-blue-300"
                  : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
              }`}
            >
              Indonesian
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-900/50 rounded-xl p-6 animate-pulse">
                <div className="h-6 bg-gray-800 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-800 rounded w-1/3 mb-3"></div>
                <div className="h-4 bg-gray-800 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-800 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 text-center">
            <p className="text-red-300">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-700 hover:bg-red-600 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* No Results */}
        {!loading && !error && searchTerm && results.length === 0 && (
          <div className="text-center py-12">
            <Search className="mx-auto text-gray-600 mb-4" size={48} />
            <h3 className="text-xl font-semibold mb-2">No results found</h3>
            <p className="text-gray-400">
              We couldn't find any entries for "${searchTerm}" in the {selectedLanguage} dictionary. Try a different search term or language.
            </p>
          </div>
        )}

        {/* Results */}
        {!loading && !error && (
          <div className="space-y-6">
            {results.map((entry, index) => (
              <div 
                key={index} 
                className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:bg-gray-900/50 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-2xl font-bold text-white">{entry.term}</h3>
                    <p className="text-lg text-gray-300">{entry.reading}</p>
                  </div>
                  <button className="p-2 rounded-full hover:bg-gray-800 transition-colors">
                    <Volume2 size={20} className="text-gray-400" />
                  </button>
                </div>
                
                <div className="mb-4">
                  {entry.definitions.map((def, idx) => (
                    <span key={idx} className="text-lg text-blue-400 mr-2">• {def}</span>
                  ))}
                </div>
                
                {entry.example && entry.exampleTranslation && (
                  <div className="border-t border-gray-800 pt-4">
                    <div className="flex items-start space-x-2 mb-2">
                      <BookOpen size={16} className="text-gray-500 mt-1 flex-shrink-0" />
                      <p className="text-gray-200">{entry.example}</p>
                    </div>
                    <p className="text-gray-500 ml-6">{entry.exampleTranslation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!searchTerm && !loading && (
          <div className="text-center py-12">
            <Search className="mx-auto text-gray-600 mb-4" size={48} />
            <h3 className="text-xl font-semibold mb-2">Search for Japanese words</h3>
            <p className="text-gray-400">
              Enter a word in the search bar to find its definition and examples.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}