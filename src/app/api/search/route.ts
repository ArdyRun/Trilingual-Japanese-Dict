import { NextResponse } from 'next/server';
import { glob } from 'glob';
import { promises as fs } from 'fs';
import { join } from 'path';
import { NextRequest } from 'next/server';


// Type definitions for dictionary entries
interface DictionaryEntry {
  term: string;
  reading: string;
  pos: string;
  definitions: string[];
  language: string;
  frequency: number;
}

interface RawDictEntry {
  term: string;       // Term in kanji or kana
  reading: string;    // Reading in kana
  pos: string;        // Part of speech
  definition: string; // Definition (English or Indonesian)
}

// Function to extract text from structured content
function extractTextFromContent(content: unknown): string {
  if (typeof content === 'string') {
    return content;
  }
  
  if (Array.isArray(content)) {
    // Handle array of content items
    return content.map(item => extractTextFromContent(item)).join('; ');
  }
  
  if (content && typeof content === 'object') {
    const objContent = content as Record<string, unknown>;
    if (objContent.content) {
      return extractTextFromContent(objContent.content);
    }
    // Handle direct content structure
    if (objContent.tag === 'li' && typeof objContent.content === 'string') {
      return objContent.content;
    }
  }
  
  return '';
}

// Function to extract only glossary definitions
function extractGlossary(content: unknown): string[] {
  const definitions: string[] = [];

  function findGlossaries(node: unknown) {
    if (!node) return;

    if (Array.isArray(node)) {
      node.forEach(findGlossaries);
      return;
    }

    if (typeof node !== 'object' || node === null) return;

    const objNode = node as Record<string, unknown>;
    if (objNode.tag === 'ul' && objNode.data && typeof objNode.data === 'object' && (objNode.data as Record<string, unknown>).content === 'glossary') {
      const glosses = Array.isArray(objNode.content) ? objNode.content : [objNode.content];
      for (const li of glosses) {
        if (li && typeof li === 'object' && !Array.isArray(li) && (li as Record<string, unknown>).tag === 'li' && typeof (li as Record<string, unknown>).content === 'string') {
          definitions.push((li as Record<string, unknown>).content as string);
        }
      }
    }

    if (objNode.content) {
      findGlossaries(objNode.content);
    }
  }

  findGlossaries(content);
  return definitions;
}

function extractRedirect(content: any): string | null {
  let redirectTarget: string | null = null;

  function getText(n: unknown): string {
    if (typeof n === 'string') {
        return n;
    } else if (Array.isArray(n)) {
        return n.map(getText).join('');
    } else if (n && typeof n === 'object' && (n as Record<string, unknown>).content) {
        return getText((n as Record<string, unknown>).content);
    }
    return '';
  }

  function findRedirect(node: unknown) {
    if (redirectTarget || !node) return;
    if (Array.isArray(node)) {
      node.forEach(findRedirect);
      return;
    }
    if (typeof node !== 'object' || node === null) return;

    const objNode = node as Record<string, unknown>;
    if (objNode.tag === 'div' && objNode.data && typeof objNode.data === 'object' && (objNode.data as Record<string, unknown>).content === 'redirect-glossary') {
      const linkNode = Array.isArray(objNode.content) ? objNode.content.find((c: unknown) => c && typeof c === 'object' && !Array.isArray(c) && (c as Record<string, unknown>).tag === 'a') : (objNode.content && typeof objNode.content === 'object' && !Array.isArray(objNode.content) && (objNode.content as Record<string, unknown>).tag === 'a' ? objNode.content : null);
      if (linkNode && (linkNode as Record<string, unknown>).content) {
        redirectTarget = getText((linkNode as Record<string, unknown>).content);
      }
    }

    if (objNode.content) {
      findRedirect(objNode.content);
    }
  }

  findRedirect(content);
  return redirectTarget;
}


