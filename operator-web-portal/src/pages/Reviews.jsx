import { useState, useEffect, useMemo } from 'react';
import { hostAPI } from '../api/hostAPI';
import Layout from '../components/Layout';

export default function Reviews() {
  const [reviews, setReviews]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [replyText, setReplyText] = useState({});
  const [replyOpen, setReplyOpen] = useState({});
  const [sending, setSending]     = useState(null);
  const [page, setPage]           = useState(1);
  const [sortBy, setSortBy]       = useState('Most Recent');
  const PER_PAGE = 5;

  useEffect(() => {
    hostAPI.getReviews()
      .then(res => setReviews(res.data.reviews))
      .catch(err => setError(err.response?.data?.message || 'Failed to load reviews'))
      .finally(() => setLoading(false));
  }, []);

  const handleReply = async (reviewId) => {
    const text = replyText[reviewId]?.trim();
    if (!text) return;
    setSending(reviewId);
    try {
      const res = await hostAPI.respondToReview(reviewId, text);
      setReviews(prev => prev.map(r => r._id === reviewId ? res.data.review : r));
      setReplyOpen(prev => ({ ...prev, [reviewId]: false }));
      setReplyText(prev => ({ ...prev, [reviewId]: '' }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send reply');
    } finally {
      setSending(null);
    }
  };

  // Rating calculations
  const totalCount = reviews.length;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const ratingBreakdown = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      if (counts[r.rating] !== undefined) {
        counts[r.rating]++;
      }
    });
    const total = reviews.length || 1;
    return [5, 4, 3, 2, 1].map(star => ({
      star,
      pct: reviews.length > 0 ? Math.round((counts[star] / total) * 100) : 0
    }));
  }, [reviews]);

  const sortedReviews = useMemo(() => {
    const sorted = [...reviews];
    if (sortBy === 'Most Recent') {
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'Highest Rating') {
      sorted.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'Lowest Rating') {
      sorted.sort((a, b) => a.rating - b.rating);
    }
    return sorted;
  }, [reviews, sortBy]);

  const paginated = useMemo(() => {
    return sortedReviews.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  }, [sortedReviews, page]);

  const totalPages  = Math.ceil(reviews.length / PER_PAGE);

  const getStars = (count) => {
    return (
      <div className="flex gap-0.5 text-amber-400 text-xs">
        {Array.from({ length: 5 }).map((_, idx) => (
          <span key={idx}>{idx < count ? '★' : '☆'}</span>
        ))}
      </div>
    );
  };

  return (
    <Layout>
      <div className="min-h-full pb-8 max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reviews & Ratings</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your guest feedback and adventure performance.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl px-4 py-2.5 text-sm shadow-sm hover:bg-gray-50 transition">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span>Filter</span>
            </button>
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl px-4 py-2.5 text-sm shadow-sm hover:bg-gray-50 transition"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 12V3m0 0L8 7m4-4l4 4"/>
              </svg>
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm" role="alert">
            {error}
          </div>
        )}

        {/* Overview Row */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Card 1: Performance Score Overview */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Performance Score Overview</h2>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-black text-gray-900">{avgRating}</span>
              <span className="text-lg font-bold text-gray-400">/ 5</span>
            </div>
            <div className="mb-4">
              {getStars(Math.round(parseFloat(avgRating)))}
            </div>
            <p className="text-[11px] text-gray-400 font-semibold">Based on {totalCount} total verified reviews this season.</p>
          </div>

          {/* Card 2: Rating Breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-2.5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Rating Breakdown</h2>
            {ratingBreakdown.map(({ star, pct }) => (
              <div key={star} className="flex items-center text-xs text-gray-500 font-semibold">
                <span className="w-12">{star} Star</span>
                <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden mx-4">
                  <div style={{ width: `${pct}%` }} className="bg-[#1A5F45] h-full rounded-full" />
                </div>
                <span className="w-8 text-right">{pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews List Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-900">Customer Reviews</h2>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
            <span>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 outline-none cursor-pointer"
            >
              <option value="Most Recent">Most Recent</option>
              <option value="Highest Rating">Highest Rating</option>
              <option value="Lowest Rating">Lowest Rating</option>
            </select>
          </div>
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="p-8 text-center text-gray-500 font-semibold">Loading reviews...</div>
        ) : (
          <div className="space-y-4">
            {paginated.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center text-gray-400">
                No reviews yet. Complete bookings to receive customer feedback.
              </div>
            ) : (
              paginated.map(review => (
                <div key={review._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                  {/* Top Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                        {review.user?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">{review.user?.name}</h4>
                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                          {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          {review.experience?.title && ` • ${review.experience.title}`}
                        </p>
                      </div>
                    </div>
                    <div>
                      {getStars(review.rating)}
                    </div>
                  </div>

                  {/* Review Text */}
                  <p className="text-xs text-gray-700 leading-relaxed font-semibold">
                    "{review.comment}"
                  </p>

                  {/* Reply Block */}
                  {review.hostReply ? (
                    <div className="bg-gray-50 border-l-[3px] border-[#1A5F45] rounded-r-xl p-4">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Your Response &bull; Sept 11</div>
                      <p className="text-xs text-gray-700 font-semibold leading-relaxed">
                        "{review.hostReply}"
                      </p>
                    </div>
                  ) : (
                    <div className="pt-2">
                      {!replyOpen[review._id] ? (
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
                            Needs Reply
                          </span>
                          <button
                            onClick={() => setReplyOpen(prev => ({ ...prev, [review._id]: true }))}
                            className="flex items-center gap-1 text-xs font-bold text-[#1A5F45] hover:underline"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
                            </svg>
                            <span>Reply</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3 pt-2 border-t border-gray-100">
                          <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Reply to {review.user?.name?.split(' ')[0]}</span>
                          <textarea
                            placeholder="Write your response to this review..."
                            rows={3}
                            value={replyText[review._id] || ''}
                            onChange={e => setReplyText(prev => ({ ...prev, [review._id]: e.target.value }))}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-800 outline-none focus:ring-1 focus:ring-[#1A5F45] resize-none"
                          />
                          <div className="flex justify-end gap-2.5">
                            <button
                              onClick={() => setReplyOpen(prev => ({ ...prev, [review._id]: false }))}
                              className="px-3.5 py-1.5 text-xs font-bold text-gray-500 rounded-lg hover:bg-gray-50 transition"
                            >
                              Cancel
                            </button>
                            <button
                              disabled={sending === review._id}
                              onClick={() => handleReply(review._id)}
                              className="px-4 py-1.5 text-xs font-bold text-white bg-[#1A5F45] rounded-lg hover:bg-[#145038] transition"
                            >
                              {sending === review._id ? 'Sending...' : 'Send Response'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-1.5 pt-4">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none transition"
                >
                  &larr;
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPage(idx + 1)}
                    className={`w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition ${
                      page === idx + 1 ? 'bg-[#1A5F45] text-white' : 'bg-white border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none transition"
                >
                  &rarr;
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

