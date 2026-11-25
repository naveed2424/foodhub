import express, { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize Google Gen AI
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

import { BlogPost, INITIAL_POSTS, CATEGORIES_LIST } from './src/data/posts.ts';
export type { BlogPost };

const POSTS_FILE = path.join(__dirname, 'posts_store.json');
const REVIEWS_FILE = path.join(__dirname, 'reviews_store.json');
const OWNER_PASSCODE = process.env.OWNER_PASSCODE || 'NAVEED2026';

function isValidOwner(req: Request): boolean {
  const headerCode = String(req.headers['x-owner-passcode'] || '');
  return headerCode.length > 0 && headerCode === OWNER_PASSCODE;
}

// Permanently registered SEO Prompt (active until founder Naveed requests changes)
export const REGISTERED_SEO_PROMPT = `Act as a professional journalist, SEO expert, and content strategist for "Naveed's Table" (founded by Naveed · Based in France), an AdSense-ready culinary journalism and global heritage recipe publication with 6 core SEO categories.
Write a detailed, engaging, fact-based article of at least 2000 words across sections with a featured image and 4 in-content image sections (all with descriptive SEO ALT text and placement notes), strictly covering:
- CTR-focused emotional & SEO-optimized headline + Meta Title (50-60 chars) + Meta Description (150-160 chars)
- Primary keyword + 3-6 related secondary keywords
- Engaging introduction + clear background/context for beginners
- Well-structured H2 and H3 headings using bullet points and short paragraphs for readability covering: latest developments, key facts/data/statistics, expert opinions, real-world impact on people/economy/culture
- Key Takeaways / Quick Summary list
- 2-5 Internal Linking suggestions to Naveed's Table recipes (/recipes/...) or pages (/map, /reviews)
- 1-3 External Authoritative Sources (FAO, UNESCO, ICCO, Culinary Institutes)
- Short FAQ section (2-4 questions) + Strong Conclusion & Future Outlook + Call-To-Action (CTA)`;

// Pool of realistic site culinary photographs (strictly excluding Naveed's personal photos)
const CULINARY_PHOTO_POOL: Array<{ url: string; captionHint: string }> = [
  { url: '/images/hero_christmas_feast_1794320880047.jpg', captionHint: 'Candlelit festive holiday dinner spread' },
  { url: '/images/poland_barszcz_featured_1794860787846.jpg', captionHint: 'Ruby fermented beetroot barszcz with mushroom uszka' },
  { url: '/images/sweden_lussekatter_featured_1794860790080.jpg', captionHint: 'Golden Swedish saffron Lussekatter buns' },
  { url: '/images/philippines_bibingka_featured_1794860790274.jpg', captionHint: 'Smoky banana-leaf Philippine Bibingka rice cake' },
  { url: '/images/ethiopia_dorowat_featured_1794860791298.jpg', captionHint: 'Ethiopian Genna Doro Wat crimson spiced stew over injera' },
  { url: '/images/peru_pavo_featured_1794860792713.jpg', captionHint: 'Peruvian ají panca glazed Nochebuena roast turkey' },
  { url: '/images/uk_pudding_featured_1794860793634.jpg', captionHint: 'Steamed British flaming Christmas pudding with holly' },
  { url: '/images/austria_kipferl_featured_1794860795105.jpg', captionHint: 'Viennese vanilla crescent Vanillekipferl cookies' },
  { url: '/images/japan_cake_featured_1794860795845.jpg', captionHint: 'Japanese Christmas whipped strawberry shortcake' },
  { url: '/images/nz_ham_featured_1794860796893.jpg', captionHint: 'New Zealand Manuka honey-glazed Christmas ham' },
  { url: '/images/lebanon_hashweh_featured_1794860798279.jpg', captionHint: 'Lebanese spiced Hashweh rice with toasted pine nuts' },
  { url: '/images/blog_christmas_boeuf_1794690224587.jpg', captionHint: 'Herb-crusted French Boeuf Wellington roast' },
  { url: '/images/blog_christmas_chicken_1794690225149.jpg', captionHint: 'Cast-iron French roast chicken with chestnuts and herbs' },
  { url: '/images/blog_christmas_fish_veg_1794690225620.jpg', captionHint: 'Herb-crusted Christmas salmon and chestnut mushroom crown' },
  { url: '/images/portugal_consoada_hero_1795271113103.jpg', captionHint: 'Portuguese Consoada poached bacalhau with potatoes and greens' },
  { url: '/images/greece_melomakarona_hero_1795271112622.jpg', captionHint: 'Greek thyme-honey Melomakarona cookies with crushed walnuts' },
  { url: '/images/norway_ribbe_hero_1795271179855.jpg', captionHint: 'Norwegian Juleribbe crisp diamond-scored pork belly and surkal' },
  { url: '/images/spain_turron_hero_1795271177958.jpg', captionHint: 'Artisanal Spanish Marcona almond and honey Turron de Jijona' },
  { url: '/images/brazil_ceia_hero_1795271177873.jpg', captionHint: 'Brazilian Ceia de Natal citrus roast with Brazil nut cassava farofa' },
  { url: '/images/puertorico_pernil_hero_1795271113351.jpg', captionHint: 'Puerto Rican crisp Pernil pork roast and Arroz con Gandules' },
  { url: '/images/india_cafreal_hero_1795271113155.jpg', captionHint: 'Goan Christmas emerald Chicken Cafreal and semolina Baath cake' },
  { url: '/images/nigeria_jollof_hero_1795271177401.jpg', captionHint: 'Smoky Nigerian Party Jollof rice with fried Dodo and peppered chicken' },
  { url: '/images/korea_galbijjim_hero_1795271112603.jpg', captionHint: 'Korean pear-glazed braised Galbijjim short ribs and chestnuts' },
  { url: '/images/czech_carp_hero_1795271113139.jpg', captionHint: 'Czech Republic golden breaded Christmas fish and Bramborovy Salat' },
  { url: '/images/ireland_spicedbeef_hero_1795371579816.jpg', captionHint: 'Cork Irish 7-day juniper spiced beef with dark treacle soda bread' },
  { url: '/images/denmark_flaeskesteg_hero_1795371577969.jpg', captionHint: 'Danish Juleaften Flaeskesteg crackling pork and Risalamande pudding' },
  { url: '/images/hungary_beigli_hero_1795371579361.jpg', captionHint: 'Hungarian marble-glazed Walnut & Poppy Seed Bejgli holiday loaves' },
  { url: '/images/finland_joulukinkku_hero_1795371578017.jpg', captionHint: 'Finnish mustard-crusted Joulukinkku ham and Porkkanalaatikko' },
  { url: '/images/ukraine_kutia_hero_1795371577877.jpg', captionHint: 'Ukrainian Sviata Vecheria wheat berry Kutia and porcini Varenyky' },
  { url: '/images/jamaica_sorrelcake_hero_1795371671488.jpg', captionHint: 'Jamaican rum-soaked Black Cake beside chilled ginger Hibiscus Sorrel' },
  { url: '/images/ghana_waakye_hero_1795371673523.jpg', captionHint: 'Ghanaian crimson sorghum Waakye with fried Kelewele and shito tilapia' },
  { url: '/images/vietnam_duck_hero_1795371672149.jpg', captionHint: 'Vietnamese five-spice roast duck with crispy rice-paper Cha Gio' },
  { url: '/images/georgia_satsivi_hero_1795371673498.jpg', captionHint: 'Georgian walnut-saffron Satsivi with pomegranate and honey Gozinaki' },
  { url: '/images/chile_panpascua_hero_1795371672791.jpg', captionHint: 'Chilean spiced Pan de Pascua cake and frosty clove-coffee Cola de Mono' },
  { url: '/images/morocco_tagine_hero_1795461404024.jpg', captionHint: 'Moroccan Saffron-Prune Lamb Tagine with quince and toasted almonds (Gluten-Free)' },
  { url: '/images/thailand_curryduck_hero_1795461404410.jpg', captionHint: 'Thai Royal Roast Duck in Pineapple-Lychee Coconut Red Curry with jasmine rice (Gluten-Free)' },
  { url: '/images/switzerland_rosti_hero_1795461406412.jpg', captionHint: 'Swiss Alpine potato-starch Fondue Moitie-Moitie beside crispy golden Rosti (Gluten-Free)' },
  { url: '/images/egypt_fatta_hero_1795461409422.jpg', captionHint: 'Egyptian Coptic Feast Fatta built on crisp pure corn flatbread and garlic lamb (Gluten-Free)' },
  { url: '/images/cuba_lechon_hero_1795461408887.jpg', captionHint: 'Cuban Nochebuena Sour-Orange Mojo Lechon Asado with yuca and black-bean Congri (Gluten-Free)' },
  { url: '/images/indonesia_rendang_hero_1795461448615.jpg', captionHint: 'Indonesian West Sumatra caramelized Beef Rendang with golden turmeric Nasi Kuning (Gluten-Free)' },
  { url: '/images/scotland_venison_hero_1795461450304.jpg', captionHint: 'Scottish Highland venison loin with neeps and certified-GF pinhead oat Cranachan (Gluten-Free)' },
  { url: '/images/southafrica_bobotie_hero_1795461451584.jpg', captionHint: 'South African almond-flour bound Cape Malay Bobotie with saffron Geelrys yellow rice (Gluten-Free)' },
  { url: '/images/elsalvador_tamales_hero_1795461517532.jpg', captionHint: 'Salvadoran banana-leaf 100% corn masa chicken tamales with pickled cabbage Curtido (Gluten-Free)' },
  { url: '/images/armenia_ghapama_hero_1795461517001.jpg', captionHint: 'Armenian festive whole honeyed pumpkin Ghapama stuffed with spiced fruit rice (Gluten-Free)' },
  { url: '/images/blog45_panettone_crumb_hero_1795633400550.jpg', captionHint: 'Feathery honeycombed Italian Panettone beside powdered Dresden Stollen slices' },
  { url: '/images/blog45_sourdough_dough_prep_1795633401896.jpg', captionHint: 'Artisanal sourdough lievito madre Panettone dough windowpane test' },
  { url: '/images/blog46_gf_feast_hero_1795633402720.jpg', captionHint: 'Inclusive 100% gluten-free international banquet spread with Pavlova, Tagine, Rosti, and Ghapama' },
];

// Helper to get or save posts (merges & syncs INITIAL_POSTS while keeping AI-generated articles)
function getStoredPosts(): BlogPost[] {
  try {
    if (fs.existsSync(POSTS_FILE)) {
      const data = fs.readFileSync(POSTS_FILE, 'utf-8');
      const stored = JSON.parse(data);
      if (Array.isArray(stored) && stored.length > 0) {
        const storedById = new Map<string, BlogPost>(stored.map((p: BlogPost) => [p.id, p]));
        const missingInitial = INITIAL_POSTS.filter((p) => !storedById.has(p.id));
        const syncedExisting = stored.map((p: BlogPost) => {
          const initialMatch = INITIAL_POSTS.find((ip) => ip.id === p.id);
          if (!initialMatch || p.isAiGenerated) return p;
          return initialMatch;
        });
        if (missingInitial.length > 0) {
          const merged = [...syncedExisting, ...missingInitial];
          savePosts(merged);
          return merged;
        }
        return syncedExisting;
      }
    }
  } catch (err) {
    console.warn('Error reading posts file, using defaults', err);
  }
  return INITIAL_POSTS;
}

function savePosts(posts: BlogPost[]) {
  try {
    fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving posts to file', err);
  }
}

// Ensure initial file exists
if (!fs.existsSync(POSTS_FILE)) {
  savePosts(INITIAL_POSTS);
}

interface StoredReviewComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

interface StoredReviewItem {
  id: string;
  author: string;
  location?: string;
  topic: string;
  category: string;
  rating: number;
  comment: string;
  createdAt: string;
  comments: StoredReviewComment[];
}

const DEFAULT_REVIEWS: StoredReviewItem[] = [
  {
    id: 'rev-1',
    author: 'Camille Laurent',
    location: 'Lyon, France',
    topic: 'French Christmas Boeuf Wellington & Red Wine Jus',
    category: 'Beef / Boeuf',
    rating: 5,
    comment:
      'Followed the 52°C pull temperature and let the mushroom duxelles cook completely dry. The pastry stayed crisp all the way around and the Burgundy red wine jus was sensational on Christmas Eve.',
    createdAt: '2026-11-14T11:20:00Z',
    comments: [
      {
        id: 'c-101',
        author: 'Naveed (Founder · France)',
        text: 'Merci Camille! Resting 15 minutes on the wooden board before slicing makes all the difference for that rosy medium-rare finish.',
        createdAt: '2026-11-14T12:05:00Z',
      },
    ],
  },
  {
    id: 'rev-2',
    author: 'Min-ji Park (박민지)',
    location: 'Seoul, South Korea',
    topic: 'French Christmas Roast Chicken with Chestnuts, Lemon & Tarragon',
    category: 'Chicken',
    rating: 5,
    comment:
      'Reading the full Korean translation automatically made following every step effortless! Roasting the chestnuts directly inside the Dutch oven with garlic and tarragon filled our entire apartment with warmth.',
    createdAt: '2026-11-13T18:40:00Z',
    comments: [],
  },
  {
    id: 'rev-3',
    author: 'Omar Al-Mansoor (عمر المنصور)',
    location: 'Dubai, UAE',
    topic: 'Nordic-French Herb-Crusted Christmas Salmon with Dill & Pomegranate',
    category: 'Fish & Vegetarian',
    rating: 5,
    comment:
      'Gentle 165°C oven temperature kept the salmon silky without drying out, and the ruby pomegranate seeds over green dill looked festive on our family table.',
    createdAt: '2026-11-12T15:10:00Z',
    comments: [],
  },
  {
    id: 'rev-4',
    author: 'Sophie Tremblay',
    location: 'Montreal, Canada',
    topic: 'Tourtière Québécoise du Réveillon',
    category: 'Desserts & Heritage',
    rating: 5,
    comment:
      'Authentic clove and cinnamon ratio just like my grandmother’s Réveillon pie. The serving scaler helped us adjust seamlessly for 14 guests.',
    createdAt: '2026-11-10T20:15:00Z',
    comments: [],
  },
];

function getStoredReviews(): StoredReviewItem[] {
  try {
    if (fs.existsSync(REVIEWS_FILE)) {
      const data = fs.readFileSync(REVIEWS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Error reading reviews file, using defaults', err);
  }
  return DEFAULT_REVIEWS;
}

function saveReviews(reviews: StoredReviewItem[]) {
  try {
    fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving reviews to file', err);
  }
}

if (!fs.existsSync(REVIEWS_FILE)) {
  saveReviews(DEFAULT_REVIEWS);
}

// Schedule state tracker
let lastPublishedTimestamp = Date.now() - 4 * 3600 * 1000; // 4 hours ago
const GAP_HOURS = 12;

// API Routes
app.get('/api/posts', (_req: Request, res: Response) => {
  const posts = getStoredPosts();
  res.json({
    posts,
    total: posts.length,
    categories: [
      'Global Christmas Feasts & Heritage Recipes',
      'Holiday Food News & Global Trends',
      'Culinary Traditions & Festive Culture Around the World',
      'Seasonal Entertaining & Hosting Guides',
      'Sustainable & Plant-Based Festive Cooking',
      'Christmas Markets, Travel & Culinary Tourism',
    ],
  });
});

app.get('/api/posts/:slug', (req: Request, res: Response) => {
  const posts = getStoredPosts();
  const post = posts.find((p) => p.slug === req.params.slug || p.id === req.params.slug);
  if (!post) {
    res.status(404).json({ error: 'Post not found' });
    return;
  }
  res.json({ post });
});

// Translation cache store
const translationCache: Record<string, Partial<BlogPost>> = {};

// Translate a blog post dynamically into any language (Korean, Arabic, Spanish, French, German, Japanese, etc.)
app.post('/api/translate-post', async (req: Request, res: Response) => {
  try {
    const { postId, targetLang, targetLangName } = req.body;
    if (!postId || !targetLang) {
      res.status(400).json({ error: 'postId and targetLang are required' });
      return;
    }

    const posts = getStoredPosts();
    const original = posts.find((p) => p.id === postId || p.slug === postId);
    if (!original) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    if (targetLang === 'en') {
      res.json({ translatedPost: original });
      return;
    }

    const cacheKey = `${original.id}_${targetLang}`;
    if (translationCache[cacheKey]) {
      res.json({ translatedPost: translationCache[cacheKey], fromCache: true });
      return;
    }

    if (!ai) {
      res.json({ translatedPost: original, fallback: true });
      return;
    }

    const prompt = `
You are an expert literary culinary and food culture journalist.
Translate this Christmas gastronomy and culinary news article accurately into ${targetLangName || targetLang} (language code: ${targetLang}).
Ensure the tone is warm, journalistic, natural, and culturally adapted.

Title: ${original.title}
Meta Title: ${original.metaTitle}
Meta Description: ${original.metaDescription}
Category: ${original.category}
Introduction: ${original.introduction}
Background: ${original.backgroundContext}
Sections: ${JSON.stringify(original.sections)}
Key Takeaways: ${JSON.stringify(original.keyTakeaways)}
FAQ: ${JSON.stringify(original.faq)}
Conclusion: ${original.conclusion}
Call to Action: ${original.callToAction}

Return STRICT JSON matching this format:
{
  "title": string,
  "metaTitle": string,
  "metaDescription": string,
  "category": string,
  "introduction": string,
  "backgroundContext": string,
  "sections": [
    {
      "heading": string,
      "content": string,
      "subsections": [
        { "subheading": string, "content": string }
      ],
      "bulletPoints": string[],
      "imageCaption": string,
      "imageAlt": string
    }
  ],
  "keyTakeaways": string[],
  "faq": [
    { "question": string, "answer": string }
  ],
  "conclusion": string,
  "callToAction": string
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const translatedPost: BlogPost = {
      ...original,
      title: parsed.title || original.title,
      metaTitle: parsed.metaTitle || original.metaTitle,
      metaDescription: parsed.metaDescription || original.metaDescription,
      category: parsed.category || original.category,
      introduction: parsed.introduction || original.introduction,
      backgroundContext: parsed.backgroundContext || original.backgroundContext,
      sections: (original.sections || []).map((sec, idx) => ({
        ...sec,
        heading: parsed.sections?.[idx]?.heading || sec.heading,
        content: parsed.sections?.[idx]?.content || sec.content,
        bulletPoints: parsed.sections?.[idx]?.bulletPoints || sec.bulletPoints,
        subsections: (sec.subsections || []).map((sub, sIdx) => ({
          ...sub,
          subheading: parsed.sections?.[idx]?.subsections?.[sIdx]?.subheading || sub.subheading,
          content: parsed.sections?.[idx]?.subsections?.[sIdx]?.content || sub.content,
        })),
        image: sec.image
          ? {
              ...sec.image,
              alt: parsed.sections?.[idx]?.imageAlt || sec.image.alt,
              caption: parsed.sections?.[idx]?.imageCaption || sec.image.caption,
            }
          : undefined,
      })),
      keyTakeaways: parsed.keyTakeaways || original.keyTakeaways,
      faq: parsed.faq || original.faq,
      conclusion: parsed.conclusion || original.conclusion,
      callToAction: parsed.callToAction || original.callToAction,
    };

    translationCache[cacheKey] = translatedPost;
    res.json({ translatedPost });
  } catch (err: any) {
    console.error('Translation error:', err);
    res.status(500).json({ error: err.message || 'Translation error' });
  }
});

app.get('/api/schedule-status', (_req: Request, res: Response) => {
  const nextScheduledTime = lastPublishedTimestamp + GAP_HOURS * 3600 * 1000;
  const msUntilNext = Math.max(0, nextScheduledTime - Date.now());
  const hoursRemaining = (msUntilNext / (1000 * 60 * 60)).toFixed(1);

  res.json({
    cadence: '2 articles per 24 hours (12 hours gap)',
    lastPublishedAt: new Date(lastPublishedTimestamp).toISOString(),
    nextScheduledAt: new Date(nextScheduledTime).toISOString(),
    hoursRemaining: Number(hoursRemaining),
    isAutomatedActive: true,
  });
});

// Owner Verification Endpoint
app.post('/api/verify-owner', (req: Request, res: Response) => {
  const { passcode } = req.body || {};
  if (typeof passcode === 'string' && passcode === OWNER_PASSCODE) {
    res.json({ authorized: true });
    return;
  }
  res.status(403).json({ authorized: false, error: 'Unauthorized owner passcode.' });
});

// Community Reviews & Comments Endpoints
app.get('/api/reviews', (_req: Request, res: Response) => {
  res.json({ reviews: getStoredReviews() });
});

app.post('/api/reviews', (req: Request, res: Response) => {
  const { author, location, topic, category, rating, comment } = req.body || {};
  if (!author || !comment || typeof author !== 'string' || typeof comment !== 'string') {
    res.status(400).json({ error: 'Author and comment are required.' });
    return;
  }

  const sanitizedRating = Math.min(5, Math.max(1, Number(rating) || 5));
  const newReview: StoredReviewItem = {
    id: `rev-${Date.now()}`,
    author: author.trim().slice(0, 80),
    location: typeof location === 'string' && location.trim() ? location.trim().slice(0, 80) : undefined,
    topic: typeof topic === 'string' ? topic.trim().slice(0, 140) : "Naveed's Table Experience",
    category: typeof category === 'string' ? category.trim().slice(0, 60) : 'Site Experience',
    rating: sanitizedRating,
    comment: comment.trim().slice(0, 1500),
    createdAt: new Date().toISOString(),
    comments: [],
  };

  const current = getStoredReviews();
  current.unshift(newReview);
  saveReviews(current);
  res.status(201).json({ review: newReview });
});

app.post('/api/reviews/:id/comments', (req: Request, res: Response) => {
  const { id } = req.params;
  const { author, text } = req.body || {};
  if (!author || !text || typeof author !== 'string' || typeof text !== 'string') {
    res.status(400).json({ error: 'Author and comment text are required.' });
    return;
  }

  const current = getStoredReviews();
  const idx = current.findIndex((r) => r.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Review not found.' });
    return;
  }

  const newComment: StoredReviewComment = {
    id: `cmt-${Date.now()}`,
    author: author.trim().slice(0, 80),
    text: text.trim().slice(0, 1000),
    createdAt: new Date().toISOString(),
  };

  current[idx] = {
    ...current[idx],
    comments: [...(current[idx].comments || []), newComment],
  };
  saveReviews(current);
  res.status(201).json({ review: current[idx] });
});

app.delete('/api/reviews/:id', (req: Request, res: Response) => {
  if (!isValidOwner(req)) {
    res.status(403).json({ error: 'Owner permission required to remove reviews.' });
    return;
  }
  const current = getStoredReviews();
  const filtered = current.filter((r) => r.id !== req.params.id);
  saveReviews(filtered);
  res.json({ success: true });
});

// Owner-Protected Registered SEO Prompt Inspector
app.get('/api/registered-prompt', (req: Request, res: Response) => {
  if (!isValidOwner(req)) {
    res.status(403).json({ error: 'Owner permission required.' });
    return;
  }
  res.json({
    siteBrand: "Naveed's Table",
    status: 'REGISTERED_ACTIVE',
    triggerPhrase: "Write today's best and trending topic",
    prompt: REGISTERED_SEO_PROMPT,
  });
});

// Automated/On-Demand Blog Generator Endpoint using Gemini AI (Owner-Restricted, uses permanently registered SEO prompt)
app.post('/api/generate-blog', async (req: Request, res: Response) => {
  try {
    if (!isValidOwner(req)) {
      res.status(403).json({
        error: 'Owner permission required. Please unlock the Owner Desk with Naveed’s passcode.',
      });
      return;
    }

    if (!ai) {
      res.status(503).json({
        error: 'Gemini API key is not configured. Please add GEMINI_API_KEY in the Settings > Secrets panel.',
      });
      return;
    }

    const rawTopic = typeof req.body.topic === 'string' ? req.body.topic.trim() : '';
    const requestedCategory = req.body.category || 'Holiday Food News & Global Trends';

    const trendingIdeas = [
      'The 2026 European Christmas Market Price Index & Artisanal Mulled Wine Trends in Nuremberg and Strasbourg',
      'The Rising Cost of Madagascar Vanilla & Ceylon Cinnamon: How Pastry Chefs Are Sourcing Holiday Spices',
      'Plant-Based Holiday Feast Revolution: Fermented Cashew Brie & Vegetable Showstoppers Across Europe',
      'Single-Origin Andean Cacao & Coffee: How Smallholder Farms Are Reshaping Festive Patisserie in 2026',
      'Winter Fermentation Revival: How Ancient Probiotic Beetroot & Pickling Traditions Reclaimed Festive Dining',
      'Coastal Seafood vs. Classic Roasts: Why Multi-Generational Households Are Blending Global Christmas Menus',
    ];

    const isAutoDailyTrigger =
      !rawTopic || /write today'?s best and trending topic/i.test(rawTopic);

    const chosenTopic = isAutoDailyTrigger
      ? trendingIdeas[Math.floor(Math.random() * trendingIdeas.length)]
      : rawTopic;

    const prompt = `
${REGISTERED_SEO_PROMPT}

ARTICLE BRIEF:
- Publication: "Naveed's Table" (Founded by Naveed · Based in France)
- Primary Research Topic: "${chosenTopic}"
- Target SEO Category (1 of 6 niches): ${requestedCategory}

STRICT QUALITY & DEPTH MANDATES:
- Target 2,000+ words of rich, fact-based journalistic depth across introduction, backgroundContext, 4 comprehensive H2 sections (each with H3 subsections and bulletPoints), Key Takeaways, FAQs, and Conclusion.
- Create 4 detailed in-content sections ("sections" array length = 4), EACH including an "image" suggestion with descriptive SEO ALT text, caption, and explicit placement note (e.g., "After Introduction", "Between Section 1 & 2", etc.).
- Create a clickable, emotional CTR-focused "title", SEO "metaTitle" (50-60 chars), "metaDescription" (150-160 chars), 1 "primaryKeyword", and 4-6 "secondaryKeywords".
- Include 2-5 internal linking suggestions to Naveed's Table recipes (/recipes/panettone-milanese, /recipes/boeuf-wellington-noel, /recipes/wigilia-barszcz-uszka, /recipes/gravlax-lussekatter, /recipes/doro-wat-injera, /recipes/bibingka-galapong, /recipes/pavo-relleno-peru, /recipes/uk-christmas-pudding, /recipes/vienna-vanillekipferl, /recipes/japan-christmas-strawberry-shortcake, /recipes/manuka-honey-ham, /recipes/lebanon-hashweh-meghli, /map, /reviews).
- Include 1-3 external authoritative sources (e.g. UNESCO Intangible Cultural Heritage, FAO, ICCO, Culinary Heritage Institutes).
- Include 3-4 engaging FAQ items and a clear Call-To-Action (CTA).

Return STRICT JSON complying with this exact structure:
{
  "title": string,
  "metaTitle": string,
  "metaDescription": string,
  "primaryKeyword": string,
  "secondaryKeywords": string[],
  "category": string,
  "readTimeMinutes": number,
  "introduction": string,
  "backgroundContext": string,
  "sections": [
    {
      "heading": string,
      "content": string,
      "subsections": [
        { "subheading": string, "content": string }
      ],
      "bulletPoints": string[],
      "image": {
        "alt": string,
        "caption": string,
        "placement": string
      }
    }
  ],
  "keyTakeaways": string[],
  "internalLinks": [
    { "text": string, "url": string, "context": string }
  ],
  "externalSources": [
    { "name": string, "url": string }
  ],
  "faq": [
    { "question": string, "answer": string }
  ],
  "callToAction": string,
  "conclusion": string
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error('No content generated from Gemini model');
    }

    const parsedData = JSON.parse(textOutput);
    const slug = (parsedData.title || chosenTopic)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);

    // Assign realistic culinary food photos distinct from Naveed's personal portraits
    const featuredPhoto = CULINARY_PHOTO_POOL[Math.floor(Math.random() * CULINARY_PHOTO_POOL.length)];
    const remainingPhotos = CULINARY_PHOTO_POOL.filter((p) => p.url !== featuredPhoto.url);

    const enrichedSections = (parsedData.sections || []).map((sec: any, idx: number) => {
      const assignedPhoto = remainingPhotos[idx % remainingPhotos.length] || featuredPhoto;
      return {
        heading: sec.heading || `Section ${idx + 1}`,
        content: sec.content || '',
        subsections: Array.isArray(sec.subsections) ? sec.subsections : [],
        bulletPoints: Array.isArray(sec.bulletPoints) ? sec.bulletPoints : [],
        image: sec.image
          ? {
              url: assignedPhoto.url,
              alt: sec.image.alt || `${chosenTopic} culinary reference photo`,
              caption: sec.image.caption || assignedPhoto.captionHint,
              placement: sec.image.placement || `Inside Section ${idx + 1}`,
            }
          : {
              url: assignedPhoto.url,
              alt: `${chosenTopic} culinary detail`,
              caption: assignedPhoto.captionHint,
              placement: `Inside Section ${idx + 1}`,
            },
      };
    });

    const newPost: BlogPost = {
      id: `post-${Date.now()}`,
      slug,
      title: parsedData.title,
      metaTitle: parsedData.metaTitle || parsedData.title,
      metaDescription: parsedData.metaDescription || '',
      primaryKeyword: parsedData.primaryKeyword || chosenTopic,
      secondaryKeywords: parsedData.secondaryKeywords || ['Christmas food', 'holiday traditions'],
      category: parsedData.category || requestedCategory,
      publishedAt: new Date().toISOString(),
      author: {
        name: "Naveed's Table Editorial Desk",
        role: 'Global Food Trends & Culinary Culture Bureau · Based in France',
        avatar: '/images/hero_christmas_feast_1794320880047.jpg',
      },
      featuredImage: {
        url: featuredPhoto.url,
        alt: parsedData.sections?.[0]?.image?.alt || featuredPhoto.captionHint,
        caption: parsedData.sections?.[0]?.image?.caption || featuredPhoto.captionHint,
      },
      readTimeMinutes: parsedData.readTimeMinutes || 9,
      introduction: parsedData.introduction,
      backgroundContext: parsedData.backgroundContext,
      sections: enrichedSections,
      keyTakeaways: parsedData.keyTakeaways || [],
      internalLinks: parsedData.internalLinks || [],
      externalSources: parsedData.externalSources || [],
      faq: parsedData.faq || [],
      callToAction: parsedData.callToAction || 'Explore our tested recipes and share your kitchen notes in Reviews.',
      conclusion: parsedData.conclusion,
      isAiGenerated: true,
    };

    const currentPosts = getStoredPosts();
    currentPosts.unshift(newPost);
    savePosts(currentPosts);

    lastPublishedTimestamp = Date.now();

    res.json({
      success: true,
      message: 'Article successfully researched, written, and published according to the registered SEO prompt.',
      post: newPost,
    });
  } catch (error: any) {
    console.error('Error generating blog post:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate blog post',
    });
  }
});

// XML Sitemap for SEO & AdSense compliance
app.get('/sitemap.xml', (_req: Request, res: Response) => {
  const posts = getStoredPosts();
  const domain = process.env.APP_URL || 'https://naveeds-table.netlify.app';

  const recipeSlugs = [
    'panettone-milanese',
    'dresdner-stollen',
    'uk-christmas-pudding',
    'vienna-vanillekipferl',
    'gravlax-lussekatter',
    'wigilia-barszcz-uszka',
    'australian-pavlova',
    'tiger-prawns-finger-lime',
    'manuka-honey-ham',
    'pan-de-jamon',
    'bunuelos-natilla',
    'vitel-tone',
    'pavo-relleno-peru',
    'tourtiere-quebec',
    'tamales-navidenos',
    'cranberry-wild-rice-squash',
    'bibingka-galapong',
    'doro-wat-injera',
    'japan-christmas-strawberry-shortcake',
    'lebanon-hashweh-meghli',
    'boeuf-wellington-noel',
    'poulet-roti-noel-chestnuts',
    'christmas-herb-salmon',
    'vegetarian-chestnut-mushroom-crown',
    'portugal-bacalhau-da-consoada',
    'greece-melomakarona-honey-cookies',
    'norway-juleribbe-pork-belly',
    'spain-turron-jijona-almond',
    'brazil-ceia-natal-farofa',
    'puerto-rico-pernil-arroz-gandules',
    'india-goa-christmas-cafreal-cake',
    'nigeria-festive-jollof-chicken',
    'korea-festive-galbijjim-feast',
    'czech-crispy-fish-potato-salad',
    'ireland-spiced-beef-soda-bread',
    'denmark-flaeskesteg-risalamande',
    'hungary-beigli-halaszle',
    'finland-joulukinkku-porkkanalaatikko',
    'ukraine-kutia-varenyky',
    'jamaica-sorrel-black-cake',
    'ghana-waakye-kelewele',
    'vietnam-cha-gio-roast-duck',
    'georgia-satsivi-gozinaki',
    'chile-cola-de-mono-pan-pascua',
    'morocco-saffron-lamb-tagine',
    'thailand-roast-duck-pineapple-curry',
    'switzerland-fondue-crispy-rosti',
    'egypt-cornbread-lamb-fatta',
    'cuba-lechon-yuca-congris',
    'indonesia-beef-rendang-nasi-kuning',
    'scotland-venison-neeps-cranachan',
    'southafrica-cape-malay-bobotie',
    'elsalvador-banana-leaf-corn-tamales',
    'armenia-ghapama-stuffed-pumpkin',
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${domain}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${domain}/recipes</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${domain}/map</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${domain}/blog</loc>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${domain}/reviews</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${domain}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${domain}/privacy</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>`;

  for (const r of recipeSlugs) {
    xml += `
  <url>
    <loc>${domain}/recipes/${r}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  }

  for (const p of posts) {
    xml += `
  <url>
    <loc>${domain}/blog/${p.slug}</loc>
    <lastmod>${p.publishedAt.split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
  }

  xml += `\n</urlset>`;
  res.header('Content-Type', 'application/xml');
  res.send(xml);
});

// Robots.txt
app.get('/robots.txt', (_req: Request, res: Response) => {
  const domain = process.env.APP_URL || 'https://naveeds-table.netlify.app';
  res.type('text/plain');
  res.send(`User-agent: *\nAllow: /\nSitemap: ${domain}/sitemap.xml\n`);
});

// Setup Vite in Dev or Static files in Production
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

setupServer();