// Function to convert raw dictionary entries to DictionaryEntry format
function convertRawDictEntry(rawEntry: RawDictEntry, isIndonesian: boolean): DictionaryEntry {
  return {
    term: rawEntry.term,
    reading: rawEntry.reading,
    pos: rawEntry.pos,
    definitions: [rawEntry.definition],
    language: isIndonesian ? 'id' : 'en',
    frequency: 0,
  };
}

// Cache for dictionary data
const dictionaryCache: { [key: string]: DictionaryEntry[] } = {};

// Function to load English dictionary data (Jitendex)
async function loadEnglishDictionary(): Promise<DictionaryEntry[]> {
  try {
    const termBankFiles = await glob('src/data/en/jitendex-yomitan/term_bank_*.json', {
      cwd: process.cwd(),
      absolute: true,
    });

    const rawEntries: unknown[][] = [];
    for (const file of termBankFiles) {
      try {
        const fileContent = await fs.readFile(file, 'utf-8');
        const parsedContent = JSON.parse(fileContent);
        if (Array.isArray(parsedContent)) {
          rawEntries.push(...parsedContent);
        }
      } catch (error) {
        console.error(`Error loading ${file}:`, error);
      }
    }

    const entryMap = new Map<string, unknown[]>();
    for (const entry of rawEntries) {
      if (Array.isArray(entry) && entry.length > 0 && typeof entry[0] === 'string') {
        entryMap.set(entry[0], entry);
      }
    }

    const allEntries: DictionaryEntry[] = [];
    for (const entry of rawEntries) {
      if (Array.isArray(entry) && entry.length > 5) {
        const term = typeof entry[0] === 'string' ? entry[0] : '';
        let reading = typeof entry[1] === 'string' ? entry[1] : '';
        let pos = typeof entry[2] === 'string' ? entry[2] : '';
        let definitions = extractGlossary(entry[5]);
        let frequency = typeof entry[4] === 'number' ? entry[4] : 0;

        const redirectTargetTerm = extractRedirect(entry[5]);
        if (redirectTargetTerm) {
          const targetEntry = entryMap.get(redirectTargetTerm);
          if (targetEntry && Array.isArray(targetEntry) && targetEntry.length > 5) {
            reading = typeof targetEntry[1] === 'string' ? targetEntry[1] : reading;
            pos = typeof targetEntry[2] === 'string' ? targetEntry[2] : pos;
            definitions = extractGlossary(targetEntry[5]);
            frequency = typeof targetEntry[4] === 'number' ? targetEntry[4] : frequency;
          }
        }
      
        if (definitions.length > 0 || reading) {
          allEntries.push({
            term,
            reading,
            pos,
            definitions,
            language: 'en',
            frequency,
          });
        }
      }
    }

    return allEntries;
  } catch (error) {
    console.error('Failed to load English dictionary:', error);
    return [];
  }
}

// Function to load Indonesian dictionary data (JIDict)
async function loadIndonesianDictionary(): Promise<DictionaryEntry[]> {
  try {
    // Find all term bank files
    const termBankFiles = await glob('src/data/id/JIDict v.1.0.1 (By Philia Space Team)/term_bank_*.json', {
      cwd: process.cwd(),
      absolute: true,
    });

    const allEntries: DictionaryEntry[] = [];

    for (const file of termBankFiles) {
      try {
        const fileContent = await fs.readFile(file, 'utf-8');
        const rawData: any[][] = JSON.parse(fileContent);

        const entries = rawData.map((entry: any) => {
          const definitions = entry[5] && entry[5][0] 
            ? entry[5][0].split('\n').map((s: string) => s.trim().replace(/^\d+\.\s*/, '')).filter((s: string) => s)
            : [];

          return {
            term: entry[0],
            reading: entry[1],
            pos: entry[3] || '',
            definitions: definitions,
            language: 'id',
            frequency: entry[6] || 0,
          };
        });
        allEntries.push(...entries);
      } catch (error) {
        console.error(`Error loading ${file}:`, error);
      }
    }

    return allEntries;
  } catch (error) {
    console.error('Failed to load Indonesian dictionary:', error);
    return [];
  }
}

