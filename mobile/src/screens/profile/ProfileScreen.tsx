import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Modal,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import { useCampaignStore } from '../../store/useCampaignStore';
import { useDraftStore } from '../../store/useDraftStore';
import { usePreferencesStore } from '../../store/usePreferencesStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DemoDataBadge } from '../../components/ui/DemoDataBadge';
import { formatCurrency, formatNumber, formatDate, timeAgo } from '../../utils/formatting';
import { INFO_PAGES } from '../info/InfoScreen';

export function ProfileScreen({ navigation }: any) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const storeCampaigns = useCampaignStore((s) => s.campaigns);
  const contributions = useCampaignStore((s) => s.contributions);
  const draftsMap = useDraftStore((s) => s.drafts);
  const drafts = useMemo(() => {
    return Object.values(draftsMap).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [draftsMap]);
  const savedCampaignIds = usePreferencesStore((s) => s.savedCampaignIds);
  const preferences = usePreferencesStore((s) => s.notificationPrefs);
  const setPref = usePreferencesStore((s) => s.setNotificationPref);

  // Modals
  const [activeReceipt, setActiveReceipt] = useState<any | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [privacyDefaultOn, setPrivacyDefaultOn] = useState(true); // Default ON per platform policy

  // Contributions for this user/device
  const myContributions = useMemo(() => {
    return user
      ? contributions.filter((c) => c.userId === user.uid || c.userId === 'demo-user')
      : contributions.slice(0, 3); // Show local prototype contributions for guest
  }, [contributions, user]);

  // Saved campaigns from preferences store
  const savedCampaigns = useMemo(() => {
    return storeCampaigns.filter((c) => savedCampaignIds.includes(c.id));
  }, [storeCampaigns, savedCampaignIds]);

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header */}
      <View
        style={{
          paddingTop: 52,
          paddingBottom: 14,
          paddingHorizontal: 20,
          backgroundColor: '#fff',
          borderBottomWidth: 1,
          borderBottomColor: '#f1f5f9',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: '800', color: '#0f172a' }}>
          Profile & Account
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Open settings modal"
          onPress={() => setShowSettingsModal(true)}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: '#f1f5f9',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="settings-outline" size={20} color="#475569" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 90 }} showsVerticalScrollIndicator={false}>
        {/* 1. Account / Guest Section */}
        {user ? (
          <Card style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 27,
                  backgroundColor: '#eef2ff',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                }}
              >
                <Ionicons name="person" size={28} color="#4f46e5" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 17, fontWeight: '800', color: '#0f172a' }}>
                    {user.name}
                  </Text>
                  <View style={{ backgroundColor: '#dcfce7', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#16a34a', textTransform: 'uppercase' }}>
                      Active
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                  {user.email}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
              <View style={{ flex: 1 }}>
                <Button
                  title="Creator Dashboard"
                  onPress={() => navigation.navigate('CreatorDashboard')}
                  size="sm"
                  variant="primary"
                  icon="speedometer-outline"
                  fullWidth
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title="Sign Out"
                  onPress={() => {
                    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Sign Out', style: 'destructive', onPress: logout },
                    ]);
                  }}
                  size="sm"
                  variant="outline"
                  icon="log-out-outline"
                  fullWidth
                />
              </View>
            </View>
          </Card>
        ) : (
          <Card style={{ marginBottom: 16, backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Ionicons name="globe-outline" size={20} color="#2563eb" />
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#1d4ed8' }}>
                Browsing as a Guest
              </Text>
            </View>
            <Text style={{ fontSize: 13, color: '#1e40af', lineHeight: 18, marginBottom: 12 }}>
              You can browse campaigns and back messages without an account. Sign in to synchronize your drafts and track campaign creation across devices.
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Button
                  title="Sign In"
                  onPress={() => navigation.navigate('Login')}
                  size="sm"
                  variant="primary"
                  fullWidth
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title="Create Account"
                  onPress={() => navigation.navigate('Register')}
                  size="sm"
                  variant="outline"
                  fullWidth
                />
              </View>
            </View>
          </Card>
        )}

        {/* 2. Created Campaigns & Creator Dashboard Shortcut */}
        <Card style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="create-outline" size={20} color="#4f46e5" />
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>
                Created Campaigns & Drafts
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('CreatorDashboard')}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#4f46e5' }}>Dashboard →</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
            Manage in-progress drafts, monitor moderation review feedback, and view delivery reports.
          </Text>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 12, borderRadius: 10 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a' }}>{drafts.length}</Text>
              <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Local Drafts</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 12, borderRadius: 10 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#4f46e5' }}>
                {storeCampaigns.filter((c) => c.status === 'submitted').length}
              </Text>
              <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>In Review</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 12, borderRadius: 10 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#16a34a' }}>
                {storeCampaigns.filter((c) => ['available_for_funding', 'goal_reached'].includes(c.status)).length}
              </Text>
              <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Published</Text>
            </View>
          </View>
        </Card>

        {/* 3. Backed Campaigns */}
        <Card style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="heart-outline" size={20} color="#e11d48" />
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>
                Backed Campaigns
              </Text>
            </View>
            <DemoDataBadge size="sm" />
          </View>

          {myContributions.length > 0 ? (
            myContributions.map((con, idx) => {
              const camp = storeCampaigns.find((c) => c.id === con.campaignId);
              return (
                <View
                  key={con.id || idx}
                  style={{
                    paddingVertical: 10,
                    borderBottomWidth: idx < myContributions.length - 1 ? 1 : 0,
                    borderBottomColor: '#f1f5f9',
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }} numberOfLines={1}>
                        {camp?.title || 'Community Campaign'}
                      </Text>
                      <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                        Backed {formatCurrency(con.amount)} • {con.showName ? 'Public backer' : 'Private (Name hidden)'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setActiveReceipt(con)}
                      style={{
                        backgroundColor: '#f1f5f9',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '600', color: '#475569' }}>Receipt</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={{ paddingVertical: 14, alignItems: 'center' }}>
              <Text style={{ fontSize: 13, color: '#94a3b8' }}>
                You haven't backed any campaigns yet.
              </Text>
            </View>
          )}
        </Card>

        {/* 4. Saved Campaigns */}
        <Card style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="bookmark-outline" size={20} color="#4f46e5" />
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>
                Saved Campaigns ({savedCampaigns.length})
              </Text>
            </View>
          </View>

          {savedCampaigns.length > 0 ? (
            savedCampaigns.map((camp, idx) => (
              <TouchableOpacity
                key={camp.id}
                onPress={() => navigation.navigate('CampaignDetail', { campaignId: camp.id })}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 8,
                  borderBottomWidth: idx < savedCampaigns.length - 1 ? 1 : 0,
                  borderBottomColor: '#f1f5f9',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#0f172a', flex: 1, marginRight: 10 }} numberOfLines={1}>
                  {camp.title}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
              </TouchableOpacity>
            ))
          ) : (
            <Text style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>
              Tap the bookmark icon on any campaign to save it here for quick access.
            </Text>
          )}
        </Card>

        {/* 5. Payment History & Receipts */}
        <Card style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="receipt-outline" size={20} color="#059669" />
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>
                Payment History (Own Transactions)
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
            Receipts for payments originating from this account or session.
          </Text>

          {myContributions.map((c, i) => (
            <TouchableOpacity
              key={c.id || i}
              onPress={() => setActiveReceipt(c)}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 10,
                borderBottomWidth: i < myContributions.length - 1 ? 1 : 0,
                borderBottomColor: '#f1f5f9',
              }}
            >
              <View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }}>
                  {formatCurrency(c.total || c.amount + 1.75)}
                </Text>
                <Text style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
                  {c.receiptNo || `REC-2026-${1000 + i}`} • {formatDate(c.createdAt)}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ backgroundColor: '#dcfce7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#16a34a' }}>Succeeded</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color="#94a3b8" />
              </View>
            </TouchableOpacity>
          ))}
        </Card>

        {/* 6. Help & About Directory (Info Pages) */}
        <Card style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 12 }}>
            Help, Policies & Information
          </Text>

          <View style={{ gap: 6 }}>
            {[
              { slug: 'about', title: 'About Campaign Amplifier', icon: 'information-circle-outline' },
              { slug: 'how-it-works', title: 'How It Works (Sequence & Rules)', icon: 'git-network-outline' },
              { slug: 'faqs', title: 'Frequently Asked Questions', icon: 'help-circle-outline' },
              { slug: 'help', title: 'Help & Support', icon: 'headset-outline' },
              { slug: 'contact', title: 'Contact Team', icon: 'mail-outline' },
              { slug: 'terms', title: 'Terms of Service', icon: 'document-text-outline' },
              { slug: 'privacy', title: 'Privacy Policy & Backer Anonymity', icon: 'shield-checkmark-outline' },
              { slug: 'community-guidelines', title: 'Community Guidelines', icon: 'people-outline' },
              { slug: 'fees-and-refunds', title: 'Fees & Refund Policy', icon: 'cash-outline' },
            ].map((item) => (
              <TouchableOpacity
                key={item.slug}
                onPress={() => navigation.navigate('InfoPage', { slug: item.slug })}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: '#f8fafc',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name={item.icon as any} size={18} color="#64748b" />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155' }}>
                    {item.title}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
              </TouchableOpacity>
            ))}
          </View>
        </Card>
      </ScrollView>

      {/* Digital Receipt Modal */}
      <Modal
        visible={!!activeReceipt}
        animationType="slide"
        transparent
        onRequestClose={() => setActiveReceipt(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="receipt-outline" size={20} color="#4f46e5" />
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a' }}>Digital Receipt</Text>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Close receipt modal"
                onPress={() => setActiveReceipt(null)}
              >
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            {activeReceipt && (
              <View style={{ gap: 10, marginBottom: 20 }}>
                <View style={{ backgroundColor: '#f1f5f9', padding: 12, borderRadius: 10 }}>
                  <Text style={{ fontSize: 11, color: '#64748b' }}>Receipt Reference</Text>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a', marginTop: 2 }}>
                    #{activeReceipt.receiptNo || 'REC-2026-DEMO'}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: '#64748b' }}>Date & Time</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#0f172a' }}>
                    {formatDate(activeReceipt.createdAt)}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: '#64748b' }}>Contribution</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#0f172a' }}>
                    {formatCurrency(activeReceipt.amount)}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: '#64748b' }}>Payment Processing Fee</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#0f172a' }}>
                    {formatCurrency(activeReceipt.fee || 1.75)}
                  </Text>
                </View>

                <View style={{ height: 1, backgroundColor: '#f1f5f9', marginVertical: 4 }} />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a' }}>Total Paid</Text>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#4f46e5' }}>
                    {formatCurrency(activeReceipt.total || activeReceipt.amount + 1.75)}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: '#64748b' }}>Privacy Status</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#059669' }}>
                    {activeReceipt.showName ? 'Public' : 'Private by default (Name hidden)'}
                  </Text>
                </View>
              </View>
            )}

            <Button
              title="Close Receipt"
              onPress={() => setActiveReceipt(null)}
              variant="secondary"
              fullWidth
            />
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a' }}>
                Account Settings
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Close settings modal"
                onPress={() => setShowSettingsModal(false)}
              >
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 16, marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>
                    Keep Backer Name Private by Default
                  </Text>
                  <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    Ensure new contributions hide your name automatically.
                  </Text>
                </View>
                <Switch
                  value={privacyDefaultOn}
                  onValueChange={setPrivacyDefaultOn}
                  trackColor={{ false: '#cbd5e1', true: '#4f46e5' }}
                />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>
                    Funding Milestone Notifications
                  </Text>
                  <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    Alerts at 25%, 50%, 75%, and 100% funding.
                  </Text>
                </View>
                <Switch
                  value={preferences.fundingMilestones}
                  onValueChange={(val) => setPref('fundingMilestones', val)}
                  trackColor={{ false: '#cbd5e1', true: '#4f46e5' }}
                />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>
                    Delivery Report Notifications
                  </Text>
                  <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    Notifies you when measured ad telemetry is published.
                  </Text>
                </View>
                <Switch
                  value={preferences.deliveryReports}
                  onValueChange={(val) => setPref('deliveryReports', val)}
                  trackColor={{ false: '#cbd5e1', true: '#4f46e5' }}
                />
              </View>
            </View>

            <Button
              title="Done"
              onPress={() => setShowSettingsModal(false)}
              variant="primary"
              fullWidth
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
