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

// Define the structure of the raw JMdict data from JSON files
interface RawJMdictEntry {
  [0]: string; // term
  [1]: string; // reading
  [2]: string; // pos
  [3]: string; // unused
  [4]: number; // frequency
  [5]: Array<{
    type: string;
    content: Array<{
      content: {
        content: string | Array<any>;
        tag: string;
      } | Array<{
        content: string;
        tag: string;
      }>;
      tag: string;
    }>;
  }>; // definitions
  [6]: number; // sequence
  [7]: string; // unused
}

class JMdictParser {
  private dictionary: JMdictEntry[] = [];
  private loaded: boolean = false;

  constructor() {
    this.loadDictionary();
  }

  private async loadDictionary() {
    try {
      // For now, we'll use sample data since we're in a browser environment
      // In a real implementation, you would fetch and parse the actual JMdict JSON files
      this.dictionary = [
        {
          term: "食べる",
          reading: "たべる",
          pos: "v1",
          frequency: 100,
          definitions: ["to eat"],
          example: "私は毎日ご飯を食べます。",
          exampleTranslation: "I eat rice every day."
        },
        {
          term: "飲む",
          reading: "のむ",
          pos: "v5",
          frequency: 200,
          definitions: ["to drink"],
          example: "彼は水を飲みます。",
          exampleTranslation: "He drinks water."
        },
        {
          term: "行く",
          reading: "いく",
          pos: "v5",
          frequency: 150,
          definitions: ["to go"],
          example: "学校に行きます。",
          exampleTranslation: "I go to school."
        },
        {
          term: "見る",
          reading: "みる",
          pos: "v1",
          frequency: 120,
          definitions: ["to see", "to look at"],
          example: "映画を見ます。",
          exampleTranslation: "I watch a movie."
        },
        {
          term: "する",
          reading: "する",
          pos: "vs",
          frequency: 50,
          definitions: ["to do"],
          example: "宿題をします。",
          exampleTranslation: "I do homework."
        },
        {
          term: "学生",
          reading: "がくせい",
          pos: "n",
          frequency: 80,
          definitions: ["student"],
          example: "彼は大学生です。",
          exampleTranslation: "He is a college student."
        },
        {
          term: "日本",
          reading: "にほん",
          pos: "n",
          frequency: 30,
          definitions: ["Japan"],
          example: "私は日本に行きました。",
          exampleTranslation: "I went to Japan."
        },
        {
          term: "本",
          reading: "ほん",
          pos: "n",
          frequency: 40,
          definitions: ["book"],
          example: "この本は面白いです。",
          exampleTranslation: "This book is interesting."
        },
        {
          term: "時間",
          reading: "じかん",
          pos: "n",
          frequency: 90,
          definitions: ["time"],
          example: "時間がありますか？",
          exampleTranslation: "Do you have time?"
        },
        {
          term: "人",
          reading: "ひと",
          pos: "n",
          frequency: 20,
          definitions: ["person"],
          example: "ここに人がいます。",
          exampleTranslation: "There is a person here."
        },
        {
          term: "大きい",
          reading: "おおきい",
          pos: "adj-i",
          frequency: 60,
          definitions: ["big", "large"],
          example: "大きい家に住んでいます。",
          exampleTranslation: "I live in a big house."
        },
        {
          term: "小さい",
          reading: "ちいさい",
          pos: "adj-i",
          frequency: 70,
          definitions: ["small", "little"],
          example: "小さい犬が好きです。",
          exampleTranslation: "I like small dogs."
        },
        {
          term: "上手",
          reading: "じょうず",
          pos: "adj-na",
          frequency: 110,
          definitions: ["skillful", "good at"],
          example: "彼はギターが上手です。",
          exampleTranslation: "He is good at guitar."
        },
        {
          term: "下手",
          reading: "へた",
          pos: "adj-na",
          frequency: 130,
          definitions: ["unskillful", "bad at"],
          example: "私は泳ぎが下手です。",
          exampleTranslation: "I'm bad at swimming."
        },
        {
          term: "美しい",
          reading: "うつくしい",
          pos: "adj-i",
          frequency: 140,
          definitions: ["beautiful"],
          example: "この花はとても美しいです。",
          exampleTranslation: "This flower is very beautiful."
        },
        {
          term: "こんにちは",
          reading: "こんにちは",
          pos: "int",
          frequency: 10,
          definitions: ["hello", "good day"],
          example: "こんにちは、元気ですか？",
          exampleTranslation: "Hello, how are you?"
        },
        {
          term: "ありがとう",
          reading: "ありがとう",
          pos: "int",
          frequency: 15,
          definitions: ["thank you"],
          example: "ありがとうございいます。",
          exampleTranslation: "Thank you very much."
        },
        {
          term: "水",
          reading: "みず",
          pos: "n",
          frequency: 75,
          definitions: ["water"],
          example: "この水は美味しいです。",
          exampleTranslation: "This water is delicious."
        },
        {
          term: "車",
          reading: "くるま",
          pos: "n",
          frequency: 65,
          definitions: ["car", "vehicle"],
          example: "車で行きます。",
          exampleTranslation: "I'll go by car."
        },
        {
          term: "電車",
          reading: "でんしゃ",
          pos: "n",
          frequency: 55,
          definitions: ["train"],
          example: "電車に乗ります。",
          exampleTranslation: "I'll take the train."
        }
      ];
      this.loaded = true;
    } catch (error) {
      console.error("Failed to load dictionary:", error);
      this.loaded = false;
    }
  }

  search(query: string): JMdictEntry[] {
    if (!this.loaded || !query.trim()) {
      return [];
    }

    const searchTerm = query.trim();
    
    // Search by term, reading, or definition
    return this.dictionary
      .filter(entry => 
        entry.term.includes(searchTerm) || 
        entry.reading.includes(searchTerm) ||
        entry.definitions.some(def => def.includes(searchTerm))
      )
      .sort((a, b) => a.frequency - b.frequency) // Sort by frequency (more common first)
      .slice(0, 50); // Limit results
  }

  getRandomEntries(count: number = 5): JMdictEntry[] {
    if (!this.loaded) return [];
    
    const shuffled = [...this.dictionary].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
}

const jmdictParser = new JMdictParser();
export default jmdictParser;