import React, { useState } from 'react';
import { Recipe } from '../data/recipes';
import { MapPin, Compass, Clock, Utensils, Globe, ArrowRight } from 'lucide-react';

interface InteractiveMapProps {
  recipes: Recipe[];
  onSelectRecipe: (recipe: Recipe) => void;
  selectedRegion: string;
  onSelectRegion: (region: string) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  recipes,
  onSelectRecipe,
  selectedRegion,
  onSelectRegion,
}) => {
  const [hoveredRecipe, setHoveredRecipe] = useState<Recipe | null>(null);

  // Approximate Mercator projection mapping to SVG 1000x520 viewport
  const projectCoordinates = (lat: number, lng: number) => {
    const x = ((lng + 180) / 360) * 1000;
    // Simple projection clamp
    const latRad = (lat * Math.PI) / 180;
    const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
    const y = 260 - (mercN * 260) / 2.5;
    return {
      x: Math.max(20, Math.min(980, x)),
      y: Math.max(30, Math.min(490, y)),
    };
  };

  const filteredRecipes = selectedRegion === 'All'
    ? recipes
    : recipes.filter((r) => r.region === selectedRegion);

  const regions = [
    { label: 'All Regions', value: 'All' },
    { label: 'Europe', value: 'Europe' },
    { label: 'Australia & Oceania', value: 'Australia & Oceania' },
    { label: 'South America', value: 'South America' },
    { label: 'North America', value: 'North America' },
  ];

  return (
    <div className="bg-[#FAF7F2] border border-[#E8DEC8] rounded-2xl p-6 shadow-sm overflow-hidden">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E8DEC8]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#9B2C2C]">
            <Compass className="w-4 h-4" />
            <span>Geographic Yuletide Atlas</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-serif text-[#241D17] mt-1">
            Global Christmas Flavor Map
          </h2>
          <p className="text-sm text-[#665A4F] mt-1">
            Explore authentic Christmas feasts by region. Click any pin to open the full step-by-step recipe.
          </p>
        </div>

        {/* Region Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#F0E9DF] rounded-xl self-start md:self-auto">
          {regions.map((reg) => (
            <button
              key={reg.value}
              onClick={() => onSelectRegion(reg.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                selectedRegion === reg.value
                  ? 'bg-white text-[#9B2C2C] shadow-xs font-semibold'
                  : 'text-[#665A4F] hover:text-[#241D17]'
              }`}
            >
              {reg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map Canvas */}
      <div className="relative mt-6 w-full aspect-[16/8.8] bg-[#F3EDE2] rounded-xl overflow-hidden border border-[#E4D9C5]">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#8C7D6D 0.75px, transparent 0.75px)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Decorative Equator & Tropic lines */}
        <div className="absolute top-[50%] left-0 right-0 h-[1px] border-b border-dashed border-[#DACDB9] pointer-events-none" />
        <span className="absolute top-[51%] left-3 text-[10px] text-[#A69988] font-mono select-none">
          Equator 0°
        </span>
        <span className="absolute top-[28%] left-3 text-[10px] text-[#A69988] font-mono select-none">
          Tropic of Cancer 23.5° N
        </span>
        <span className="absolute top-[72%] left-3 text-[10px] text-[#A69988] font-mono select-none">
          Tropic of Capricorn 23.5° S
        </span>

        {/* SVG World Background (stylized vector continents) */}
        <svg
          viewBox="0 0 1000 520"
          className="w-full h-full object-cover select-none pointer-events-none"
        >
          {/* North America */}
          <path
            d="M 120 70 Q 180 50 260 70 Q 300 110 270 170 Q 230 200 210 260 Q 180 290 190 320 Q 160 300 140 240 Q 100 170 120 70 Z"
            fill="#E5DCB"
            className="fill-[#E6DDCE]"
          />
          {/* Greenland */}
          <path
            d="M 320 40 Q 360 30 380 60 Q 350 90 310 70 Z"
            fill="#E6DDCE"
          />
          {/* South America */}
          <path
            d="M 230 300 Q 320 310 330 370 Q 310 440 270 480 Q 250 490 230 440 Q 220 370 230 300 Z"
            fill="#E6DDCE"
          />
          {/* Europe */}
          <path
            d="M 450 110 Q 540 90 560 140 Q 520 190 470 190 Q 430 160 450 110 Z"
            fill="#E6DDCE"
          />
          {/* Africa */}
          <path
            d="M 470 200 Q 560 210 570 290 Q 530 400 480 390 Q 440 310 470 200 Z"
            fill="#E6DDCE"
          />
          {/* Asia */}
          <path
            d="M 570 90 Q 750 80 840 140 Q 860 220 790 260 Q 710 250 670 200 Q 570 190 570 90 Z"
            fill="#E6DDCE"
          />
          {/* Australia */}
          <path
            d="M 780 340 Q 890 330 880 410 Q 820 440 770 400 Q 750 360 780 340 Z"
            fill="#E6DDCE"
          />
          {/* New Zealand */}
          <path
            d="M 910 430 Q 930 420 925 450 Q 910 460 910 430 Z"
            fill="#E6DDCE"
          />
        </svg>

        {/* Recipe Pins */}
        <div className="absolute inset-0 pointer-events-auto">
          {filteredRecipes.map((recipe) => {
            const { x, y } = projectCoordinates(recipe.coordinates[0], recipe.coordinates[1]);
            const isHovered = hoveredRecipe?.id === recipe.id;

            return (
              <div
                key={recipe.id}
                style={{
                  left: `${(x / 1000) * 100}%`,
                  top: `${(y / 520) * 100}%`,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10"
                onMouseEnter={() => setHoveredRecipe(recipe)}
                onClick={() => onSelectRecipe(recipe)}
              >
                {/* Pin visual */}
                <div className="relative flex items-center justify-center">
                  <span className="absolute w-6 h-6 rounded-full bg-[#9B2C2C]/20 animate-ping" />
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-all duration-200 border-2 ${
                      isHovered
                        ? 'bg-[#9B2C2C] text-white scale-125 border-white shadow-lg'
                        : 'bg-white text-[#9B2C2C] border-[#9B2C2C] hover:scale-110'
                    }`}
                  >
                    <Utensils className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Country label tag on map */}
                <div className="absolute top-8 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#241D17]/85 text-white tracking-wide shadow-xs">
                    {recipe.country}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Hovered Recipe Card Overlay (Fixed positioned preview) */}
        {hoveredRecipe && (
          <div
            className="absolute bottom-4 left-4 right-4 md:right-auto md:w-96 bg-white/95 backdrop-blur-md border border-[#E8DEC8] p-4 rounded-xl shadow-xl z-30 transition-all animate-in fade-in zoom-in-95 duration-150"
            onMouseLeave={() => setHoveredRecipe(null)}
          >
            <div className="flex gap-3">
              <img
                src={hoveredRecipe.image}
                alt={hoveredRecipe.imageAlt}
                className="w-20 h-20 rounded-lg object-cover shrink-0 border border-[#EAE3D2]"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    '/src/assets/images/hero_christmas_feast_1794320880047.jpg';
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs text-[#82532B] font-medium">
                  <Globe className="w-3 h-3" />
                  <span>{hoveredRecipe.country}</span>
                  <span aria-hidden="true">·</span>
                  <span>{hoveredRecipe.region}</span>
                </div>
                <h4 className="text-base font-serif font-bold text-[#241D17] truncate mt-0.5">
                  {hoveredRecipe.name}
                </h4>
                <p className="text-xs text-[#665A4F] line-clamp-2 mt-1">
                  {hoveredRecipe.description}
                </p>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#F2ECE1]">
                  <div className="flex items-center gap-2 text-xs text-[#7A6C5F]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{hoveredRecipe.prepTimeMinutes + hoveredRecipe.cookTimeMinutes} mins</span>
                  </div>
                  <button
                    onClick={() => onSelectRecipe(hoveredRecipe)}
                    className="flex items-center gap-1 text-xs font-semibold text-[#9B2C2C] hover:text-[#7B1D1D] transition-colors"
                  >
                    <span>Read Recipe</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mini Regional Quick Jump Strip */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-2.5 bg-[#FAF4EB] rounded-lg border border-[#EDE3D2]">
          <span className="font-semibold text-[#241D17] block">Europe</span>
          <span className="text-[#7A6C5F] text-[11px]">Panettone, Stollen, Roast Goose</span>
        </div>
        <div className="p-2.5 bg-[#FAF4EB] rounded-lg border border-[#EDE3D2]">
          <span className="font-semibold text-[#241D17] block">Australia & Oceania</span>
          <span className="text-[#7A6C5F] text-[11px]">Summer Pavlova, King Prawns</span>
        </div>
        <div className="p-2.5 bg-[#FAF4EB] rounded-lg border border-[#EDE3D2]">
          <span className="font-semibold text-[#241D17] block">South America</span>
          <span className="text-[#7A6C5F] text-[11px]">Pan de Jamón, Buñuelos, Vitel Toné</span>
        </div>
        <div className="p-2.5 bg-[#FAF4EB] rounded-lg border border-[#EDE3D2]">
          <span className="font-semibold text-[#241D17] block">North America</span>
          <span className="text-[#7A6C5F] text-[11px]">Quebec Tourtière, Tamales de Mole</span>
        </div>
      </div>
    </div>
  );
};
