import React, { useState, useEffect } from 'react';
import { RECIPES_DATA } from '../data/recipes';
import { TRANSLATIONS, SUPPORTED_LANGUAGES } from '../data/translations';
import {
  Star,
  MessageSquare,
  Send,
  ArrowLeft,
  CheckCircle2,
  Trash2,
  CornerDownRight,
  MapPin,
  ShieldCheck,
} from 'lucide-react';

export interface ReviewComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface ReviewItem {
  id: string;
  author: string;
  location?: string;
  topic: string;
  category: 'Beef / Boeuf' | 'Chicken' | 'Fish & Vegetarian' | 'Desserts & Heritage' | 'Site Experience';
  rating: number;
  comment: string;
  createdAt: string;
  comments: ReviewComment[];
}

const INITIAL_REVIEWS: ReviewItem[] = [
  {
    id: 'rev-1',
    author: 'Camille Laurent',
    location: 'Lyon, France',
    topic: 'French Christmas Boeuf Wellington & Red Wine Jus',
    category: 'Beef / Boeuf',
    rating: 5,
    comment:
      'Followed the 52°C pull temperature and let the mushroom duxelles cook completely dry. The pastry stayed crisp all the way around and the Burgundy red wine jus was sensational on Christmas Eve.',
    createdAt: '2026-11-14T11:20:00Z',
    comments: [
      {
        id: 'c-101',
        author: 'Naveed (Founder · France)',
        text: 'Merci Camille! Resting 15 minutes on the wooden board before slicing makes all the difference for that rosy medium-rare finish.',
        createdAt: '2026-11-14T12:05:00Z',
      },
    ],
  },
  {
    id: 'rev-2',
    author: 'Min-ji Park (박민지)',
    location: 'Seoul, South Korea',
    topic: 'French Christmas Roast Chicken with Chestnuts, Lemon & Tarragon',
    category: 'Chicken',
    rating: 5,
    comment:
      'Reading the full Korean translation automatically made following every step effortless! Roasting the chestnuts directly inside the Dutch oven with garlic and tarragon filled our entire apartment with warmth.',
    createdAt: '2026-11-13T18:40:00Z',
    comments: [],
  },
  {
    id: 'rev-3',
    author: 'Omar Al-Mansoor (عمر المنصور)',
    location: 'Dubai, UAE',
    topic: 'Nordic-French Herb-Crusted Christmas Salmon with Dill & Pomegranate',
    category: 'Fish & Vegetarian',
    rating: 5,
    comment:
      'Gentle 165°C oven temperature kept the salmon silky without drying out, and the ruby pomegranate seeds over green dill looked festive on our family table.',
    createdAt: '2026-11-12T15:10:00Z',
    comments: [],
  },
  {
    id: 'rev-4',
    author: 'Sophie Tremblay',
    location: 'Montreal, Canada',
    topic: 'Tourtière Québécoise du Réveillon',
    category: 'Desserts & Heritage',
    rating: 5,
    comment:
      'Authentic clove and cinnamon ratio just like my grandmother’s Réveillon pie. The serving scaler helped us adjust seamlessly for 14 guests.',
    createdAt: '2026-11-10T20:15:00Z',
    comments: [],
  },
];

interface ReviewsPageProps {
  onBackToHome: () => void;
  currentLang: string;
  isOwnerAuthorized: boolean;
  ownerPasscode: string;
}

