import { useState, useEffect } from 'react';
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

  // Rating breakdown
  const ratingBreakdown = [5,4,3,2,1].map(star => ({
    star,
    count: reviews.filter(r => Math.round(r.rating) === star).length,
    pct: reviews.length > 0
      ? Math.round((reviews.filter(r => Math.round(r.rating) === star).length / reviews.length) * 100)
      : 0
  }));
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '—';

  const paginated   = reviews.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const totalPages  = Math.ceil(reviews.length / PER_PAGE);

  return (
    <Layout>
      <div id="reviews-page">
        {/* Header */}
        <div id="reviews-header">
          <div>
            <h1 id="reviews-title">Reviews &amp; Ratings</h1>
            <p id="reviews-subtitle">Manage your guest feedback and adventure performance.</p>
          </div>
          <div id="reviews-header-actions">
            <button id="btn-filter-reviews">⊟ Filter</button>
            <button id="btn-export-reviews" onClick={() => window.print()}>⬇ Export Report</button>
          </div>
        </div>

        {error && <div id="reviews-error" role="alert">{error}</div>}

        {/* Score Overview */}
        <div id="reviews-overview">
          <div id="performance-score">
            <h2>Performance Score Overview</h2>
            <div id="avg-rating-display">
              <span id="avg-rating-value">{avgRating}</span>
              <span id="avg-rating-denom">/ 5</span>
            </div>
            <div id="star-display" aria-label={`${avgRating} out of 5 stars`}>
              {[1,2,3,4,5].map(s => (
                <span key={s} className={`star ${parseFloat(avgRating) >= s ? 'filled' : ''}`}>★</span>
              ))}
            </div>
            <p id="review-count-label">Based on {reviews.length} total verified reviews this season.</p>
          </div>

          <div id="rating-breakdown">
            <h2>Rating Breakdown</h2>
            {ratingBreakdown.map(({ star, count, pct }) => (
              <div key={star} className="rating-bar-row" id={`rating-row-${star}`}>
                <span className="rating-star-label">{star} Star</span>
                <div className="rating-bar-track">
                  <div
                    className="rating-bar-fill"
                    id={`bar-${star}star`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="rating-pct">{pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Review List */}
        <div id="customer-reviews-header">
          <h2>Customer Reviews</h2>
          <div id="reviews-sort">
            <label htmlFor="sort-select">Sort by:</label>
            <select id="sort-select">
              <option>Most Recent</option>
              <option>Highest Rating</option>
              <option>Lowest Rating</option>
              <option>Needs Reply</option>
            </select>
          </div>
        </div>

        {loading ? <p id="reviews-loading">Loading reviews...</p> : (
          <>
            <div id="reviews-list">
              {paginated.length === 0 ? (
                <p id="no-reviews-msg">No reviews yet. Complete more bookings to receive feedback.</p>
              ) : paginated.map(review => (
                <div key={review._id} className="review-card" id={`review-${review._id}`}>
                  {/* Reviewer Info */}
                  <div className="review-top">
                    <div className="reviewer-avatar">{review.user?.name?.[0] || '?'}</div>
                    <div className="reviewer-info">
                      <strong className="reviewer-name" id={`reviewer-name-${review._id}`}>{review.user?.name}</strong>
                      <small className="reviewer-meta">
                        {new Date(review.createdAt).toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' })}
                        {review.experience?.title && ` · ${review.experience.title}`}
                      </small>
                    </div>
                    <div className="review-stars" id={`stars-${review._id}`} aria-label={`${review.rating} out of 5 stars`}>
                      {[1,2,3,4,5].map(s => (
                        <span key={s} className={`star ${review.rating >= s ? 'filled' : ''}`}>★</span>
                      ))}
                    </div>
                  </div>

                  {/* Review Text */}
                  <p className="review-text" id={`review-text-${review._id}`}>"{review.comment}"</p>

                  {/* Existing Host Reply */}
                  {review.hostReply && (
                    <div className="host-reply" id={`host-reply-${review._id}`}>
                      <small className="host-reply-label">Your Response</small>
                      <p className="host-reply-text">"{review.hostReply}"</p>
                    </div>
                  )}

                  {/* Reply Actions */}
                  {!review.hostReply && (
                    <div className="review-actions">
                      {!review.hostReply && !replyOpen[review._id] ? (
                        <div>
                          <span className="needs-reply-badge" id={`needs-reply-${review._id}`}>⏰ Needs Reply</span>
                          <button
                            id={`btn-reply-${review._id}`}
                            className="btn-reply-toggle"
                            onClick={() => setReplyOpen(prev => ({ ...prev, [review._id]: true }))}
                          >↩ Reply</button>
                        </div>
                      ) : (
                        <div className="reply-form" id={`reply-form-${review._id}`}>
                          <small className="reply-to-label">↩ Reply to {review.user?.name?.split(' ')[0]}</small>
                          <textarea
                            id={`reply-textarea-${review._id}`}
                            className="reply-textarea"
                            placeholder="Write your response to this review..."
                            value={replyText[review._id] || ''}
                            onChange={e => setReplyText(prev => ({ ...prev, [review._id]: e.target.value }))}
                            rows={3}
                          />
                          <div className="reply-form-actions">
                            <button
                              id={`btn-cancel-reply-${review._id}`}
                              className="btn-cancel"
                              onClick={() => setReplyOpen(prev => ({ ...prev, [review._id]: false }))}
                            >Cancel</button>
                            <button
                              id={`btn-send-reply-${review._id}`}
                              className="btn-send-reply"
                              disabled={sending === review._id}
                              onClick={() => handleReply(review._id)}
                            >{sending === review._id ? 'Sending...' : 'Send Response'}</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div id="reviews-pagination">
              <button id="btn-prev-review" onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}>&lt;</button>
              {Array.from({ length: Math.min(totalPages,5) }, (_,i)=>i+1).map(n => (
                <button key={n} id={`btn-rpage-${n}`} className={`page-btn ${page===n?'active':''}`} onClick={() => setPage(n)}>{n}</button>
              ))}
              {totalPages > 5 && <span>...</span>}
              <button id="btn-next-review" onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}>&gt;</button>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
