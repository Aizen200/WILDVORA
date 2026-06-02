import { useState, useEffect } from 'react';
import { hostAPI } from '../api/hostAPI';
import Layout from '../components/Layout';

const TABS = ['All Bookings', 'Requests', 'Cancelled'];

export default function Bookings() {
  const [bookings, setBookings]     = useState([]);
  const [tab, setTab]               = useState('All Bookings');
  const [selected, setSelected]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [updating, setUpdating]     = useState(false);
  const [page, setPage]             = useState(1);
  const PER_PAGE = 10;

  const fetchBookings = async (statusFilter) => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter === 'Requests') params.status = 'pending';
      else if (statusFilter === 'Cancelled') params.status = 'cancelled';
      const res = await hostAPI.getBookings(params);
      setBookings(res.data.bookings);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(tab); }, [tab]);

  const handleStatus = async (id, status) => {
    setUpdating(true);
    try {
      const res = await hostAPI.updateBookingStatus(id, status);
      setBookings(prev => prev.map(b => b._id === id ? res.data.booking : b));
      setSelected(res.data.booking);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update booking');
    } finally {
      setUpdating(false);
    }
  };

  const paginated = bookings.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const totalPages = Math.ceil(bookings.length / PER_PAGE);

  // Stat summary counts
  const pendingCount    = bookings.filter(b => b.status === 'pending').length;
  const confirmedCount  = bookings.filter(b => b.status === 'confirmed').length;
  const totalRevenue    = bookings.filter(b => ['confirmed','completed'].includes(b.status))
                                  .reduce((s, b) => s + b.totalPrice, 0);

  return (
    <Layout>
      <div id="bookings-page">
        {/* Header */}
        <div id="bookings-header">
          <div>
            <h1 id="bookings-title">Bookings</h1>
            <p id="bookings-subtitle">Manage your upcoming adventure reservations and guest interactions.</p>
          </div>
          <button id="btn-export-bookings" onClick={() => alert('Export coming soon')}>⬆ Export</button>
        </div>

        {error && <div id="bookings-error" role="alert">{error}</div>}

        {/* Stat Cards */}
        <div id="bookings-stats">
          <div className="stat-card" id="bs-total">
            <span className="stat-label">Total Bookings</span>
            <span className="stat-value">{bookings.length}</span>
          </div>
          <div className="stat-card" id="bs-pending">
            <span className="stat-label">Pending</span>
            <span className="stat-value">{pendingCount}</span>
          </div>
          <div className="stat-card" id="bs-confirmed">
            <span className="stat-label">Confirmed</span>
            <span className="stat-value">{confirmedCount}</span>
          </div>
          <div className="stat-card" id="bs-revenue">
            <span className="stat-label">Revenue</span>
            <span className="stat-value">₹{totalRevenue.toLocaleString()}</span>
          </div>
        </div>

        {/* Tabs */}
        <div id="bookings-tabs">
          {TABS.map(t => (
            <button
              key={t}
              id={`tab-${t.replace(' ', '-').toLowerCase()}`}
              className={`tab-btn ${tab === t ? 'active' : ''}`}
              onClick={() => { setTab(t); setPage(1); setSelected(null); }}
            >{t}</button>
          ))}
          <span id="bookings-count-label">Showing {bookings.length} results</span>
        </div>

        {/* Main area: table + detail panel */}
        <div id="bookings-main">
          {/* Table */}
          <div id="bookings-table-wrap">
            {loading ? <p id="bookings-loading">Loading...</p> : (
              <table id="bookings-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Booking ID</th>
                    <th>Experience</th>
                    <th>Dates</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={7} id="no-bookings-msg">No bookings found.</td></tr>
                  ) : paginated.map(b => (
                    <tr
                      key={b._id}
                      className={`booking-row ${selected?._id === b._id ? 'selected' : ''}`}
                      id={`booking-row-${b._id}`}
                      onClick={() => setSelected(b)}
                    >
                      <td className="booking-customer">
                        <div className="customer-avatar">{b.user?.name?.[0] || '?'}</div>
                        <div>
                          <div className="customer-name">{b.user?.name}</div>
                          <div className="customer-email">{b.user?.email}</div>
                        </div>
                      </td>
                      <td className="booking-id">WV-{b._id.slice(-4).toUpperCase()}</td>
                      <td className="booking-exp">{b.experience?.title}</td>
                      <td className="booking-date">{new Date(b.startDate).toLocaleDateString('en-IN')}</td>
                      <td className="booking-amount">₹{b.totalPrice}</td>
                      <td>
                        <span className={`status-badge status-${b.status}`} id={`booking-status-${b._id}`}>
                          {b.status}
                        </span>
                      </td>
                      <td>
                        <button
                          id={`btn-booking-detail-${b._id}`}
                          className="action-btn"
                          onClick={e => { e.stopPropagation(); setSelected(b); }}
                        >›</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Pagination */}
            <div id="bookings-pagination">
              <button id="btn-prev-booking" onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}>‹ Previous</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i+1).map(n => (
                <button key={n} id={`btn-bpage-${n}`} className={`page-btn ${page===n?'active':''}`} onClick={() => setPage(n)}>{n}</button>
              ))}
              {totalPages > 5 && <span>...</span>}
              <button id="btn-next-booking" onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}>Next ›</button>
            </div>
          </div>

          {/* Detail Panel */}
          {selected && (
            <aside id="booking-detail-panel">
              <div id="detail-panel-header">
                <h2>Booking Details</h2>
                <button id="btn-close-detail" onClick={() => setSelected(null)}>✕</button>
              </div>

              <span className={`status-badge status-${selected.status}`} id="detail-status-badge">
                {selected.status.toUpperCase()}
              </span>

              <div id="detail-guest">
                <div className="detail-avatar">{selected.user?.name?.[0]}</div>
                <div>
                  <strong id="detail-guest-name">{selected.user?.name}</strong>
                  <small id="detail-guest-email">{selected.user?.email}</small>
                </div>
              </div>

              <div id="detail-meta">
                <div><span>Booking ID</span><strong>WV-{selected._id.slice(-4).toUpperCase()}</strong></div>
                <div><span>Date & Time</span><strong>{new Date(selected.startDate).toLocaleDateString('en-IN')}</strong></div>
              </div>

              <div id="detail-experience">
                <h3>Experience Package</h3>
                <div id="detail-exp-info">
                  <strong id="detail-exp-title">{selected.experience?.title}</strong>
                  <small>{selected.experience?.duration} · {selected.adults} Adults {selected.children > 0 && `· ${selected.children} Children`}</small>
                </div>
              </div>

              <div id="detail-payment">
                <h3>Payment Summary</h3>
                <div id="detail-payment-row">
                  <span>Experience Base Fee</span>
                  <strong>₹{selected.totalPrice}</strong>
                </div>
              </div>

              {selected.status === 'pending' && (
                <div id="detail-actions">
                  <button
                    id="btn-reject-booking"
                    className="btn-reject"
                    disabled={updating}
                    onClick={() => handleStatus(selected._id, 'cancelled')}
                  >Reject Booking</button>
                  <button
                    id="btn-confirm-booking"
                    className="btn-confirm"
                    disabled={updating}
                    onClick={() => handleStatus(selected._id, 'confirmed')}
                  >Confirm Booking</button>
                </div>
              )}

              {selected.status === 'confirmed' && (
                <div id="detail-actions">
                  <button
                    id="btn-complete-booking"
                    className="btn-confirm"
                    disabled={updating}
                    onClick={() => handleStatus(selected._id, 'completed')}
                  >Mark Completed</button>
                  <button
                    id="btn-cancel-confirmed"
                    className="btn-reject"
                    disabled={updating}
                    onClick={() => handleStatus(selected._id, 'cancelled')}
                  >Cancel</button>
                </div>
              )}
            </aside>
          )}
        </div>
      </div>
    </Layout>
  );
}
