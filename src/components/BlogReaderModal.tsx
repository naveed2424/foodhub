import React, { useState, useEffect } from 'react';
import { BlogPost } from '../data/posts';
import { SUPPORTED_LANGUAGES, TRANSLATIONS } from '../data/translations';
import {
  X,
  Calendar,
  Clock,
  Share2,
  HelpCircle,
  CheckCircle,
  FileText,
  Search,
  Code,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Printer,
  Globe,
  Loader2,
} from 'lucide-react';

interface BlogReaderModalProps {
  post: BlogPost | null;
  onClose: () => void;
  onNavigateRecipe?: (recipeSlug: string) => void;
  currentLang: string;
  onLanguageChange: (langCode: string) => void;
}

export const BlogReaderModal: React.FC<BlogReaderModalProps> = ({
  post: initialPost,
  onClose,
  onNavigateRecipe,
  currentLang,
  onLanguageChange,
}) => {
  if (!initialPost) return null;

  const [activeTab, setActiveTab] = useState<'article' | 'seo-inspector'>('article');
  const [displayedPost, setDisplayedPost] = useState<BlogPost>(initialPost);
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [openFaqIndices, setOpenFaqIndices] = useState<number[]>([0]);

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];
  const activeLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];
  const isRtl = activeLangObj.dir === 'rtl';

  // Automatically fetch translation when language is not English
  useEffect(() => {
    if (currentLang === 'en') {
      setDisplayedPost(initialPost);
      return;
    }

    let isCancelled = false;
    setIsTranslating(true);

    fetch('/api/translate-post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId: initialPost.id,
        targetLang: currentLang,
        targetLangName: activeLangObj.name,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled && data.translatedPost) {
          setDisplayedPost(data.translatedPost);
        }
      })
      .catch((err) => {
        console.warn('Translation failed, keeping original:', err);
      })
      .finally(() => {
        if (!isCancelled) {
          setIsTranslating(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [currentLang, initialPost.id]);

  const toggleFaq = (idx: number) => {
    setOpenFaqIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.origin + `/blog/${displayedPost.slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Schema.org BlogPosting & FAQPage JSON-LD
  const blogSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: displayedPost.title,
    alternativeHeadline: displayedPost.metaTitle,
    image: [displayedPost.featuredImage.url],
    description: displayedPost.metaDescription,
    keywords: [displayedPost.primaryKeyword, ...displayedPost.secondaryKeywords].join(', '),
    articleSection: displayedPost.category,
    inLanguage: currentLang,
    datePublished: displayedPost.publishedAt,
    dateModified: displayedPost.publishedAt,
    author: {
      '@type': 'Person',
      name: displayedPost.author.name,
      jobTitle: displayedPost.author.role,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Yuletide Table Global Journal',
      logo: {
        '@type': 'ImageObject',
        url: window.location.origin + '/images/hero_christmas_feast_1794320880047.jpg',
      },
    },
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      {/* Schema.org Injections */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />

      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#E8DEC8] my-8 max-h-[94vh] flex flex-col"
      >
        {/* Top bar with View Switcher & Language Dropdown */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 border-b border-[#F0EAE1] bg-[#FAF7F2] shrink-0">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 bg-[#EFE8DD] rounded-lg">
            <button
              onClick={() => setActiveTab('article')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'article'
                  ? 'bg-white text-[#9B2C2C] shadow-xs font-semibold'
                  : 'text-[#665A4F] hover:text-[#241D17]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Article View</span>
            </button>
            <button
              onClick={() => setActiveTab('seo-inspector')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'seo-inspector'
                  ? 'bg-white text-[#9B2C2C] shadow-xs font-semibold'
                  : 'text-[#665A4F] hover:text-[#241D17]'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>SEO Inspector</span>
            </button>
          </div>

          {/* Language Selector inside Reader */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#EFE8DD] px-2.5 py-1 rounded-lg text-xs border border-[#DDD2C0]">
              <Globe className="w-3.5 h-3.5 text-[#9B2C2C]" />
              <select
                value={currentLang}
                onChange={(e) => onLanguageChange(e.target.value)}
                className="bg-transparent text-[#241D17] font-medium text-xs focus:outline-none cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.nativeName}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleShare}
              className="p-2 text-[#7A6C5F] hover:text-[#241D17] hover:bg-[#F0EAE1] rounded-lg transition-colors text-xs flex items-center gap-1.5"
              title="Share Article Link"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="p-2 text-[#7A6C5F] hover:text-[#241D17] hover:bg-[#F0EAE1] rounded-lg transition-colors text-xs flex items-center gap-1.5"
              title="Print Article"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-[#7A6C5F] hover:text-[#9B2C2C] hover:bg-[#FCE8E8] rounded-lg transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Translation Banner if active or translating */}
        {isTranslating ? (
          <div className="bg-[#FAF2EB] border-b border-[#EED4C4] px-6 py-2.5 flex items-center gap-2 text-xs text-[#9B2C2C] shrink-0">
            <Loader2 className="w-4 h-4 animate-spin text-[#9B2C2C]" />
            <span>{t.translatingNotice} ({activeLangObj.nativeName})</span>
          </div>
        ) : currentLang !== 'en' ? (
          <div className="bg-[#F4F9F4] border-b border-[#CDE5CD] px-6 py-2 flex items-center justify-between text-xs text-[#2E7D32] shrink-0">
            <div className="flex items-center gap-1.5">
              <span>{activeLangObj.flag}</span>
              <span>
                {t.translatedInto} <strong>{activeLangObj.nativeName}</strong>
              </span>
            </div>
            <button
              onClick={() => onLanguageChange('en')}
              className="text-xs text-[#665A4F] hover:underline"
            >
              View in English
            </button>
          </div>
        ) : null}

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 md:p-10 space-y-8">
          {activeTab === 'article' ? (
            <article className="max-w-3xl mx-auto space-y-8">
              {/* Category & Meta Header */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#82532B]">
                  <span className="font-semibold uppercase tracking-wider">
                    {displayedPost.category}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {new Date(displayedPost.publishedAt).toLocaleDateString(currentLang, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {displayedPost.readTimeMinutes} {t.minRead}
                    </span>
                  </span>
                </div>

                <h1 className="text-3xl md:text-5xl font-serif font-bold text-[#241D17] leading-tight">
                  {displayedPost.title}
                </h1>

                {/* Author Strip */}
                <div className="flex items-center gap-3 pt-3 border-t border-[#F0EAE1]">
                  <img
                    src={displayedPost.author.avatar}
                    alt={displayedPost.author.name}
                    className="w-10 h-10 rounded-full object-cover border border-[#E8DEC8]"
                  />
                  <div>
                    <div className="text-sm font-semibold text-[#241D17]">
                      {displayedPost.author.name}
                    </div>
                    <div className="text-xs text-[#7A6C5F]">
                      {displayedPost.author.role}
                    </div>
                  </div>
                </div>
              </div>

              {/* Featured Image */}
              <figure className="space-y-2">
                <div className="rounded-xl overflow-hidden aspect-[16/9] shadow-md border border-[#E8DEC8]">
                  <img
                    src={displayedPost.featuredImage.url}
                    alt={displayedPost.featuredImage.alt}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        '/images/hero_christmas_feast_1794320880047.jpg';
                    }}
                  />
                </div>
                {displayedPost.featuredImage.caption && (
                  <figcaption className="text-xs text-[#7A6C5F] italic text-center">
                    {displayedPost.featuredImage.caption}
                  </figcaption>
                )}
              </figure>

              {/* AdSense Compliant Banner Slot */}
              <div className="p-3 bg-[#FAF8F5] border border-dashed border-[#DDD2C0] rounded-lg text-center my-6">
                <span className="text-[10px] uppercase tracking-wider text-[#9C8F80] block font-medium">
                  Advertisement · Google AdSense Verified Placement
                </span>
                <div className="h-12 flex items-center justify-center text-xs text-[#8C7D6D]">
                  Seasonal Food & Kitchenware Partners
                </div>
              </div>

              {/* Introduction */}
              <div
                className={`text-lg text-[#3D332A] leading-relaxed font-serif italic ${
                  isRtl ? 'border-r-2 pr-4 border-[#9B2C2C]' : 'border-l-2 pl-4 border-[#9B2C2C]'
                }`}
              >
                {displayedPost.introduction}
              </div>

              {/* Background / Context */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-[#82532B] uppercase tracking-wider">
                  {currentLang === 'ko'
                    ? '배경 및 맥락'
                    : currentLang === 'ar'
                    ? 'السياق والخلفية التاريخية'
                    : 'Context & Background'}
                </h3>
                <p className="text-base text-[#473B30] leading-relaxed">
                  {displayedPost.backgroundContext}
                </p>
              </div>

              {/* Main Content Sections */}
              <div className="space-y-8 pt-4">
                {displayedPost.sections.map((section, idx) => (
                  <section key={idx} className="space-y-4">
                    <h2 className="text-2xl font-serif font-bold text-[#241D17]">
                      {section.heading}
                    </h2>
                    <p className="text-base text-[#473B30] leading-relaxed">
                      {section.content}
                    </p>

                    {/* Subsections */}
                    {section.subsections?.map((sub, sIdx) => (
                      <div
                        key={sIdx}
                        className={`${
                          isRtl ? 'pr-4 border-r border-[#EADCCB]' : 'pl-4 border-l border-[#EADCCB]'
                        } space-y-1.5 my-3`}
                      >
                        <h3 className="text-lg font-semibold text-[#241D17]">
                          {sub.subheading}
                        </h3>
                        <p className="text-sm text-[#574A3E] leading-relaxed">
                          {sub.content}
                        </p>
                      </div>
                    ))}
                  </section>
                ))}
              </div>

              {/* Key Takeaways Card */}
              <div className="p-6 bg-[#F8F4EC] border border-[#E4D7C3] rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#9B2C2C]">
                  <CheckCircle className="w-4 h-4 text-[#9B2C2C]" />
                  <span>{t.keyTakeaways}</span>
                </div>
                <ul className="space-y-2 text-sm text-[#473B30]">
                  {displayedPost.keyTakeaways.map((takeaway, tIdx) => (
                    <li key={tIdx} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#9B2C2C] mt-2 shrink-0" />
                      <span>{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* FAQ Section */}
              {displayedPost.faq.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-[#F0EAE1]">
                  <h3 className="text-xl font-serif font-bold text-[#241D17] flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-[#9B2C2C]" />
                    <span>{t.faq}</span>
                  </h3>
                  <div className="space-y-2">
                    {displayedPost.faq.map((f, fIdx) => {
                      const isOpen = openFaqIndices.includes(fIdx);
                      return (
                        <div
                          key={fIdx}
                          className="border border-[#E4D9C5] rounded-xl overflow-hidden bg-white"
                        >
                          <button
                            onClick={() => toggleFaq(fIdx)}
                            className="w-full px-4 py-3.5 flex items-center justify-between text-left text-sm font-semibold text-[#241D17] hover:bg-[#FAF7F2] transition-colors"
                          >
                            <span>{f.question}</span>
                            <ChevronDown
                              className={`w-4 h-4 text-[#7A6C5F] transition-transform ${
                                isOpen ? 'transform rotate-180 text-[#9B2C2C]' : ''
                              }`}
                            />
                          </button>
                          {isOpen && (
                            <div className="px-4 pb-4 pt-1 text-sm text-[#574A3E] leading-relaxed border-t border-[#F2ECE1] bg-[#FAF8F5]">
                              {f.answer}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Conclusion & Call to Action */}
              <div className="p-6 bg-[#241D17] text-white rounded-xl space-y-3">
                <h3 className="text-lg font-serif font-bold text-[#F3EFE9]">
                  {t.conclusion}
                </h3>
                <p className="text-sm text-white/80 leading-relaxed">
                  {displayedPost.conclusion}
                </p>
                <div className="pt-3 border-t border-white/15 text-xs text-[#EAB308] font-medium">
                  {displayedPost.callToAction}
                </div>
              </div>
            </article>
          ) : (
            /* SEO & Inspector Tab */
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="p-4 bg-[#F2F8F2] border border-[#CDE5CD] rounded-xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#2E7D32] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-[#1E4620]">
                    Multilingual SEO Verification
                  </h4>
                  <p className="text-xs text-[#355B37] mt-0.5">
                    This article is dynamically translated and cached with localized Schema.org metadata and language tags.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-white border border-[#E4D9C5] rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#82532B] uppercase tracking-wider">
                      Meta Title ({currentLang.toUpperCase()})
                    </span>
                    <span className="text-[#7A6C5F] font-mono tabular-nums">
                      {displayedPost.metaTitle.length} chars
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-[#241D17] bg-[#FAF7F2] p-2.5 rounded border border-[#EDE5D8]">
                    {displayedPost.metaTitle}
                  </div>
                </div>

                <div className="p-4 bg-white border border-[#E4D9C5] rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#82532B] uppercase tracking-wider">
                      Meta Description ({currentLang.toUpperCase()})
                    </span>
                    <span className="text-[#7A6C5F] font-mono tabular-nums">
                      {displayedPost.metaDescription.length} chars
                    </span>
                  </div>
                  <div className="text-xs text-[#332A22] bg-[#FAF7F2] p-2.5 rounded border border-[#EDE5D8] leading-relaxed">
                    {displayedPost.metaDescription}
                  </div>
                </div>

                <div className="p-4 bg-white border border-[#E4D9C5] rounded-xl space-y-2">
                  <span className="font-bold text-[#82532B] uppercase tracking-wider flex items-center gap-1.5 text-xs">
                    <Code className="w-4 h-4" />
                    <span>Schema.org JSON-LD Output ({currentLang})</span>
                  </span>
                  <pre className="p-3 bg-[#241D17] text-[#D8CAB8] rounded text-[11px] overflow-x-auto font-mono max-h-56">
                    {JSON.stringify(blogSchema, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#F0EAE1] bg-[#FAF7F2] flex items-center justify-between shrink-0">
          <div className="text-xs text-[#7A6C5F]">
            Yuletide Table · Multilingual Food Journal ({activeLangObj.nativeName})
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#9B2C2C] hover:bg-[#822424] rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
