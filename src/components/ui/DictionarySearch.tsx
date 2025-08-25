"use client";

import { GlassSearchBox } from "./GlassSurface";
import { useRouter } from "next/navigation";

interface DictionarySearchProps {
  selectedLanguage?: string;
}

export default function DictionarySearch({ selectedLanguage = "english" }: DictionarySearchProps) {
  const router = useRouter();
  
  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}&lang=${selectedLanguage}`);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <GlassSearchBox onSearch={handleSearch} />
      </div>
    </div>
  );
}