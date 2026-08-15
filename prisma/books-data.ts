// prisma/books-data.ts
import { Language } from '@prisma/client';

export interface LibraryBookData {
  title: string;
  author: string;
  language: Language;
  genre: string[];
  description: string;
  coverImage?: string;
  pageCount?: number;
  publishedYear?: number;
  isbn?: string;
  themeColor?: string;
  editorPickType?: string;
}

export const LIBRARY_GENRES = [
  'Thriller',
  'Satire',
  'Psychology',
  'Fiction',
  'Poetry',
  'Drama',
  'Philosophy',
  'Politics',
  'Spirituality',
  'Self-Help'
] as const;

export const LIBRARY_BOOKS: LibraryBookData[] = [
  // ==========================================
  // HINDI BOOKS (1 - 30) - Language: HINDI
  // ==========================================
  {
    title: 'कर्मभूमि',
    author: 'मुंशी प्रेमचंद',
    language: Language.HINDI,
    genre: ['Fiction', 'Politics'],
    description: 'सामाजिक और राष्ट्रीय चेतना पर आधारित उपन्यास। कर्तव्य और त्याग का महत्व दर्शाता है। ग्रामीण भारत का यथार्थ चित्रण।',
    coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=900&fit=crop',
    pageCount: 380,
    publishedYear: 1932,
    themeColor: '#7c2d12',
    editorPickType: 'MONTH'
  },
  {
    title: 'रश्मिरथी',
    author: 'रामधारी सिंह दिनकर',
    language: Language.HINDI,
    genre: ['Poetry', 'Drama'],
    description: 'कर्ण के जीवन पर आधारित महाकाव्य। वीरता और आत्मसम्मान का प्रतीक। ओजस्वी काव्य शैली।',
    coverImage: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600&h=900&fit=crop',
    pageCount: 160,
    publishedYear: 1952,
    themeColor: '#9a3412',
    editorPickType: 'WEEK'
  },
  {
    title: 'उर्वशी',
    author: 'रामधारी सिंह दिनकर',
    language: Language.HINDI,
    genre: ['Poetry', 'Drama'],
    description: 'पौराणिक प्रेम कथा। मानवीय भावनाओं का चित्रण। काव्य और दर्शन का संगम।',
    coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&h=900&fit=crop',
    pageCount: 210,
    publishedYear: 1961,
    themeColor: '#854d0e'
  },
  {
    title: 'गोदान',
    author: 'मुंशी प्रेमचंद',
    language: Language.HINDI,
    genre: ['Fiction', 'Politics'],
    description: 'किसान जीवन पर आधारित उपन्यास। शोषण और गरीबी की समस्या। यथार्थवादी साहित्य।',
    coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=900&fit=crop',
    pageCount: 340,
    publishedYear: 1936,
    themeColor: '#451a03',
    editorPickType: 'MAGAZINE'
  },
  {
    title: 'उत्सर्ग',
    author: 'रवीन्द्रनाथ ठाकुर',
    language: Language.HINDI,
    genre: ['Drama', 'Fiction'],
    description: 'त्याग और प्रेम की कथा। मानवीय मूल्यों पर आधारित। भावनात्मक रचना।',
    coverImage: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=600&h=900&fit=crop',
    pageCount: 180,
    publishedYear: 1903,
    themeColor: '#365314'
  },
  {
    title: 'सूरज का सातवाँ घोड़ा',
    author: 'धर्मवीर भारती',
    language: Language.HINDI,
    genre: ['Fiction', 'Psychology'],
    description: 'प्रयोगात्मक कथा शैली। प्रेम और स्मृति का चित्रण। आधुनिक हिंदी उपन्यास।',
    coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&h=900&fit=crop',
    pageCount: 128,
    publishedYear: 1952,
    themeColor: '#1e3a8a'
  },
  {
    title: 'डार्क हॉर्स',
    author: 'नीलोत्पल मृणाल',
    language: Language.HINDI,
    genre: ['Fiction', 'Self-Help'],
    description: 'समकालीन युवा जीवन। प्रतियोगी परीक्षाओं की सच्चाई। यथार्थपरक दृष्टि।',
    coverImage: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=900&fit=crop',
    pageCount: 220,
    publishedYear: 2015,
    themeColor: '#1f2937'
  },
  {
    title: 'हमसे क्या हो सका मोहब्बत में',
    author: 'विविध कवि',
    language: Language.HINDI,
    genre: ['Poetry'],
    description: 'प्रेम कविताओं का संग्रह। विरह और अनुभूति। भावनात्मक अभिव्यक्ति।',
    coverImage: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&h=900&fit=crop',
    pageCount: 150,
    publishedYear: 2018,
    themeColor: '#831843'
  },
  {
    title: 'चित्रलेखा',
    author: 'भगवतीचरण वर्मा',
    language: Language.HINDI,
    genre: ['Philosophy', 'Fiction'],
    description: 'पाप और पुण्य का दर्शन। ऐतिहासिक पृष्ठभूमि। दार्शनिक उपन्यास।',
    coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&h=900&fit=crop',
    pageCount: 260,
    publishedYear: 1934,
    themeColor: '#701a75'
  },
  {
    title: 'संघर्ष से समाधि की ओर',
    author: 'स्वामी विवेकानंद',
    language: Language.HINDI,
    genre: ['Spirituality', 'Philosophy'],
    description: 'आध्यात्मिक प्रेरणा। आत्मविकास पर केंद्रित। वेदांत दर्शन।',
    coverImage: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600&h=900&fit=crop',
    pageCount: 310,
    publishedYear: 1910,
    themeColor: '#c2410c'
  },
  {
    title: 'यही सच है',
    author: 'मन्नू भंडारी',
    language: Language.HINDI,
    genre: ['Psychology', 'Fiction'],
    description: 'आधुनिक नारी मनोविज्ञान। भावनात्मक संघर्ष। सामाजिक यथार्थ।',
    coverImage: 'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?w=600&h=900&fit=crop',
    pageCount: 140,
    publishedYear: 1966,
    themeColor: '#0f766e'
  },
  {
    title: 'राग दरबारी',
    author: 'श्रीलाल शुक्ल',
    language: Language.HINDI,
    genre: ['Satire', 'Politics'],
    description: 'राजनीतिक और सामाजिक व्यंग्य। ग्रामीण सत्ता संरचना। तीक्ष्ण हास्य।',
    coverImage: 'https://images.unsplash.com/photo-1513001900722-370f803f498d?w=600&h=900&fit=crop',
    pageCount: 350,
    publishedYear: 1968,
    themeColor: '#374151'
  },
  {
    title: 'शेखर: एक जीवनी',
    author: 'सच्चिदानंद हीरानंद वात्स्यायन अज्ञेय',
    language: Language.HINDI,
    genre: ['Psychology', 'Fiction'],
    description: 'मनोवैज्ञानिक उपन्यास। व्यक्तिगत स्वतंत्रता। आधुनिक साहित्य।',
    coverImage: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&h=900&fit=crop',
    pageCount: 420,
    publishedYear: 1941,
    themeColor: '#1e293b'
  },
  {
    title: 'अपने अपने राम',
    author: 'भीष्म साहनी',
    language: Language.HINDI,
    genre: ['Philosophy', 'Drama'],
    description: 'राम कथा की आधुनिक व्याख्या। मानवीय दृष्टिकोण। दार्शनिक चिंतन।',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&h=900&fit=crop',
    pageCount: 290,
    publishedYear: 1992,
    themeColor: '#78350f'
  },
  {
    title: 'कबीर साखी सुधा',
    author: 'कबीर',
    language: Language.HINDI,
    genre: ['Poetry', 'Spirituality', 'Philosophy'],
    description: 'भक्ति काव्य संग्रह। जीवन दर्शन। सरल और प्रभावी भाषा।',
    coverImage: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=600&h=900&fit=crop',
    pageCount: 190,
    publishedYear: 1500,
    themeColor: '#92400e'
  },
  {
    title: 'गाय-सी मेहनत',
    author: 'हरिशंकर परसाई',
    language: Language.HINDI,
    genre: ['Satire'],
    description: 'व्यंग्य निबंध। सामाजिक विसंगतियाँ। तीखा कटाक्ष।',
    coverImage: 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=600&h=900&fit=crop',
    pageCount: 160,
    publishedYear: 1980,
    themeColor: '#164e63'
  },
  {
    title: 'अक्टूबर जंक्शन',
    author: 'दिव्य प्रकाश दुबे',
    language: Language.HINDI,
    genre: ['Fiction', 'Drama'],
    description: 'युवा प्रेम कथा। शहरी जीवन। आधुनिक शैली।',
    coverImage: 'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?w=600&h=900&fit=crop',
    pageCount: 180,
    publishedYear: 2019,
    themeColor: '#b45309'
  },
  {
    title: 'खुद से मिलने की फुर्सत किसे थी',
    author: 'गुलजार',
    language: Language.HINDI,
    genre: ['Poetry', 'Psychology'],
    description: 'कविता संग्रह। आत्मचिंतन। संवेदनशील अभिव्यक्ति।',
    coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&h=900&fit=crop',
    pageCount: 175,
    publishedYear: 2016,
    themeColor: '#4c1d95'
  },
  {
    title: 'काशी का अस्सी',
    author: 'काशीनाथ सिंह',
    language: Language.HINDI,
    genre: ['Satire', 'Politics'],
    description: 'बनारस की लोकसंस्कृति। हास्य और यथार्थ। स्थानीय जीवन।',
    coverImage: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600&h=900&fit=crop',
    pageCount: 240,
    publishedYear: 2002,
    themeColor: '#831843'
  },
  {
    title: 'गबन',
    author: 'मुंशी प्रेमचंद',
    language: Language.HINDI,
    genre: ['Fiction', 'Psychology'],
    description: 'मध्यम वर्गीय जीवन। लालच और नैतिकता। यथार्थवादी उपन्यास।',
    coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=900&fit=crop',
    pageCount: 320,
    publishedYear: 1931,
    themeColor: '#3b0764'
  },
  {
    title: 'मैं मृत्यु सिखाता हूँ',
    author: 'ओशो',
    language: Language.HINDI,
    genre: ['Spirituality', 'Philosophy'],
    description: 'आध्यात्मिक दर्शन। जीवन और मृत्यु। चिंतनपरक लेखन।',
    coverImage: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&h=900&fit=crop',
    pageCount: 280,
    publishedYear: 1978,
    themeColor: '#064e3b'
  },
  {
    title: 'कैसा कुत्ता है',
    author: 'हरिशंकर परसाई',
    language: Language.HINDI,
    genre: ['Satire'],
    description: 'व्यंग्य रचना। सामाजिक आलोचना। हास्य मिश्रित।',
    coverImage: 'https://images.unsplash.com/photo-1513001900722-370f803f498d?w=600&h=900&fit=crop',
    pageCount: 150,
    publishedYear: 1984,
    themeColor: '#1c1917'
  },
  {
    title: 'कितने पाकिस्तान',
    author: 'कमलेश्वर',
    language: Language.HINDI,
    genre: ['Fiction', 'Politics', 'Philosophy'],
    description: 'भारत विभाजन की पीड़ा। इतिहास और राजनीति। संवेदनशील उपन्यास।',
    coverImage: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&h=900&fit=crop',
    pageCount: 360,
    publishedYear: 2000,
    themeColor: '#7f1d1d'
  },
  {
    title: 'गुनाहों का देवता',
    author: 'धर्मवीर भारती',
    language: Language.HINDI,
    genre: ['Fiction', 'Drama'],
    description: 'प्रेम और त्याग की कथा। भावनात्मक संघर्ष। आदर्शवादी उपन्यास।',
    coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&h=900&fit=crop',
    pageCount: 270,
    publishedYear: 1949,
    themeColor: '#701a75'
  },
  {
    title: 'कसप',
    author: 'मोहम्मद अली',
    language: Language.HINDI,
    genre: ['Fiction', 'Drama'],
    description: 'मानवीय संघर्ष। सामाजिक यथार्थ। संवेदनशील कथा।',
    coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=900&fit=crop',
    pageCount: 210,
    publishedYear: 1982,
    themeColor: '#1e1b4b'
  },
  {
    title: 'आपका बंटी',
    author: 'मन्नू भंडारी',
    language: Language.HINDI,
    genre: ['Psychology', 'Drama', 'Fiction'],
    description: 'टूटते परिवार की कहानी। बाल मनोविज्ञान। संवेदनशील उपन्यास।',
    coverImage: 'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?w=600&h=900&fit=crop',
    pageCount: 230,
    publishedYear: 1971,
    themeColor: '#047857'
  },
  {
    title: 'बहरों को सुनाने के लिए',
    author: 'हरिशंकर परसाई',
    language: Language.HINDI,
    genre: ['Satire', 'Politics'],
    description: 'व्यंग्य निबंध संग्रह। सामाजिक आलोचना। तर्कपूर्ण लेखन।',
    coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&h=900&fit=crop',
    pageCount: 165,
    publishedYear: 1990,
    themeColor: '#334155'
  },
  {
    title: 'यश की धरोहर',
    author: 'महादेवी वर्मा',
    language: Language.HINDI,
    genre: ['Drama', 'Philosophy'],
    description: 'साहित्यिक स्मृतियाँ। संवेदनशील लेखन। सांस्कृतिक धरोहर।',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&h=900&fit=crop',
    pageCount: 200,
    publishedYear: 1968,
    themeColor: '#854d0e'
  },
  {
    title: 'संस्कृतियाँ',
    author: 'महादेवी वर्मा',
    language: Language.HINDI,
    genre: ['Philosophy', 'Politics'],
    description: 'निबंध संग्रह। भारतीय संस्कृति। चिंतनपरक शैली।',
    coverImage: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=600&h=900&fit=crop',
    pageCount: 220,
    publishedYear: 1974,
    themeColor: '#3f3f46'
  },
  {
    title: 'पूस की रात और अन्य कहानियाँ',
    author: 'मुंशी प्रेमचंद',
    language: Language.HINDI,
    genre: ['Fiction', 'Drama'],
    description: 'कहानी संग्रह। ग्रामीण जीवन। मानवीय संवेदना।',
    coverImage: 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=600&h=900&fit=crop',
    pageCount: 180,
    publishedYear: 1930,
    themeColor: '#451a03'
  },

  // ==========================================
  // ENGLISH BOOKS (31 - 60) - Language: ENGLISH
  // ==========================================
  {
    title: 'The Bell Jar',
    author: 'Sylvia Plath',
    language: Language.ENGLISH,
    genre: ['Psychology', 'Fiction'],
    description: 'Psychological novel exploring mental health themes and personal identity with an autobiographical tone.',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&h=900&fit=crop',
    pageCount: 244,
    publishedYear: 1963,
    themeColor: '#0f172a',
    editorPickType: 'MONTH'
  },
  {
    title: 'Crime and Punishment',
    author: 'Fyodor Dostoevsky',
    language: Language.ENGLISH,
    genre: ['Psychology', 'Philosophy', 'Thriller'],
    description: 'Crime and morality, guilt and conscience examined with profound psychological depth.',
    coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=900&fit=crop',
    pageCount: 430,
    publishedYear: 1866,
    themeColor: '#881337',
    editorPickType: 'WEEK'
  },
  {
    title: 'The Picture of Dorian Gray',
    author: 'Oscar Wilde',
    language: Language.ENGLISH,
    genre: ['Fiction', 'Philosophy', 'Drama'],
    description: 'Beauty and morality intertwined with philosophical fiction and dark aesthetics.',
    coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&h=900&fit=crop',
    pageCount: 254,
    publishedYear: 1890,
    themeColor: '#3b0764'
  },
  {
    title: 'War and Peace',
    author: 'Leo Tolstoy',
    language: Language.ENGLISH,
    genre: ['Fiction', 'Politics', 'Drama'],
    description: 'Historical epic charting human emotions and society across the Napoleonic wars.',
    coverImage: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600&h=900&fit=crop',
    pageCount: 1225,
    publishedYear: 1869,
    themeColor: '#451a03'
  },
  {
    title: 'The Subtle Art of Not Giving a F*ck',
    author: 'Mark Manson',
    language: Language.ENGLISH,
    genre: ['Self-Help', 'Psychology', 'Philosophy'],
    description: 'Modern self-help, life philosophy, and practical advice on choosing what truly matters.',
    coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&h=900&fit=crop',
    pageCount: 224,
    publishedYear: 2016,
    themeColor: '#ea580c'
  },
  {
    title: 'The Stranger',
    author: 'Albert Camus',
    language: Language.ENGLISH,
    genre: ['Philosophy', 'Psychology', 'Fiction'],
    description: 'Existential novel investigating absurdism, alienation, and philosophical detachment.',
    coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&h=900&fit=crop',
    pageCount: 159,
    publishedYear: 1942,
    themeColor: '#1e293b'
  },
  {
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    language: Language.ENGLISH,
    genre: ['Fiction', 'Satire', 'Drama'],
    description: 'Romantic fiction examining social manners, class, and marriage in 19th-century England.',
    coverImage: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&h=900&fit=crop',
    pageCount: 279,
    publishedYear: 1813,
    themeColor: '#9f1239'
  },
  {
    title: 'Something I’m Waiting to Tell You',
    author: 'Shreya Pattar',
    language: Language.ENGLISH,
    genre: ['Poetry', 'Drama'],
    description: 'Poetry collection exploring love, longing, and delicate modern emotional connections.',
    coverImage: 'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?w=600&h=900&fit=crop',
    pageCount: 120,
    publishedYear: 2020,
    themeColor: '#be185d'
  },
  {
    title: 'Norwegian Wood',
    author: 'Haruki Murakami',
    language: Language.ENGLISH,
    genre: ['Fiction', 'Psychology', 'Drama'],
    description: 'A nostalgic story of love, loss, and loneliness set against late-1960s Tokyo.',
    coverImage: 'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?w=600&h=900&fit=crop',
    pageCount: 296,
    publishedYear: 1987,
    themeColor: '#15803d'
  },
  {
    title: 'Wuthering Heights',
    author: 'Emily Brontë',
    language: Language.ENGLISH,
    genre: ['Fiction', 'Drama'],
    description: 'Gothic romance fueled by passion, revenge, and stormy moorland drama.',
    coverImage: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=900&fit=crop',
    pageCount: 416,
    publishedYear: 1847,
    themeColor: '#18181b'
  },
  {
    title: 'A Room of One’s Own',
    author: 'Virginia Woolf',
    language: Language.ENGLISH,
    genre: ['Politics', 'Philosophy'],
    description: 'Feminist essay reflecting on women, artistic creation, financial freedom, and writing.',
    coverImage: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&h=900&fit=crop',
    pageCount: 112,
    publishedYear: 1929,
    themeColor: '#0e7490'
  },
  {
    title: 'The Secret History',
    author: 'Donna Tartt',
    language: Language.ENGLISH,
    genre: ['Thriller', 'Psychology', 'Fiction'],
    description: 'Psychological thriller and dark academia mystery following classics students at an elite college.',
    coverImage: 'https://images.unsplash.com/photo-1513001900722-370f803f498d?w=600&h=900&fit=crop',
    pageCount: 559,
    publishedYear: 1992,
    themeColor: '#1c1917'
  },
  {
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    language: Language.ENGLISH,
    genre: ['Fiction', 'Drama', 'Satire'],
    description: 'The American Dream, illusion, wealth, and longing in the Roaring Twenties.',
    coverImage: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=600&h=900&fit=crop',
    pageCount: 180,
    publishedYear: 1925,
    themeColor: '#ca8a04'
  },
  {
    title: 'The Evolution of Beauty',
    author: 'Richard O. Prum',
    language: Language.ENGLISH,
    genre: ['Philosophy', 'Self-Help'],
    description: 'Evolutionary biology and aesthetic theory exploring Darwin\'s forgotten theory of mate choice.',
    coverImage: 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=600&h=900&fit=crop',
    pageCount: 336,
    publishedYear: 2017,
    themeColor: '#059669'
  },
  {
    title: 'Verity',
    author: 'Colleen Hoover',
    language: Language.ENGLISH,
    genre: ['Thriller', 'Psychology', 'Drama'],
    description: 'A gripping psychological thriller and dark romantic suspense with twisted secrets.',
    coverImage: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=600&h=900&fit=crop',
    pageCount: 336,
    publishedYear: 2018,
    themeColor: '#4c0519'
  },
  {
    title: 'The Alchemist',
    author: 'Paulo Coelho',
    language: Language.ENGLISH,
    genre: ['Fiction', 'Spirituality', 'Philosophy'],
    description: 'A spiritual journey of self-discovery, listening to one\'s heart, and pursuing one\'s Personal Legend.',
    coverImage: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600&h=900&fit=crop',
    pageCount: 208,
    publishedYear: 1988,
    themeColor: '#d97706'
  },
  {
    title: 'The Problems of Philosophy',
    author: 'Bertrand Russell',
    language: Language.ENGLISH,
    genre: ['Philosophy'],
    description: 'An accessible introduction to fundamental philosophical problems and logical analysis.',
    coverImage: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600&h=900&fit=crop',
    pageCount: 167,
    publishedYear: 1912,
    themeColor: '#1d4ed8'
  },
  {
    title: 'Letters to Milena',
    author: 'Franz Kafka',
    language: Language.ENGLISH,
    genre: ['Psychology', 'Drama', 'Philosophy'],
    description: 'Personal letters revealing intimate love, vulnerability, inner conflict, and literary brilliance.',
    coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&h=900&fit=crop',
    pageCount: 320,
    publishedYear: 1952,
    themeColor: '#713f12'
  },
  {
    title: 'Thus Spoke Zarathustra',
    author: 'Friedrich Nietzsche',
    language: Language.ENGLISH,
    genre: ['Philosophy', 'Spirituality'],
    description: 'Philosophical novel introducing the Übermensch, eternal recurrence, and will to power.',
    coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=900&fit=crop',
    pageCount: 352,
    publishedYear: 1883,
    themeColor: '#78350f'
  },
  {
    title: 'Love in the Time of Cholera',
    author: 'Gabriel García Márquez',
    language: Language.ENGLISH,
    genre: ['Fiction', 'Drama'],
    description: 'An epic novel of enduring, lifelong love spanning over half a century.',
    coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&h=900&fit=crop',
    pageCount: 348,
    publishedYear: 1985,
    themeColor: '#b91c1c'
  },
  {
    title: 'The Republic',
    author: 'Plato',
    language: Language.ENGLISH,
    genre: ['Philosophy', 'Politics'],
    description: 'Socratic dialogue on justice, the ideal city-state, the soul, and philosophical rulership.',
    coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=900&fit=crop',
    pageCount: 416,
    publishedYear: -375,
    themeColor: '#4338ca'
  },
  {
    title: 'The Idiot',
    author: 'Fyodor Dostoevsky',
    language: Language.ENGLISH,
    genre: ['Psychology', 'Fiction', 'Drama'],
    description: 'Innocence clashing with corrupt high society in this profound psychological tragedy.',
    coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&h=900&fit=crop',
    pageCount: 656,
    publishedYear: 1869,
    themeColor: '#312e81'
  },
  {
    title: 'The Laws of Human Nature',
    author: 'Robert Greene',
    language: Language.ENGLISH,
    genre: ['Psychology', 'Self-Help'],
    description: 'In-depth analysis of human behavior, social dynamics, and personal mastery.',
    coverImage: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=900&fit=crop',
    pageCount: 624,
    publishedYear: 2018,
    themeColor: '#047857'
  },
  {
    title: 'Reminders of Him',
    author: 'Colleen Hoover',
    language: Language.ENGLISH,
    genre: ['Fiction', 'Drama', 'Psychology'],
    description: 'A poignant story of redemption, motherhood, grief, and emotional healing.',
    coverImage: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&h=900&fit=crop',
    pageCount: 335,
    publishedYear: 2022,
    themeColor: '#9333ea'
  },
  {
    title: 'Think and Grow Rich',
    author: 'Napoleon Hill',
    language: Language.ENGLISH,
    genre: ['Self-Help', 'Psychology'],
    description: 'Timeless self-help and motivational classic on mindset, persistence, and ambition.',
    coverImage: 'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?w=600&h=900&fit=crop',
    pageCount: 238,
    publishedYear: 1937,
    themeColor: '#b45309'
  },
  {
    title: 'Genius',
    author: 'Various',
    language: Language.ENGLISH,
    genre: ['Psychology', 'Self-Help'],
    description: 'Explorations of extraordinary human intellect, creative breakthroughs, and creative potential.',
    coverImage: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&h=900&fit=crop',
    pageCount: 384,
    publishedYear: 2011,
    themeColor: '#4f46e5'
  },
  {
    title: 'India After Gandhi',
    author: 'Ramachandra Guha',
    language: Language.ENGLISH,
    genre: ['Politics', 'Philosophy'],
    description: 'Magisterial history of post-independence India, democracy, and national transformation.',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&h=900&fit=crop',
    pageCount: 960,
    publishedYear: 2007,
    themeColor: '#065f46'
  },
  {
    title: 'The Idiot Brain',
    author: 'Dean Burnett',
    language: Language.ENGLISH,
    genre: ['Psychology', 'Self-Help'],
    description: 'A witty, insightful exploration of neuroscience and the quirks of human brain function.',
    coverImage: 'https://images.unsplash.com/photo-1513001900722-370f803f498d?w=600&h=900&fit=crop',
    pageCount: 336,
    publishedYear: 2016,
    themeColor: '#0284c7'
  },
  {
    title: 'The Book Thief',
    author: 'Markus Zusak',
    language: Language.ENGLISH,
    genre: ['Fiction', 'Drama'],
    description: 'Moving historical fiction narrated by Death about the power of words and books in WWII Germany.',
    coverImage: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=600&h=900&fit=crop',
    pageCount: 584,
    publishedYear: 2005,
    themeColor: '#374151'
  },
  {
    title: 'Man’s Search for Meaning',
    author: 'Viktor E. Frankl',
    language: Language.ENGLISH,
    genre: ['Psychology', 'Spirituality', 'Philosophy'],
    description: 'Logotherapy, survival, and finding purpose and hope through unimaginable suffering.',
    coverImage: 'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?w=600&h=900&fit=crop',
    pageCount: 165,
    publishedYear: 1946,
    themeColor: '#111827',
    editorPickType: 'WEEK'
  }
];
