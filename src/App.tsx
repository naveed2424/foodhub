/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { RECIPES_DATA, Recipe } from './data/recipes';
import { BlogPost, INITIAL_POSTS, CATEGORIES_LIST } from './data/posts';
import { SUPPORTED_LANGUAGES, TRANSLATIONS, Language } from './data/translations';
import { InteractiveMap } from './components/InteractiveMap';
import { RecipeModal } from './components/RecipeModal';
import { BlogReaderModal } from './components/BlogReaderModal';
import { AiBlogGeneratorModal } from './components/AiBlogGeneratorModal';
import { AboutPolicyModal } from './components/AboutPolicyModal';
import { AboutPage } from './components/AboutPage';
import { ReviewsPage } from './components/ReviewsPage';
import { LegalPages, LegalSection } from './components/LegalPages';
import {
  Compass,
  Utensils,
  Search,
  BookOpen,
  Clock,
  Globe,
  ChevronRight,
  ChevronDown,
  Flame,
  Filter,
  CheckCircle,
  Calendar,
  Share2,
  Bookmark,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  Lock,
  Mail,
  MessageSquare,
  KeyRound,
  X,
} from 'lucide-react';

const OWNER_PASSCODE_SHA256 =
  '73f623cb0538319622d679e79b63808fe5ccdb0e20edc009c3face01cb7ac9f6';

