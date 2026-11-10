import React, { useState, useEffect } from 'react';
import { Recipe } from '../data/recipes';
import {
  X,
  Clock,
  Users,
  ChefHat,
  Bookmark,
  Share2,
  CheckCircle2,
  Play,
  RotateCcw,
  Sparkles,
  Info,
  Flame,
  Globe,
  Printer,
} from 'lucide-react';

interface RecipeModalProps {
  recipe: Recipe | null;
  onClose: () => void;
}

export const RecipeModal: React.FC<RecipeModalProps> = ({ recipe, onClose }) => {
  if (!recipe) return null;

  const [servingMultiplier, setServingMultiplier] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [activeTimerSeconds, setActiveTimerSeconds] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [activeTimerStep, setActiveTimerStep] = useState<number | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Reset state when recipe changes
  useEffect(() => {
    setServingMultiplier(1);
    setCompletedSteps([]);
    setActiveTimerSeconds(null);
    setTimerRunning(false);
  }, [recipe.id]);

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning && activeTimerSeconds !== null && activeTimerSeconds > 0) {
      interval = setInterval(() => {
        setActiveTimerSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (activeTimerSeconds === 0) {
      setTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [timerRunning, activeTimerSeconds]);

  const startTimer = (minutes: number, stepNum: number) => {
    setActiveTimerSeconds(minutes * 60);
    setActiveTimerStep(stepNum);
    setTimerRunning(true);
  };

  const toggleStep = (stepNum: number) => {
    setCompletedSteps((prev) =>
      prev.includes(stepNum) ? prev.filter((s) => s !== stepNum) : [...prev, stepNum]
    );
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.origin + `/recipes/${recipe.slug}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  // Schema.org Recipe JSON-LD definition
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.name,
    headline: recipe.description,
    image: [recipe.image],
    author: {
      '@type': 'Organization',
      name: 'Yuletide Table Global Culinary Archive',
    },
    datePublished: '2026-11-10',
    description: recipe.description,
    recipeCuisine: recipe.country,
    prepTime: `PT${recipe.prepTimeMinutes}M`,
    cookTime: `PT${recipe.cookTimeMinutes}M`,
    totalTime: `PT${recipe.prepTimeMinutes + recipe.cookTimeMinutes}M`,
    recipeYield: `${Math.round(recipe.servings * servingMultiplier)} servings`,
    recipeCategory: recipe.dietary.join(', '),
    nutrition: {
      '@type': 'NutritionInformation',
      calories: `${recipe.nutrition.calories} calories`,
      proteinContent: `${recipe.nutrition.proteinGrams}g`,
      carbohydrateContent: `${recipe.nutrition.carbsGrams}g`,
      fatContent: `${recipe.nutrition.fatGrams}g`,
    },
    recipeIngredient: recipe.ingredients.map(
      (ing) => `${(ing.amount * servingMultiplier).toFixed(ing.amount * servingMultiplier % 1 === 0 ? 0 : 1)} ${ing.unit} ${ing.item}`
    ),
    recipeInstructions: recipe.instructions.map((ins) => ({
      '@type': 'HowToStep',
      name: ins.title,
      text: ins.text,
    })),
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      {/* Schema.org Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#E8DEC8] my-8 max-h-[92vh] flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0EAE1] bg-[#FAF7F2] shrink-0">
          <div className="flex items-center gap-2 text-xs text-[#7A6C5F]">
            <Globe className="w-3.5 h-3.5 text-[#9B2C2C]" />
            <span className="font-semibold text-[#9B2C2C]">{recipe.country}</span>
            <span aria-hidden="true">·</span>
            <span>{recipe.region}</span>
            <span aria-hidden="true">·</span>
            <span className="italic">{recipe.localName}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 text-[#7A6C5F] hover:text-[#241D17] hover:bg-[#F0EAE1] rounded-lg transition-colors text-xs flex items-center gap-1.5"
              title="Share Recipe Link"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">{copiedLink ? 'Link Copied!' : 'Share'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="p-2 text-[#7A6C5F] hover:text-[#241D17] hover:bg-[#F0EAE1] rounded-lg transition-colors text-xs flex items-center gap-1.5"
              title="Print Recipe"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-[#7A6C5F] hover:text-[#9B2C2C] hover:bg-[#FCE8E8] rounded-lg transition-colors ml-2"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-6 md:p-8 space-y-8">
          {/* Hero Split */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-7 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#82532B]">
                {recipe.dietary.map((d) => (
                  <span key={d} className="font-medium">
                    {d}
                  </span>
                ))}
              </div>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#241D17] tracking-tight">
                {recipe.name}
              </h1>
              <p className="text-base text-[#574B40] leading-relaxed">
                {recipe.description}
              </p>

              {/* Meta stats strip */}
              <div className="grid grid-cols-4 gap-2 pt-3 border-t border-[#F2ECE1] text-center">
                <div className="p-2 bg-[#FAF7F2] rounded-lg border border-[#EDE5D8]">
                  <span className="block text-[11px] text-[#8C7D6D] uppercase tracking-wider">Prep</span>
                  <span className="text-sm font-semibold text-[#241D17] tabular-nums">
                    {recipe.prepTimeMinutes}m
                  </span>
                </div>
                <div className="p-2 bg-[#FAF7F2] rounded-lg border border-[#EDE5D8]">
                  <span className="block text-[11px] text-[#8C7D6D] uppercase tracking-wider">Cook</span>
                  <span className="text-sm font-semibold text-[#241D17] tabular-nums">
                    {recipe.cookTimeMinutes}m
                  </span>
                </div>
                <div className="p-2 bg-[#FAF7F2] rounded-lg border border-[#EDE5D8]">
                  <span className="block text-[11px] text-[#8C7D6D] uppercase tracking-wider">Servings</span>
                  <span className="text-sm font-semibold text-[#241D17] tabular-nums">
                    {Math.round(recipe.servings * servingMultiplier)}
                  </span>
                </div>
                <div className="p-2 bg-[#FAF7F2] rounded-lg border border-[#EDE5D8]">
                  <span className="block text-[11px] text-[#8C7D6D] uppercase tracking-wider">Level</span>
                  <span className="text-xs font-semibold text-[#9B2C2C] truncate block">
                    {recipe.difficulty}
                  </span>
                </div>
              </div>
            </div>

            <div className="md:col-span-5">
              <div className="relative rounded-xl overflow-hidden aspect-[4/3] shadow-md border border-[#E8DEC8]">
                <img
                  src={recipe.image}
                  alt={recipe.imageAlt}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      '/images/hero_christmas_feast_1794320880047.jpg';
                  }}
                />
              </div>
            </div>
          </div>

          {/* Cultural Folklore / Christmas Lore Box */}
          <div className="p-5 bg-[#F9F5EE] border border-[#EADBCC] rounded-xl relative">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[#9B2C2C] shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#9B2C2C] mb-1">
                  Festive Heritage & Origins
                </h3>
                <p className="text-sm text-[#4E4237] leading-relaxed italic">
                  "{recipe.traditionLore}"
                </p>
              </div>
            </div>
          </div>

          {/* Active Kitchen Timer Widget (if running) */}
          {activeTimerSeconds !== null && (
            <div className="p-4 bg-[#241D17] text-white rounded-xl flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-[#EAB308] animate-pulse" />
                <div>
                  <div className="text-xs text-white/70">
                    Step {activeTimerStep} Cooking Timer
                  </div>
                  <div className="text-2xl font-mono font-bold tracking-wider text-[#FDE047]">
                    {formatTimer(activeTimerSeconds)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTimerRunning(!timerRunning)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                >
                  {timerRunning ? 'Pause' : 'Resume'}
                </button>
                <button
                  onClick={() => {
                    setActiveTimerSeconds(null);
                    setTimerRunning(false);
                  }}
                  className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10"
                  title="Dismiss timer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Ingredients & Prep Calculator Split */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-4 border-t border-[#F0EAE1]">
            {/* Left: Ingredients */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-serif font-bold text-[#241D17]">
                  Ingredients
                </h3>
                {/* Servings Adjuster */}
                <div className="flex items-center gap-1.5 bg-[#FAF7F2] border border-[#E4D9C5] p-1 rounded-lg">
                  <span className="text-[11px] text-[#7A6C5F] px-1 font-medium">Scale:</span>
                  {[0.5, 1, 1.5, 2].map((factor) => (
                    <button
                      key={factor}
                      onClick={() => setServingMultiplier(factor)}
                      className={`px-2 py-0.5 text-xs rounded transition-colors ${
                        servingMultiplier === factor
                          ? 'bg-[#9B2C2C] text-white font-semibold'
                          : 'text-[#665A4F] hover:bg-[#EDE5D8]'
                      }`}
                    >
                      {factor}x
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs text-[#7A6C5F]">
                Yields approx. {Math.round(recipe.servings * servingMultiplier)} servings
              </p>

              <ul className="divide-y divide-[#F2EDE4] border border-[#EADBCC] rounded-xl overflow-hidden bg-white">
                {recipe.ingredients.map((ing, idx) => {
                  const scaledAmount = ing.amount * servingMultiplier;
                  const displayAmount =
                    scaledAmount % 1 === 0 ? scaledAmount : scaledAmount.toFixed(1);
                  return (
                    <li
                      key={idx}
                      className="px-3.5 py-2.5 flex items-center justify-between text-sm hover:bg-[#FAF7F2] transition-colors"
                    >
                      <span className="text-[#332A22]">{ing.item}</span>
                      <span className="font-semibold text-[#9B2C2C] tabular-nums whitespace-nowrap ml-2">
                        {displayAmount} {ing.unit}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {/* Nutrition Estimation Strip */}
              <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#EDE5D8] text-xs space-y-2">
                <div className="flex items-center justify-between text-[#8C7D6D]">
                  <span className="font-medium uppercase tracking-wider text-[10px]">
                    Estimated Per Serving
                  </span>
                  <span className="font-bold text-[#241D17] tabular-nums">
                    {recipe.nutrition.calories} kcal
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-[#E8DFC8]">
                  <div>
                    <span className="text-[10px] text-[#8C7D6D] block">Protein</span>
                    <span className="font-semibold text-[#241D17] tabular-nums">
                      {recipe.nutrition.proteinGrams}g
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8C7D6D] block">Carbs</span>
                    <span className="font-semibold text-[#241D17] tabular-nums">
                      {recipe.nutrition.carbsGrams}g
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8C7D6D] block">Fat</span>
                    <span className="font-semibold text-[#241D17] tabular-nums">
                      {recipe.nutrition.fatGrams}g
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Step-by-Step Instructions */}
            <div className="md:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-serif font-bold text-[#241D17]">
                  Cooking Directions
                </h3>
                <span className="text-xs text-[#7A6C5F]">
                  {completedSteps.length} of {recipe.instructions.length} steps completed
                </span>
              </div>

              <div className="space-y-4">
                {recipe.instructions.map((ins) => {
                  const isDone = completedSteps.includes(ins.step);
                  return (
                    <div
                      key={ins.step}
                      className={`p-4 rounded-xl border transition-all ${
                        isDone
                          ? 'bg-[#F4EFEB] border-[#DDD3C5] opacity-75'
                          : 'bg-white border-[#E4D9C5] hover:border-[#CFBEA5]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleStep(ins.step)}
                          className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                            isDone
                              ? 'bg-[#2E7D32] text-white'
                              : 'border-2 border-[#BDB09E] text-transparent hover:border-[#9B2C2C]'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>

                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4
                              className={`text-sm font-bold ${
                                isDone ? 'line-through text-[#7A6C5F]' : 'text-[#241D17]'
                              }`}
                            >
                              {ins.step}. {ins.title}
                            </h4>

                            {ins.timerMinutes && (
                              <button
                                onClick={() => startTimer(ins.timerMinutes!, ins.step)}
                                className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-[#82532B] bg-[#F7F1E7] hover:bg-[#EADBCC] rounded transition-colors whitespace-nowrap shrink-0"
                              >
                                <Play className="w-3 h-3 fill-current" />
                                <span>{ins.timerMinutes}m Timer</span>
                              </button>
                            )}
                          </div>

                          <p
                            className={`text-sm mt-1.5 leading-relaxed ${
                              isDone ? 'text-[#8C7E72]' : 'text-[#4A3F34]'
                            }`}
                          >
                            {ins.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chef tips */}
              <div className="mt-6 p-4 bg-[#FAF7F2] rounded-xl border border-[#EDE5D8]">
                <div className="flex items-center gap-2 text-xs font-bold text-[#82532B] uppercase tracking-wider mb-2">
                  <ChefHat className="w-4 h-4 text-[#9B2C2C]" />
                  <span>Chef's Secrets to Authenticity</span>
                </div>
                <ul className="space-y-1.5 text-xs text-[#52463B]">
                  {recipe.chefTips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#9B2C2C] font-bold">·</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#F0EAE1] bg-[#FAF7F2] flex items-center justify-between shrink-0">
          <div className="text-xs text-[#7A6C5F]">
            Christmas Recipe Collection · Yuletide Table
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#9B2C2C] hover:bg-[#822424] rounded-lg transition-colors shadow-xs"
          >
            Back to Hub
          </button>
        </div>
      </div>
    </div>
  );
};