export const ReviewsPage: React.FC<ReviewsPageProps> = ({
  onBackToHome,
  currentLang,
  isOwnerAuthorized,
  ownerPasscode,
}) => {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];
  const activeLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];
  const isRtl = activeLangObj.dir === 'rtl';

  const [reviews, setReviews] = useState<ReviewItem[]>(() => {
    try {
      const local = localStorage.getItem('yt_reviews_v1');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return INITIAL_REVIEWS;
  });

  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [authorName, setAuthorName] = useState('');
  const [location, setLocation] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('French Christmas Boeuf Wellington & Red Wine Jus');
  const [selectedCategory, setSelectedCategory] = useState<ReviewItem['category']>('Beef / Boeuf');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Per-review reply input state
  const [activeReplyReviewId, setActiveReplyReviewId] = useState<string | null>(null);
  const [replyAuthor, setReplyAuthor] = useState('');
  const [replyText, setReplyText] = useState('');

  // Sync with backend if available
  useEffect(() => {
    fetch('/api/reviews')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data.reviews) && data.reviews.length > 0) {
          setReviews(data.reviews);
          localStorage.setItem('yt_reviews_v1', JSON.stringify(data.reviews));
        }
      })
      .catch(() => {
        // Static deploy (Netlify): localStorage + INITIAL_REVIEWS continues smoothly
      });
  }, []);

  const persistLocal = (next: ReviewItem[]) => {
    setReviews(next);
    try {
      localStorage.setItem('yt_reviews_v1', JSON.stringify(next));
    } catch (_) {}
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !commentText.trim()) return;

    setIsSubmitting(true);
    const payload = {
      author: authorName.trim(),
      location: location.trim() || undefined,
      topic: selectedTopic,
      category: selectedCategory,
      rating,
      comment: commentText.trim(),
    };

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.review) {
          persistLocal([data.review, ...reviews]);
        }
      } else {
        throw new Error('Fallback to local store');
      }
    } catch (_) {
      const fallbackItem: ReviewItem = {
        id: `rev-${Date.now()}`,
        ...payload,
        createdAt: new Date().toISOString(),
        comments: [],
      };
      persistLocal([fallbackItem, ...reviews]);
    } finally {
      setIsSubmitting(false);
      setAuthorName('');
      setLocation('');
      setCommentText('');
      setRating(5);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 4000);
    }
  };

  const handlePostComment = async (reviewId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!replyAuthor.trim() || !replyText.trim()) return;

    const newComment: ReviewComment = {
      id: `cmt-${Date.now()}`,
      author: replyAuthor.trim(),
      text: replyText.trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await fetch(`/api/reviews/${reviewId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: newComment.author, text: newComment.text }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.review) {
          persistLocal(reviews.map((r) => (r.id === reviewId ? data.review : r)));
          setReplyAuthor('');
          setReplyText('');
          setActiveReplyReviewId(null);
          return;
        }
      }
    } catch (_) {}

    const updated = reviews.map((r) =>
      r.id === reviewId ? { ...r, comments: [...(r.comments || []), newComment] } : r
    );
    persistLocal(updated);
    setReplyAuthor('');
    setReplyText('');
    setActiveReplyReviewId(null);
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!isOwnerAuthorized) return;
    try {
      await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'x-owner-passcode': ownerPasscode,
        },
      });
    } catch (_) {}
    persistLocal(reviews.filter((r) => r.id !== reviewId));
  };

  const filteredReviews =
    filterCategory === 'All'
      ? reviews
      : reviews.filter((r) => r.category === filterCategory);

  const avgScore =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '5.0';

  const categoriesList = [
    'All',
    'Beef / Boeuf',
    'Chicken',
    'Fish & Vegetarian',
    'Desserts & Heritage',
    'Site Experience',
  ];

  const topicOptions = [
    ...RECIPES_DATA.map((r) => r.name),
    'Blog & Global Culinary News',
    'Website & Multi-Language Experience',
  ];

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-12 animate-in fade-in duration-200"
    >
      {/* Back button */}
      <div>
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#82532B] hover:text-[#9B2C2C] transition-colors group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
          <span>{t.ctaViewRecipes}</span>
        </button>
      </div>

      {/* Header & Aggregate Stats */}
      <section className="bg-white border border-[#E8DEC8] rounded-3xl p-6 sm:p-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#82532B]">
              Naveed’s Table · Community Feedback
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#241D17] leading-tight">
              {t.reviewsTitle}
            </h1>
            <p className="text-sm sm:text-base text-[#5A4D40] leading-relaxed">
              {t.reviewsSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-8 border-t lg:border-t-0 lg:border-s border-[#E8DEC8] pt-5 lg:pt-0 lg:ps-8 shrink-0">
            <div>
              <div className="text-xs text-[#7A6C5F]">{t.avgRating}</div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-serif font-bold text-[#241D17] tabular-nums">
                  {avgScore}
                </span>
                <span className="text-xs text-[#8C7D6D] tabular-nums">/ 5.0</span>
              </div>
              <div className="flex items-center gap-0.5 mt-1 text-[#D97706]">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs text-[#7A6C5F]">{t.totalReviews}</div>
              <div className="text-4xl font-serif font-bold text-[#241D17] tabular-nums mt-1">
                {reviews.length}
              </div>
              <div className="text-xs text-[#82532B] mt-1">
                {reviews.reduce((sum, r) => sum + (r.comments?.length || 0), 0)} Comments
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Split: Review Form + Reviews List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Write a Review Form */}
        <section className="lg:col-span-5 bg-white border border-[#E8DEC8] rounded-2xl p-6 sm:p-7 space-y-5 sticky top-24">
          <div className="space-y-1 pb-3 border-b border-[#F0EAE1]">
            <h2 className="text-xl font-serif font-bold text-[#241D17]">
              {t.leaveReview}
            </h2>
            <p className="text-xs text-[#7A6C5F]">
              Leave a dish review, cooking note, or comment for Naveed and fellow home cooks.
            </p>
          </div>

          {submitSuccess && (
            <div className="p-3.5 bg-[#F2F8F2] border border-[#CDE5CD] rounded-xl flex items-center gap-2.5 text-xs text-[#1E4620]">
              <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0" />
              <span>Thank you! Your review has been published to the community board.</span>
            </div>
          )}

          <form onSubmit={handleSubmitReview} className="space-y-4">
            {/* Star Rating Picker */}
            <div>
              <label className="block text-xs font-semibold text-[#665A4F] mb-1.5">
                {t.ratingLabel}
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 cursor-pointer focus:outline-none"
                      aria-label={`Rate ${star} stars`}
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          active ? 'text-[#D97706] fill-[#D97706]' : 'text-[#DDD2C0]'
                        }`}
                      />
                    </button>
                  );
                })}
                <span className="text-xs font-semibold text-[#82532B] ms-2 tabular-nums">
                  {rating}/5
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#665A4F] mb-1">
                  {t.yourName}
                </label>
                <input
                  type="text"
                  required
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="e.g. Claire, Min-ho, Ahmed"
                  className="w-full text-xs p-2.5 bg-[#FAF7F2] border border-[#E4D9C5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9B2C2C]/20 focus:border-[#9B2C2C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#665A4F] mb-1">
                  {t.yourLocation}
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Paris, France"
                  className="w-full text-xs p-2.5 bg-[#FAF7F2] border border-[#E4D9C5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9B2C2C]/20 focus:border-[#9B2C2C]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#665A4F] mb-1">
                {t.selectDish}
              </label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full text-xs p-2.5 bg-[#FAF7F2] border border-[#E4D9C5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9B2C2C]/20 focus:border-[#9B2C2C]"
              >
                {topicOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#665A4F] mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as ReviewItem['category'])}
                className="w-full text-xs p-2.5 bg-[#FAF7F2] border border-[#E4D9C5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9B2C2C]/20 focus:border-[#9B2C2C]"
              >
                <option value="Beef / Boeuf">Beef / Boeuf</option>
                <option value="Chicken">Chicken</option>
                <option value="Fish & Vegetarian">Fish & Vegetarian</option>
                <option value="Desserts & Heritage">Desserts & Heritage</option>
                <option value="Site Experience">Site Experience</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#665A4F] mb-1">
                Comment / Review
              </label>
              <textarea
                required
                rows={4}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={t.commentPlaceholder}
                className="w-full text-xs p-3 bg-[#FAF7F2] border border-[#E4D9C5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9B2C2C]/20 focus:border-[#9B2C2C]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-[#9B2C2C] hover:bg-[#822424] rounded-xl transition-colors inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{t.submitReview}</span>
            </button>
          </form>
        </section>

        {/* Right: Reviews Feed + Nested Comments */}
        <section className="lg:col-span-7 space-y-6">
          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-[#F0E9DF] rounded-xl overflow-x-auto scrollbar-none">
            {categoriesList.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  filterCategory === cat
                    ? 'bg-white text-[#9B2C2C] shadow-xs font-semibold'
                    : 'text-[#665A4F] hover:text-[#241D17]'
                }`}
              >
                {cat === 'All' ? t.allCategories : cat}
              </button>
            ))}
          </div>

          {isOwnerAuthorized && (
            <div className="p-3 bg-[#F2F8F2] border border-[#CDE5CD] rounded-xl flex items-center gap-2 text-xs text-[#1E4620]">
              <ShieldCheck className="w-4 h-4 text-[#2E7D32]" />
              <span>Owner Moderation Active: You may remove inappropriate reviews.</span>
            </div>
          )}

          {/* Reviews List */}
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <article
                key={review.id}
                className="bg-white border border-[#E8DEC8] rounded-2xl p-6 space-y-4"
              >
                {/* Header Metadata */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#7A6C5F]">
                      <span className="text-sm font-bold text-[#241D17]">{review.author}</span>
                      {review.location && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#82532B]" />
                            <span>{review.location}</span>
                          </span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span>
                        {new Date(review.createdAt).toLocaleDateString(currentLang, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#82532B]">
                      <span>{review.topic}</span>
                      <span aria-hidden="true">·</span>
                      <span>{review.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-0.5 text-[#D97706]">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            review.rating >= s ? 'fill-[#D97706]' : 'text-[#E0D5C1]'
                          }`}
                        />
                      ))}
                    </div>

                    {isOwnerAuthorized && (
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        className="p-1.5 text-[#9B2C2C] hover:bg-[#FCE8E8] rounded-lg transition-colors cursor-pointer"
                        title="Remove review (Owner permission)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Review Body */}
                <p className="text-sm text-[#3B3026] leading-relaxed">
                  {review.comment}
                </p>

                {/* Nested Comments / Replies */}
                {review.comments && review.comments.length > 0 && (
                  <div className="pt-3 border-t border-[#F2ECE1] space-y-2.5">
                    {review.comments.map((cmt) => (
                      <div
                        key={cmt.id}
                        className="ps-4 pt-1 flex items-start gap-2 text-xs text-[#4E4237]"
                      >
                        <CornerDownRight className="w-3.5 h-3.5 text-[#9B2C2C] shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#241D17]">{cmt.author}</span>
                            <span className="text-[11px] text-[#8C7D6D]">
                              {new Date(cmt.createdAt).toLocaleDateString(currentLang, {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                          <p className="leading-relaxed">{cmt.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Comment Trigger & Inline Form */}
                <div className="pt-2">
                  {activeReplyReviewId === review.id ? (
                    <form
                      onSubmit={(e) => handlePostComment(review.id, e)}
                      className="p-3.5 bg-[#FAF7F2] border border-[#E8DEC8] rounded-xl space-y-2.5"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          value={replyAuthor}
                          onChange={(e) => setReplyAuthor(e.target.value)}
                          placeholder={t.yourName}
                          className="text-xs p-2 bg-white border border-[#DDD2C0] rounded-lg focus:outline-none focus:border-[#9B2C2C]"
                        />
                        <input
                          type="text"
                          required
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder={t.writeReply}
                          className="text-xs p-2 bg-white border border-[#DDD2C0] rounded-lg focus:outline-none focus:border-[#9B2C2C]"
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveReplyReviewId(null)}
                          className="px-2.5 py-1 text-xs text-[#7A6C5F] hover:text-[#241D17] cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 text-xs font-semibold text-white bg-[#241D17] hover:bg-black rounded-lg transition-colors cursor-pointer"
                        >
                          {t.postComment}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setActiveReplyReviewId(review.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#82532B] hover:text-[#9B2C2C] transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{t.addComment}</span>
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
