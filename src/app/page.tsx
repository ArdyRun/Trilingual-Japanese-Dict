"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Vortex } from "@/components/ui/vortex"
import { Globe } from "lucide-react"

export default function Home() {
  const router = useRouter()
  const [selectedLanguage, setSelectedLanguage] = useState("english")

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}&lang=${selectedLanguage}`)
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <Vortex
        className="z-0"
        containerClassName="absolute inset-0"
        particleCount={500}
        rangeY={100}
        baseHue={0}
        rangeHue={20}
        baseSpeed={0.1}
        rangeSpeed={1.5}
        baseRadius={1}
        rangeRadius={2}
        backgroundColor="#000000"
      />
      <div className="relative z-10 w-full max-w-2xl mx-auto text-center space-y-4">
        <div className="space-y-4">
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-white mx-auto w-fit">
            JIDict
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-lg mx-auto">
            A minimalist Japanese dictionary for learning
          </p>
        </div>
        
        <div className="pt-4 flex justify-center">
          <div className="w-full max-w-xl">
            <SearchBox onSearch={handleSearch} selectedLanguage={selectedLanguage} />
          </div>
        </div>
        
        {/* Language Selection */}
        <div className="pt-4">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <Globe size={20} className="text-gray-400" />
            <span className="text-gray-400">Dictionary Language:</span>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setSelectedLanguage("indonesian")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors backdrop-blur-lg border ${
                selectedLanguage === "indonesian"
                  ? "bg-blue-500/20 border-blue-400/30 text-blue-300"
                  : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
              }`}
            >
              Indonesian
            </button>
            <button
              onClick={() => setSelectedLanguage("english")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors backdrop-blur-lg border ${
                selectedLanguage === "english"
                  ? "bg-blue-500/20 border-blue-400/30 text-blue-300"
                  : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
              }`}
            >
              English
            </button>
            <button
              onClick={() => setSelectedLanguage("japanese")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors backdrop-blur-lg border ${
                selectedLanguage === "japanese"
                  ? "bg-blue-500/20 border-blue-400/30 text-blue-300"
                  : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
              }`}
            >
              Japanese (Monolingual)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SearchBox({ onSearch, selectedLanguage }: { onSearch: (query: string) => void, selectedLanguage: string }) {
  const [query, setQuery] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative rounded-full bg-white/5 border border-white/10 backdrop-blur-lg p-1 shadow-lg">
        <div className="flex items-center">
          <input
            type="text"
            placeholder={`Search in ${selectedLanguage} dictionary...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-3 text-base rounded-full bg-transparent text-white placeholder-gray-300 focus:outline-none"
          />
          <button 
            type="submit"
            className="absolute right-3 p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <svg 
              className="text-gray-300" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </div>
      </div>
    </form>
  )
}