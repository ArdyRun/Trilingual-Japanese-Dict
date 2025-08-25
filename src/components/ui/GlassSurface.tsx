"use client"

import { useEffect, useRef, useState } from "react"

const GlassSurface = ({
  children,
  width = "100%",
  height = 60,
  borderRadius = 30,
  className = "",
  style = {},
}: {
  children: React.ReactNode;
  width?: string | number;
  height?: number;
  borderRadius?: number;
  className?: string;
  style?: React.CSSProperties;
}) => {
  const [isClient, setIsClient] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    // Simple fallback for server-side rendering
    return (
      <div 
        ref={containerRef}
        className={`relative overflow-hidden ${className}`}
        style={{
          width,
          height,
          borderRadius: `${borderRadius}px`,
          background: "rgba(255, 255, 255, 0.1)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          backdropFilter: "blur(12px)",
          ...style
        }}
      >
        <div className="w-full h-full flex items-center p-2">
          {children}
        </div>
      </div>
    )
  }

  // Client-side enhanced version
  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        width,
        height,
        borderRadius: `${borderRadius}px`,
        background: "rgba(255, 255, 255, 0.1)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.2)",
        ...style
      }}
    >
      <div className="w-full h-full flex items-center p-2">
        {children}
      </div>
    </div>
  )
}

const GlassSearchBox = ({ onSearch }: { onSearch: (query: string) => void }) => {
  const [query, setQuery] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query)
  }

  return (
    <GlassSurface 
      height={50}
      borderRadius={30}
    >
      <div className="relative w-full">
        <input
          type="text"
          placeholder="Search Japanese words..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-4 pr-10 py-3 text-sm rounded-full bg-transparent text-white placeholder-gray-300 focus:outline-none"
        />
        <button 
          type="submit"
          onClick={handleSubmit}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <svg 
            className="text-gray-300" 
            width="16" 
            height="16" 
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
    </GlassSurface>
  )
}

export { GlassSurface, GlassSearchBox };