// Function to load Japanese monolingual dictionary data
async function loadJapaneseDictionary(): Promise<DictionaryEntry[]> {
  try {
    // First try to load the new Japanese dictionary
    const jpTermBankFiles = await glob('src/data/jp/新明解国語辞典　第八版/term_bank_*.json', {
      cwd: process.cwd(),
      absolute: true,
    });

    if (jpTermBankFiles.length > 0) {
      const allEntries: DictionaryEntry[] = [];

      for (const file of jpTermBankFiles) {
        try {
          const fileContent = await fs.readFile(file, 'utf-8');
          const rawData: any[][] = JSON.parse(fileContent);

          const entries = rawData.map((entry: any) => {
            // Extract definitions from structured content
            let definitions: string[] = [];
            if (entry[5] && Array.isArray(entry[5])) {
              definitions = entry[5].map((item: any) => {
                if (typeof item === 'string') {
                  return item;
                } else if (item && item.content) {
                  return extractTextFromContent(item.content);
                }
                return '';
              }).filter((def: string) => def.trim() !== '');
            }

            return {
              term: entry[0],
              reading: entry[1],
              pos: entry[2] || '',
              definitions: definitions,
              language: 'ja',
              frequency: entry[4] || 0,
            };
          });
          allEntries.push(...entries);
        } catch (error) {
          console.error(`Error loading ${file}:`, error);
        }
      }

      return allEntries;
    }

    // Fallback to the old English-based Japanese dictionary if new one isn't found
    const termBankFiles = await glob('dictionary/english/JMdict_english/term_bank_*.json', {
      cwd: process.cwd(),
      absolute: true,
    });

    const rawEntries: unknown[][] = [];
    for (const file of termBankFiles) {
      try {
        const fileContent = await fs.readFile(file, 'utf-8');
        const parsedContent = JSON.parse(fileContent);
        if (Array.isArray(parsedContent)) {
          rawEntries.push(...parsedContent);
        }
      } catch (error) {
        console.error(`Error loading ${file}:`, error);
      }
    }

    const entryMap = new Map<string, unknown[]>();
    for (const entry of rawEntries) {
      if (Array.isArray(entry) && entry.length > 0 && typeof entry[0] === 'string') {
        entryMap.set(entry[0], entry);
      }
    }

    const allEntries: DictionaryEntry[] = [];
    for (const entry of rawEntries) {
      if (Array.isArray(entry) && entry.length > 5) {
        const term = typeof entry[0] === 'string' ? entry[0] : '';
        let reading = typeof entry[1] === 'string' ? entry[1] : '';
        let pos = typeof entry[2] === 'string' ? entry[2] : '';
        let definitions = extractGlossary(entry[5]);
        let frequency = typeof entry[4] === 'number' ? entry[4] : 0;

        const redirectTargetTerm = extractRedirect(entry[5]);
        if (redirectTargetTerm) {
          const targetEntry = entryMap.get(redirectTargetTerm);
          if (targetEntry && Array.isArray(targetEntry) && targetEntry.length > 5) {
            reading = typeof targetEntry[1] === 'string' ? targetEntry[1] : reading;
            pos = typeof targetEntry[2] === 'string' ? targetEntry[2] : pos;
            definitions = extractGlossary(targetEntry[5]);
            frequency = typeof targetEntry[4] === 'number' ? targetEntry[4] : frequency;
          }
        }
      
        if (definitions.length > 0 || reading) {
          allEntries.push({
            term,
            reading,
            pos,
            definitions,
            language: 'ja',
            frequency,
          });
        }
      }
    }

    return allEntries;
  } catch (error) {
    console.error('Failed to load Japanese dictionary:', error);
    return [];
  }
}