async function sha256Hex(value: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'reviews' | 'about' | 'legal'>('home');
  const [legalSection, setLegalSection] = useState<LegalSection>('privacy');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [selectedDietary, setSelectedDietary] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);
  const [activeBlogPost, setActiveBlogPost] = useState<BlogPost | null>(null);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState<boolean>(false);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
  const [aboutTab, setAboutTab] = useState<'about' | 'privacy' | 'editorial' | 'contact'>('about');
  const [posts, setPosts] = useState<BlogPost[]>(INITIAL_POSTS);
  const [categories, setCategories] = useState<string[]>(CATEGORIES_LIST);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [scheduleStatus, setScheduleStatus] = useState<any>(null);
  const [cookieConsentDismissed, setCookieConsentDismissed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return Boolean(localStorage.getItem('nt_cookie_consent'));
    }
    return false;
  });

  // Multi-Language System (supports Korean, Arabic RTL, English, Spanish, French, German, Italian, Japanese)
  const [currentLang, setCurrentLang] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('yt_lang');
      if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
        return saved;
      }
      const navLang = (navigator.language || '').toLowerCase();
      if (navLang.startsWith('ko')) return 'ko';
      if (navLang.startsWith('ar')) return 'ar';
      if (navLang.startsWith('es')) return 'es';
      if (navLang.startsWith('fr')) return 'fr';
      if (navLang.startsWith('de')) return 'de';
      if (navLang.startsWith('it')) return 'it';
      if (navLang.startsWith('ja')) return 'ja';
    }
    return 'en';
  });
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState<boolean>(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];
  const activeLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];
  const isRtl = activeLangObj.dir === 'rtl';

  const handleLanguageSelect = (code: string) => {
    setCurrentLang(code);
    localStorage.setItem('yt_lang', code);
    setIsLangDropdownOpen(false);
  };

  // Close language dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Verified Owner Authorization (strictly locked against unauthorized changes or downloads)
  const [isOwnerAuthorized, setIsOwnerAuthorized] = useState<boolean>(false);
  const [ownerPasscode, setOwnerPasscode] = useState<string>('');
  const [isOwnerLoginOpen, setIsOwnerLoginOpen] = useState<boolean>(false);
  const [passcodeInput, setPasscodeInput] = useState<string>('');
  const [passcodeError, setPasscodeError] = useState<string>('');
  const [isVerifyingOwner, setIsVerifyingOwner] = useState<boolean>(false);

  // Clear legacy unauthenticated editor flag if present
  useEffect(() => {
    try {
      localStorage.removeItem('yt_editor_mode');
    } catch (_) {}
  }, []);

  // Prevent right-click and image drag-download by public visitors across the site
  useEffect(() => {
    if (isOwnerAuthorized) return;

    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'IMG' || target.closest('.protected-media'))) {
        e.preventDefault();
      }
    };

    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'IMG' || target.closest('.protected-media'))) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('dragstart', handleDragStart);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, [isOwnerAuthorized]);

  // Keyboard shortcut Ctrl+Shift+E or Cmd+Shift+E opens Owner Verification modal (never bypasses passcode!)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'E' || e.key === 'e')) {
        e.preventDefault();
        if (isOwnerAuthorized) {
          setIsOwnerAuthorized(false);
          setOwnerPasscode('');
        } else {
          setPasscodeError('');
          setIsOwnerLoginOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOwnerAuthorized]);

  const handleVerifyOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    const candidate = passcodeInput.trim();
    if (!candidate) return;

    setIsVerifyingOwner(true);
    setPasscodeError('');

    try {
      const res = await fetch('/api/verify-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: candidate }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.authorized) {
          setIsOwnerAuthorized(true);
          setOwnerPasscode(candidate);
          setPasscodeInput('');
          setIsOwnerLoginOpen(false);
          return;
        }
      } else if (res.status === 403) {
        setPasscodeError('Access denied: Invalid owner passcode.');
        return;
      }
      throw new Error('Static fallback');
    } catch (_) {
      // Static Netlify deployment verification via SHA-256
      const digest = await sha256Hex(candidate);
      if (digest === OWNER_PASSCODE_SHA256) {
        setIsOwnerAuthorized(true);
        setOwnerPasscode(candidate);
        setPasscodeInput('');
        setIsOwnerLoginOpen(false);
      } else {
        setPasscodeError('Access denied: Invalid owner passcode.');
      }
    } finally {
      setIsVerifyingOwner(false);
    }
  };

  // Fetch initial posts and schedule with graceful fallback
  useEffect(() => {
    fetch('/api/posts')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.posts && Array.isArray(data.posts) && data.posts.length > 0) {
          setPosts(data.posts);
        }
        if (data.categories && Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
      })
      .catch((err) => console.warn('Using local posts fallback:', err));

    fetch('/api/schedule-status')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setScheduleStatus(data))
      .catch((err) => console.warn('Schedule status offline:', err));
  }, []);

  // Sync URL paths (/recipes/:slug, /blog/:slug, /privacy, /terms, /disclaimer, /editorial-policy, /contact, /about, /reviews)
  const syncPathToState = (pathname: string, availablePosts: BlogPost[]) => {
    const cleanPath = pathname.replace(/\/+$/, '') || '/';
    if (cleanPath === '/about') {
      setActiveRecipe(null);
      setActiveBlogPost(null);
      setCurrentPage('about');
      return;
    }
    if (cleanPath === '/reviews') {
      setActiveRecipe(null);
      setActiveBlogPost(null);
      setCurrentPage('reviews');
      return;
    }
    if (
      cleanPath === '/privacy' ||
      cleanPath === '/terms' ||
      cleanPath === '/disclaimer' ||
      cleanPath === '/editorial-policy' ||
      cleanPath === '/contact'
    ) {
      setActiveRecipe(null);
      setActiveBlogPost(null);
      setLegalSection(cleanPath.slice(1) as LegalSection);
      setCurrentPage('legal');
      return;
    }
    if (cleanPath.startsWith('/recipes/')) {
      const slug = cleanPath.slice('/recipes/'.length);
      const found = RECIPES_DATA.find((r) => r.slug === slug);
      if (found) {
        setCurrentPage('home');
        setActiveBlogPost(null);
        setActiveRecipe(found);
        return;
      }
    }
    if (cleanPath.startsWith('/blog/')) {
      const slug = cleanPath.slice('/blog/'.length);
      const found = availablePosts.find((p) => p.slug === slug || p.id === slug);
      if (found) {
        setCurrentPage('home');
        setActiveRecipe(null);
        setActiveBlogPost(found);
        return;
      }
    }
    if (cleanPath === '/map') {
      setCurrentPage('home');
      setTimeout(() => document.getElementById('map-section')?.scrollIntoView({ behavior: 'smooth' }), 80);
      return;
    }
    if (cleanPath === '/recipes') {
      setCurrentPage('home');
      setTimeout(() => document.getElementById('recipes-section')?.scrollIntoView({ behavior: 'smooth' }), 80);
      return;
    }
    if (cleanPath === '/blog') {
      setCurrentPage('home');
      setTimeout(() => document.getElementById('journal-section')?.scrollIntoView({ behavior: 'smooth' }), 80);
      return;
    }
    setActiveRecipe(null);
    setActiveBlogPost(null);
    setCurrentPage('home');
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    syncPathToState(window.location.pathname, posts);
    const handlePopState = () => syncPathToState(window.location.pathname, posts);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [posts.length]);

  const pushRoute = (path: string) => {
    if (typeof window !== 'undefined' && window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
  };

  const openLegalPage = (section: LegalSection) => {
    setActiveRecipe(null);
    setActiveBlogPost(null);
    setLegalSection(section);
    setCurrentPage('legal');
    pushRoute(`/${section}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveCookieConsent = (level: 'all' | 'essential') => {
    try {
      localStorage.setItem('nt_cookie_consent', level);
      localStorage.setItem('nt_cookie_consent_date', new Date().toISOString());
    } catch (_) {}
    setCookieConsentDismissed(true);
  };

  // Dynamic Document Title, Meta Description & Canonical URL for SEO
  useEffect(() => {
    let title = "Naveed's Table – Global Christmas Food & Culinary Journal";
    let description =
      "Naveed's Table: Explore authentic traditional Christmas recipes across Europe, Asia, Africa, Oceania, and the Americas with an interactive map, dietary filters, and daily SEO-optimized culinary journalism.";

    if (activeBlogPost) {
      title = `${activeBlogPost.metaTitle || activeBlogPost.title} | Naveed's Table`;
      description = activeBlogPost.metaDescription || activeBlogPost.introduction.slice(0, 158);
    } else if (activeRecipe) {
      title = `${activeRecipe.name} (${activeRecipe.country}) Recipe | Naveed's Table`;
      description = activeRecipe.description.slice(0, 158);
    } else if (currentPage === 'about') {
      title = "About Naveed's Table – Editorial Standards & Culinary Heritage";
      description =
        "Learn about Naveed's Table, our international test kitchen, founder Naveed in France, and our culinary journalism methodology.";
    } else if (currentPage === 'reviews') {
      title = "Reader Reviews & Community Kitchen Notes | Naveed's Table";
      description =
        "Verified home cook ratings, tasting feedback, and regional holiday memories from Naveed's Table readers worldwide.";
    } else if (currentPage === 'legal') {
      const legalTitles: Record<LegalSection, string> = {
        privacy: "Privacy Policy & Cookie Disclosure | Naveed's Table",
        terms: "Terms of Service | Naveed's Table",
        disclaimer: "Culinary, Nutritional & Advertising Disclaimer | Naveed's Table",
        'editorial-policy': "Editorial Guidelines & Fact-Checking Policy | Naveed's Table",
        contact: "Contact the Editorial Desk | Naveed's Table",
      };
      title = legalTitles[legalSection];
    }

    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', description);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical && typeof window !== 'undefined') {
      canonical.setAttribute('href', window.location.origin + window.location.pathname);
    }
  }, [activeRecipe, activeBlogPost, currentPage, legalSection]);

  // Filter recipes
  const filteredRecipes = RECIPES_DATA.filter((recipe) => {
    const matchesRegion = selectedRegion === 'All' || recipe.region === selectedRegion;
    const matchesDietary =
      selectedDietary === 'All' || (recipe.dietary as string[]).includes(selectedDietary);
    const matchesSearch =
      searchQuery === '' ||
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.ingredients.some((ing) => ing.item.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesRegion && matchesDietary && matchesSearch;
  });

  // Filter blog posts
  const filteredPosts = posts.filter((post) => {
    const matchesCat =
      selectedCategoryFilter === 'All' || post.category === selectedCategoryFilter;
    const matchesSearch =
      searchQuery === '' ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.introduction.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.primaryKeyword.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const dietaryFilters = [
    'All',
    'Vegetarian',
    'Gluten-Free',
    'Dairy-Free',
    'Traditional Feast',
    'Sweet/Dessert',
  ];

  const regionTabs = [
    { label: 'All Regions', value: 'All' },
    { label: 'Europe', value: 'Europe' },
    { label: 'Australia & Oceania', value: 'Australia & Oceania' },
    { label: 'South America', value: 'South America' },
    { label: 'North America', value: 'North America' },
    { label: 'Asia & Africa', value: 'Asia & Africa' },
  ];

  const navigateToSection = (sectionId: string) => {
    if (sectionId === 'reviews') {
      setCurrentPage('reviews');
      pushRoute('/reviews');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (currentPage !== 'home') {
      setCurrentPage('home');
      pushRoute('/');
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    } else {
      pushRoute('/');
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#FAF7F2] text-[#241D17] flex flex-col font-sans print:bg-white print:min-h-0"
    >
      {/* Top Navigation Bar: One-Row, Three-Zone Contract (§2) */}
      <header className="sticky top-0 z-40 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-[#E8DEC8] print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 sm:gap-8 px-4 sm:px-6 py-4">
          {/* Zone 1: Single text element wordmark */}
          <button
            onClick={() => setCurrentPage('home')}
            className="text-xl md:text-2xl font-serif font-bold text-[#241D17] tracking-tight whitespace-nowrap shrink-0 hover:text-[#9B2C2C] transition-colors cursor-pointer text-left"
          >
            {t.siteTitle || "Naveed's Table"}
          </button>

          {/* Zone 2: 4–5 clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#665A4F]">
            <button
              onClick={() => navigateToSection('recipes-section')}
              className={`hover:text-[#241D17] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currentPage === 'home' ? 'text-[#241D17]' : ''
              }`}
            >
              {t.navRecipes}
            </button>
            <button
              onClick={() => navigateToSection('map-section')}
              className="hover:text-[#241D17] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t.navMap}
            </button>
            <button
              onClick={() => navigateToSection('journal-section')}
              className="hover:text-[#241D17] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t.navJournal}
            </button>
            <button
              onClick={() => {
                setCurrentPage('reviews');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`hover:text-[#241D17] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currentPage === 'reviews'
                  ? 'text-[#9B2C2C] font-semibold border-b-2 border-[#9B2C2C] pb-0.5'
                  : ''
              }`}
            >
              {t.navReviews || 'Reviews'}
            </button>
            <button
              onClick={() => {
                setCurrentPage('about');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`hover:text-[#241D17] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currentPage === 'about'
                  ? 'text-[#9B2C2C] font-semibold border-b-2 border-[#9B2C2C] pb-0.5'
                  : ''
              }`}
            >
              {t.navAbout}
            </button>
          </nav>

          {/* Zone 3: Language Selector + 1 Primary Action */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Language Switcher Dropdown */}
            <div className="relative" ref={langDropdownRef}>
              <button
                type="button"
                onClick={() => setIsLangDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-white border border-[#DDD2C0] hover:border-[#9B2C2C] rounded-lg text-[#241D17] transition-colors cursor-pointer shadow-2xs"
                title="Select language / 언어 선택 / اختر اللغة"
              >
                <span className="text-sm">{activeLangObj.flag}</span>
                <span className="hidden sm:inline font-medium">{activeLangObj.nativeName}</span>
                <ChevronDown className="w-3 h-3 text-[#7A6C5F]" />
              </button>

              {isLangDropdownOpen && (
                <div
                  className={`absolute top-full mt-1.5 ${
                    isRtl ? 'left-0' : 'right-0'
                  } w-56 bg-white border border-[#DDD2C0] rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150`}
                >
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8C7D6D] border-b border-[#F2ECE1]">
                    Language / 언어 / اللغة
                  </div>
                  <div className="py-1 max-h-64 overflow-y-auto">
                    {SUPPORTED_LANGUAGES.map((lang) => {
                      const isSelected = lang.code === currentLang;
                      return (
                        <button
                          key={lang.code}
                          onClick={() => handleLanguageSelect(lang.code)}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#FAF2EB] text-[#9B2C2C] font-bold'
                              : 'text-[#3B3026] hover:bg-[#FAF7F2]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{lang.flag}</span>
                            <span>{lang.nativeName}</span>
                            <span className="text-[10px] text-[#8C7D6D]">({lang.name})</span>
                          </div>
                          {lang.code === 'ko' && (
                            <span className="text-[9px] bg-red-100 text-[#9B2C2C] font-semibold px-1.5 py-0.5 rounded">
                              한국어
                            </span>
                          )}
                          {lang.code === 'ar' && (
                            <span className="text-[9px] bg-amber-100 text-[#82532B] font-semibold px-1.5 py-0.5 rounded">
                              العربية RTL
                            </span>
                          )}
                          {isSelected && <CheckCircle className="w-3.5 h-3.5 text-[#9B2C2C]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Primary Action Button */}
            {currentPage === 'about' || currentPage === 'reviews' ? (
              <button
                onClick={() => setCurrentPage('home')}
                className="px-3.5 sm:px-4 py-2 text-xs font-semibold text-white bg-[#9B2C2C] hover:bg-[#822424] rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-xs cursor-pointer"
              >
                {t.ctaViewRecipes}
              </button>
            ) : (
              <button
                onClick={() => navigateToSection('recipes-section')}
                className="px-3.5 sm:px-4 py-2 text-xs font-semibold text-white bg-[#9B2C2C] hover:bg-[#822424] rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-xs cursor-pointer"
              >
                {t.ctaExplore}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Secondary Quick Nav Strip */}
        <div className="md:hidden flex items-center gap-4 overflow-x-auto px-4 py-2 border-t border-[#ECE2D0] text-xs font-medium text-[#665A4F] scrollbar-none">
          <button
            onClick={() => navigateToSection('recipes-section')}
            className="whitespace-nowrap shrink-0 hover:text-[#9B2C2C]"
          >
            {t.navRecipes}
          </button>
          <button
            onClick={() => navigateToSection('journal-section')}
            className="whitespace-nowrap shrink-0 hover:text-[#9B2C2C]"
          >
            {t.navJournal}
          </button>
          <button
            onClick={() => {
              setCurrentPage('reviews');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`whitespace-nowrap shrink-0 ${
              currentPage === 'reviews' ? 'text-[#9B2C2C] font-bold' : ''
            }`}
          >
            {t.navReviews || 'Reviews'}
          </button>
          <button
            onClick={() => {
              setCurrentPage('about');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`whitespace-nowrap shrink-0 ${
              currentPage === 'about' ? 'text-[#9B2C2C] font-bold' : ''
            }`}
          >
            {t.navAbout}
          </button>
        </div>
      </header>

      {/* Main Page Content */}
      {currentPage === 'about' ? (
        <main className={`flex-1 ${activeRecipe || activeBlogPost ? 'print:hidden' : ''}`}>
          <AboutPage
            onBackToHome={() => {
              setCurrentPage('home');
              pushRoute('/');
            }}
            isOwnerAuthorized={isOwnerAuthorized}
            onRequestOwnerUnlock={() => {
              setPasscodeError('');
              setIsOwnerLoginOpen(true);
            }}
            currentLang={currentLang}
          />
        </main>
      ) : currentPage === 'reviews' ? (
        <main className={`flex-1 ${activeRecipe || activeBlogPost ? 'print:hidden' : ''}`}>
          <ReviewsPage
            onBackToHome={() => {
              setCurrentPage('home');
              pushRoute('/');
            }}
            currentLang={currentLang}
            isOwnerAuthorized={isOwnerAuthorized}
            ownerPasscode={ownerPasscode}
          />
        </main>
      ) : currentPage === 'legal' ? (
        <main className={`flex-1 ${activeRecipe || activeBlogPost ? 'print:hidden' : ''}`}>
          <LegalPages
            section={legalSection}
            onSelectSection={(sec) => openLegalPage(sec)}
            onBackToHome={() => {
              setCurrentPage('home');
              pushRoute('/');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenCookieSettings={() => setCookieConsentDismissed(false)}
          />
        </main>
      ) : (
        <main
          className={`flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 space-y-16 ${
            activeRecipe || activeBlogPost ? 'print:hidden' : ''
          }`}
        >
          {/* Hero Section */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2 pb-6 border-b border-[#E8DEC8]">
            <div className="lg:col-span-7 space-y-5">
              <div className="flex items-center gap-2 text-xs text-[#82532B]">
                <span>{t.heroTagline}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#241D17] leading-[1.12] tracking-tight">
                {t.heroTitle}
              </h1>

              <p className="text-base sm:text-lg text-[#5A4D40] leading-relaxed max-w-2xl">
                {t.heroDescription}
              </p>

              {/* Search and Quick Discovery Bar */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 max-w-xl">
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-[#8C7D6D] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-[#DDD2C0] rounded-xl text-[#241D17] placeholder:text-[#9C8F80] focus:outline-none focus:ring-2 focus:ring-[#9B2C2C]/20 focus:border-[#9B2C2C]"
                  />
                </div>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-3 py-2 text-xs text-[#7A6C5F] hover:text-[#241D17] underline whitespace-nowrap shrink-0"
                  >
                    {t.clearSearch}
                  </button>
                )}
              </div>

              {/* Quick Proof Metrics Strip */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-[#7A6C5F]">
                <div>
                  <span className="font-bold text-[#241D17] text-sm tabular-nums mr-1">100%</span>
                  {t.testedAuthenticity}
                </div>
                <span aria-hidden="true">·</span>
                <div>
                  <span className="font-bold text-[#241D17] text-sm tabular-nums mr-1">5 Regions</span>
                  {t.continentsDivided}
                </div>
                <span aria-hidden="true">·</span>
                <div>
                  <span className="font-bold text-[#241D17] text-sm tabular-nums mr-1">Daily Editions</span>
                  {t.dailyDispatches}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-[4/3] border border-[#E0D5C1] group protected-media">
                <img
                  src="/images/hero_christmas_feast_1794320880047.jpg"
                  alt="Grand atmospheric Christmas Eve dinner table with golden roasted roast, desserts, and candlelit ambiance"
                  draggable={isOwnerAuthorized}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500 protected-media"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent flex flex-col justify-end p-6 text-white select-none">
                  <span className="text-[11px] uppercase tracking-wider text-white/80 font-medium">
                    Featured Global Tradition
                  </span>
                  <h3 className="text-xl font-serif font-bold text-white mt-1">
                    The French Réveillon & Italian Vigilia
                  </h3>
                  <p className="text-xs text-white/80 mt-1 line-clamp-2">
                    Nocturnal multi-course banquets that celebrate the midnight transition into Christmas morning.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Interactive World Map Section */}
          <section id="map-section" className="space-y-4">
            <InteractiveMap
              recipes={RECIPES_DATA}
              selectedRegion={selectedRegion}
              onSelectRegion={setSelectedRegion}
              onSelectRecipe={(r) => setActiveRecipe(r)}
            />
          </section>

          {/* Global Recipes Catalog */}
          <section id="recipes-section" className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#E8DEC8]">
              <div>
                <div className="flex items-center gap-2 text-xs text-[#82532B] font-semibold uppercase tracking-wider">
                  <Utensils className="w-3.5 h-3.5 text-[#9B2C2C]" />
                  <span>Culinary Archives</span>
                </div>
                <h2 className="text-3xl font-serif font-bold text-[#241D17] mt-1">
                  Authentic Christmas Recipes by Region
                </h2>
                <p className="text-sm text-[#665A4F] mt-1">
                  Filtered by region (Europe, Oceania, Americas, Asia & Africa) and dietary preference.
                </p>
              </div>

              {/* Region Tabs */}
              <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F0E9DF] rounded-xl self-start md:self-auto">
                {regionTabs.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setSelectedRegion(tab.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                      selectedRegion === tab.value
                        ? 'bg-white text-[#9B2C2C] shadow-xs font-semibold'
                        : 'text-[#665A4F] hover:text-[#241D17]'
                    }`}
                  >
                    {tab.value === 'All' ? t.allRegions : tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dietary Filters Sub-Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs text-[#7A6C5F] font-medium flex items-center gap-1 shrink-0">
                <Filter className="w-3.5 h-3.5" />
                <span>{t.dietaryFilter}</span>
              </span>
              {dietaryFilters.map((diet) => (
                <button
                  key={diet}
                  onClick={() => setSelectedDietary(diet)}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    selectedDietary === diet
                      ? 'bg-[#9B2C2C] text-white font-medium'
                      : 'bg-white border border-[#E0D5C1] text-[#665A4F] hover:bg-[#F2ECE1]'
                  }`}
                >
                  {diet}
                </button>
              ))}
            </div>

            {/* Recipe Cards Grid */}
            {filteredRecipes.length === 0 ? (
              <div className="p-12 text-center bg-white border border-[#E4D9C5] rounded-2xl space-y-3">
                <Utensils className="w-8 h-8 text-[#A69988] mx-auto" />
                <h3 className="text-lg font-serif font-bold text-[#241D17]">
                  No recipes found matching your filters
                </h3>
                <p className="text-xs text-[#7A6C5F]">
                  Try selecting "All Regions" or reset dietary preferences to view our full collection.
                </p>
                <button
                  onClick={() => {
                    setSelectedRegion('All');
                    setSelectedDietary('All');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-[#9B2C2C] border border-[#9B2C2C] rounded-lg hover:bg-[#9B2C2C] hover:text-white transition-colors cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRecipes.map((recipe) => (
                  <article
                    key={recipe.id}
                    className="bg-white border border-[#E4D9C5] rounded-2xl overflow-hidden hover:shadow-md hover:border-[#CFBEA5] transition-all duration-200 flex flex-col group"
                  >
                    <a
                      href={`/recipes/${recipe.slug}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveRecipe(recipe);
                        pushRoute(`/recipes/${recipe.slug}`);
                      }}
                      className="flex-1 flex flex-col cursor-pointer"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-[#F0E9DF] protected-media">
                        <img
                          src={recipe.image}
                          alt={recipe.imageAlt}
                          draggable={isOwnerAuthorized}
                          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300 protected-media"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              '/images/hero_christmas_feast_1794320880047.jpg';
                          }}
                        />
                        <div className="absolute top-3 left-3 bg-[#241D17]/85 backdrop-blur-xs text-white text-[11px] font-semibold px-2 py-0.5 rounded-md">
                          {recipe.country}
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs text-[#82532B]">
                            <span>{recipe.region}</span>
                            <span aria-hidden="true">·</span>
                            <span className="italic">{recipe.localName}</span>
                          </div>

                          <h3 className="text-lg font-serif font-bold text-[#241D17] group-hover:text-[#9B2C2C] transition-colors mt-1">
                            {recipe.name}
                          </h3>

                          <p className="text-xs text-[#665A4F] line-clamp-2 mt-1.5 leading-relaxed">
                            {recipe.description}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-[#F2ECE1] flex items-center justify-between text-xs text-[#7A6C5F]">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="tabular-nums">
                              {recipe.prepTimeMinutes + recipe.cookTimeMinutes} mins
                            </span>
                          </div>

                          <div className="text-[11px] font-medium text-[#82532B]">
                            {recipe.difficulty}
                          </div>
                        </div>
                      </div>
                    </a>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Editorial Quick Directory & Dietary Discovery Strip */}
          <aside className="p-5 sm:p-6 bg-white border border-[#E4D9C5] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-[#9B2C2C] font-semibold block">
                Curated Test-Kitchen Collections
              </span>
              <p className="text-sm font-serif font-bold text-[#241D17]">
                Explore 100% Gluten-Free Global Feasts, Interactive World Flavor Pins, &amp; Editorial Standards
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedDietary('Gluten-Free');
                  navigateToSection('recipes-section');
                }}
                className="px-3.5 py-2 text-xs font-semibold bg-[#FAF7F2] hover:bg-[#EFE8DD] text-[#241D17] border border-[#DDD2C0] rounded-lg transition-colors cursor-pointer"
              >
                Gluten-Free Archive
              </button>
              <a
                href="/editorial-policy"
                onClick={(e) => {
                  e.preventDefault();
                  openLegalPage('editorial-policy');
                }}
                className="px-3.5 py-2 text-xs font-semibold bg-[#9B2C2C] hover:bg-[#822424] text-white rounded-lg transition-colors"
              >
                Editorial Guidelines
              </a>
            </div>
          </aside>

          {/* News, Current Affairs & Culinary Trends Journal */}
          <section id="journal-section" className="space-y-6 pt-6 border-t border-[#E8DEC8]">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#E8DEC8]">
              <div>
                <div className="flex items-center gap-2 text-xs text-[#82532B] font-semibold uppercase tracking-wider">
                  <BookOpen className="w-3.5 h-3.5 text-[#9B2C2C]" />
                  <span>Culinary Journalism & News Bureau</span>
                </div>
                <h2 className="text-3xl font-serif font-bold text-[#241D17] mt-1">
                  Holiday News, Agri-Trends & Traditions Journal
                </h2>
                <p className="text-sm text-[#665A4F] mt-1">
                  Fact-based, SEO-rich articles covering 6 core holiday food niches, published on a daily cadence.
                </p>
              </div>

              {/* Clean Editorial Cadence Badge for visitors (No robot buttons exposed!) */}
              <div className="p-3 bg-white border border-[#E4D9C5] rounded-xl flex items-center gap-3 shadow-xs">
                <Clock className="w-4 h-4 text-[#9B2C2C]" />
                <div className="text-xs">
                  <span className="font-semibold text-[#241D17] block">
                    Daily Editorial Editions
                  </span>
                  <span className="text-[#7A6C5F]">
                    Morning & Evening Holiday Gastronomy Dispatches
                  </span>
                </div>
              </div>
            </div>

            {/* 6 Category Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedCategoryFilter('All')}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  selectedCategoryFilter === 'All'
                    ? 'bg-[#241D17] text-white font-semibold'
                    : 'bg-white border border-[#E0D5C1] text-[#665A4F] hover:bg-[#F2ECE1]'
                }`}
              >
                {t.allCategories}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    selectedCategoryFilter === cat
                      ? 'bg-[#241D17] text-white font-semibold'
                      : 'bg-white border border-[#E0D5C1] text-[#665A4F] hover:bg-[#F2ECE1]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredPosts.map((post) => (
                <article
                  key={post.id}
                  className="bg-white border border-[#E4D9C5] rounded-2xl overflow-hidden hover:border-[#CFBEA5] hover:shadow-md transition-all duration-200 flex flex-col group"
                >
                  <a
                    href={`/blog/${post.slug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveBlogPost(post);
                      pushRoute(`/blog/${post.slug}`);
                    }}
                    className="flex-1 flex flex-col cursor-pointer"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden bg-[#F0E9DF] protected-media">
                      <img
                        src={post.featuredImage.url}
                        alt={post.featuredImage.alt}
                        draggable={isOwnerAuthorized}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300 protected-media"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            '/images/hero_christmas_feast_1794320880047.jpg';
                        }}
                      />
                      <div className="absolute top-3 left-3 bg-[#241D17]/85 backdrop-blur-xs text-white text-[11px] font-semibold px-2 py-0.5 rounded-md">
                        {post.category}
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-[#82532B]">
                          <span>
                            {new Date(post.publishedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{post.readTimeMinutes} min read</span>
                        </div>

                        <h3 className="text-xl font-serif font-bold text-[#241D17] group-hover:text-[#9B2C2C] transition-colors leading-snug">
                          {post.title}
                        </h3>

                        <p className="text-xs text-[#665A4F] line-clamp-3 leading-relaxed">
                          {post.introduction}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-[#F2ECE1] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-[#7A6C5F]">
                          <span className="font-medium text-[#241D17]">{post.author.name}</span>
                        </div>

                        <span className="font-semibold text-[#9B2C2C] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                          <span>{t.readReport}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </a>
                </article>
              ))}
            </div>
          </section>

          {/* Community Reviews & Comments Invitation Banner */}
          <section className="p-8 bg-white border border-[#E4D9C5] rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#9B2C2C]">
                <MessageSquare className="w-4 h-4" />
                <span>{t.navReviews || 'Reviews'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#241D17]">
                {t.reviewsTitle || 'Reader Reviews & Culinary Comments'}
              </h2>
              <p className="text-sm text-[#5A4D40] leading-relaxed">
                {t.reviewsSubtitle ||
                  'Verified home cooks sharing festive results, dish feedback, and holiday stories across the globe.'}
              </p>
            </div>
            <button
              onClick={() => {
                setCurrentPage('reviews');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-5 py-3 bg-[#9B2C2C] hover:bg-[#822424] text-white text-xs font-semibold rounded-xl transition-colors shadow-xs whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{t.leaveReview || 'Leave a Review & Comment'}</span>
            </button>
          </section>
        </main>
      )}

      {/* Footer */}
      <footer className="mt-16 bg-[#241D17] text-[#D8CAB8] border-t border-[#3B3026] print:hidden">
        <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <span className="text-xl font-serif font-bold text-white block">
                Naveed’s Table
              </span>
              <p className="text-xs text-[#A89886] leading-relaxed">
                The premier international culinary repository and news journal for authentic global Christmas food, ancestral recipes, and holiday gastronomy. Founded by Naveed.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
                Geographic Hubs
              </h4>
              <ul className="space-y-1.5 text-xs text-[#BDB09E]">
                <li>Europe & Mediterranean</li>
                <li>Australia & Oceania Feasts</li>
                <li>South American Nochebuena</li>
                <li>North American Heritage Pies</li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
                Navigation &amp; Legal Compliance
              </h4>
              <ul className="space-y-1.5 text-xs text-[#BDB09E]">
                <li>
                  <a
                    href="/reviews"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage('reviews');
                      pushRoute('/reviews');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-white transition-colors font-semibold text-white"
                  >
                    {t.navReviews || 'Reviews'} &amp; Community Comments
                  </a>
                </li>
                <li>
                  <a
                    href="/about"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage('about');
                      pushRoute('/about');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-white transition-colors font-semibold text-white"
                  >
                    About Us &amp; Founder Story
                  </a>
                </li>
                <li>
                  <a
                    href="/contact"
                    onClick={(e) => {
                      e.preventDefault();
                      openLegalPage('contact');
                    }}
                    className="hover:text-white transition-colors"
                  >
                    Contact Editorial Desk
                  </a>
                </li>
                <li>
                  <a
                    href="/editorial-policy"
                    onClick={(e) => {
                      e.preventDefault();
                      openLegalPage('editorial-policy');
                    }}
                    className="hover:text-white transition-colors"
                  >
                    Editorial &amp; Fact-Checking Policy
                  </a>
                </li>
                <li>
                  <a
                    href="/privacy"
                    onClick={(e) => {
                      e.preventDefault();
                      openLegalPage('privacy');
                    }}
                    className="hover:text-white transition-colors"
                  >
                    Privacy Policy &amp; CCPA / GDPR
                  </a>
                </li>
                <li>
                  <a
                    href="/terms"
                    onClick={(e) => {
                      e.preventDefault();
                      openLegalPage('terms');
                    }}
                    className="hover:text-white transition-colors"
                  >
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a
                    href="/disclaimer"
                    onClick={(e) => {
                      e.preventDefault();
                      openLegalPage('disclaimer');
                    }}
                    className="hover:text-white transition-colors"
                  >
                    Culinary &amp; Ad Disclaimer
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
                Naveed’s Table Culinary Bureau
              </h4>
              <p className="text-xs text-[#A89886] leading-relaxed mb-3">
                Published daily under international gastronomy, agricultural economics, and cultural heritage press standards.
              </p>
              <div className="text-[11px] text-[#8C7D6D]">
                Headquartered in France · Global bureaus across Europe, Oceania, Americas, Asia &amp; Africa.
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-[#3B3026] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8C7D6D]">
            <div className="flex flex-wrap items-center gap-2">
              <span>© 2026 Naveed’s Table Global Journal.</span>
              <span aria-hidden="true">·</span>
              <span>Founded by Naveed</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#D8CAB8] font-semibold">Based in France 🇫🇷</span>
              <span aria-hidden="true">·</span>
              <a
                href="mailto:afzal460@gmail.com"
                className="text-[#E0A96D] hover:underline flex items-center gap-1 font-medium"
                title="Contact Naveed directly"
              >
                <Mail className="w-3 h-3" />
                <span>afzal460@gmail.com</span>
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => setCookieConsentDismissed(false)}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Cookie Settings
              </button>
              <a href="/ads.txt" className="hover:text-white transition-colors">
                ads.txt
              </a>
              <a href="/sitemap.xml" className="hover:text-white transition-colors">
                XML Sitemap
              </a>
              <a href="/robots.txt" className="hover:text-white transition-colors">
                Robots.txt
              </a>
              {/* Owner-Verified Staff Desk trigger */}
              <button
                onClick={() => {
                  if (isOwnerAuthorized) {
                    setIsOwnerAuthorized(false);
                    setOwnerPasscode('');
                  } else {
                    setPasscodeError('');
                    setIsOwnerLoginOpen(true);
                  }
                }}
                className="hover:text-white transition-colors opacity-45 hover:opacity-100 flex items-center gap-1 cursor-pointer"
                title="Owner verification portal"
              >
                <Lock className="w-3 h-3" />
                <span>{isOwnerAuthorized ? 'Lock Owner Desk' : 'Staff Desk'}</span>
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Owner-Verified Floating Editorial Desk (Strictly hidden unless authenticated as Naveed) */}
      {isOwnerAuthorized && (
        <div className="fixed bottom-4 right-4 bg-[#241D17] text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-3.5 z-50 text-xs animate-in fade-in duration-200 print:hidden">
          <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>Owner Editorial Desk</span>
          </div>
          <button
            onClick={() => setIsGeneratorOpen(true)}
            className="px-3 py-1.5 bg-[#9B2C2C] hover:bg-[#822424] text-white rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>Research & Publish Blog</span>
          </button>
          <button
            onClick={() => {
              setIsOwnerAuthorized(false);
              setOwnerPasscode('');
            }}
            className="text-white/60 hover:text-white cursor-pointer px-1"
          >
            Lock
          </button>
        </div>
      )}

      {/* Owner Passcode Verification Modal */}
      {isOwnerLoginOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E8DEC8] overflow-hidden">
            <div className="px-6 py-4 bg-[#FAF7F2] border-b border-[#E8DEC8] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#9B2C2C]" />
                <h3 className="text-base font-serif font-bold text-[#241D17]">
                  Owner Permission Required
                </h3>
              </div>
              <button
                onClick={() => setIsOwnerLoginOpen(false)}
                className="p-1 text-[#7A6C5F] hover:text-[#241D17] rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleVerifyOwner} className="p-6 space-y-4">
              <p className="text-xs text-[#5A4D40] leading-relaxed">
                Site media downloads, portrait changes, moderation, and the AI Editorial Desk are strictly protected under founder Naveed’s permission.
              </p>
              {passcodeError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-[#9B2C2C] font-medium">
                  {passcodeError}
                </div>
              )}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7A6C5F] mb-1.5">
                  Owner Passcode
                </label>
                <input
                  type="password"
                  value={passcodeInput}
                  onChange={(e) => setPasscodeInput(e.target.value)}
                  placeholder="Enter owner passcode..."
                  autoFocus
                  className="w-full px-3.5 py-2.5 text-sm bg-[#FAF7F2] border border-[#DDD2C0] rounded-xl text-[#241D17] focus:outline-none focus:ring-2 focus:ring-[#9B2C2C]/20 focus:border-[#9B2C2C]"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOwnerLoginOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#665A4F] hover:text-[#241D17] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingOwner}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#9B2C2C] hover:bg-[#822424] rounded-lg transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isVerifyingOwner ? 'Verifying...' : 'Unlock Owner Controls'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cookie & GDPR / CCPA Consent Banner */}
      {!cookieConsentDismissed && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-[28rem] bg-[#241D17] text-white p-4 rounded-xl shadow-2xl border border-white/10 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300 print:hidden">
          <div className="space-y-3">
            <div className="text-xs space-y-1">
              <span className="font-semibold block text-[#F3EFE9]">Cookie &amp; Privacy Notice</span>
              <p className="text-white/75 leading-relaxed text-[11px]">
                We use essential storage for language preferences and optional cookies for traffic measurement and Google AdSense advertising. Read our{' '}
                <a
                  href="/privacy"
                  onClick={(e) => {
                    e.preventDefault();
                    openLegalPage('privacy');
                  }}
                  className="underline text-[#E0A96D] hover:text-white"
                >
                  Privacy &amp; Cookie Policy
                </a>
                .
              </p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => handleSaveCookieConsent('essential')}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white/90 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                Essential Only
              </button>
              <button
                type="button"
                onClick={() => handleSaveCookieConsent('all')}
                className="px-3.5 py-1.5 bg-[#9B2C2C] hover:bg-[#822424] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recipe Modal */}
      {activeRecipe && (
        <RecipeModal
          recipe={activeRecipe}
          onClose={() => {
            setActiveRecipe(null);
            pushRoute('/');
          }}
          isOwnerAuthorized={isOwnerAuthorized}
        />
      )}

      {/* Blog Reader Modal with SEO Inspector & Instant Multi-Language Translation */}
      {activeBlogPost && (
        <BlogReaderModal
          post={activeBlogPost}
          onClose={() => {
            setActiveBlogPost(null);
            pushRoute('/');
          }}
          onNavigateRecipe={(recipeSlug) => {
            setActiveBlogPost(null);
            const found = RECIPES_DATA.find((r) => r.slug === recipeSlug);
            if (found) {
              setActiveRecipe(found);
              pushRoute(`/recipes/${found.slug}`);
            }
          }}
          onNavigateBlog={(blogSlug) => {
            const foundPost = posts.find((p) => p.slug === blogSlug || p.id === blogSlug);
            if (foundPost) {
              setActiveBlogPost(foundPost);
              pushRoute(`/blog/${foundPost.slug}`);
            }
          }}
          onNavigateSection={(sectionId) => {
            setActiveBlogPost(null);
            navigateToSection(sectionId);
          }}
          currentLang={currentLang}
          onLanguageChange={handleLanguageSelect}
          isOwnerAuthorized={isOwnerAuthorized}
        />
      )}

      {/* AI Research & Generator Modal (Owner-Restricted) */}
      <AiBlogGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onPostCreated={(newPost) => {
          setPosts((prev) => [newPost, ...prev]);
          setActiveBlogPost(newPost);
        }}
        categories={categories}
        ownerPasscode={ownerPasscode}
      />

      {/* About, Standards, Contact, & Privacy Modal */}
      <AboutPolicyModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        initialTab={aboutTab}
      />
    </div>
  );
}
