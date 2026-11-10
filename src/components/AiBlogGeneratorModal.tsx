import React, { useState } from 'react';
import { BlogPost } from '../data/posts';
import {
  X,
  Sparkles,
  RefreshCw,
  Clock,
  Compass,
  CheckCircle,
  AlertCircle,
  Send,
  Zap,
} from 'lucide-react';

interface AiBlogGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (post: BlogPost) => void;
  categories: string[];
}

export const AiBlogGeneratorModal: React.FC<AiBlogGeneratorModalProps> = ({
  isOpen,
  onClose,
  onPostCreated,
  categories,
}) => {
  if (!isOpen) return null;

  const [topic, setTopic] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categories[0] || 'Holiday Food News & Global Trends');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sampleTrendingPrompts = [
    '2026 European Christmas Market Spices: Price Volatility in Cinnamon and Cloves',
    'The Rise of Chilled Seafood and Tropical Fruits on Southern Hemisphere Christmas Tables',
    'Rediscovering Saffron Lussekatter: Ancient Nordic Solstice and Christmas Breads',
    'Plant-Based Roast Showstoppers: How Root Vegetables Are Replacing Traditional Turkeys',
    'Pan de Jamón in Caracas: The Century-Old Heritage of Venezuelan Christmas Eve',
  ];

  const handleGenerate = async (customTopic?: string) => {
    setIsGenerating(true);
    setError(null);

    const topicToUse = customTopic || topic;

    try {
      const response = await fetch('/api/generate-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicToUse || undefined,
          category: selectedCategory,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate blog post');
      }

      onPostCreated(data.post);
      onClose();
    } catch (err: any) {
      console.error('Error generating blog post:', err);
      setError(err.message || 'An error occurred during article generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#E8DEC8]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0EAE1] bg-[#FAF7F2]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#9B2C2C]/10 text-[#9B2C2C] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-[#241D17]">
                AI Journalist & SEO Publishing Engine
              </h3>
              <p className="text-xs text-[#7A6C5F]">
                Automated 12-Hour Research Cadence & On-Demand Dispatch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#7A6C5F] hover:text-[#241D17] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Cadence Info Banner */}
          <div className="p-4 bg-[#F9F5EE] border border-[#EADBCC] rounded-xl flex items-start gap-3">
            <Clock className="w-5 h-5 text-[#82532B] shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-semibold text-[#241D17]">
                Automated Publishing Protocol: 2 Articles / 24 Hours (12h Gap)
              </div>
              <p className="text-[#665A4F] leading-relaxed">
                The integrated content robot autonomously gathers holiday trends, verifies data against culinary records, structures H2/H3 semantic sections, and generates full SEO meta tags and Schema.org markup.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-[#FDF2F2] border border-[#F8B4B4] rounded-lg flex items-center gap-2 text-xs text-[#9B2C2C]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#7A6C5F] mb-1.5">
                Target Category (6 SEO Niches)
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E4D9C5] rounded-xl text-[#241D17] focus:outline-none focus:ring-2 focus:ring-[#9B2C2C]/20 focus:border-[#9B2C2C]"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#7A6C5F] mb-1.5">
                Specific Topic or Leave Blank for Automated Trending Research
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Impact of Madagascar vanilla prices on Christmas pastry chefs"
                className="w-full text-sm px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E4D9C5] rounded-xl text-[#241D17] placeholder:text-[#9C8F80] focus:outline-none focus:ring-2 focus:ring-[#9B2C2C]/20 focus:border-[#9B2C2C]"
              />
            </div>

            {/* Quick Trending Suggestions */}
            <div>
              <span className="block text-[11px] font-semibold text-[#8C7D6D] uppercase tracking-wider mb-2">
                Or pick a trending suggestion:
              </span>
              <div className="space-y-1.5">
                {sampleTrendingPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setTopic(p);
                    }}
                    className="w-full text-left p-2 rounded-lg text-xs bg-[#FAF7F2] hover:bg-[#F2ECE1] text-[#473B30] border border-[#EDE5D8] transition-colors flex items-center justify-between group"
                  >
                    <span className="truncate">{p}</span>
                    <span className="text-[#9B2C2C] opacity-0 group-hover:opacity-100 font-semibold shrink-0 ml-2">
                      Select
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#F0EAE1] bg-[#FAF7F2] flex items-center justify-between">
          <div className="text-xs text-[#7A6C5F]">
            Powered by Gemini 3.8 Flash
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="px-4 py-2 text-xs font-medium text-[#665A4F] hover:text-[#241D17] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleGenerate()}
              disabled={isGenerating}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#9B2C2C] hover:bg-[#822424] rounded-lg transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Researching & Writing...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Publish Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
