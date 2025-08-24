// Define the structure of JMdict entries
export interface JMdictEntry {
  term: string;
  reading: string;
  pos: string;
  frequency: number;
  definitions: string[];
  example?: string;
  exampleTranslation?: string;
}

class JMdictService {
  async search(query: string, language: string = "english"): Promise<JMdictEntry[]> {
    if (!query.trim()) {
      return [];
    }
    
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&lang=${encodeURIComponent(language)}`);
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      const results: JMdictEntry[] = await response.json();
      return results;
    } catch (error) {
      console.error('Search API error:', error);
      return [];
    }
  }

  // For now, we'll return empty array for random entries since we don't have that API yet
  getRandomEntries(count: number = 5): JMdictEntry[] {
    return [];
  }
}

const jmdictService = new JMdictService();
export default jmdictService;