// Function to load dictionary data based on language
async function loadDictionary(language: string = "english"): Promise<DictionaryEntry[]> {
  // Use language-specific cache
  if (dictionaryCache[language]) {
    return dictionaryCache[language];
  }
  
  let allEntries: DictionaryEntry[] = [];
  
  try {
    switch (language) {
      case "english":
        allEntries = await loadEnglishDictionary();
        break;
      case "indonesian":
        allEntries = await loadIndonesianDictionary();
        break;
      case "japanese":
        allEntries = await loadJapaneseDictionary();
        break;
      default:
        // Default to English if language not supported
        allEntries = await loadEnglishDictionary();
        break;
    }
    
    dictionaryCache[language] = allEntries;
    return allEntries;
  } catch (error) {
    console.error(`Failed to load ${language} dictionary:`, error);
    dictionaryCache[language] = [];
    return dictionaryCache[language];
  }
}

// Helper function to check if a string contains Japanese characters
function containsJapanese(text: string): boolean {
  // Japanese character ranges:
  // Hiragana: \u3040-\u309F
  // Katakana: \u30A0-\u30FF
  // Kanji: \u4E00-\u9FAF
  const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
  return japaneseRegex.test(text);
}

// Helper function to calculate character overlap between search term and dictionary term
function calculateCharacterOverlap(searchTerm: string, dictTerm: string): number {
  const searchChars = new Set(searchTerm);
  const dictChars = new Set(dictTerm);
  
  let overlap = 0;
  for (const char of searchChars) {
    if (dictChars.has(char)) {
      overlap++;
    }
  }
  
  return overlap;
}

function isRomaji(text: string): boolean {
  return /^[a-zA-Z]+$/.test(text);
}

// Helper function to check if a string is romaji only
function isRomajiOnly(text: string): boolean {
  return /^[a-zA-Z]+$/.test(text);
}

function hiraganaToKatakana(text: string): string {
  return text.replace(/[\u3041-\u3096]/g, function(match) {
    const charCode = match.charCodeAt(0) + 0x60;
    return String.fromCharCode(charCode);
  });
}

