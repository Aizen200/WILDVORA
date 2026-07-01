import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { inquiryAPI } from '../services/api';
import Alert from '../utils/alert';

const C = {
  primary:          '#1A5F45',
  primaryContainer: '#338263',
  onPrimaryContainer: '#f5fff7',
  background:       '#f7faf6',
  surface:          '#ffffff',
  onSurface:        '#181d1a',
  onSurfaceVariant: '#3f4943',
  outline:          '#6f7a73',
  outlineVariant:   '#bec9c1',
  white:            '#ffffff',
  chatBg:           '#EDF1EF',
};

const getInitials = (name) => {
  if (!name) return 'H';
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
};

export default function InquiryChatScreen({ route, navigation }) {
  const { experienceId, hostName, experienceTitle } = route.params;
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);

  const [inquiryId,  setInquiryId]  = useState(null);
  const [messages,   setMessages]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [text,       setText]       = useState('');
  const [sending,    setSending]    = useState(false);

  const fetchInquiry = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await inquiryAPI.getOrCreate(experienceId);
      if (res.data.success) {
        setInquiryId(res.data.inquiry._id);
        setMessages(res.data.inquiry.messages || []);
      }
    } catch (err) {
      console.error('Error loading inquiry:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [experienceId]);

  useEffect(() => {
    fetchInquiry();
    const interval = setInterval(() => fetchInquiry(true), 5000);
    return () => clearInterval(interval);
  }, [fetchInquiry]);

  const handleSend = async () => {
    if (!text.trim() || sending || !inquiryId) return;

    const messageText = text.trim();
    setText('');
    setSending(true);

    try {
      const res = await inquiryAPI.sendMessage(inquiryId, messageText);
      if (res.data.success) {
        setMessages(prev => [...prev, res.data.message]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not send message. Please try again.');
      setText(messageText);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.role === 'customer';
    return (
      <View style={[s.msgRow, isMe ? s.msgRowMe : s.msgRowHost]}>
        {!isMe && (
          <View style={s.avatarWrap}>
            <View style={s.avatarFallback}>
              <Text style={s.avatarText}>{getInitials(hostName)}</Text>
            </View>
          </View>
        )}
        <View style={[s.bubble, isMe ? s.bubbleMe : s.bubbleHost]}>
          <Text style={[s.msgText, isMe ? s.msgTextMe : s.msgTextHost]}>{item.text}</Text>
          <Text style={[s.timeText, isMe ? s.timeTextMe : s.timeTextHost]}>
            {new Date(item.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Ionicons name="arrow-back" size={24} color={C.onSurface} />
        </TouchableOpacity>
        <View style={s.headerTitleWrap}>
          <Text style={s.headerTitle} numberOfLines={1}>{hostName || 'Experience Host'}</Text>
          <Text style={s.headerSubtitle} numberOfLines={1}>{experienceTitle || 'Pre-booking enquiry'}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Pre-booking notice banner */}
      <View style={s.noticeBanner}>
        <MaterialCommunityIcons name="lock-outline" size={13} color="#b45309" />
        <Text style={s.noticeText}>
          Direct contact details are shared only after a confirmed booking.
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {loading && messages.length === 0 ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={s.loadingText}>Loading conversation…</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item._id}
            renderItem={renderMessage}
            contentContainerStyle={[s.listContent, { paddingBottom: insets.bottom + 16 }]}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); fetchInquiry(true); }}
                tintColor={C.primary}
              />
            }
            ListEmptyComponent={
              <View style={s.emptyState}>
                <MaterialCommunityIcons name="chat-question-outline" size={52} color={C.outline} />
                <Text style={s.emptyTitle}>Ask the host anything</Text>
                <Text style={s.emptySubtitle}>
                  Questions about dates, group size, what to bring — the host will respond here.
                </Text>
              </View>
            }
          />
        )}

        {/* Input bar */}
        <View style={[s.inputBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <TextInput
            style={s.input}
            placeholder="Ask about dates, safety, what to bring…"
            placeholderTextColor={C.outline}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
            editable={!sending}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!text.trim() || !inquiryId) && s.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending || !inquiryId}
            activeOpacity={0.8}
          >
            {sending ? (
              <ActivityIndicator color={C.white} size="small" />
            ) : (
              <Ionicons name="send" size={16} color={C.white} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.chatBg },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: C.onSurfaceVariant, fontSize: 14 },

  header: {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'space-between',
    paddingHorizontal: 16,
    paddingVertical:  12,
    backgroundColor:  C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.outlineVariant + '40',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitleWrap: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  headerTitle:     { fontSize: 16, fontWeight: '700', color: C.onSurface },
  headerSubtitle:  { fontSize: 11, color: C.onSurfaceVariant, marginTop: 2 },

  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fffbeb',
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  noticeText: { fontSize: 12, color: '#b45309', flex: 1, lineHeight: 17 },

  listContent: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },

  msgRow:     { flexDirection: 'row', alignItems: 'flex-end', maxWidth: '85%' },
  msgRowMe:   { alignSelf: 'flex-end' },
  msgRowHost: { alignSelf: 'flex-start', gap: 8 },

  avatarWrap:    { width: 28, height: 28, borderRadius: 14, overflow: 'hidden' },
  avatarFallback:{ width: '100%', height: '100%', backgroundColor: C.primaryContainer, justifyContent: 'center', alignItems: 'center' },
  avatarText:    { color: C.onPrimaryContainer, fontSize: 10, fontWeight: '700' },

  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  bubbleMe:   { backgroundColor: C.primary, borderBottomRightRadius: 2 },
  bubbleHost: { backgroundColor: C.surface, borderBottomLeftRadius: 2, borderWidth: 1, borderColor: C.outlineVariant + '40' },

  msgText:     { fontSize: 14, lineHeight: 20 },
  msgTextMe:   { color: C.white },
  msgTextHost: { color: C.onSurface },
  timeText:    { fontSize: 9, marginTop: 4, alignSelf: 'flex-end' },
  timeTextMe:  { color: C.white + 'A0' },
  timeTextHost:{ color: C.onSurfaceVariant + '90' },

  emptyState: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 80, paddingHorizontal: 32, gap: 12,
  },
  emptyTitle:    { fontSize: 17, fontWeight: '700', color: C.onSurface },
  emptySubtitle: { fontSize: 13, color: C.onSurfaceVariant, textAlign: 'center', lineHeight: 18 },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: C.surface, paddingHorizontal: 12, paddingTop: 8,
    borderTopWidth: 1, borderTopColor: C.outlineVariant + '40',
  },
  input: {
    flex: 1, backgroundColor: C.chatBg + '60',
    borderWidth: 1, borderColor: C.outlineVariant + '80',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
    maxHeight: 100, color: C.onSurface, fontSize: 14,
  },
  sendBtn:         { width: 38, height: 38, borderRadius: 19, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', marginLeft: 8, marginBottom: 2 },
  sendBtnDisabled: { backgroundColor: C.outlineVariant },
});
