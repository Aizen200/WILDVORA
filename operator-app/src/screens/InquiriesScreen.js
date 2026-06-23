import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';
import { inquiryAPI } from '../services/api';

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const diffDays = Math.floor((Date.now() - d) / 86400000);
  if (diffDays === 0) return formatTime(dateStr);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

// ── Conversation thread view ────────────────────────────────────────────────
function ConversationView({ inquiry, onBack }) {
  const [messages, setMessages]   = useState(inquiry.messages || []);
  const [text, setText]           = useState('');
  const [sending, setSending]     = useState(false);
  const flatListRef               = useRef(null);
  const pollRef                   = useRef(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await inquiryAPI.getInquiries();
      if (res.data.success) {
        const updated = res.data.inquiries.find(i => i._id === inquiry._id);
        if (updated) {
          setMessages([...(updated.messages || [])].sort(
            (a, b) => new Date(a.sentAt) - new Date(b.sentAt)
          ));
        }
      }
    } catch (_) {}
  }, [inquiry._id]);

  useEffect(() => {
    // Sort on mount
    setMessages([...(inquiry.messages || [])].sort(
      (a, b) => new Date(a.sentAt) - new Date(b.sentAt)
    ));
    pollRef.current = setInterval(fetchMessages, 5000);
    return () => clearInterval(pollRef.current);
  }, [fetchMessages]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    const msgText = text.trim();
    setText('');
    setSending(true);
    try {
      const res = await inquiryAPI.sendReply(inquiry._id, msgText);
      if (res.data.success) {
        setMessages(prev => [...prev, res.data.message]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Could not send reply. Please try again.');
      setText(msgText);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isOp = item.role === 'operator';
    return (
      <View style={[s.msgRow, isOp ? s.msgRowOp : s.msgRowGuest]}>
        {!isOp && (
          <View style={s.avatarWrap}>
            <View style={s.avatarBg}>
              <Text style={s.avatarText}>{getInitials(inquiry.customer?.name)}</Text>
            </View>
          </View>
        )}
        <View style={[s.bubble, isOp ? s.bubbleOp : s.bubbleGuest]}>
          <Text style={[s.msgText, isOp ? s.msgTextOp : s.msgTextGuest]}>{item.text}</Text>
          <Text style={[s.timeText, isOp ? s.timeTextOp : s.timeTextGuest]}>
            {formatTime(item.sentAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerName} numberOfLines={1}>
            {inquiry.customer?.name || 'Guest'}
          </Text>
          <Text style={s.headerExp} numberOfLines={1}>
            {inquiry.experience?.title || ''}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Notice */}
      <View style={s.noticeBanner}>
        <MaterialCommunityIcons name="lock-outline" size={12} color="#b45309" />
        <Text style={s.noticeText}>
          Pre-booking enquiry — contact details shared after confirmed booking.
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item._id}
          renderItem={renderMessage}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <MaterialCommunityIcons name="chat-outline" size={44} color={theme.outlineVariant} />
              <Text style={s.emptyText}>No messages yet</Text>
            </View>
          }
        />

        {/* Reply input */}
        <View style={s.inputBar}>
          <TextInput
            style={s.input}
            placeholder="Reply to this guest…"
            placeholderTextColor={theme.textLight}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
            editable={!sending}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!text.trim() || sending) && s.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
            activeOpacity={0.8}
          >
            {sending
              ? <ActivityIndicator color={theme.white} size="small" />
              : <Ionicons name="send" size={16} color={theme.white} />
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Thread list view ────────────────────────────────────────────────────────
export default function InquiriesScreen() {
  const [inquiries, setInquiries]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected]     = useState(null);
  const pollRef                     = useRef(null);

  const fetchInquiries = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await inquiryAPI.getInquiries();
      if (res.data.success) {
        setInquiries(res.data.inquiries || []);
      }
    } catch (err) {
      console.error('Failed to load inquiries:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInquiries();
    pollRef.current = setInterval(() => fetchInquiries(true), 10000);
    return () => clearInterval(pollRef.current);
  }, [fetchInquiries]);

  if (selected) {
    return (
      <ConversationView
        inquiry={selected}
        onBack={() => { setSelected(null); fetchInquiries(true); }}
      />
    );
  }

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const lastMsg = (inq) => {
    const msgs = inq.messages || [];
    return msgs[msgs.length - 1] || null;
  };

  return (
    <View style={s.screen}>
      <FlatList
        data={inquiries}
        keyExtractor={item => item._id}
        renderItem={({ item }) => {
          const last = lastMsg(item);
          const unread = last?.role === 'customer';
          return (
            <TouchableOpacity
              style={s.threadCard}
              onPress={() => setSelected(item)}
              activeOpacity={0.75}
            >
              <View style={s.threadAvatar}>
                <Text style={s.threadAvatarText}>{getInitials(item.customer?.name)}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={s.threadTopRow}>
                  <Text style={[s.threadName, unread && s.threadNameUnread]} numberOfLines={1}>
                    {item.customer?.name || 'Guest'}
                  </Text>
                  {last && (
                    <Text style={s.threadDate}>{formatDate(last.sentAt)}</Text>
                  )}
                </View>
                <Text style={s.threadExp} numberOfLines={1}>
                  {item.experience?.title || 'Experience'}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  {unread && <View style={s.unreadDot} />}
                  {last ? (
                    <Text style={[s.threadPreview, unread && s.threadPreviewUnread]} numberOfLines={1}>
                      {last.role === 'operator' ? 'You: ' : ''}{last.text}
                    </Text>
                  ) : (
                    <Text style={[s.threadPreview, { fontStyle: 'italic' }]}>No messages yet</Text>
                  )}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.outlineVariant} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={s.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchInquiries(true); }}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <MaterialCommunityIcons name="chat-question-outline" size={52} color={theme.outlineVariant} />
            <Text style={s.emptyTitle}>No guest enquiries yet</Text>
            <Text style={s.emptySubtitle}>
              When guests ask questions about your experiences, they'll appear here.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#EDF1EF' },
  screen: { flex: 1, backgroundColor: theme.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: theme.surface,
    borderBottomWidth: 1, borderColor: theme.outlineVariant + '40',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3,
  },
  backBtn:    { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  headerName:   { fontSize: 15, fontWeight: '700', color: theme.text },
  headerExp:    { fontSize: 11, color: theme.textLight, marginTop: 1 },

  // Notice banner
  noticeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fffbeb', borderBottomWidth: 1, borderColor: '#fde68a',
    paddingHorizontal: 16, paddingVertical: 8,
  },
  noticeText: { fontSize: 11, color: '#b45309', flex: 1, lineHeight: 16 },

  // Thread list
  listContainer: { paddingVertical: 8 },
  threadCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.card, paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderColor: theme.cardBorder,
  },
  threadAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: theme.primaryFixed,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12, flexShrink: 0,
  },
  threadAvatarText:  { fontSize: 14, fontWeight: '700', color: theme.primary },
  threadTopRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  threadName:        { fontSize: 14, fontWeight: '600', color: theme.text, flex: 1 },
  threadNameUnread:  { fontWeight: '700' },
  threadDate:        { fontSize: 10, color: theme.textLight, marginLeft: 8 },
  threadExp:         { fontSize: 11, color: theme.primary, marginTop: 2 },
  threadPreview:     { fontSize: 12, color: theme.textLight, flex: 1 },
  threadPreviewUnread: { color: theme.text, fontWeight: '500' },
  unreadDot:         { width: 7, height: 7, borderRadius: 4, backgroundColor: theme.primary, flexShrink: 0 },

  // Message bubbles
  listContent: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 8, gap: 10 },
  msgRow:     { flexDirection: 'row', alignItems: 'flex-end', maxWidth: '85%' },
  msgRowOp:   { alignSelf: 'flex-end' },
  msgRowGuest:{ alignSelf: 'flex-start', gap: 8 },
  avatarWrap: { width: 28, height: 28, borderRadius: 14, overflow: 'hidden' },
  avatarBg:   { width: '100%', height: '100%', backgroundColor: theme.primaryFixed, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: theme.primary, fontSize: 10, fontWeight: '700' },
  bubble: {
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  bubbleOp:    { backgroundColor: theme.primary, borderBottomRightRadius: 2 },
  bubbleGuest: { backgroundColor: theme.surface, borderBottomLeftRadius: 2, borderWidth: 1, borderColor: theme.outlineVariant + '40' },
  msgText:     { fontSize: 14, lineHeight: 20 },
  msgTextOp:   { color: theme.white },
  msgTextGuest:{ color: theme.text },
  timeText:    { fontSize: 9, marginTop: 4, alignSelf: 'flex-end' },
  timeTextOp:  { color: theme.white + 'A0' },
  timeTextGuest:{ color: theme.textLight + '90' },

  // Input bar
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: theme.surface, paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, borderColor: theme.outlineVariant + '40',
  },
  input: {
    flex: 1, backgroundColor: '#EDF1EF',
    borderWidth: 1, borderColor: theme.outlineVariant + '80',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
    maxHeight: 100, color: theme.text, fontSize: 14,
  },
  sendBtn:         { width: 38, height: 38, borderRadius: 19, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center', marginLeft: 8, marginBottom: 2 },
  sendBtnDisabled: { backgroundColor: theme.outlineVariant },

  // Empty states
  emptyWrap: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 80, paddingHorizontal: 32, gap: 12,
  },
  emptyText:     { fontSize: 14, color: theme.textLight },
  emptyTitle:    { fontSize: 17, fontWeight: '700', color: theme.text },
  emptySubtitle: { fontSize: 13, color: theme.textLight, textAlign: 'center', lineHeight: 18 },
});
