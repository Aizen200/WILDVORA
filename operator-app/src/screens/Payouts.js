import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, TextInput, Alert,
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';

const BAR_DATA = [
  { label: 'May', pct: 40, value: '₹4.2k' },
  { label: 'Jun', pct: 65, value: '₹6.8k' },
  { label: 'Jul', pct: 55, value: '₹5.9k' },
  { label: 'Aug', pct: 85, value: '₹9.1k' },
  { label: 'Sep', pct: 70, value: '₹7.4k' },
  { label: 'Oct', pct: 95, value: '₹10.2k', active: true },
];
const BAR_MAX_H = 120;

const PAYOUTS = [
  { id: 'P001', date: 'Oct 14, 2023', ref: 'WV-7829-PAY', status: 'Completed', amount: '₹2,450' },
  { id: 'P002', date: 'Sep 28, 2023', ref: 'WV-7541-PAY', status: 'Completed', amount: '₹3,120' },
  { id: 'P003', date: 'Sep 12, 2023', ref: 'WV-7210-PAY', status: 'Completed', amount: '₹1,980' },
  { id: 'P004', date: 'Aug 28, 2023', ref: 'WV-6992-PAY', status: 'Completed', amount: '₹4,500' },
];

export default function Payouts() {
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankForm, setBankForm] = useState({ name: '', account: '', ifsc: '', bank: '' });
  const [savedBank, setSavedBank] = useState({
    name: 'ADVENTURE OPERATORS LLC', account: '8291', ifsc: 'HDFC0001234', bank: 'HDFC Bank',
  });

  const handleSaveBank = () => {
    if (!bankForm.account.trim() || !bankForm.ifsc.trim()) {
      Alert.alert('Error', 'Please fill in all fields.'); return;
    }
    setSavedBank({ ...bankForm });
    setShowBankModal(false);
    Alert.alert('Saved', 'Bank account updated!');
  };

  return (
    <ScrollView
      style={styles.screen}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      {/* Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Payouts & Earnings</Text>
        <Text style={styles.pageSubtitle}>
          Manage your revenue, track performance, and update payout settings.
        </Text>
      </View>

      {/* Total Earnings card */}
      <View style={styles.earningsCard}>
        <Text style={styles.earningsLabel}>TOTAL EARNINGS</Text>
        <Text style={styles.earningsAmount}>$42,850.00</Text>
        <View style={styles.earningsTrend}>
          <Feather name="trending-up" size={15} color={theme.primaryContainer} />
          <Text style={styles.earningsTrendText}>  +12.5% from last month</Text>
        </View>
      </View>

      {/* Pending payout card */}
      <View style={styles.pendingCard}>
        <Text style={styles.pendingLabel}>PENDING PAYOUT</Text>
        <Text style={styles.pendingAmount}>$3,120.45</Text>
        <View style={styles.rowBetween}>
          <Text style={styles.pendingArrival}>Est. arrival: Oct 24</Text>
          <TouchableOpacity style={styles.detailsBtn}>
            <Text style={styles.detailsBtnText}>Details</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Monthly Performance chart */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>Monthly Performance</Text>
          <View style={styles.periodChip}>
            <Text style={styles.periodChipText}>Last 6 Months</Text>
          </View>
        </View>
        <View style={styles.chartArea}>
          {BAR_DATA.map((d, i) => (
            <View key={i} style={styles.barCol}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: (d.pct / 100) * BAR_MAX_H,
                      backgroundColor: d.active ? theme.primary : theme.primaryFixed + '99',
                    },
                  ]}
                />
              </View>
              <Text style={[styles.barLabel, d.active && { color: theme.text, fontWeight: '700' }]}>
                {d.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Recent Payouts */}
      <View style={styles.card}>
        <View style={[styles.rowBetween, { marginBottom: 16 }]}>
          <Text style={styles.cardTitle}>Recent Payouts</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {/* Table header */}
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.tableHeaderText, { flex: 1.2 }]}>DATE</Text>
          <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>REFERENCE</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>STATUS</Text>
          <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>AMOUNT</Text>
        </View>

        {PAYOUTS.map((p, i) => (
          <View key={p.id} style={[styles.tableRow, i < PAYOUTS.length - 1 && styles.tableRowBorder]}>
            <Text style={[styles.tableCell, { flex: 1.2 }]}>{p.date}</Text>
            <Text style={[styles.tableCellMuted, { flex: 1.5 }]}>{p.ref}</Text>
            <View style={{ flex: 1 }}>
              <View style={styles.completedPill}>
                <Text style={styles.completedPillText}>Completed</Text>
              </View>
            </View>
            <Text style={[styles.tableAmount, { flex: 1, textAlign: 'right' }]}>{p.amount}</Text>
          </View>
        ))}
      </View>

      {/* Payout Account */}
      <View style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Ionicons name="business-outline" size={20} color={theme.primary} />
          <Text style={styles.cardTitle}>Payout Account</Text>
        </View>

        {/* Bank card */}
        <View style={styles.bankCard}>
          <View style={styles.rowBetween}>
            <MaterialCommunityIcons name="credit-card-outline" size={32} color="#fff" />
            <View style={styles.primaryBadge}>
              <Text style={styles.primaryBadgeText}>Primary</Text>
            </View>
          </View>
          <View style={{ marginTop: 20 }}>
            <Text style={styles.bankFieldLabel}>Account Holder</Text>
            <Text style={styles.bankFieldValue}>{savedBank.name}</Text>
          </View>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.bankFieldLabel}>Account Number</Text>
              <Text style={styles.bankFieldValue}>**** **** {savedBank.account.slice(-4)}</Text>
            </View>
            <Ionicons name="card-outline" size={32} color="rgba(255,255,255,0.4)" />
          </View>
        </View>

        <TouchableOpacity style={styles.changeBankBtn} onPress={() => setShowBankModal(true)}>
          <Feather name="edit-2" size={15} color={theme.primary} />
          <Text style={styles.changeBankText}>  Change Bank Details</Text>
        </TouchableOpacity>
        <Text style={styles.scheduleNote}>Next automatic payout scheduled for Oct 21st</Text>
      </View>

      {/* Payout info */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={20} color={theme.secondary} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.infoTitle}>Payout Schedule</Text>
          <Text style={styles.infoText}>
            Earnings are processed every 14 days. Transfer times vary based on your
            financial institution but typically arrive within 3–5 business days.
          </Text>
        </View>
      </View>

      {/* Bank modal */}
      <Modal visible={showBankModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Update Bank Details</Text>
            {[
              { key: 'name',    ph: 'Account Holder Name' },
              { key: 'account', ph: 'Account Number', kt: 'numeric' },
              { key: 'ifsc',    ph: 'IFSC Code' },
              { key: 'bank',    ph: 'Bank Name' },
            ].map(f => (
              <TextInput
                key={f.key}
                style={[styles.input, { marginBottom: 10 }]}
                placeholder={f.ph}
                placeholderTextColor={theme.outlineVariant}
                value={bankForm[f.key]}
                onChangeText={v => setBankForm(prev => ({ ...prev, [f.key]: v }))}
                keyboardType={f.kt || 'default'}
              />
            ))}
            <TouchableOpacity style={styles.sendBtn} onPress={handleSaveBank}>
              <Text style={styles.sendBtnText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelLink} onPress={() => setShowBankModal(false)}>
              <Text style={styles.cancelLinkText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg, paddingHorizontal: 16, paddingTop: 8 },
  pageHeader: { marginBottom: 16, marginTop: 4 },
  pageTitle: { color: theme.text, fontSize: 24, fontWeight: '700' },
  pageSubtitle: { color: theme.textMuted, fontSize: 14, marginTop: 4, lineHeight: 20 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  earningsCard: {
    backgroundColor: theme.card, borderRadius: 24, padding: 22, marginBottom: 14,
    shadowColor: '#1E293B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
  },
  earningsLabel: { color: theme.textLight, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  earningsAmount: { color: theme.primary, fontSize: 36, fontWeight: '800', marginTop: 4 },
  earningsTrend: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  earningsTrendText: { color: theme.primaryContainer, fontSize: 13, fontWeight: '600' },

  pendingCard: {
    backgroundColor: theme.primary, borderRadius: 24, padding: 22, marginBottom: 14,
    shadowColor: theme.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 14, elevation: 5,
    gap: 6,
  },
  pendingLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  pendingAmount: { color: '#FFFFFF', fontSize: 36, fontWeight: '800' },
  pendingArrival: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  detailsBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 99, paddingHorizontal: 16, paddingVertical: 6 },
  detailsBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },

  card: {
    backgroundColor: theme.card, borderRadius: 24, padding: 20, marginBottom: 14,
    shadowColor: '#1E293B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 2,
  },
  cardTitle: { color: theme.text, fontSize: 16, fontWeight: '700' },
  periodChip: { backgroundColor: theme.surfaceContainerLow, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 6 },
  periodChipText: { color: theme.textMuted, fontSize: 12, fontWeight: '600' },
  viewAllText: { color: theme.primary, fontSize: 13, fontWeight: '600' },

  chartArea: {
    flexDirection: 'row', alignItems: 'flex-end',
    height: BAR_MAX_H + 32, marginTop: 16, gap: 6,
  },
  barCol: { flex: 1, alignItems: 'center', gap: 6 },
  barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderTopLeftRadius: 6, borderTopRightRadius: 6, minHeight: 4 },
  barLabel: { color: theme.textLight, fontSize: 11, fontWeight: '500' },

  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  tableHeader: { marginBottom: 4 },
  tableRowBorder: { borderTopWidth: 1, borderTopColor: theme.cardBorder },
  tableHeaderText: { color: theme.textLight, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  tableCell: { color: theme.text, fontSize: 13 },
  tableCellMuted: { color: theme.textMuted, fontSize: 13 },
  tableAmount: { color: theme.text, fontSize: 15, fontWeight: '700' },
  completedPill: { backgroundColor: theme.primaryFixed + '33', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
  completedPillText: { color: theme.primary, fontSize: 11, fontWeight: '600' },

  bankCard: {
    backgroundColor: theme.secondary, borderRadius: 18, padding: 20, gap: 12,
    shadowColor: theme.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 4,
  },
  primaryBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 4 },
  primaryBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  bankFieldLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 11, marginBottom: 2 },
  bankFieldValue: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
  changeBankBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, paddingVertical: 12, borderWidth: 1.5, borderColor: theme.primary, borderRadius: 14 },
  changeBankText: { color: theme.primary, fontSize: 14, fontWeight: '600' },
  scheduleNote: { color: theme.textLight, fontSize: 12, textAlign: 'center', marginTop: 8 },

  infoCard: {
    backgroundColor: '#E8F4FB', borderRadius: 20, padding: 18, marginBottom: 8,
    flexDirection: 'row', alignItems: 'flex-start',
    borderWidth: 1, borderColor: '#C2E8FF',
  },
  infoTitle: { color: theme.secondary, fontSize: 13, fontWeight: '700', marginBottom: 4 },
  infoText: { color: theme.textMuted, fontSize: 13, lineHeight: 18 },

  modalOverlay: { flex: 1, backgroundColor: '#00000055', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: theme.card, borderRadius: 24, padding: 24, margin: 16 },
  modalTitle: { color: theme.text, fontSize: 18, fontWeight: '700', marginBottom: 14 },
  input: { backgroundColor: theme.surfaceContainerLow, borderRadius: 14, padding: 14, color: theme.text, fontSize: 14 },
  sendBtn: { backgroundColor: theme.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  sendBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  cancelLink: { marginTop: 12, alignItems: 'center' },
  cancelLinkText: { color: theme.textLight, fontWeight: '600', fontSize: 14 },
});