// Convert kana to romaji
function convertKanaToRomaji(text: string): string {
  const kanaMap: { [key: string]: string } = {
    // Hiragana
    'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
    'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
    'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
    'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
    'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
    'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
    'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
    'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
    'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
    'わ': 'wa', 'を': 'wo', 'ん': 'n',
    'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
    'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
    'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do',
    'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
    'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
    'きゃ': 'kya', 'きゅ': 'kyu', 'きょ': 'kyo',
    'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho',
    'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho',
    'にゃ': 'nya', 'にゅ': 'nyu', 'にょ': 'nyo',
    'ひゃ': 'hya', 'ひゅ': 'hyu', 'ひょ': 'hyo',
    'みゃ': 'mya', 'みゅ': 'myu', 'みょ': 'myo',
    'りゃ': 'rya', 'りゅ': 'ryu', 'りょ': 'ryo',
    'ぎゃ': 'gya', 'ぎゅ': 'gyu', 'ぎょ': 'gyo',
    'じゃ': 'ja', 'じゅ': 'ju', 'じょ': 'jo',
    'びゃ': 'bya', 'びゅ': 'byu', 'びょ': 'byo',
    'ぴゃ': 'pya', 'ぴゅ': 'pyu', 'ぴょ': 'pyo',
    // Katakana
    'ア': 'a', 'イ': 'i', 'ウ': 'u', 'エ': 'e', 'オ': 'o',
    'カ': 'ka', 'キ': 'ki', 'ク': 'ku', 'ケ': 'ke', 'コ': 'ko',
    'サ': 'sa', 'シ': 'shi', 'ス': 'su', 'セ': 'se', 'ソ': 'so',
    'タ': 'ta', 'チ': 'chi', 'ツ': 'tsu', 'テ': 'te', 'ト': 'to',
    'ナ': 'na', 'ニ': 'ni', 'ヌ': 'nu', 'ネ': 'ne', 'ノ': 'no',
    'ハ': 'ha', 'ヒ': 'hi', 'フ': 'fu', 'ヘ': 'he', 'ホ': 'ho',
    'マ': 'ma', 'ミ': 'mi', 'ム': 'mu', 'メ': 'me', 'モ': 'mo',
    'ヤ': 'ya', 'ユ': 'yu', 'ヨ': 'yo',
    'ラ': 'ra', 'リ': 'ri', 'ル': 'ru', 'レ': 're', 'ロ': 'ro',
    'ワ': 'wa', 'ヲ': 'wo', 'ン': 'n',
    'ガ': 'ga', 'ギ': 'gi', 'グ': 'gu', 'ゲ': 'ge', 'ゴ': 'go',
    'ザ': 'za', 'ジ': 'ji', 'ズ': 'zu', 'ゼ': 'ze', 'ゾ': 'zo',
    'ダ': 'da', 'ヂ': 'ji', 'ヅ': 'zu', 'デ': 'de', 'ド': 'do',
    'バ': 'ba', 'ビ': 'bi', 'ブ': 'bu', 'ベ': 'be', 'ボ': 'bo',
    'パ': 'pa', 'ピ': 'pi', 'プ': 'pu', 'ペ': 'pe', 'ポ': 'po',
    'キャ': 'kya', 'キュ': 'kyu', 'キョ': 'kyo',
    'シャ': 'sha', 'シュ': 'shu', 'ショ': 'sho',
    'チャ': 'cha', 'チュ': 'chu', 'チョ': 'cho',
    'ニャ': 'nya', 'ニュ': 'nyu', 'ニョ': 'nyo',
    'ヒャ': 'hya', 'ヒュ': 'hyu', 'ヒョ': 'hyo',
    'ミャ': 'mya', 'ミュ': 'myu', 'ミョ': 'myo',
    'リャ': 'rya', 'リュ': 'ryu', 'リョ': 'ryo',
    'ギャ': 'gya', 'ギュ': 'gyu', 'ギョ': 'gyo',
    'ジャ': 'ja', 'ジュ': 'ju', 'ジョ': 'jo',
    'ビャ': 'bya', 'ビュ': 'byu', 'ビョ': 'byo',
    'ピャ': 'pya', 'ピュ': 'pyu', 'ピョ': 'pyo',
  };

  let result = '';
  let i = 0;
  while (i < text.length) {
    let found = false;
    // Try to match 2-character kana first (like しゃ, きゃ, etc.)
    if (i + 1 < text.length) {
      const twoChars = text.substring(i, i + 2);
      if (kanaMap[twoChars]) {
        result += kanaMap[twoChars];
        i += 2;
        found = true;
        continue;
      }
    }
    // Try to match 1-character kana
    const oneChar = text.substring(i, i + 1);
    if (kanaMap[oneChar]) {
      result += kanaMap[oneChar];
      i += 1;
      found = true;
      continue;
    }
    // If no match, just add the character as is
    result += oneChar;
    i += 1;
  }
  return result;
}

