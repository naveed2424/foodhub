import React, { useState } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  FileText,
  Scale,
  AlertTriangle,
  Mail,
  Send,
  CheckCircle2,
  BookOpen,
  Cookie,
} from 'lucide-react';

export type LegalSection = 'privacy' | 'terms' | 'disclaimer' | 'editorial-policy' | 'contact';

interface LegalPagesProps {
  section: LegalSection;
  onSelectSection: (section: LegalSection) => void;
  onBackToHome: () => void;
  onOpenCookieSettings?: () => void;
}

export const LegalPages: React.FC<LegalPagesProps> = ({
  section,
  onSelectSection,
  onBackToHome,
  onOpenCookieSettings,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Editorial & Recipe Inquiry');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorDetail, setErrorDetail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitStatus('idle');
    setErrorDetail('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not deliver message right now.');
      }
      setSubmitStatus('success');
      setName('');
      setEmail('');
      setMessage('');
    } catch (err: any) {
      setSubmitStatus('error');
      setErrorDetail(err?.message || 'Unable to submit form. You can email afzal460@gmail.com directly.');
    } finally {
      setSubmitting(false);
    }
  };

  const navItems: { id: LegalSection; label: string; href: string }[] = [
    { id: 'privacy', label: 'Privacy & Cookie Policy', href: '/privacy' },
    { id: 'terms', label: 'Terms of Service', href: '/terms' },
    { id: 'disclaimer', label: 'Culinary & Ad Disclaimer', href: '/disclaimer' },
    { id: 'editorial-policy', label: 'Editorial Standards', href: '/editorial-policy' },
    { id: 'contact', label: 'Contact Editorial Desk', href: '/contact' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10 animate-in fade-in duration-200">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E8DEC8] pb-4">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onBackToHome();
          }}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#82532B] hover:text-[#9B2C2C] transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Recipes &amp; Journal</span>
        </a>

        <nav aria-label="Compliance and policy pages" className="flex flex-wrap items-center gap-1.5">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                onSelectSection(item.id);
              }}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                section === item.id
                  ? 'bg-[#241D17] text-white font-semibold'
                  : 'bg-white border border-[#E0D5C1] text-[#5A4D40] hover:text-[#241D17] hover:bg-[#F5EFE6]'
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>

      <article className="bg-white border border-[#E8DEC8] rounded-3xl p-6 sm:p-10 md:p-12 shadow-sm space-y-8 text-[#3A3027] leading-relaxed">
        {section === 'privacy' && (
          <div className="max-w-3xl space-y-6">
            <header className="space-y-2 border-b border-[#EFE8DD] pb-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#9B2C2C]">
                <ShieldCheck className="w-4 h-4" />
                <span>GDPR · CCPA · Google AdSense Compliance</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#241D17] text-balance">
                Privacy Policy &amp; Cookie Disclosure
              </h1>
              <p className="text-xs text-[#7A6C5F]">
                Effective Date: November 27, 2026 · Published by Naveed’s Table (France)
              </p>
            </header>

            <section className="space-y-2 text-sm">
              <h2 className="text-xl font-serif font-bold text-[#241D17]">
                1. Publisher &amp; Data Controller
              </h2>
              <p>
                Naveed’s Table (“we,” “our,” or “the Publication”) operates an international culinary archive and food journalism website based in France. For privacy inquiries, data access requests, or deletion requests, please contact our editorial desk directly at{' '}
                <a href="mailto:afzal460@gmail.com" className="text-[#9B2C2C] underline font-semibold">
                  afzal460@gmail.com
                </a>
                .
              </p>
            </section>

            <section className="space-y-2 text-sm">
              <h2 className="text-xl font-serif font-bold text-[#241D17]">
                2. Information We Collect &amp; How We Use It
              </h2>
              <p>
                We collect only minimal personal information necessary to operate our publication responsibly:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-[#4E4237]">
                <li>
                  <strong>Contact &amp; Recipe Submissions:</strong> Name, email address, and message text voluntarily submitted via our Contact Desk are used solely to reply to your inquiry or review reader-submitted family recipes.
                </li>
                <li>
                  <strong>Community Reviews &amp; Comments:</strong> Display name, optional city/country, star rating, and comment text posted publicly by you on the Reviews page.
                </li>
                <li>
                  <strong>Local Preferences:</strong> Essential browser storage preserves your chosen display language (such as English, French, Korean, or Arabic) and your cookie consent choice so banners do not interrupt every page load.
                </li>
                <li>
                  <strong>Server Access Logs:</strong> Standard HTTP server logs (IP address, browser type, requested URL, and timestamp) maintained strictly for security, spam mitigation, and uptime reliability.
                </li>
              </ul>
            </section>

            <section className="space-y-2 text-sm">
              <h2 className="text-xl font-serif font-bold text-[#241D17]">
                3. Google AdSense &amp; Third-Party Advertising Cookies
              </h2>
              <p>
                Naveed’s Table partners with Google AdSense and authorized advertising networks to fund free global culinary journalism and test-kitchen research.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-[#4E4237]">
                <li>
                  Third-party vendors, including Google, use cookies to serve ads based on a visitor’s prior visits to Naveed’s Table or other websites across the Internet.
                </li>
                <li>
                  Google’s use of advertising cookies (including the DoubleClick DART cookie) enables it and its partners to serve ads to users based on their visit to our pages and/or other sites on the Internet.
                </li>
                <li>
                  <strong>Personalized Ad Opt-Out:</strong> You may opt out of personalized advertising at any time by visiting{' '}
                  <a
                    href="https://adssettings.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#9B2C2C] underline font-medium"
                  >
                    Google Ads Settings
                  </a>{' '}
                  or opt out of third-party vendor cookies via{' '}
                  <a
                    href="https://www.aboutads.info/choices/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#9B2C2C] underline font-medium"
                  >
                    www.aboutads.info
                  </a>
                  .
                </li>
              </ul>
            </section>

            <section className="space-y-2 text-sm">
              <h2 className="text-xl font-serif font-bold text-[#241D17]">
                4. GDPR (European Union / UK) &amp; CCPA (California) Rights
              </h2>
              <p>
                If you reside in the European Economic Area (EEA), the United Kingdom, or California, you hold explicit rights to access, rectify, export, restrict, or delete personal data we hold about you, as well as to withdraw non-essential cookie consent at any moment. We never sell personal data to data brokers.
              </p>
              {onOpenCookieSettings && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onOpenCookieSettings}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#241D17] bg-[#FAF7F2] hover:bg-[#EFE8DD] border border-[#DDD2C0] rounded-lg transition-colors cursor-pointer"
                  >
                    <Cookie className="w-3.5 h-3.5 text-[#9B2C2C]" />
                    <span>Update Cookie Consent Preferences</span>
                  </button>
                </div>
              )}
            </section>

            <section className="space-y-2 text-sm">
              <h2 className="text-xl font-serif font-bold text-[#241D17]">
                5. Children’s Privacy (COPPA)
              </h2>
              <p>
                Naveed’s Table does not knowingly collect personally identifiable information from children under 13 years of age (or under 16 in applicable EEA jurisdictions). If a parent or guardian believes a child has submitted personal data through a comment or form, email{' '}
                <a href="mailto:afzal460@gmail.com" className="text-[#9B2C2C] underline">
                  afzal460@gmail.com
                </a>{' '}
                and we will promptly erase the record.
              </p>
            </section>
          </div>
        )}

        {section === 'terms' && (
          <div className="max-w-3xl space-y-6">
            <header className="space-y-2 border-b border-[#EFE8DD] pb-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#9B2C2C]">
                <Scale className="w-4 h-4" />
                <span>Reader Agreement &amp; Publishing Terms</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#241D17] text-balance">
                Terms of Service
              </h1>
              <p className="text-xs text-[#7A6C5F]">
                Effective Date: November 27, 2026 · Naveed’s Table Global Culinary Journal
              </p>
            </header>

            <section className="space-y-2 text-sm">
              <h2 className="text-xl font-serif font-bold text-[#241D17]">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing, reading, printing recipes from, or submitting comments on Naveed’s Table, you agree to comply with these Terms of Service and all applicable local and international laws.
              </p>
            </section>

            <section className="space-y-2 text-sm">
              <h2 className="text-xl font-serif font-bold text-[#241D17]">
                2. Intellectual Property &amp; Personal Kitchen Use
              </h2>
              <p>
                All original articles, historical research, recipe instructions, photography, interactive map curation, and editorial layouts published on Naveed’s Table are protected by international copyright laws. Home cooks are warmly granted permission to print recipes via our printer-friendly button for personal, non-commercial household cooking. Automated scraping, bulk republishing, or commercial redistribution without written consent is prohibited.
              </p>
            </section>

            <section className="space-y-2 text-sm">
              <h2 className="text-xl font-serif font-bold text-[#241D17]">
                3. Community Reviews &amp; Conduct
              </h2>
              <p>
                Readers posting dish reviews and kitchen tips agree to remain respectful, truthful, and constructive. We reserve the right to moderate or remove spam links, promotional solicitations, abusive language, or off-topic submissions.
              </p>
            </section>

            <section className="space-y-2 text-sm">
              <h2 className="text-xl font-serif font-bold text-[#241D17]">
                4. External Authoritative Links
              </h2>
              <p>
                Our articles cite third-party cultural archives, agricultural institutions (such as FAO, ICCO, and UNESCO), and culinary references. We do not control and are not responsible for external site availability or third-party content updates.
              </p>
            </section>
          </div>
        )}

        {section === 'disclaimer' && (
          <div className="max-w-3xl space-y-6">
            <header className="space-y-2 border-b border-[#EFE8DD] pb-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#9B2C2C]">
                <AlertTriangle className="w-4 h-4" />
                <span>Food Safety, Nutrition &amp; Advertising Disclosure</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#241D17] text-balance">
                Culinary, Nutritional &amp; Advertising Disclaimer
              </h1>
              <p className="text-xs text-[#7A6C5F]">
                Last Updated: November 27, 2026
              </p>
            </header>

            <section className="space-y-2 text-sm">
              <h2 className="text-xl font-serif font-bold text-[#241D17]">
                1. Nutritional Estimates &amp; Dietary Labels
              </h2>
              <p>
                Calorie, protein, carbohydrate, and fat figures provided inside Naveed’s Table recipe cards are calculated estimates offered solely for general informational convenience. Actual nutritional values vary depending on specific ingredient brands, regional produce varieties, moisture loss during cooking, and portion scaling.
              </p>
            </section>

            <section className="space-y-2 text-sm">
              <h2 className="text-xl font-serif font-bold text-[#241D17]">
                2. Celiac, Gluten-Free &amp; Allergen Safety
              </h2>
              <p>
                While many featured dishes are prepared using naturally gluten-free, nut-free, or dairy-free heritage ingredients, readers with severe food allergies or celiac disease must always inspect manufacturer ingredient labels, verify certified gluten-free seals (for example on oats, spice blends, rice flour, and vinegar), and guard against kitchen cross-contamination. Nothing on this site constitutes medical or clinical dietetic advice.
              </p>
            </section>

            <section className="space-y-2 text-sm">
              <h2 className="text-xl font-serif font-bold text-[#241D17]">
                3. Food Temperature &amp; Safe Handling
              </h2>
              <p>
                Always follow safe internal cooking temperatures verified with a calibrated food thermometer when preparing poultry, pork, beef, salt fish, shellfish, or egg-based sauces.
              </p>
            </section>

            <section className="space-y-2 text-sm">
              <h2 className="text-xl font-serif font-bold text-[#241D17]">
                4. Advertising &amp; Editorial Independence
              </h2>
              <p>
                Advertising placements displayed via Google AdSense are strictly separated from recipes, ingredient choices, and editorial conclusions. Advertisers never influence which global dishes, cultural histories, or culinary findings appear on Naveed’s Table.
              </p>
            </section>
          </div>
        )}

        {section === 'editorial-policy' && (
          <div className="max-w-3xl space-y-6">
            <header className="space-y-2 border-b border-[#EFE8DD] pb-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#9B2C2C]">
                <BookOpen className="w-4 h-4" />
                <span>Journalistic Rigor &amp; Test-Kitchen Methodology</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#241D17] text-balance">
                Editorial Guidelines &amp; Fact-Checking Policy
              </h1>
              <p className="text-xs text-[#7A6C5F]">
                Naveed’s Table Global Editorial Bureau · France
              </p>
            </header>

            <section className="space-y-2 text-sm">
              <h2 className="text-xl font-serif font-bold text-[#241D17]">
                1. Cultural Authenticity &amp; Source Attribution
              </h2>
              <p>
                Every historical article and regional feast guide published on Naveed’s Table cross-references national culinary archives, UNESCO cultural heritage registries, FAO agricultural reports, and regional food historians. We credit traditional dish origins accurately by country, festival calendar, and local terminology.
              </p>
            </section>

            <section className="space-y-2 text-sm">
              <h2 className="text-xl font-serif font-bold text-[#241D17]">
                2. Precision Kitchen Testing
              </h2>
              <p>
                Recipes undergo thorough proportion verification—including hydration ratios, oven probe temperatures, spice-grinding guidance, and realistic preparation timelines—so cooks across Europe, the Americas, Asia, Africa, and Oceania achieve consistent results.
              </p>
            </section>

            <section className="space-y-2 text-sm">
              <h2 className="text-xl font-serif font-bold text-[#241D17]">
                3. Corrections &amp; Updates Policy
              </h2>
              <p>
                If a reader spots a regional spelling nuance, ingredient availability update, or factual question, our editorial team investigates promptly and updates articles transparently. Send correction requests anytime to{' '}
                <a href="mailto:afzal460@gmail.com" className="text-[#9B2C2C] underline font-semibold">
                  afzal460@gmail.com
                </a>
                .
              </p>
            </section>
          </div>
        )}

        {section === 'contact' && (
          <div className="max-w-2xl space-y-6">
            <header className="space-y-2 border-b border-[#EFE8DD] pb-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#9B2C2C]">
                <Mail className="w-4 h-4" />
                <span>Direct Editorial Correspondence</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#241D17] text-balance">
                Contact Naveed’s Table
              </h1>
              <p className="text-sm text-[#5A4D40]">
                Founded by Naveed · Based in France · Direct Editorial Email:{' '}
                <a href="mailto:afzal460@gmail.com" className="text-[#9B2C2C] underline font-semibold">
                  afzal460@gmail.com
                </a>
              </p>
            </header>

            {submitStatus === 'success' ? (
              <div className="p-5 bg-[#F2F8F2] border border-[#CDE5CD] rounded-2xl flex items-start gap-3 text-sm text-[#1E4620]">
                <CheckCircle2 className="w-5 h-5 text-[#2E7D32] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Message Received</p>
                  <p className="text-xs mt-1">
                    Thank you for writing to Naveed’s Table. Our editorial desk reviews reader submissions and inquiries daily.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {submitStatus === 'error' && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-[#9B2C2C]">
                    {errorDetail}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#5A4D40] mb-1.5">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Elena Rossi"
                      className="w-full text-sm p-3 bg-[#FAF7F2] border border-[#E4D9C5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9B2C2C]/20 focus:border-[#9B2C2C]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#5A4D40] mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full text-sm p-3 bg-[#FAF7F2] border border-[#E4D9C5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9B2C2C]/20 focus:border-[#9B2C2C]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5A4D40] mb-1.5">
                    Inquiry Topic
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full text-sm p-3 bg-[#FAF7F2] border border-[#E4D9C5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9B2C2C]/20 focus:border-[#9B2C2C]"
                  >
                    <option value="Editorial & Recipe Inquiry">Editorial &amp; Recipe Inquiry</option>
                    <option value="Family Heritage Recipe Submission">Family Heritage Recipe Submission</option>
                    <option value="Privacy / GDPR / Cookie Request">Privacy / GDPR / Cookie Request</option>
                    <option value="Correction or Fact-Check Note">Correction or Fact-Check Note</option>
                    <option value="Advertising & Partnerships">Advertising &amp; Partnerships</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5A4D40] mb-1.5">
                    Message
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Share your message, regional feast tradition, or editorial inquiry..."
                    className="w-full text-sm p-3 bg-[#FAF7F2] border border-[#E4D9C5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9B2C2C]/20 focus:border-[#9B2C2C]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#9B2C2C] hover:bg-[#822424] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-60"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Sending...' : 'Send Message to Editorial Desk'}</span>
                </button>
              </form>
            )}
          </div>
        )}
      </article>
    </div>
  );
};
