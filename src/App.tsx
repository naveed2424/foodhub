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
} from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'about'>('home');
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
  const [cookieConsentDismissed, setCookieConsentDismissed] = useState<boolean>(false);

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

  // Hidden Editor Mode (strictly hidden from public visitors, accessible via secret shortcut or parameter)
  const [isEditorMode, setIsEditorMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        window.location.search.includes('editor') ||
        window.location.search.includes('admin') ||
        localStorage.getItem('yt_editor_mode') === 'true'
      );
    }
    return false;
  });

  // Keyboard shortcut Ctrl+Shift+E or Cmd+Shift+E to toggle editor mode privately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'E' || e.key === 'e')) {
        e.preventDefault();
        setIsEditorMode((prev) => {
          const next = !prev;
          localStorage.setItem('yt_editor_mode', next ? 'true' : 'false');
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
  ];

  const navigateToSection = (sectionId: string) => {
    if (currentPage !== 'home') {
      setCurrentPage('home');
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#FAF7F2] text-[#241D17] flex flex-col font-sans"
    >
      {/* Top Navigation Bar: One-Row, Three-Zone Contract (§2) */}
      <header className="sticky top-0 z-40 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-[#E8DEC8]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 sm:gap-8 px-4 sm:px-6 py-4">
          {/* Zone 1: Single text element wordmark */}
          <button
            onClick={() => setCurrentPage('home')}
            className="text-xl md:text-2xl font-serif font-bold text-[#241D17] tracking-tight whitespace-nowrap shrink-0 hover:text-[#9B2C2C] transition-colors cursor-pointer text-left"
          >
            {t.siteTitle || 'Yuletide Table'}
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
              onClick={() => setCurrentPage('about')}
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
            {currentPage === 'about' ? (
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
      </header>

      {/* Main Page Content */}
      {currentPage === 'about' ? (
        <main className="flex-1">
          <AboutPage onBackToHome={() => setCurrentPage('home')} />
        </main>
      ) : (
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 space-y-16">
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
                  <span className="font-bold text-[#241D17] text-sm tabular-nums mr-1">4 Continents</span>
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
              <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-[4/3] border border-[#E0D5C1] group">
                <img
                  src="/images/hero_christmas_feast_1794320880047.jpg"
                  alt="Grand atmospheric Christmas Eve dinner table with golden roasted roast, desserts, and candlelit ambiance"
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent flex flex-col justify-end p-6 text-white">
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
                  Filtered by region (Europe, Australia, South and North America) and dietary preference.
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
                  <div
                    key={recipe.id}
                    onClick={() => setActiveRecipe(recipe)}
                    className="bg-white border border-[#E4D9C5] rounded-2xl overflow-hidden hover:shadow-md hover:border-[#CFBEA5] transition-all duration-200 cursor-pointer flex flex-col group"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-[#F0E9DF]">
                      <img
                        src={recipe.image}
                        alt={recipe.imageAlt}
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
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
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* AdSense Compliant Mid-Page Banner */}
          <div className="p-4 bg-[#FAF8F5] border border-dashed border-[#DDD2C0] rounded-xl text-center">
            <span className="text-[10px] uppercase tracking-wider text-[#9C8F80] block font-medium">
              Advertisement · Google AdSense Approved Placement
            </span>
            <div className="h-16 flex items-center justify-center text-xs text-[#8C7D6D]">
              Curated Artisanal Kitchenware, Holiday Spices & Gourmet Wine Pairings
            </div>
          </div>

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
                  onClick={() => setActiveBlogPost(post)}
                  className="bg-white border border-[#E4D9C5] rounded-2xl overflow-hidden hover:border-[#CFBEA5] hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col group"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-[#F0E9DF]">
                    <img
                      src={post.featuredImage.url}
                      alt={post.featuredImage.alt}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
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
                </article>
              ))}
            </div>
          </section>
        </main>
      )}

      {/* Footer */}
      <footer className="mt-16 bg-[#241D17] text-[#D8CAB8] border-t border-[#3B3026]">
        <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <span className="text-xl font-serif font-bold text-white block">
                Yuletide Table
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
                Navigation & Editorial
              </h4>
              <ul className="space-y-1.5 text-xs text-[#BDB09E]">
                <li>
                  <button
                    onClick={() => {
                      setCurrentPage('about');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-white transition-colors text-left font-semibold text-white cursor-pointer"
                  >
                    About Us & Founder Story
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setAboutTab('editorial');
                      setIsAboutOpen(true);
                    }}
                    className="hover:text-white transition-colors text-left"
                  >
                    AdSense & Advertising Transparency
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setAboutTab('about');
                      setIsAboutOpen(true);
                    }}
                    className="hover:text-white transition-colors text-left"
                  >
                    Recipe Testing Kitchen
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setAboutTab('privacy');
                      setIsAboutOpen(true);
                    }}
                    className="hover:text-white transition-colors text-left"
                  >
                    Privacy Policy & CCPA
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
                Yuletide Culinary Bureau
              </h4>
              <p className="text-xs text-[#A89886] leading-relaxed mb-3">
                Published daily under international gastronomy, agricultural economics, and cultural heritage press standards.
              </p>
              <div className="text-[11px] text-[#8C7D6D]">
                Headquartered in London & Paris · Global bureaus across Sydney, Montreal & Buenos Aires.
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-[#3B3026] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8C7D6D]">
            <div className="flex flex-wrap items-center gap-2">
              <span>© 2026 Yuletide Table Global Journal.</span>
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
            <div className="flex items-center gap-4">
              <a href="/sitemap.xml" className="hover:text-white transition-colors">
                XML Sitemap
              </a>
              <a href="/robots.txt" className="hover:text-white transition-colors">
                Robots.txt
              </a>
              {/* Subtle Staff / Editor trigger */}
              <button
                onClick={() => {
                  setIsEditorMode((prev) => !prev);
                }}
                className="hover:text-white transition-colors opacity-40 hover:opacity-100 flex items-center gap-1 cursor-pointer"
                title="Staff editorial portal (or press Ctrl+Shift+E)"
              >
                <Lock className="w-3 h-3" />
                <span>Staff Desk</span>
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Secret Floating Editor Desk (Only rendered when editor mode is enabled!) */}
      {isEditorMode && (
        <div className="fixed bottom-4 right-4 bg-[#241D17] text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-3.5 z-50 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>Staff Editorial Mode</span>
          </div>
          <button
            onClick={() => setIsGeneratorOpen(true)}
            className="px-3 py-1.5 bg-[#9B2C2C] hover:bg-[#822424] text-white rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>Research & Publish Blog</span>
          </button>
          <button
            onClick={() => {
              setIsEditorMode(false);
              localStorage.setItem('yt_editor_mode', 'false');
            }}
            className="text-white/60 hover:text-white cursor-pointer px-1"
          >
            Hide
          </button>
        </div>
      )}

      {/* Cookie Consent Banner */}
      {!cookieConsentDismissed && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-96 bg-[#241D17] text-white p-4 rounded-xl shadow-2xl border border-white/10 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="text-xs space-y-1">
              <span className="font-semibold block text-[#F3EFE9]">Cookie & Privacy Notice</span>
              <p className="text-white/70 leading-relaxed text-[11px]">
                We use cookies to enhance navigation and deliver relevant content in accordance with Google AdSense policies.
              </p>
            </div>
            <button
              onClick={() => setCookieConsentDismissed(true)}
              className="px-3 py-1 bg-[#9B2C2C] hover:bg-[#822424] text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Accept
            </button>
          </div>
        </div>
      )}

      {/* Recipe Modal */}
      {activeRecipe && (
        <RecipeModal recipe={activeRecipe} onClose={() => setActiveRecipe(null)} />
      )}

      {/* Blog Reader Modal with SEO Inspector & Instant Multi-Language Translation */}
      {activeBlogPost && (
        <BlogReaderModal
          post={activeBlogPost}
          onClose={() => setActiveBlogPost(null)}
          onNavigateRecipe={(recipeSlug) => {
            setActiveBlogPost(null);
            const found = RECIPES_DATA.find((r) => r.slug === recipeSlug);
            if (found) {
              setActiveRecipe(found);
            }
          }}
          currentLang={currentLang}
          onLanguageChange={handleLanguageSelect}
        />
      )}

      {/* AI Research & Generator Modal (Hidden from visitors) */}
      <AiBlogGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onPostCreated={(newPost) => {
          setPosts((prev) => [newPost, ...prev]);
          setActiveBlogPost(newPost);
        }}
        categories={categories}
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