function romajiToHiragana(text: string): string {
  const romajiMap: { [key: string]: string } = {
    'a': 'あ', 'i': 'い', 'u': 'う', 'e': 'え', 'o': 'お',
    'ka': 'か', 'ki': 'き', 'ku': 'く', 'ke': 'け', 'ko': 'こ',
    'sa': 'さ', 'shi': 'し', 'su': 'す', 'se': 'せ', 'so': 'そ',
    'ta': 'た', 'chi': 'ち', 'tsu': 'つ', 'te': 'て', 'to': 'と',
    'na': 'な', 'ni': 'に', 'nu': 'ぬ', 'ne': 'ね', 'no': 'の',
    'ha': 'は', 'hi': 'ひ', 'fu': 'ふ', 'he': 'へ', 'ho': 'ほ',
    'ma': 'ま', 'mi': 'み', 'mu': 'む', 'me': 'め', 'mo': 'も',
    'ya': 'や', 'yu': 'ゆ', 'yo': 'よ',
    'ra': 'ら', 'ri': 'り', 'ru': 'る', 're': 'れ', 'ro': 'ろ',
    'wa': 'わ', 'wo': 'を', 'n': 'ん',
    'ga': 'が', 'gi': 'ぎ', 'gu': 'ぐ', 'ge': 'げ', 'go': 'ご',
    'za': 'ざ', 'ji': 'じ', 'zu': 'ず', 'ze': 'ぜ', 'zo': 'ぞ',
    'da': 'だ', 'di': 'ぢ', 'dzu': 'づ', 'de': 'で', 'do': 'ど',
    'ba': 'ば', 'bi': 'び', 'bu': 'ぶ', 'be': 'べ', 'bo': 'ぼ',
    'pa': 'ぱ', 'pi': 'ぴ', 'pu': 'ぷ', 'pe': 'ぺ', 'po': 'ぽ',
    'kya': 'きゃ', 'kyu': 'きゅ', 'kyo': 'きょ',
    'sha': 'しゃ', 'shu': 'しゅ', 'sho': 'しょ',
    'cha': 'ちゃ', 'chu': 'ちゅ', 'cho': 'ちょ',
    'nya': 'にゃ', 'nyu': 'にゅ', 'nyo': 'にょ',
    'hya': 'ひゃ', 'hyu': 'ひゅ', 'hyo': 'ひょ',
    'mya': 'みゃ', 'myu': 'みゅ', 'myo': 'みょ',
    'rya': 'りゃ', 'ryu': 'りゅ', 'ryo': 'りょ',
    'gya': 'ぎゃ', 'gyu': 'ぎゅ', 'gyo': 'ぎょ',
    'ja': 'じゃ', 'ju': 'じゅ', 'jo': 'じょ',
    'bya': 'びゃ', 'byu': 'びゅ', 'byo': 'びょ',
    'pya': 'ぴゃ', 'pyu': 'ぴゅ', 'pyo': 'ぴょ',
  };

  let result = '';
  let i = 0;
  text = text.toLowerCase();
  while (i < text.length) {
    let found = false;
    if (i + 1 < text.length && text[i] !== 'n' && text[i] === text[i+1] && 'bcdfghjklmpqrstvwxyz'.includes(text[i])) {
      result += 'っ';
      i++;
      continue;
    }
    for (let j = 3; j > 0; j--) {
      if (i + j <= text.length) {
        const sub = text.substring(i, i + j);
        if (romajiMap[sub]) {
          result += romajiMap[sub];
          i += j;
          found = true;
          break;
        }
      }
    }
    if (!found) {
      const sub = text.substring(i, i + 1);
      if (sub === 'n') {
        if (i + 1 >= text.length || !'aiueoy'.includes(text[i+1])) {
          result += 'ん';
        } else {
          result += 'ん';
        }
      } else {
        result += sub;
      }
      i++;
    }
  }
  return result;
}

function levenshtein(a: string, b: string): number {
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
  for (let i = 0; i <= a.length; i += 1) {
    matrix[0][i] = i;
  }
  for (let j = 0; j <= b.length; j += 1) {
    matrix[j][0] = j;
  }
  for (let j = 1; j <= b.length; j += 1) {
    for (let i = 1; i <= a.length; i += 1) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + substitutionCost, // substitution
      );
    }
  }
  return matrix[b.length][a.length];
}

// Helper function to check if a string contains only kanji characters
function isKanjiOnly(text: string): boolean {
  const kanjiRegex = /^[\u4E00-\u9FAF]+$/;
  return kanjiRegex.test(text);
}

// Helper function to check if a string contains kanji characters
function containsKanji(text: string): boolean {
  const kanjiRegex = /[\u4E00-\u9FAF]/;
  return kanjiRegex.test(text);
}

