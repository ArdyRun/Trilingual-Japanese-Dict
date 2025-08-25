import { NextResponse } from 'next/server';
import dictionaryService from '@/lib/dictionary-service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const languageParam = searchParams.get('lang') || 'en';
  
  // Map language codes to dictionary identifiers
  const languageMap: Record<string, string> = {
    'english': 'en',
    'japanese': 'jp',
    'indonesian': 'id',
    'en': 'en',
    'jp': 'jp',
    'id': 'id'
  };
  
  const language = languageMap[languageParam] || 'en';
  
  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }
  
  try {
    // Load dictionaries if not already loaded
    await dictionaryService.loadDictionaries();
    
    // Search the dictionary
    const results = await dictionaryService.search(query, language);
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}