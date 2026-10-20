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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import { useCampaignStore } from '../../store/useCampaignStore';
import { useDraftStore } from '../../store/useDraftStore';
import { usePreferencesStore } from '../../store/usePreferencesStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DemoDataBadge } from '../../components/ui/DemoDataBadge';
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatting';
import { BrandLogo } from '../../components/ui/BrandLogo';
import { colors, fonts, tokens } from '../../theme/tokens';

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
    if (user) {
      return contributions.filter((c) => c.userId === user.uid || (user.email && c.guestEmail === user.email));
    }
    // Guest: only show contributions made by guest on this device/session (exclude seed demo data)
    return contributions.filter(
      (c) =>
        !c.userId &&
        Boolean(c.guestEmail) &&
        !['con-1', 'con-2', 'con-3', 'con-4', 'con-5'].includes(c.id)
    );
  }, [contributions, user]);

  // Saved campaigns from preferences store
  const savedCampaigns = useMemo(() => {
    return storeCampaigns.filter((c) => savedCampaignIds.includes(c.id));
  }, [storeCampaigns, savedCampaignIds]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header */}
      <View
        style={{
          paddingTop: 52,
          paddingBottom: 14,
          paddingHorizontal: 20,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <BrandLogo size="sm" showWordmark={false} />
          <Text style={{ fontSize: 24, fontFamily: fonts.serifBold, color: colors.ink }}>
            Profile & Account
          </Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Open settings modal"
          onPress={() => setShowSettingsModal(true)}
          style={{
            width: 36,
            height: 36,
            borderRadius: tokens.radii.xs,
            backgroundColor: colors.surfaceSecondary,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="settings-outline" size={18} color={colors.inkSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 90 }} showsVerticalScrollIndicator={false}>
        {/* 1. Account / Guest Section */}
        {user ? (
          <Card style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: tokens.radii.xs,
                  backgroundColor: colors.surfaceSecondary,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                }}
              >
                <Ionicons name="person-outline" size={24} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 16, fontFamily: fonts.serifSemiBold, color: colors.ink }}>
                    {user.name}
                  </Text>
                  <View style={{ backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 6, paddingVertical: 1, borderRadius: tokens.radii.xs }}>
                    <Text style={{ fontSize: 9, fontFamily: fonts.sansBold, color: colors.positive, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Active
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary, marginTop: 2 }}>
                  {user.email}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Button
                  title="Dashboard"
                  onPress={() => navigation.navigate('CreatorDashboard')}
                  size="sm"
                  variant="primary"
                  fullWidth
                />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
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
                  fullWidth
                />
              </View>
            </View>
          </Card>
        ) : (
          <Card style={{ marginBottom: 16, backgroundColor: colors.surfaceSecondary }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Ionicons name="globe-outline" size={18} color={colors.accent} />
              <Text style={{ fontSize: 15, fontFamily: fonts.serifSemiBold, color: colors.ink }}>
                Browsing as a Guest
              </Text>
            </View>
            <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary, lineHeight: 18, marginBottom: 12 }}>
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

        {/* 2. Created Campaigns & Creator Dashboard Shortcut - Authenticated Only */}
        {user ? (
          <Card style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8 }}>
              <Text style={{ fontSize: 16, fontFamily: fonts.serifSemiBold, color: colors.ink, flex: 1, minWidth: 0 }} numberOfLines={1}>
                Your Campaigns
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Open creator dashboard"
                onPress={() => navigation.navigate('CreatorDashboard')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={{ fontSize: 12, fontFamily: fonts.sansSemiBold, color: colors.accent }}>Dashboard →</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary, marginBottom: 12 }}>
              Manage in-progress drafts, monitor moderation review feedback, and view delivery reports.
            </Text>

            {/* Newspaper Stat Heroes */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, padding: 12, borderRadius: tokens.radii.xs }}>
                <Text style={{ fontSize: 20, fontFamily: fonts.serifBold, color: colors.ink }}>{drafts.length}</Text>
                <Text style={{ fontSize: 9, fontFamily: fonts.sansBold, color: colors.inkMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 }}>Local Drafts</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, padding: 12, borderRadius: tokens.radii.xs }}>
                <Text style={{ fontSize: 20, fontFamily: fonts.serifBold, color: colors.accent }}>
                  {storeCampaigns.filter((c) => (c.creatorId === user.uid || (c as any).created_by === user.uid) && c.status === 'submitted').length}
                </Text>
                <Text style={{ fontSize: 9, fontFamily: fonts.sansBold, color: colors.inkMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 }}>In Review</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, padding: 12, borderRadius: tokens.radii.xs }}>
                <Text style={{ fontSize: 20, fontFamily: fonts.serifBold, color: colors.positive }}>
                  {storeCampaigns.filter((c) => (c.creatorId === user.uid || (c as any).created_by === user.uid) && ['available_for_funding', 'goal_reached'].includes(c.status)).length}
                </Text>
                <Text style={{ fontSize: 9, fontFamily: fonts.sansBold, color: colors.inkMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 }}>Published</Text>
              </View>
            </View>
          </Card>
        ) : null}

        {/* 3. Backed Campaigns */}
        <Card style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontSize: 16, fontFamily: fonts.serifSemiBold, color: colors.ink }}>
              Backed Campaigns
            </Text>
            {user ? <DemoDataBadge size="sm" /> : null}
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
                    borderBottomColor: colors.border,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={{ fontSize: 14, fontFamily: fonts.serifSemiBold, color: colors.ink }} numberOfLines={1}>
                        {camp?.title || 'Community Campaign'}
                      </Text>
                      <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary, marginTop: 2 }}>
                        Backed {formatCurrency(con.amount)} • {con.showName ? 'Public backer' : 'Private (Name hidden)'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setActiveReceipt(con)}
                      style={{
                        backgroundColor: colors.surfaceSecondary,
                        borderWidth: 1,
                        borderColor: colors.border,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: tokens.radii.xs,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontFamily: fonts.sansMedium, color: colors.inkSecondary }}>Receipt</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={{ paddingVertical: 14, alignItems: 'center' }}>
              <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkMuted }}>
                You haven't backed any campaigns yet.
              </Text>
            </View>
          )}
        </Card>

        {/* 4. Saved Campaigns */}
        <Card style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontSize: 16, fontFamily: fonts.serifSemiBold, color: colors.ink }}>
              Saved Campaigns ({savedCampaigns.length})
            </Text>
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
                  borderBottomColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 13, fontFamily: fonts.sansMedium, color: colors.ink, flex: 1, marginRight: 10 }} numberOfLines={1}>
                  {camp.title}
                </Text>
                <Ionicons name="chevron-forward" size={15} color={colors.inkMuted} />
              </TouchableOpacity>
            ))
          ) : (
            <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkMuted, fontStyle: 'italic' }}>
              Tap the bookmark icon on any campaign to save it here for quick access.
            </Text>
          )}
        </Card>

        {/* 5. Payment History & Receipts */}
        <Card style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontSize: 16, fontFamily: fonts.serifSemiBold, color: colors.ink }}>
              Payment History (Own Transactions)
            </Text>
          </View>
          <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary, marginBottom: 10 }}>
            Receipts for payments originating from this account or session.
          </Text>

          {myContributions.length > 0 ? (
            myContributions.map((c, i) => (
              <TouchableOpacity
                key={c.id || i}
                onPress={() => setActiveReceipt(c)}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 10,
                  borderBottomWidth: i < myContributions.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                }}
              >
                <View>
                  <Text style={{ fontSize: 14, fontFamily: fonts.serifSemiBold, color: colors.ink }}>
                    {formatCurrency(c.total || c.amount + 1.75)}
                  </Text>
                  <Text style={{ fontSize: 11, fontFamily: fonts.sansRegular, color: colors.inkSecondary, marginTop: 1 }}>
                    {c.receiptNo || `REC-2026-${1000 + i}`} • {formatDate(c.createdAt)}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 6, paddingVertical: 2, borderRadius: tokens.radii.xs }}>
                    <Text style={{ fontSize: 10, fontFamily: fonts.sansBold, color: colors.positive }}>Succeeded</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={colors.inkMuted} />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={{ paddingVertical: 12, alignItems: 'center' }}>
              <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkMuted }}>
                No transaction receipts for this device yet.
              </Text>
            </View>
          )}
        </Card>

        {/* 6. Help & About Directory (Info Pages) */}
        <Card style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontFamily: fonts.serifSemiBold, color: colors.ink, marginBottom: 12 }}>
            Help, Policies & Information
          </Text>

          <View style={{ gap: 2 }}>
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
                  borderBottomColor: colors.border,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name={item.icon as any} size={16} color={colors.inkSecondary} />
                  <Text style={{ fontSize: 13, fontFamily: fonts.sansMedium, color: colors.ink }}>
                    {item.title}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={15} color={colors.inkMuted} />
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
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: tokens.radii.lg, borderTopRightRadius: tokens.radii.lg, padding: 20, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 17, fontFamily: fonts.serifSemiBold, color: colors.ink }}>Digital Receipt</Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Close receipt modal"
                onPress={() => setActiveReceipt(null)}
              >
                <Ionicons name="close" size={20} color={colors.inkSecondary} />
              </TouchableOpacity>
            </View>

            {activeReceipt && (
              <View style={{ gap: 10, marginBottom: 20 }}>
                <View style={{ backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, padding: 12, borderRadius: tokens.radii.xs }}>
                  <Text style={{ fontSize: 11, fontFamily: fonts.sansRegular, color: colors.inkSecondary }}>Receipt Reference</Text>
                  <Text style={{ fontSize: 14, fontFamily: fonts.sansBold, color: colors.ink, marginTop: 2 }}>
                    #{activeReceipt.receiptNo || 'REC-2026-DEMO'}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, fontFamily: fonts.sansRegular, color: colors.inkSecondary }}>Date & Time</Text>
                  <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.ink }}>
                    {formatDate(activeReceipt.createdAt)}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, fontFamily: fonts.sansRegular, color: colors.inkSecondary }}>Contribution</Text>
                  <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.ink }}>
                    {formatCurrency(activeReceipt.amount)}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, fontFamily: fonts.sansRegular, color: colors.inkSecondary }}>Payment Processing Fee</Text>
                  <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.ink }}>
                    {formatCurrency(activeReceipt.fee || 1.75)}
                  </Text>
                </View>

                <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 4 }} />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 14, fontFamily: fonts.serifBold, color: colors.ink }}>Total Paid</Text>
                  <Text style={{ fontSize: 17, fontFamily: fonts.serifBold, color: colors.accent }}>
                    {formatCurrency(activeReceipt.total || activeReceipt.amount + 1.75)}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, fontFamily: fonts.sansRegular, color: colors.inkSecondary }}>Privacy Status</Text>
                  <Text style={{ fontSize: 13, fontFamily: fonts.sansBold, color: colors.positive }}>
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
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: tokens.radii.lg, borderTopRightRadius: tokens.radii.lg, padding: 20, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 17, fontFamily: fonts.serifSemiBold, color: colors.ink }}>
                Account Settings
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Close settings modal"
                onPress={() => setShowSettingsModal(false)}
              >
                <Ionicons name="close" size={20} color={colors.inkSecondary} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 16, marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.ink }}>
                    Keep Backer Name Private by Default
                  </Text>
                  <Text style={{ fontSize: 11, fontFamily: fonts.sansRegular, color: colors.inkSecondary, marginTop: 2 }}>
                    Ensure new contributions hide your name automatically.
                  </Text>
                </View>
                <Switch
                  value={privacyDefaultOn}
                  onValueChange={setPrivacyDefaultOn}
                  trackColor={{ false: colors.border, true: colors.accent }}
                />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.ink }}>
                    Funding Milestone Notifications
                  </Text>
                  <Text style={{ fontSize: 11, fontFamily: fonts.sansRegular, color: colors.inkSecondary, marginTop: 2 }}>
                    Alerts at 25%, 50%, 75%, and 100% funding.
                  </Text>
                </View>
                <Switch
                  value={preferences.fundingMilestones}
                  onValueChange={(val) => setPref('fundingMilestones', val)}
                  trackColor={{ false: colors.border, true: colors.accent }}
                />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.ink }}>
                    Delivery Report Notifications
                  </Text>
                  <Text style={{ fontSize: 11, fontFamily: fonts.sansRegular, color: colors.inkSecondary, marginTop: 2 }}>
                    Notifies you when measured ad telemetry is published.
                  </Text>
                </View>
                <Switch
                  value={preferences.deliveryReports}
                  onValueChange={(val) => setPref('deliveryReports', val)}
                  trackColor={{ false: colors.border, true: colors.accent }}
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
