"use client"

import { useState, useEffect } from "react"
import { Vortex } from "@/components/ui/vortex"
import DictionarySearch from "@/components/ui/DictionarySearch"
import LanguageSelector from "@/components/ui/LanguageSelector"

export default function Home() {
  const [isClient, setIsClient] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState("english")

  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      {isClient && (
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
      )}
      <div className="relative z-10 w-full max-w-2xl mx-auto text-center space-y-4">
        <div className="space-y-4">
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-white mx-auto w-fit">
            JIDict
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-lg mx-auto">
            A minimalist Japanese dictionary for learning
          </p>
        </div>
        
        <div className="pt-1">
          <DictionarySearch selectedLanguage={selectedLanguage} />
        </div>
        
        <div className="pt-1">
          <LanguageSelector 
            selectedLanguage={selectedLanguage} 
            onLanguageChange={setSelectedLanguage} 
          />
        </div>
      </div>
    </div>
  )
}