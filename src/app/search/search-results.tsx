"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Search, BookOpen, Globe } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DictionaryEntry {
  term: string;
  reading: string;
  pos: string;
  frequency: number;
  definitions: string[];
  example?: string;
  exampleTranslation?: string;
}

export default function SearchResults() {
  const searchParams = useSearchParams()
  const query = searchParams ? searchParams.get('q') || '' : ''
  const lang = searchParams ? searchParams.get('lang') || 'english' : 'english'
  
  const [results, setResults] = useState<DictionaryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState(query)
  const [selectedLanguage, setSelectedLanguage] = useState(lang)

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

  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value)
    if (searchTerm.trim()) {
      performSearch(searchTerm, value)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-4 pt-8">
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Back button */}
        <div className="flex items-center">
          <Link href="/">
            <Button variant="ghost" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
        
        {/* Search Bar */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Japanese dictionary..."
                className="h-12 pl-4 pr-12 text-lg"
              />
              <Button 
                type="submit"
                size="icon"
                variant="ghost"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-12 w-12"
              >
                <Search className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="w-36">
              <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                <SelectTrigger className="h-12 text-lg">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="indonesia">Indonesia</SelectItem>
                  <SelectItem value="japanese">Japanese</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </form>
        
        {/* Results Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold">
              {query ? `Results for &quot;${query}&quot;` : "Search Results"}
            </h2>
            <p className="text-muted-foreground">
              {loading ? "Searching..." : error ? "Error occurred" : `${results.length} results found`}
            </p>
          </div>
        </div>
        
        {/* Results */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-muted-foreground">Searching...</p>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-destructive">Error: {error}</p>
            </CardContent>
          </Card>
        ) : results.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No results found for &quot;{query}&quot;</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {results.map((entry, index) => (
              <Card key={index} className="shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl">{entry.term}</CardTitle>
                      {entry.reading && (
                        <p className="text-lg text-muted-foreground">{entry.reading}</p>
                      )}
                    </div>
                    <Badge variant="secondary">{entry.pos}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 space-y-2">
                    {entry.definitions.map((def, idx) => (
                      <p key={idx} className="text-lg">
                        • {def}
                      </p>
                    ))}
                  </div>
                  
                  {entry.example && entry.exampleTranslation && (
                    <div className="border-t border-muted pt-4 mt-4">
                      <div className="flex items-start space-x-2 mb-2">
                        <BookOpen className="text-muted-foreground mt-1 h-5 w-5 flex-shrink-0" />
                        <p className="text-lg italic">{entry.example}</p>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Globe className="text-muted-foreground mt-1 h-4 w-4 flex-shrink-0" />
                        <p className="text-muted-foreground">{entry.exampleTranslation}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}