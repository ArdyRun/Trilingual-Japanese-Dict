// Import necessary modules
import { glob } from 'glob';
import { promises as fs } from 'fs';
import { join } from 'path';

// Define the structure of dictionary entries
export interface DictionaryEntry {
  term: string;
  reading: string;
  pos: string;
  frequency: number;
  definitions: string[];
  example?: string;
  exampleTranslation?: string;
}

// Define types for the dictionary data structure
interface DictionaryDefinition {
  type?: string;
  content?: string | DictionaryDefinition[];
  [key: string]: unknown;
}

type DictionaryEntryRaw = [
  string,     // term
  string,     // reading
  string,     // pos
  unknown,    // unused
  number,     // frequency
  DictionaryDefinition[], // definitions
  unknown,    // unused
  string?,    // example
  string?,    // exampleTranslation
  unknown?    // additional data
];

class DictionaryService {
  private dictionaries: Record<string, DictionaryEntry[]> = {};
  private loaded: boolean = false;

  async loadDictionaries() {
    if (this.loaded) return;

    try {
      // Load English dictionary
      await this.loadDictionary('en', 'jitendex-yomitan');
      
      // Load Japanese dictionary
      await this.loadDictionary('jp', '新明解国語辞典　第八版');
      
      // Load Indonesian dictionary
      await this.loadDictionary('id', 'JIDict v.1.0.1 (By Philia Space Team)');
      
      this.loaded = true;
    } catch (error) {
      console.error('Failed to load dictionaries:', error);
      this.loaded = false;
    }
  }

  private async loadDictionary(languageCode: string, folderName: string) {
    try {
      const basePath = join(process.cwd(), 'src', 'data', languageCode, folderName);
      
      // Find all term bank files
      const termBankFiles = await glob(join(basePath, '**/term_bank_*.json'));
      
      let entries: DictionaryEntry[] = [];
      
      // Load each term bank file
      for (const file of termBankFiles) {
        const rawData = await fs.readFile(file, 'utf-8');
        const data: DictionaryEntryRaw[] = JSON.parse(rawData);
        
        const fileEntries = data.map((entry: DictionaryEntryRaw) => {
          // Extract definitions - simplified approach
          let definitions: string[] = [];
          if (Array.isArray(entry[5])) {
            // Handle different formats of definitions
            entry[5].forEach((def: DictionaryDefinition) => {
              if (typeof def === 'string') {
                definitions.push(def);
              } else if (def.type === 'structured-content' && Array.isArray(def.content)) {
                // Parse structured content for text
                const parsedDefs = this.extractDefinitionsFromStructuredContent(def.content);
                definitions = definitions.concat(parsedDefs);
              }
            });
          }
          
          return {
            term: entry[0] || '',
            reading: entry[1] || '',
            pos: entry[2] || '',
            frequency: entry[4] || 0,
            definitions: definitions.filter(d => d && d.length > 0),
            example: entry[7] || undefined,
            exampleTranslation: entry[8] || undefined
          };
        });
        
        entries = entries.concat(fileEntries);
      }
      
      this.dictionaries[languageCode] = entries;
      console.log(`Loaded ${entries.length} entries for ${languageCode} dictionary`);
    } catch (error) {
      console.error(`Failed to load ${languageCode} dictionary:`, error);
    }
  }

  private extractDefinitionsFromStructuredContent(content: (string | DictionaryDefinition)[]): string[] {
    const definitions: string[] = [];
    
    for (const item of content) {
      if (typeof item === 'string') {
        definitions.push(item);
      } else if (item && typeof item === 'object') {
        if (item.content && typeof item.content === 'string') {
          definitions.push(item.content);
        } else if (item.content && Array.isArray(item.content)) {
          const nestedDefs = this.extractDefinitionsFromStructuredContent(item.content);
          definitions.push(...nestedDefs);
        } else if (Array.isArray(item)) {
          const nestedDefs = this.extractDefinitionsFromStructuredContent(item);
          definitions.push(...nestedDefs);
        }
      }
    }
    
    return definitions;
  }

  async search(query: string, language: string = 'en'): Promise<DictionaryEntry[]> {
    if (!this.loaded) {
      await this.loadDictionaries();
    }
    
    if (!query.trim() || !this.dictionaries[language]) {
      return [];
    }
    
    const searchTerm = query.trim().toLowerCase();
    const results = this.dictionaries[language].filter(entry => 
      entry.term.toLowerCase().includes(searchTerm) || 
      entry.reading.toLowerCase().includes(searchTerm) ||
      entry.definitions.some(def => def.toLowerCase().includes(searchTerm))
    );
    
    // Sort by frequency (more common first) and limit results
    return results
      .sort((a, b) => a.frequency - b.frequency)
      .slice(0, 50);
  }

  getRandomEntries(language: string = 'en', count: number = 5): DictionaryEntry[] {
    if (!this.loaded || !this.dictionaries[language]) {
      return [];
    }
    
    const shuffled = [...this.dictionaries[language]].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
}

const dictionaryService = new DictionaryService();
export default dictionaryService;