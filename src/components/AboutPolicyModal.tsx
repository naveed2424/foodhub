import React, { useState } from 'react';
import { X, ShieldCheck, Mail, Send, Award, FileText, CheckCircle2 } from 'lucide-react';

interface AboutPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'about' | 'privacy' | 'editorial' | 'contact';
}

export const AboutPolicyModal: React.FC<AboutPolicyModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'about',
}) => {
  if (!isOpen) return null;

  const [tab, setTab] = useState<'about' | 'privacy' | 'editorial' | 'contact'>(initialTab);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          subject: 'Policy / Editorial Modal Inquiry',
          message: contactMessage,
        }),
      });
    } catch (_) {}
    setSubmitted(true);
    setTimeout(() => {
      setContactName('');
      setContactEmail('');
      setContactMessage('');
      setSubmitted(false);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#E8DEC8] my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0EAE1] bg-[#FAF7F2] shrink-0">
          <div className="flex items-center gap-1 p-1 bg-[#EFE8DD] rounded-lg">
            <button
              onClick={() => setTab('about')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                tab === 'about'
                  ? 'bg-white text-[#9B2C2C] shadow-xs font-semibold'
                  : 'text-[#665A4F] hover:text-[#241D17]'
              }`}
            >
              About Us
            </button>
            <button
              onClick={() => setTab('editorial')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                tab === 'editorial'
                  ? 'bg-white text-[#9B2C2C] shadow-xs font-semibold'
                  : 'text-[#665A4F] hover:text-[#241D17]'
              }`}
            >
              Editorial & AdSense Policy
            </button>
            <button
              onClick={() => setTab('privacy')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                tab === 'privacy'
                  ? 'bg-white text-[#9B2C2C] shadow-xs font-semibold'
                  : 'text-[#665A4F] hover:text-[#241D17]'
              }`}
            >
              Privacy & Cookies
            </button>
            <button
              onClick={() => setTab('contact')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                tab === 'contact'
                  ? 'bg-white text-[#9B2C2C] shadow-xs font-semibold'
                  : 'text-[#665A4F] hover:text-[#241D17]'
              }`}
            >
              Contact Desk
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#7A6C5F] hover:text-[#241D17] rounded-lg transition-colors ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-6 md:p-8 space-y-6 text-sm text-[#473B30] leading-relaxed">
          {tab === 'about' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-[#241D17]">
                About Naveed’s Table: The Global Culinary Heritage Hub
              </h2>
              <p>
                Naveed’s Table is a dedicated cultural archive and culinary journalism magazine celebrating the vast diversity of holiday food traditions around the world. While classic media often narrows festive food to a single regional menu, our mission is to illuminate how families across Europe, Australia & Oceania, South America, North America, and Asia & Africa gather around unique, deeply personal holiday feasts.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#EDE5D8]">
                  <h4 className="font-bold text-[#241D17] mb-1">Authentic Test Kitchen</h4>
                  <p className="text-xs text-[#665A4F]">
                    Every recipe in our archive is tested and calibrated for home cooks, complete with serving size adjusters and timing guides.
                  </p>
                </div>
                <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#EDE5D8]">
                  <h4 className="font-bold text-[#241D17] mb-1">Cultural Folklore</h4>
                  <p className="text-xs text-[#665A4F]">
                    We document the oral histories, medieval origins, and religious folklore behind dishes from the Réveillon to Las Novenas.
                  </p>
                </div>
                <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#EDE5D8]">
                  <h4 className="font-bold text-[#241D17] mb-1">Daily Culinary Reporting</h4>
                  <p className="text-xs text-[#665A4F]">
                    Our editorial desk tracks global agricultural commodity shifts, seasonal food culture, and sustainable holiday cooking practices.
                  </p>
                </div>
              </div>
            </div>
          )}

          {tab === 'editorial' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-[#241D17]">
                Editorial Integrity & Advertising Transparency
              </h2>
              <p>
                Naveed’s Table adheres to strict journalistic codes of conduct, ensuring all published news, market analyses, and cultural dispatches are fact-based and rigorously referenced.
              </p>

              <div className="space-y-3 pt-2">
                <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#EDE5D8] space-y-1">
                  <h3 className="font-bold text-[#241D17] text-sm">
                    1. Clear Separation Between Ads &amp; Editorial Content
                  </h3>
                  <p className="text-xs text-[#665A4F]">
                    Advertising placements never mimic editorial content, navigation controls, or recipe action buttons, and are clearly separated from culinary instructions.
                  </p>
                </div>

                <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#EDE5D8] space-y-1">
                  <h3 className="font-bold text-[#241D17] text-sm">
                    2. Fact-Checking &amp; Primary Sources
                  </h3>
                  <p className="text-xs text-[#665A4F]">
                    Our reports cite reputable international authorities including the Food and Agriculture Organization (FAO), International Cocoa Organization (ICCO), and national culinary heritage institutes.
                  </p>
                </div>

                <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#EDE5D8] space-y-1">
                  <h3 className="font-bold text-[#241D17] text-sm">
                    3. Corrections &amp; Allergen Responsibility
                  </h3>
                  <p className="text-xs text-[#665A4F]">
                    Every recipe is reviewed for clarity, probe temperatures, and allergen notes. Readers can request updates or report errors anytime via afzal460@gmail.com.
                  </p>
                </div>
              </div>
            </div>
          )}

          {tab === 'privacy' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-[#241D17]">
                Privacy Policy & Cookie Consent
              </h2>
              <p className="text-xs text-[#665A4F]">
                Effective Date: November 2026. Last updated for global GDPR & CCPA compliance.
              </p>

              <div className="space-y-2 text-xs">
                <p>
                  <strong>1. Data Collection:</strong> Naveed’s Table values your privacy. We do not sell or trade your personal information. Any data submitted via our contact forms is used solely to respond to your editorial inquiries.
                </p>
                <p>
                  <strong>2. Cookies & Advertising:</strong> Third-party vendors, including Google, use cookies to serve ads based on prior visits to our website. Google's use of advertising cookies enables it and its partners to serve ads based on your visit to our site and/or other sites on the Internet.
                </p>
                <p>
                  <strong>3. Opting Out:</strong> Users may opt out of personalized advertising by visiting Google Ads Settings (www.aboutads.info).
                </p>
              </div>
            </div>
          )}

          {tab === 'contact' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-[#241D17]">
                Contact the Naveed’s Table Editorial Desk
              </h2>
              <p className="text-xs text-[#665A4F]">
                Founded by Naveed · Based in France 🇫🇷 · Direct Email: <a href="mailto:afzal460@gmail.com" className="text-[#9B2C2C] underline font-semibold">afzal460@gmail.com</a>
              </p>
              <p className="text-xs text-[#665A4F]">
                Have a traditional family recipe from your country that should be represented in our archive? Or feedback on our market news? Send us a message below.
              </p>

              {submitted ? (
                <div className="p-4 bg-[#F2F8F2] border border-[#CDE5CD] rounded-xl flex items-center gap-3 text-xs text-[#1E4620]">
                  <CheckCircle2 className="w-5 h-5 text-[#2E7D32]" />
                  <span>
                    Thank you! Your submission has been received by our culinary research team.
                  </span>
                </div>
              ) : (
                <form onSubmit={handleSubmitContact} className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#665A4F] mb-1">
                        Your Name
                      </label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="e.g. Maria Rossi"
                        className="w-full text-xs p-2.5 bg-[#FAF7F2] border border-[#E4D9C5] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#9B2C2C]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#665A4F] mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="you@domain.com"
                        className="w-full text-xs p-2.5 bg-[#FAF7F2] border border-[#E4D9C5] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#9B2C2C]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#665A4F] mb-1">
                      Message / Heritage Recipe Suggestion
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Share your region, recipe name, or news inquiry..."
                      className="w-full text-xs p-2.5 bg-[#FAF7F2] border border-[#E4D9C5] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#9B2C2C]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#9B2C2C] hover:bg-[#822424] rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Message to Editors</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#F0EAE1] bg-[#FAF7F2] flex items-center justify-between shrink-0">
          <div className="text-xs text-[#7A6C5F]">
            Naveed’s Table · Global Culinary Culture & Gastronomy
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-[#241D17] hover:bg-black rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