// Helper function to check if a string contains hiragana or katakana
function containsKana(text: string): boolean {
  const kanaRegex = /[\u3040-\u309F\u30A0-\u30FF]/;
  return kanaRegex.test(text);
}

// Helper function to check if a string is hiragana or katakana only
function isKanaOnly(text: string): boolean {
  const kanaOnlyRegex = /^[\u3040-\u309F\u30A0-\u30FF]+$/;
  return kanaOnlyRegex.test(text);
}

// Calculate similarity between two kana strings using Levenshtein distance
function calculateKanaSimilarity(searchTerm: string, dictTerm: string): number {
  // Convert both to hiragana for comparison
  const searchHiragana = hiraganaToKatakana(searchTerm).replace(/[\u30A0-\u30FF]/g, match => {
    const charCode = match.charCodeAt(0) - 0x60;
    return String.fromCharCode(charCode);
  });
  
  const dictHiragana = hiraganaToKatakana(dictTerm).replace(/[\u30A0-\u30FF]/g, match => {
    const charCode = match.charCodeAt(0) - 0x60;
    return String.fromCharCode(charCode);
  });
  
  const distance = levenshtein(searchHiragana, dictHiragana);
  const maxLength = Math.max(searchHiragana.length, dictHiragana.length);
  
  // Return similarity as a percentage (higher is more similar)
  return maxLength > 0 ? (1 - distance / maxLength) * 100 : 0;
}

// Calculate similarity between two strings using Levenshtein distance
function calculateStringSimilarity(searchTerm: string, dictTerm: string): number {
  const distance = levenshtein(searchTerm.toLowerCase(), dictTerm.toLowerCase());
  const maxLength = Math.max(searchTerm.length, dictTerm.length);
  
  // Return similarity as a percentage (higher is more similar)
  return maxLength > 0 ? (1 - distance / maxLength) * 100 : 0;
}

