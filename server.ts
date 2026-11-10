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


// Helper to get or save posts
function getStoredPosts(): BlogPost[] {
  try {
    if (fs.existsSync(POSTS_FILE)) {
      const data = fs.readFileSync(POSTS_FILE, 'utf-8');
      const posts = JSON.parse(data);
      if (Array.isArray(posts) && posts.length > 0) {
        return posts;
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
      ]
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
      model: 'gemini-3.8-flash',
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
        subsections: (sec.subsections || []).map((sub, sIdx) => ({
          ...sub,
          subheading: parsed.sections?.[idx]?.subsections?.[sIdx]?.subheading || sub.subheading,
          content: parsed.sections?.[idx]?.subsections?.[sIdx]?.content || sub.content,
        })),
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

// Automated/On-Demand Blog Generator Endpoint using Gemini AI
app.post('/api/generate-blog', async (req: Request, res: Response) => {
  try {
    if (!ai) {
      res.status(503).json({
        error: 'Gemini API key is not configured. Please add GEMINI_API_KEY in the Settings > Secrets panel.',
      });
      return;
    }

    const requestedTopic = req.body.topic;
    const requestedCategory = req.body.category || 'Holiday Food News & Global Trends';

    const trendingIdeas = [
      'The 2026 European Christmas Market Price Index & Artisanal Mulled Wine Trends in Nuremberg and Strasbourg',
      'The Rising Cost of Madagascar Vanilla & Ceylon Cinnamon: How Pastry Chefs Are Sourcing Holiday Spices',
      'Plant-Based Yuletide Revolution: Fermented Cashew Brie & Plant-Forward Julbord Across Scandinavia',
      'Pisco-Spiced Roasted Turkey: How Lima’s Gastronomic Explosion Is Modernizing Peruvian Christmas Feasts',
      'The Japanese Christmas Strawberry Shortcake & Fried Chicken Phenomenon: A 50-Year Cultural Retrospective',
      'Whiskey-Soaked Figgy Puddings & Historic British Mince Pies: Recreating 17th Century Yuletide Delicacies',
    ];

    const chosenTopic = requestedTopic || trendingIdeas[Math.floor(Math.random() * trendingIdeas.length)];

    const prompt = `
Act as a professional journalist, SEO expert, and content strategist for "Yuletide Table" (a premier global Christmas food, traditions, and culinary news publication).

Write a detailed, engaging, and fact-based blog post on the Christmas food, traditions, or holiday culinary news topic: "${chosenTopic}".

Target Category: ${requestedCategory}

FOLLOW THESE INSTRUCTIONS CAREFULLY:
CONTENT STRUCTURE:
- Create a highly clickable, emotional, and SEO-optimized headline (CTR-focused).
- Write an engaging introduction that hooks the reader and explains why this topic is important right now.
- Provide clear background/context so even beginners understand the topic.
- Break the article into 2 to 3 well-structured sections using clear headings (H2) and optional subsections (H3).
- Cover: Latest developments, Key facts/data/statistics, Expert opinions or insights, Real-world impact (on people, economy, traditions, or global trends).
- Maintain a neutral, professional, and journalistic tone.
- Add a "Key Takeaways" or "Quick Summary" list (3-4 points).
- Add a short FAQ section (2-3 questions with clear answers).
- Add internal linking suggestions to Yuletide Table recipes (/recipes/panettone-milanese, /recipes/australian-pavlova, /recipes/tourtiere-quebec, /recipes/pan-de-jamon, or /map).
- Suggest 1-2 external authoritative sources (e.g. UNESCO Intangible Cultural Heritage, International Food Guild, FAO).
- End with a strong conclusion and future outlook with a call-to-action.
- Suggest image ALT text and descriptions.

Return STRICT JSON complying with this exact structure:
{
  "title": string,
  "metaTitle": string (50-60 chars max),
  "metaDescription": string (150-160 chars max),
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
      model: 'gemini-3.8-flash',
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
        name: 'Yuletide Editorial Desk (AI Journal)',
        role: 'Global Food Trends & Culinary Culture Bureau',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      },
      featuredImage: {
        url: '/images/hero_christmas_feast_1794320880047.jpg',
        alt: parsedData.sections?.[0]?.image?.alt || 'Festive Christmas feast and holiday culinary traditions',
        caption: parsedData.sections?.[0]?.image?.caption || 'Festive gastronomy and cultural heritage around the globe.',
      },
      readTimeMinutes: parsedData.readTimeMinutes || 5,
      introduction: parsedData.introduction,
      backgroundContext: parsedData.backgroundContext,
      sections: parsedData.sections || [],
      keyTakeaways: parsedData.keyTakeaways || [],
      internalLinks: parsedData.internalLinks || [],
      externalSources: parsedData.externalSources || [],
      faq: parsedData.faq || [],
      callToAction: parsedData.callToAction || 'Share your holiday culinary traditions with us.',
      conclusion: parsedData.conclusion,
      isAiGenerated: true,
    };

    const currentPosts = getStoredPosts();
    currentPosts.unshift(newPost);
    savePosts(currentPosts);

    lastPublishedTimestamp = Date.now();

    res.json({
      success: true,
      message: 'Article successfully researched, written, and published according to SEO specifications.',
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
  const domain = process.env.APP_URL || 'https://yuletide-table.applet';

  const recipeSlugs = [
    'panettone-milanese',
    'dresdner-stollen',
    'buche-de-noel',
    'roast-goose-victorian',
    'gravlax-lussekatter',
    'uszka-red-borscht',
    'australian-pavlova',
    'tiger-prawns-finger-lime',
    'manuka-honey-ham',
    'pan-de-jamon',
    'bunuelos-natilla',
    'vitel-tone',
    'pavo-relleno-peru',
    'tourtiere-quebec',
    'tamales-navidenos',
    'bourbon-glazed-ham',
    'cranberry-wild-rice-squash',
    'bibingka-galapong',
    'doro-wat-injera',
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
  const domain = process.env.APP_URL || 'https://yuletide-table.applet';
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
