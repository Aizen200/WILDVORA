import { useState, useEffect, useRef, useCallback } from 'react';
import { inquiryAPI, messageAPI } from '../api/hostAPI';
import Layout from '../components/Layout';

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

// Convert an inquiry document to a unified thread shape
function normaliseInquiry(inq) {
  const msgs = inq.messages || [];
  if (msgs.length === 0) return null; // hide empty inquiry threads
  const last = msgs[msgs.length - 1];
  return {
    id:       inq._id,
    type:     'inquiry',
    customer: inq.customer,
    title:    inq.experience?.title || 'Experience',
    lastMsg:  { text: last.text, time: last.sentAt, senderRole: last.role },
    updatedAt: last.sentAt,
    _inq:     inq, // keep raw for message list
  };
}

// Convert a booking message-thread summary to unified thread shape
function normaliseBookingThread(t) {
  return {
    id:       t._id,
    type:     'booking',
    customer: t.customer,
    title:    t.experience?.title || 'Experience',
    lastMsg:  { text: t.lastMessage.text, time: t.lastMessage.createdAt, senderRole: t.lastMessage.senderRole },
    updatedAt: t.updatedAt,
  };
}

export default function Messages() {
  const [threads,        setThreads]        = useState([]);
  const [selected,       setSelected]       = useState(null);
  const [loading,        setLoading]        = useState(true);

  // For booking threads: full message list loaded on demand
  const [bookingMsgs,    setBookingMsgs]    = useState([]);
  const [bMsgsLoading,   setBMsgsLoading]   = useState(false);

  const [replyText,      setReplyText]      = useState('');
  const [sending,        setSending]        = useState(false);

  const messagesEndRef = useRef(null);
  const mainPollRef    = useRef(null);
  const bMsgPollRef    = useRef(null);
  const selectedRef    = useRef(null);

  useEffect(() => { selectedRef.current = selected; }, [selected]);

  // ── Fetch both thread types and merge ──
  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [iqRes, mtRes] = await Promise.all([
        inquiryAPI.getInquiries(),
        messageAPI.getThreads(),
      ]);

      const iqThreads = (iqRes.data.inquiries || [])
        .map(normaliseInquiry)
        .filter(Boolean);

      const bThreads = (mtRes.data.threads || [])
        .map(normaliseBookingThread);

      const merged = [...iqThreads, ...bThreads]
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

      setThreads(merged);

      // Sync selected inquiry thread with fresh messages
      const cur = selectedRef.current;
      if (cur?.type === 'inquiry') {
        const fresh = merged.find(t => t.id === cur.id);
        if (fresh) setSelected(fresh);
      }
    } catch (_) {}
    finally { if (!silent) setLoading(false); }
  }, []);

  // Main poll – runs always
  useEffect(() => {
    fetchAll();
    mainPollRef.current = setInterval(() => fetchAll(true), 5000);
    return () => clearInterval(mainPollRef.current);
  }, [fetchAll]);

  // ── Fetch full messages for a booking thread ──
  const fetchBookingMsgs = useCallback(async (bookingId, silent = false) => {
    if (!silent) setBMsgsLoading(true);
    try {
      const res = await messageAPI.getByBooking(bookingId);
      if (res.data.success) setBookingMsgs(res.data.messages || []);
    } catch (_) {}
    finally { if (!silent) setBMsgsLoading(false); }
  }, []);

  // Poll booking messages only when a booking thread is active
  useEffect(() => {
    clearInterval(bMsgPollRef.current);
    if (selected?.type === 'booking') {
      fetchBookingMsgs(selected.id);
      bMsgPollRef.current = setInterval(() => fetchBookingMsgs(selected.id, true), 5000);
    }
    return () => clearInterval(bMsgPollRef.current);
  }, [selected?.id, selected?.type, fetchBookingMsgs]);

  // Scroll to bottom on new messages
  useEffect(() => {
    const count = selected?.type === 'inquiry'
      ? selected._inq?.messages?.length
      : bookingMsgs.length;
    if (count) setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, [selected?._inq?.messages?.length, bookingMsgs.length, selected?.type]);

  const handleSelect = (thread) => {
    setSelected(thread);
    setReplyText('');
    setBookingMsgs([]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'instant' }), 80);
  };

  // ── Send reply ──
  const handleSend = async () => {
    if (!replyText.trim() || sending || !selected) return;
    const text = replyText.trim();
    setReplyText('');
    setSending(true);
    try {
      if (selected.type === 'inquiry') {
        const res = await inquiryAPI.sendReply(selected.id, text);
        if (res.data.success) {
          const newMsg = res.data.message;
          setSelected(prev => ({
            ...prev,
            _inq: { ...prev._inq, messages: [...(prev._inq.messages || []), newMsg] },
            lastMsg: { text: newMsg.text, time: newMsg.sentAt, senderRole: 'operator' },
          }));
          setThreads(prev => prev.map(t =>
            t.id === selected.id
              ? { ...t, lastMsg: { text: newMsg.text, time: newMsg.sentAt, senderRole: 'operator' }, _inq: { ...t._inq, messages: [...(t._inq.messages || []), newMsg] } }
              : t
          ));
        }
      } else {
        const res = await messageAPI.send(selected.id, text);
        if (res.data.success) {
          const newMsg = res.data.message;
          setBookingMsgs(prev => [...prev, newMsg]);
          setThreads(prev => prev.map(t =>
            t.id === selected.id
              ? { ...t, lastMsg: { text, time: new Date().toISOString(), senderRole: 'operator' } }
              : t
          ));
        }
      }
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not send reply. Please try again.');
      setReplyText(text);
    } finally {
      setSending(false);
    }
  };

  // ── Derive messages for the active thread ──
  const activeMessages = (() => {
    if (!selected) return [];
    if (selected.type === 'inquiry') {
      return [...(selected._inq?.messages || [])].sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));
    }
    return [...bookingMsgs].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  })();

  const isOpMsg = (msg) =>
    selected?.type === 'inquiry'
      ? msg.role === 'operator'
      : (msg.sender?.role === 'operator' || msg.sender?.role === 'admin');

  const msgTime = (msg) =>
    selected?.type === 'inquiry' ? msg.sentAt : msg.createdAt;

  if (loading) {
    return (
      <Layout compact>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-6 h-6 border-2 border-[#1A5F45] border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout compact>
      <div className="flex flex-1 overflow-hidden bg-gray-50">

        {/* ── Left panel: unified thread list ── */}
        <aside className="w-72 min-w-[260px] border-r border-gray-100 bg-white flex flex-col min-h-0">
          <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0">
            <h1 className="text-[15px] font-bold text-gray-900">Messages</h1>
            <p className="text-[11px] text-gray-400 mt-0.5">All guest conversations</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {threads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <svg className="w-10 h-10 text-gray-300 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
                </svg>
                <p className="text-sm font-medium text-gray-500">No messages yet</p>
                <p className="text-xs text-gray-400 mt-1">Guest conversations will appear here</p>
              </div>
            ) : (
              threads.map(thread => {
                const unread   = thread.lastMsg?.senderRole === 'customer';
                const isActive = selected?.id === thread.id;
                return (
                  <button
                    key={`${thread.type}-${thread.id}`}
                    onClick={() => handleSelect(thread)}
                    className={`w-full text-left px-4 py-3.5 border-b border-gray-50 transition-colors flex items-start gap-3 ${
                      isActive ? 'bg-[#EEF6F1]' : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Avatar */}
                    <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-[12px] font-bold ${
                      isActive ? 'bg-[#1A5F45] text-white' : 'bg-[#EEF6F1] text-[#1A5F45]'
                    }`}>
                      {getInitials(thread.customer?.name)}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Name + time */}
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-[13px] truncate ${unread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                          {thread.customer?.name || 'Guest'}
                        </span>
                        <span className="text-[10px] text-gray-400 flex-shrink-0">
                          {formatDate(thread.lastMsg?.time)}
                        </span>
                      </div>

                      {/* Experience + type badge */}
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-[11px] text-[#1A5F45] truncate">{thread.title}</p>
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                          thread.type === 'booking'
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-amber-50 text-amber-600'
                        }`}>
                          {thread.type === 'booking' ? 'Confirmed' : 'Enquiry'}
                        </span>
                      </div>

                      {/* Last message preview */}
                      <div className="flex items-center gap-1 mt-0.5">
                        {unread && <span className="w-1.5 h-1.5 rounded-full bg-[#1A5F45] flex-shrink-0" />}
                        <p className={`text-[11px] truncate ${unread ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                          {thread.lastMsg?.senderRole !== 'customer' && 'You: '}{thread.lastMsg?.text}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ── Right panel: conversation ── */}
        {selected ? (
          <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#F4F7F5]">

            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-3 flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-[#EEF6F1] flex items-center justify-center text-[11px] font-bold text-[#1A5F45]">
                {getInitials(selected.customer?.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-semibold text-gray-900 leading-tight truncate">
                    {selected.customer?.name || 'Guest'}
                  </p>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                    selected.type === 'booking' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {selected.type === 'booking' ? 'Confirmed booking' : 'Pre-booking enquiry'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 truncate">{selected.title}</p>
              </div>
            </div>

            {/* Message list */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {(selected.type === 'booking' && bMsgsLoading) ? (
                <div className="flex justify-center py-10">
                  <div className="w-5 h-5 border-2 border-[#1A5F45] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : activeMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <svg className="w-10 h-10 text-gray-300 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
                  </svg>
                  <p className="text-sm text-gray-400">No messages yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeMessages.map((msg, i) => {
                    const isOp = isOpMsg(msg);
                    return (
                      <div key={msg._id ?? i} className={`flex items-end gap-2 ${isOp ? 'justify-end' : 'justify-start'}`}>
                        {!isOp && (
                          <div className="w-6 h-6 rounded-full bg-[#EEF6F1] flex items-center justify-center text-[9px] font-bold text-[#1A5F45] flex-shrink-0">
                            {getInitials(selected.customer?.name)}
                          </div>
                        )}
                        <div className={`max-w-[65%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                          isOp
                            ? 'bg-[#1A5F45] text-white rounded-br-sm'
                            : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'
                        }`}>
                          <p className="text-[13px] leading-5 whitespace-pre-wrap break-words">{msg.text}</p>
                          <p className={`text-[9px] mt-1 text-right ${isOp ? 'text-white/60' : 'text-gray-400'}`}>
                            {new Date(msgTime(msg)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Reply input */}
            <div className="bg-white border-t border-gray-100 px-4 py-3 flex items-end gap-2 flex-shrink-0">
              <textarea
                className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[13px] text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1A5F45]/30 focus:border-[#1A5F45] max-h-32"
                placeholder="Reply to this guest…"
                rows={1}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                maxLength={1000}
                disabled={sending}
              />
              <button
                onClick={handleSend}
                disabled={!replyText.trim() || sending}
                className="w-9 h-9 rounded-xl bg-[#1A5F45] hover:bg-[#145038] disabled:bg-gray-200 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors flex-shrink-0 mb-0.5"
              >
                {sending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#F4F7F5] text-center px-8">
            <div className="w-14 h-14 rounded-2xl bg-[#EEF6F1] flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-[#1A5F45]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
              </svg>
            </div>
            <p className="text-[14px] font-semibold text-gray-700">Select a conversation</p>
            <p className="text-[12px] text-gray-400 mt-1 max-w-xs">
              Choose a thread from the list to view the conversation and send a reply
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