// Check if a definition contains the exact meaning (for English/Indonesian searches)
function hasExactMeaning(definitions: string[], searchTerm: string): boolean {
  const lowerSearchTerm = searchTerm.toLowerCase();
  return definitions.some(def => {
    const lowerDef = def.toLowerCase();
    // Check for exact word match (not partial)
    return lowerDef === lowerSearchTerm || 
           lowerDef.startsWith(lowerSearchTerm + " ") || 
           lowerDef.endsWith(" " + lowerSearchTerm) || 
           lowerDef.includes(" " + lowerSearchTerm + " ");
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const language = searchParams.get('lang') || 'english';
  
  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }
  
  try {
    const dictionary = await loadDictionary(language);
    const searchTerm = query.trim();
    
    // Check if search term is kanji only
    const isSearchKanjiOnly = isKanjiOnly(searchTerm);
    const isSearchKanaOnly = isKanaOnly(searchTerm);
    const isSearchRomaji = isRomaji(searchTerm);
    
    // Separate different types of matches
    const exactMatches: typeof dictionary = [];
    const kanjiMatches: typeof dictionary = [];
    const kanaMatches: { entry: typeof dictionary[0], similarity: number }[] = [];
    const romajiMatches: { entry: typeof dictionary[0], similarity: number }[] = [];
    const meaningMatches: typeof dictionary = [];
    const otherMatches: typeof dictionary = [];
    
    dictionary.forEach(entry => {
      const term = entry.term;
      const reading = entry.reading;
      const definitions = entry.definitions.join(' ').toLowerCase();
      
      // Exact term match
      if (term === searchTerm) {
        exactMatches.push(entry);
        return;
      }
      
      // For kanji-only searches, prioritize entries that contain the exact kanji
      if (isSearchKanjiOnly && containsKanji(term)) {
        // Check if the term contains all the kanji characters from the search term
        const searchChars = new Set(searchTerm);
        const termChars = new Set(term);
        let allKanjiMatch = true;
        
        for (const char of searchChars) {
          if (!termChars.has(char)) {
            allKanjiMatch = false;
            break;
          }
        }
        
        if (allKanjiMatch) {
          // Exact kanji match gets highest priority
          if (term.length === searchTerm.length) {
            exactMatches.push(entry);
          } else {
            // Words with exact kanji + different kanji
            kanjiMatches.push(entry);
          }
          return;
        }
      }
      
      // For kana-only searches, prioritize by similarity
      if (isSearchKanaOnly && (containsKana(term) || containsKana(reading))) {
        const termToCompare = containsKana(term) ? term : reading;
        if (termToCompare) {
          const similarity = calculateKanaSimilarity(searchTerm, termToCompare);
          if (similarity > 0) {
            kanaMatches.push({ entry, similarity });
            return;
          }
        }
      }
      
      // For romaji searches, prioritize by similarity to readings
      // Only do this for short queries that look like romaji
      if (isSearchRomaji && reading && searchTerm.length <= 10) {
        // Convert reading to romaji for comparison
        const readingRomaji = convertKanaToRomaji(reading);
        const similarity = calculateStringSimilarity(searchTerm, readingRomaji);
        if (similarity > 0) {
          romajiMatches.push({ entry, similarity });
          return;
        }
      }
      
      // For English/Indonesian searches, look for exact and similar meanings
      // Only do this for longer queries or when romaji detection fails
      if ((language === 'english' || language === 'indonesian') && 
          (searchTerm.length > 3 || !isSearchRomaji)) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        const lowerDefinitions = entry.definitions.join(' ').toLowerCase();
        
        // Check for exact word matches in definitions
        if (hasExactMeaning(entry.definitions, searchTerm)) {
          meaningMatches.push(entry);
          return;
        }
        
        // Check for partial matches in definitions
        if (lowerDefinitions.includes(lowerSearchTerm)) {
          meaningMatches.push(entry);
          return;
        }
      }
      
      // For Japanese monolingual searches, prioritize definitions that contain the search term
      if (language === 'japanese') {
        const lowerSearchTerm = searchTerm.toLowerCase();
        const lowerDefinitions = entry.definitions.join(' ').toLowerCase();
        const lowerTerm = term.toLowerCase();
        const lowerReading = reading.toLowerCase();
        
        // Check for matches in term, reading, or definitions
        if (lowerTerm.includes(lowerSearchTerm) || 
            lowerReading.includes(lowerSearchTerm) || 
            lowerDefinitions.includes(lowerSearchTerm)) {
          meaningMatches.push(entry);
          return;
        }
      }
      
      // Regular search for non-kanji-only terms or if no kanji match
      const lowerSearchTerm = searchTerm.toLowerCase();
      const lowerTerm = term.toLowerCase();
      const lowerReading = reading.toLowerCase();
      
      if (lowerTerm.includes(lowerSearchTerm) || 
          lowerReading.includes(lowerSearchTerm) || 
          definitions.includes(lowerSearchTerm)) {
        otherMatches.push(entry);
      }
    });
    
    // Sort kana matches by similarity (highest first)
    kanaMatches.sort((a, b) => b.similarity - a.similarity);
    
    // Sort romaji matches by similarity (highest first)
    romajiMatches.sort((a, b) => b.similarity - a.similarity);
    
    // Combine results in order of priority: 
    // 1. Exact matches
    // 2. Kanji matches (for kanji-only searches)
    // 3. Meaning matches (for English/Indonesian/Japanese searches)
    // 4. Kana matches sorted by similarity (for kana-only searches)
    // 5. Romaji matches sorted by similarity (for romaji searches)
    // 6. Other matches
    const results = [
      ...exactMatches, 
      ...kanjiMatches, 
      ...meaningMatches,
      ...kanaMatches.map(item => item.entry), 
      ...romajiMatches.map(item => item.entry),
      ...otherMatches
    ];
    
    const limitedResults = results.slice(0, 50);
    
    return NextResponse.json(limitedResults);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
