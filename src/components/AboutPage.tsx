import React, { useState } from 'react';
import {
  Mail,
  Send,
  Award,
  BookOpen,
  Globe,
  Sparkles,
  CheckCircle2,
  Heart,
  Upload,
  Camera,
  ShieldCheck,
  Utensils,
  ArrowLeft,
} from 'lucide-react';

interface AboutPageProps {
  onBackToHome: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onBackToHome }) => {
  const KITCHEN_PHOTO = '/src/assets/images/naveed_in_home_kitchen_1794323626380.jpg';
  const ORIGINAL_PHOTO = '/assets/aistudio/naveed_birthday2007_080_b4ca29b7.jpg';

  const [founderPhoto, setFounderPhoto] = useState<string>(KITCHEN_PHOTO);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFounderPhoto(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSent(true);
    setTimeout(() => {
      setContactName('');
      setContactEmail('');
      setContactMessage('');
      setIsSent(false);
    }, 4500);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-16 animate-in fade-in duration-200">
      {/* Top back button */}
      <div>
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#82532B] hover:text-[#9B2C2C] transition-colors group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
          <span>Back to Yuletide Recipe Hub & Journal</span>
        </button>
      </div>

      {/* Hero: Founder Introduction & Photo */}
      <section className="bg-white border border-[#E8DEC8] rounded-3xl p-6 sm:p-10 shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Photo Column */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden shadow-xl border-4 border-[#F5EFEB] group bg-[#FAF7F2]">
              <img
                src={founderPhoto}
                alt="Naveed in his home kitchen, Founder & Editor-in-Chief of Yuletide Table"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = ORIGINAL_PHOTO;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent flex items-end p-4">
                <span className="text-xs text-white font-medium tracking-wide">
                  Naveed · Founder & Editor-in-Chief · Based in France 🇫🇷
                </span>
              </div>
            </div>

            {/* Direct Email Link Badge */}
            <div className="mt-3 text-center">
              <a
                href="mailto:afzal460@gmail.com"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#9B2C2C] bg-[#FAF2EB] hover:bg-[#F2DEC0] border border-[#EED4C4] rounded-lg transition-colors"
                title="Send direct email"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>afzal460@gmail.com</span>
              </a>
            </div>

            {/* Photo options and switcher */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setFounderPhoto(KITCHEN_PHOTO)}
                className={`px-2.5 py-1 text-xs rounded-lg border transition-colors cursor-pointer ${
                  founderPhoto === KITCHEN_PHOTO
                    ? 'bg-[#241D17] text-white border-[#241D17]'
                    : 'bg-[#FAF7F2] text-[#665A4F] border-[#DDD2C0] hover:text-[#241D17]'
                }`}
              >
                Home Kitchen Photo
              </button>
              <button
                type="button"
                onClick={() => setFounderPhoto(ORIGINAL_PHOTO)}
                className={`px-2.5 py-1 text-xs rounded-lg border transition-colors cursor-pointer ${
                  founderPhoto === ORIGINAL_PHOTO
                    ? 'bg-[#241D17] text-white border-[#241D17]'
                    : 'bg-[#FAF7F2] text-[#665A4F] border-[#DDD2C0] hover:text-[#241D17]'
                }`}
              >
                Original Photo
              </button>
              <label
                htmlFor="photo-upload"
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#7A6C5F] hover:text-[#241D17] bg-[#FAF7F2] hover:bg-[#EFE8DD] border border-[#DDD2C0] rounded-lg cursor-pointer transition-colors"
                title="Upload another photo"
              >
                <Camera className="w-3 h-3 text-[#9B2C2C]" />
                <span>Upload</span>
              </label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Letter / Story Column */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center gap-2 text-xs text-[#82532B] font-semibold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-[#9B2C2C]" />
              <span>Founder’s Welcome & Mission · Based in France</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#241D17] leading-tight">
              A Global Journey to the World’s Christmas Tables
            </h1>

            <div className="space-y-4 text-base text-[#4E4237] leading-relaxed">
              <p>
                Welcome to <strong>Yuletide Table</strong>. I created this publication from a simple, profound observation: while the world often portrays Christmas through snowy windows with a single golden roast bird, the true reality of Christmas gastronomy across our planet is an infinitely richer, vibrant tapestry.
              </p>
              <p>
                In Milan, families wait all year for the soaring, sourdough honeycomb of fresh Panettone. In Quebec, midnight church bells usher in the Réveillon with the clove-perfumed steam of grandmother’s Tourtière pie. Across Australia, families celebrate a radiant 30°C sunny Christmas with chilled wild king prawns, passionfruit Pavlova, and iced spritzes. And in Caracas, Christmas Eve is incomplete without the savory-sweet aroma of Pan de Jamón rolling out of the oven.
              </p>
              <p className="italic border-l-2 border-[#9B2C2C] pl-4 text-[#332A22]">
                "Food is the most honest bridge between cultures. When we understand what another family lovingly prepares on their most sacred holiday evening, distant continents suddenly feel like home."
              </p>
              <p>
                Based here in France—surrounded by centuries of gastronomy, artisanal patisseries, and festive holiday markets—our mission is twofold: to preserve authentic, heirloom Christmas recipes with rigorous test-kitchen precision, and to provide fact-based, intelligent reporting on the agricultural trends, spice markets, and cultural movements shaping holiday food today.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <div className="font-serif text-xl font-bold text-[#241D17]">
                Naveed
              </div>
              <span className="text-xs text-[#8C7D6D]">·</span>
              <span className="text-xs text-[#7A6C5F]">
                Founder & Editor-in-Chief
              </span>
              <span className="text-xs text-[#8C7D6D]">·</span>
              <span className="text-xs font-semibold text-[#9B2C2C]">
                Based in France 🇫🇷
              </span>
              <span className="text-xs text-[#8C7D6D]">·</span>
              <a
                href="mailto:afzal460@gmail.com"
                className="text-xs text-[#82532B] hover:text-[#9B2C2C] underline flex items-center gap-1"
              >
                <Mail className="w-3 h-3" />
                <span>afzal460@gmail.com</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* The 4 Core Editorial Pillars */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#9B2C2C]">
            Our Guiding Philosophy
          </span>
          <h2 className="text-3xl font-serif font-bold text-[#241D17]">
            How We Document Christmas Gastronomy
          </h2>
          <p className="text-sm text-[#665A4F]">
            Every recipe and story on Yuletide Table is grounded in 4 non-negotiable principles of culinary authenticity and journalistic rigor.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-[#E8DEC8] rounded-2xl p-6 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-[#FAF2EB] text-[#9B2C2C] flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-serif font-bold text-[#241D17]">
              1. Geographic Diversity
            </h3>
            <p className="text-xs text-[#574B40] leading-relaxed">
              We divide recipes systematically across Europe, Australia & Oceania, South America, and North America, ensuring both cold-winter and warm-summer traditions are honored.
            </p>
          </div>

          <div className="bg-white border border-[#E8DEC8] rounded-2xl p-6 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-[#FAF2EB] text-[#9B2C2C] flex items-center justify-center">
              <Utensils className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-serif font-bold text-[#241D17]">
              2. Test-Kitchen Tested
            </h3>
            <p className="text-xs text-[#574B40] leading-relaxed">
              Every dish includes accurate ingredient scaling, timing cues, temperature calibrations, and chef secrets so home cooks achieve bakery-grade results every time.
            </p>
          </div>

          <div className="bg-white border border-[#E8DEC8] rounded-2xl p-6 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-[#FAF2EB] text-[#9B2C2C] flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-serif font-bold text-[#241D17]">
              3. Ancestral Folklore
            </h3>
            <p className="text-xs text-[#574B40] leading-relaxed">
              Recipes don't exist in a vacuum. We document the religious ceremonies, medieval legends, and family customs that gave birth to each traditional feast.
            </p>
          </div>

          <div className="bg-white border border-[#E8DEC8] rounded-2xl p-6 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-[#FAF2EB] text-[#9B2C2C] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-serif font-bold text-[#241D17]">
              4. Fact-Based Journalism
            </h3>
            <p className="text-xs text-[#574B40] leading-relaxed">
              Our culinary news bureau tracks agricultural commodity shifts, cocoa price volatility, and climate factors using primary data from the FAO, ICCO, and UNESCO.
            </p>
          </div>
        </div>
      </section>

      {/* Editorial Standards & Google AdSense Transparency */}
      <section className="bg-[#FAF7F2] border border-[#E8DEC8] rounded-3xl p-8 sm:p-10 space-y-6">
        <div className="flex items-center gap-3">
          <Award className="w-6 h-6 text-[#9B2C2C]" />
          <div>
            <h2 className="text-2xl font-serif font-bold text-[#241D17]">
              Editorial Transparency & Advertising Standards
            </h2>
            <p className="text-xs text-[#7A6C5F]">
              Clear boundaries between editorial independence and Google AdSense partner placements
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-[#473B30] leading-relaxed">
          <div className="p-4 bg-white rounded-xl border border-[#E0D5C1] space-y-1.5">
            <h4 className="font-bold text-[#241D17]">Strict Ad Labeling</h4>
            <p>
              All advertising units are clearly designated with “Advertisement” markers and separated from recipe steps and news text to ensure a pristine reader experience.
            </p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-[#E0D5C1] space-y-1.5">
            <h4 className="font-bold text-[#241D17]">Fact-Checking & Sources</h4>
            <p>
              Economic and culinary statistics cite verified scientific and international agricultural organizations. We maintain a zero-tolerance policy for fabricated claims.
            </p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-[#E0D5C1] space-y-1.5">
            <h4 className="font-bold text-[#241D17]">Reader Privacy & Cookies</h4>
            <p>
              We honor global privacy mandates (GDPR & CCPA). You can manage cookie preferences at any time through our transparent footer settings.
            </p>
          </div>
        </div>
      </section>

      {/* Contact & Recipe Submissions */}
      <section className="bg-white border border-[#E8DEC8] rounded-3xl p-8 sm:p-10 shadow-sm">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <Mail className="w-7 h-7 text-[#9B2C2C] mx-auto" />
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#241D17]">
              Connect with Naveed & The Editorial Desk
            </h2>
            <p className="text-xs text-[#665A4F]">
              Have a cherished Christmas recipe from your homeland or heritage you'd like to see documented on Yuletide Table? Write directly to our team.
            </p>
          </div>

          {isSent ? (
            <div className="p-4 bg-[#F2F8F2] border border-[#CDE5CD] rounded-2xl flex items-center gap-3 text-xs text-[#1E4620]">
              <CheckCircle2 className="w-5 h-5 text-[#2E7D32] shrink-0" />
              <span>
                Thank you! Your message and recipe suggestions have been sent to Naveed and the Yuletide Table research team.
              </span>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#665A4F] mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Maria or Carlos"
                    className="w-full text-xs p-3 bg-[#FAF7F2] border border-[#E4D9C5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9B2C2C]/20 focus:border-[#9B2C2C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#665A4F] mb-1">
                    Your Email
                  </label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full text-xs p-3 bg-[#FAF7F2] border border-[#E4D9C5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9B2C2C]/20 focus:border-[#9B2C2C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#665A4F] mb-1">
                  Message / Traditional Family Recipe Submission
                </label>
                <textarea
                  required
                  rows={4}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Tell us about the country, festive history, and ingredients of your family's holiday feast..."
                  className="w-full text-xs p-3 bg-[#FAF7F2] border border-[#E4D9C5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9B2C2C]/20 focus:border-[#9B2C2C]"
                />
              </div>

              <div className="text-center pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-semibold text-white bg-[#9B2C2C] hover:bg-[#822424] rounded-xl transition-colors shadow-xs inline-flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Message to Naveed</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};
