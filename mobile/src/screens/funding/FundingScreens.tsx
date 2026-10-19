import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Alert,
  ScrollView,
  Switch,
  ActivityIndicator,
  Share,
  KeyboardAvoidingView,
  Platform,
  AccessibilityInfo,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useCampaignStore } from '../../store/useCampaignStore';
import { useAuthStore } from '../../store/useAuthStore';
import { usePreferencesStore } from '../../store/usePreferencesStore';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { formatCurrency, formatNumber } from '../../utils/formatting';
import { AmplificationNotice } from '../../components/campaign/AmplificationNotice';
import { DemoDataBadge } from '../../components/ui/DemoDataBadge';
import { demoConfig } from '../../config/demoConfig';
import { estimateReach, calculateBackerFee } from '../../services/reach';
import { apiClient } from '../../api/client';
import { colors, fonts, tokens } from '../../theme/tokens';

export function FundCampaignScreen({ route, navigation }: any) {
  const { campaignId, initialAmount } = route.params;
  const campaigns = useCampaignStore((s) => s.campaigns);
  const campaign = useMemo(
    () => campaigns.find((c) => c.id === campaignId || c.slug === campaignId),
    [campaigns, campaignId]
  );
  const addContribution = useCampaignStore((s) => s.addContribution);
  const user = useAuthStore((s) => s.user);

  // Steps: 1 = Amount & Inspect, 2 = Review & Fees, 3 = Simulated Checkout
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [selectedPreset, setSelectedPreset] = useState<number>(initialAmount || 50);
  const [customAmount, setCustomAmount] = useState('');
  const [showName, setShowName] = useState(false); // DEFAULT OFF per brief!
  const [guestEmail, setGuestEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInspectModal, setShowInspectModal] = useState(false);

  // Simulation State
  const [simulationState, setSimulationState] = useState<
    'idle' | 'pending' | 'failed' | 'cancelled'
  >('idle');
  const [simulationMessage, setSimulationMessage] = useState<string | null>(null);

  if (!campaign) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <Text style={{ fontSize: 16, fontFamily: fonts.serifBold, color: colors.ink }}>Campaign not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 12 }}>
          <Text style={{ color: colors.accent, fontFamily: fonts.sansSemiBold }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const dollars = customAmount ? parseFloat(customAmount) || 0 : selectedPreset;
  const { fee, total } = calculateBackerFee(dollars);
  const reachCalc = estimateReach(dollars);
  const remaining = Math.max(0, campaign.fundingGoal - campaign.amountRaised);

  // Fee calculation breakdown:
  // Payment fee: 2.9% + $0.30
  // Platform fee: 5% included from contribution towards moderation & platform operations
  const platformFee = Number((dollars * demoConfig.platformFeePct).toFixed(2));
  const netAdBudget = Number((dollars - platformFee).toFixed(2));

  // Step 1 Validation -> Next
  const handleProceedToReview = () => {
    if (dollars < 1) {
      Alert.alert('Invalid Amount', 'Minimum backer contribution is $1.00.');
      return;
    }
    setStep(2);
  };

  // Execute Simulated Payment Outcome
  const handleSimulatePayment = async (
    outcome: 'success' | 'pending' | 'failed' | 'cancelled'
  ) => {
    if (dollars < 1) {
      Alert.alert('Invalid Amount', 'Contribution must be at least $1.00.');
      return;
    }

    setLoading(true);
    setSimulationMessage(null);

    try {
      // 1. Create contribution on server (or offline fallback)
      const contrib = await apiClient.createContribution({
        campaignId: campaign.id,
        amount: dollars,
        showName,
        guestEmail: user?.email || guestEmail.trim() || null,
      });

      // 2. Call simulate payment endpoint
      const result = await apiClient.simulatePayment({
        contributionId: contrib.id,
        outcome,
      });

      setLoading(false);

      if (outcome === 'success') {
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}

        // Increment locally in Zustand store so UI updates immediately
        addContribution({
          campaignId: campaign.id,
          amount: dollars,
          userId: user?.uid || null,
          backerName: showName ? user?.name || 'Community Backer' : 'Anonymous',
          showName,
          guestEmail: user?.email || guestEmail.trim() || null,
        });

        navigation.replace('ThankYou', {
          campaignId: campaign.id,
          amount: dollars,
          receiptNo: result.receiptNo || contrib.receiptNo,
          estimatedReach: reachCalc.estimate,
          fee,
          total,
          paymentStatus: 'succeeded',
        });
      } else if (outcome === 'pending') {
        setSimulationState('pending');
        setSimulationMessage(
          'Your bank transfer / clearing payment is currently pending confirmation. The campaign raised amount will update once settlement clears.'
        );
      } else if (outcome === 'failed') {
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch {}
        setSimulationState('failed');
        setSimulationMessage(
          'Simulated Payment Declined: The bank returned an insufficient funds / risk check decline. No funds were charged.'
        );
      } else if (outcome === 'cancelled') {
        setSimulationState('cancelled');
        setSimulationMessage(
          'Simulated Checkout Cancelled: The checkout session was aborted. You can change your amount or try again whenever you are ready.'
        );
      }
    } catch (err: any) {
      setLoading(false);
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
      Alert.alert('Payment Error', err.message || 'Unable to process contribution.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.paper }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" />

      {/* Top Header */}
      <View
        style={{
          paddingTop: 52,
          paddingBottom: 12,
          paddingHorizontal: 16,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => {
              if (step > 1) {
                setStep((s) => ((s - 1) as 1 | 2));
                setSimulationState('idle');
                setSimulationMessage(null);
              } else {
                navigation.goBack();
              }
            }}
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
            <Ionicons name="arrow-back" size={18} color={colors.ink} />
          </TouchableOpacity>
          <View style={{ marginLeft: 12 }}>
            <Text style={{ fontSize: 16, fontFamily: fonts.serifBold, color: colors.ink }}>
              Back This Campaign
            </Text>
            <Text style={{ fontSize: 11, fontFamily: fonts.sansRegular, color: colors.inkSecondary }}>
              Step {step} of 3 • {step === 1 ? 'Choose Amount' : step === 2 ? 'Review & Fees' : 'Simulated Checkout'}
            </Text>
          </View>
        </View>

        {/* Step dots */}
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {[1, 2, 3].map((s) => (
            <View
              key={s}
              style={{
                width: 7,
                height: 7,
                borderRadius: 3.5,
                backgroundColor: s === step ? colors.accent : s < step ? colors.positive : colors.border,
              }}
            />
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Campaign Header Summary */}
        <Card style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Text
              style={{
                fontSize: 10,
                fontFamily: fonts.sansBold,
                color: colors.accent,
                textTransform: 'uppercase',
                letterSpacing: 0.9,
              }}
            >
              {campaign.category.replace('_', ' ')}
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={showInspectModal ? 'Hide campaign details' : 'Inspect campaign details'}
              onPress={() => setShowInspectModal(!showInspectModal)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Ionicons
                name={showInspectModal ? 'chevron-up-circle' : 'information-circle-outline'}
                size={15}
                color={colors.accent}
              />
              <Text style={{ fontSize: 11, fontFamily: fonts.sansSemiBold, color: colors.accent }}>
                {showInspectModal ? 'Hide Details' : 'Inspect'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 16, fontFamily: fonts.serifBold, color: colors.ink }} numberOfLines={2}>
            {campaign.title}
          </Text>
          <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary, marginTop: 4 }}>
            by {campaign.creatorName} • {formatCurrency(remaining)} needed to reach advertising goal
          </Text>

          {/* Quick inspect drawer */}
          {showInspectModal && (
            <View
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: colors.border,
                gap: 6,
              }}
            >
              <Text style={{ fontSize: 12, fontFamily: fonts.sansBold, color: colors.ink, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Campaign Distribution Specs:
              </Text>
              <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary, lineHeight: 18 }}>
                • Visible Sources: {campaign.sources?.length || 2} citations checkable by backers.
              </Text>
              <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary, lineHeight: 18 }}>
                • Distribution split: 95% goes directly to targeted ad platforms (Meta, Instagram, Reddit).
              </Text>
              <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary, lineHeight: 18 }}>
                • 5% platform operations fee supports review, policy enforcement, and infrastructure.
              </Text>
              <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary, lineHeight: 18 }}>
                • Goal Reached Policy: Reaching 100% funds locks allocation; platform review finalizes ads before delivery begins.
              </Text>
            </View>
          )}
        </Card>

        {/* ========================================================================= */}
        {/* STEP 1: CHOOSE AMOUNT & INSPECT                                           */}
        {/* ========================================================================= */}
        {step === 1 && (
          <View>
            {/* Amplification Notice */}
            <View style={{ marginBottom: 16 }}>
              <AmplificationNotice compact />
            </View>

            <Text style={{ fontSize: 16, fontFamily: fonts.serifBold, color: colors.ink, marginBottom: 12 }}>
              Select Contribution Amount
            </Text>

            {/* Presets */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
              {demoConfig.presetAmounts.map((preset) => {
                const selected = selectedPreset === preset && !customAmount;
                return (
                  <TouchableOpacity
                    key={preset}
                    accessibilityRole="button"
                    accessibilityLabel={`Preset $${preset}`}
                    onPress={() => {
                      setSelectedPreset(preset);
                      setCustomAmount('');
                    }}
                    style={{
                      paddingHorizontal: 18,
                      paddingVertical: 12,
                      borderRadius: tokens.radii.xs,
                      marginRight: 8,
                      marginBottom: 8,
                      backgroundColor: selected ? colors.ink : colors.surface,
                      borderWidth: 1,
                      borderColor: selected ? colors.ink : colors.border,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily: fonts.serifBold,
                        color: selected ? '#FFFFFF' : colors.ink,
                      }}
                    >
                      ${preset}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Amount Input */}
            <Text style={{ fontSize: 12, fontFamily: fonts.sansSemiBold, color: colors.inkSecondary, marginBottom: 8 }}>
              Or specify a custom amount
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: customAmount ? colors.ink : colors.border,
                borderRadius: tokens.radii.xs,
                paddingHorizontal: 16,
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: 22, fontFamily: fonts.serifBold, color: colors.ink }}>$</Text>
              <TextInput
                accessibilityLabel="Custom contribution amount in dollars"
                value={customAmount}
                onChangeText={(t) => {
                  setCustomAmount(t);
                  setSelectedPreset(0);
                }}
                placeholder="0.00"
                placeholderTextColor={colors.inkMuted}
                keyboardType="decimal-pad"
                style={{
                  flex: 1,
                  fontSize: 22,
                  fontFamily: fonts.serifBold,
                  color: colors.ink,
                  paddingVertical: 12,
                  marginLeft: 6,
                }}
              />
            </View>

            {/* Live Estimated Reach Preview - Broadsheet Hero (Requirement 6) */}
            <Card style={{ backgroundColor: colors.surfaceSecondary, borderColor: colors.border, marginBottom: 16 }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontSize: 10, fontFamily: fonts.sansBold, color: colors.inkMuted, textTransform: 'uppercase', letterSpacing: 0.9 }}>
                  ESTIMATED AUDIENCE REACH
                </Text>
                <DemoDataBadge size="sm" />
              </View>
              <View style={{ flexDirection: 'row', marginTop: 4 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 28, fontFamily: fonts.serifBold, color: colors.ink, lineHeight: 34 }}>
                    {formatNumber(reachCalc.estimate)}
                  </Text>
                  <Text style={{ fontSize: 11, fontFamily: fonts.sansRegular, color: colors.inkSecondary, marginTop: 2 }}>
                    Est. people reached
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 28, fontFamily: fonts.serifBold, color: colors.ink, lineHeight: 34 }}>
                    {formatNumber(reachCalc.impressions)}
                  </Text>
                  <Text style={{ fontSize: 11, fontFamily: fonts.sansRegular, color: colors.inkSecondary, marginTop: 2 }}>
                    Est. ad impressions
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 11, fontFamily: fonts.sansRegular, color: colors.inkSecondary, marginTop: 12, lineHeight: 16 }}>
                Based on ${demoConfig.cpmUsd} CPM and {demoConfig.avgFrequency}x frequency. Labelled estimate, not a guarantee.
              </Text>
            </Card>

            {/* Quick Fee Summary */}
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <Text style={{ fontSize: 13, fontFamily: fonts.sansRegular, color: colors.inkSecondary }}>Contribution</Text>
                <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.ink }}>
                  {formatCurrency(dollars)}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <Text style={{ fontSize: 13, fontFamily: fonts.sansRegular, color: colors.inkSecondary }}>Payment fee (2.9% + $0.30)</Text>
                <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.ink }}>
                  {formatCurrency(fee)}
                </Text>
              </View>
              <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
                <Text style={{ fontSize: 14, fontFamily: fonts.serifBold, color: colors.ink }}>Total Payment</Text>
                <Text style={{ fontSize: 16, fontFamily: fonts.serifBold, color: colors.accent }}>
                  {formatCurrency(total)}
                </Text>
              </View>
            </Card>
          </View>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: REVIEW & COMPREHENSIVE FEE BREAKDOWN                              */}
        {/* ========================================================================= */}
        {step === 2 && (
          <View>
            {/* Unmissable Value Proposition & Non-Donation Notice */}
            <View style={{ marginBottom: 14 }}>
              <AmplificationNotice />
            </View>

            <Text style={{ fontSize: 16, fontFamily: fonts.serifBold, color: colors.ink, marginBottom: 12 }}>
              Contribution & Fee Breakdown
            </Text>

            {/* Itemized Fee Breakdown Card */}
            <Card style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                <Text style={{ fontSize: 13, fontFamily: fonts.sansMedium, color: colors.inkSecondary }}>
                  Chosen Contribution
                </Text>
                <Text style={{ fontSize: 14, fontFamily: fonts.sansSemiBold, color: colors.ink }}>
                  {formatCurrency(dollars)}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={{ fontSize: 13, fontFamily: fonts.sansMedium, color: colors.inkSecondary }}>
                    Payment Processing Fee
                  </Text>
                  <Text style={{ fontSize: 11, fontFamily: fonts.sansRegular, color: colors.inkMuted, marginTop: 1 }}>
                    2.9% + $0.30 standard gateway fee
                  </Text>
                </View>
                <Text style={{ fontSize: 14, fontFamily: fonts.sansSemiBold, color: colors.ink }}>
                  +{formatCurrency(fee)}
                </Text>
              </View>

              <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 10 }} />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <Text style={{ fontSize: 14, fontFamily: fonts.serifBold, color: colors.ink }}>
                  Total Charged to Card
                </Text>
                <Text style={{ fontSize: 18, fontFamily: fonts.serifBold, color: colors.accent }}>
                  {formatCurrency(total)}
                </Text>
              </View>

              {/* Fund deployment split subcard */}
              <View
                style={{
                  marginTop: 14,
                  backgroundColor: colors.surfaceSecondary,
                  borderRadius: tokens.radii.xs,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 11, fontFamily: fonts.sansBold, color: colors.ink, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                  Where Your {formatCurrency(dollars)} Contribution Goes:
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary }}>• Direct Ad Spend (95%)</Text>
                  <Text style={{ fontSize: 12, fontFamily: fonts.sansSemiBold, color: colors.positive }}>
                    {formatCurrency(netAdBudget)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary }}>• Platform Review & Ops (5%)</Text>
                  <Text style={{ fontSize: 12, fontFamily: fonts.sansSemiBold, color: colors.ink }}>
                    {formatCurrency(platformFee)}
                  </Text>
                </View>
              </View>
            </Card>

            {/* Impact & Progress Projection Card */}
            <Card style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontFamily: fonts.serifSemiBold, color: colors.ink, marginBottom: 8 }}>
                Projected Impact on Campaign
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary }}>Current Funded Progress</Text>
                <Text style={{ fontSize: 13, fontFamily: fonts.serifBold, color: colors.ink }}>
                  {campaign.percentFunded}% ({formatCurrency(campaign.amountRaised)})
                </Text>
              </View>
              <ProgressBar
                progress={Math.min(100, campaign.percentFunded + Math.round((dollars / campaign.fundingGoal) * 100))}
                color={colors.accent}
                height={3}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary }}>
                  Projected with your backing:
                </Text>
                <Text style={{ fontSize: 12, fontFamily: fonts.sansBold, color: colors.accent }}>
                  {Math.min(100, Math.round(((campaign.amountRaised + dollars) / campaign.fundingGoal) * 100))}% of goal
                </Text>
              </View>
            </Card>

            {/* Backer Privacy Option (Default OFF per Brief) */}
            <Card style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ fontSize: 14, fontFamily: fonts.sansSemiBold, color: colors.ink }}>
                    Show my name publicly
                  </Text>
                  <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary, marginTop: 3, lineHeight: 17 }}>
                    Private by default. Turn on to display your name on the public campaign supporters list.
                  </Text>
                </View>
                <Switch
                  value={showName}
                  onValueChange={setShowName}
                  trackColor={{ false: colors.border, true: colors.accent }}
                />
              </View>
            </Card>

            {/* Terms & Refund Policy */}
            <Card style={{ backgroundColor: colors.surfaceSecondary, borderColor: colors.border, marginBottom: 16 }}>
              <Text style={{ fontSize: 11, fontFamily: fonts.sansBold, color: colors.ink, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                Unspent Funds & Allocation Policy:
              </Text>
              <Text style={{ fontSize: 11, fontFamily: fonts.sansRegular, color: colors.inkSecondary, lineHeight: 16 }}>
                Contributions purchase advertising distribution to spread checkable civic information. If a campaign is cancelled or fails to launch, all unspent funds are refunded. Reaching 100% of the funding goal does NOT start ads immediately; platform review finalizes targeting and creative setup first.
              </Text>
            </Card>
          </View>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: SIMULATED CHECKOUT                                                */}
        {/* ========================================================================= */}
        {step === 3 && (
          <View>
            {/* Demo Simulation Notice Banner */}
            <View
              style={{
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.borderDark,
                borderWidth: 1,
                borderRadius: tokens.radii.sm,
                padding: 14,
                marginBottom: 16,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Ionicons name="card-outline" size={16} color={colors.ink} />
                <Text style={{ fontSize: 11, fontFamily: fonts.sansBold, color: colors.ink, textTransform: 'uppercase', letterSpacing: 0.9 }}>
                  Test mode - no real payment
                </Text>
              </View>
              <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary, lineHeight: 17 }}>
                This is a prototype payment sandbox. No real credit card or bank account is billed. Use the simulation controls below to demonstrate success, pending, failed, and cancelled payment states.
              </Text>
            </View>

            {/* Backer identity info (Guest support) */}
            <Card style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontFamily: fonts.serifSemiBold, color: colors.ink, marginBottom: 8 }}>
                Backer Information
              </Text>

              {user ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceSecondary, borderRadius: tokens.radii.xs, borderWidth: 1, borderColor: colors.border, padding: 12 }}>
                  <Ionicons name="person-circle" size={28} color={colors.accent} />
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text style={{ fontSize: 14, fontFamily: fonts.sansSemiBold, color: colors.ink }}>{user.name}</Text>
                    <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary }}>{user.email}</Text>
                  </View>
                  <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: tokens.radii.xs, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 10, fontFamily: fonts.sansBold, color: colors.positive, textTransform: 'uppercase' }}>Signed In</Text>
                  </View>
                </View>
              ) : (
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Ionicons name="globe-outline" size={16} color={colors.inkSecondary} />
                    <Text style={{ fontSize: 12, fontFamily: fonts.sansSemiBold, color: colors.ink, marginLeft: 6 }}>
                      Backing as a Guest (No account required)
                    </Text>
                  </View>
                  <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary, marginBottom: 8 }}>
                    Optional: Provide an email address to receive your confirmation and digital receipt.
                  </Text>
                  <TextInput
                    accessibilityLabel="Guest email address for digital receipt"
                    value={guestEmail}
                    onChangeText={setGuestEmail}
                    placeholder="you@example.com (optional)"
                    placeholderTextColor={colors.inkMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={{
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: tokens.radii.xs,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      fontSize: 14,
                      fontFamily: fonts.sansRegular,
                      color: colors.ink,
                    }}
                  />
                </View>
              )}
            </Card>

            {/* Mock Payment Card Widget */}
            <Card style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 14, fontFamily: fonts.serifSemiBold, color: colors.ink }}>
                  Simulated Payment Method
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="lock-closed" size={12} color={colors.positive} />
                  <Text style={{ fontSize: 11, fontFamily: fonts.sansSemiBold, color: colors.positive }}>Encrypted</Text>
                </View>
              </View>

              <View
                style={{
                  backgroundColor: colors.ink,
                  borderRadius: tokens.radii.sm,
                  padding: 16,
                  marginBottom: 12,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <Text style={{ fontSize: 12, fontFamily: fonts.sansBold, color: colors.inkMuted, letterSpacing: 1 }}>
                    DEMO VISA
                  </Text>
                  <Ionicons name="radio-outline" size={18} color={colors.inkMuted} />
                </View>
                <Text style={{ fontSize: 18, fontFamily: fonts.sansSemiBold, color: '#FFFFFF', letterSpacing: 2, marginBottom: 14 }}>
                  •••• •••• •••• 4242
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ fontSize: 9, fontFamily: fonts.sansBold, color: colors.inkMuted, textTransform: 'uppercase' }}>Cardholder</Text>
                    <Text style={{ fontSize: 12, fontFamily: fonts.sansSemiBold, color: '#FFFFFF', marginTop: 2 }}>
                      {showName && user ? user.name : 'COMMUNITY BACKER'}
                    </Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 9, fontFamily: fonts.sansBold, color: colors.inkMuted, textTransform: 'uppercase' }}>Expires</Text>
                    <Text style={{ fontSize: 12, fontFamily: fonts.sansSemiBold, color: '#FFFFFF', marginTop: 2 }}>12/28</Text>
                  </View>
                </View>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 }}>
                <Text style={{ fontSize: 13, fontFamily: fonts.sansMedium, color: colors.inkSecondary }}>Amount to Authorize:</Text>
                <Text style={{ fontSize: 18, fontFamily: fonts.serifBold, color: colors.accent }}>
                  {formatCurrency(total)}
                </Text>
              </View>
            </Card>

            {/* Simulation Feedback Alert */}
            {simulationMessage && (
              <View
                style={{
                  backgroundColor:
                    simulationState === 'failed'
                      ? colors.dangerFaint
                      : simulationState === 'pending'
                      ? colors.warningFaint
                      : colors.surfaceSecondary,
                  borderColor:
                    simulationState === 'failed'
                      ? colors.danger
                      : simulationState === 'pending'
                      ? colors.warning
                      : colors.border,
                  borderWidth: 1,
                  borderRadius: tokens.radii.sm,
                  padding: 14,
                  marginBottom: 16,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Ionicons
                    name={
                      simulationState === 'failed'
                        ? 'alert-circle'
                        : simulationState === 'pending'
                        ? 'time'
                        : 'close-circle'
                    }
                    size={16}
                    color={
                      simulationState === 'failed'
                        ? colors.danger
                        : simulationState === 'pending'
                        ? colors.warning
                        : colors.inkSecondary
                    }
                  />
                  <Text
                    style={{
                      fontSize: 11,
                      fontFamily: fonts.sansBold,
                      color:
                        simulationState === 'failed'
                          ? colors.danger
                          : simulationState === 'pending'
                          ? colors.warning
                          : colors.ink,
                      textTransform: 'uppercase',
                      letterSpacing: 0.8,
                    }}
                  >
                    State: {simulationState}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: fonts.sansRegular,
                    color:
                      simulationState === 'failed'
                        ? colors.danger
                        : simulationState === 'pending'
                        ? colors.warning
                        : colors.inkSecondary,
                    lineHeight: 17,
                  }}
                >
                  {simulationMessage}
                </Text>
              </View>
            )}

            {/* 4 Outcome Simulation Buttons */}
            <Text style={{ fontSize: 11, fontFamily: fonts.sansBold, color: colors.inkMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
              Simulate Payment Outcome:
            </Text>

            <View style={{ gap: 8, marginBottom: 20 }}>
              {/* 1. Simulate Success */}
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Simulate successful payment of ${formatCurrency(total)}`}
                onPress={() => handleSimulatePayment('success')}
                disabled={loading}
                activeOpacity={0.8}
                style={{
                  backgroundColor: colors.positive,
                  paddingVertical: 12,
                  borderRadius: tokens.radii.xs,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="#fff" />
                    <Text style={{ fontSize: 14, fontFamily: fonts.sansBold, color: '#fff' }}>
                      Simulate Success ({formatCurrency(total)})
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* 2. Simulate Pending */}
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Simulate pending payment"
                onPress={() => handleSimulatePayment('pending')}
                disabled={loading}
                activeOpacity={0.8}
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.warning,
                  paddingVertical: 11,
                  borderRadius: tokens.radii.xs,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Ionicons name="time" size={16} color={colors.warning} />
                <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.warning }}>
                  Simulate Pending (ACH/Clearing)
                </Text>
              </TouchableOpacity>

              {/* 3. Simulate Failed */}
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Simulate payment failure"
                onPress={() => handleSimulatePayment('failed')}
                disabled={loading}
                activeOpacity={0.8}
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.danger,
                  paddingVertical: 11,
                  borderRadius: tokens.radii.xs,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Ionicons name="close-circle" size={16} color={colors.danger} />
                <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.danger }}>
                  Simulate Failed (Card Declined)
                </Text>
              </TouchableOpacity>

              {/* 4. Simulate Cancelled */}
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Simulate cancelled payment"
                onPress={() => handleSimulatePayment('cancelled')}
                disabled={loading}
                activeOpacity={0.8}
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingVertical: 11,
                  borderRadius: tokens.radii.xs,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Ionicons name="ban-outline" size={16} color={colors.inkSecondary} />
                <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.inkSecondary }}>
                  Simulate Cancelled by User
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom Bar for Step 1 and Step 2 */}
      {step < 3 && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 16,
            paddingBottom: 32,
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            flexDirection: 'row',
            gap: 12,
          }}
        >
          {step === 2 && (
            <View style={{ flex: 1 }}>
              <Button
                title="Back"
                variant="outline"
                onPress={() => setStep(1)}
                fullWidth
              />
            </View>
          )}
          <View style={{ flex: 2 }}>
            <Button
              title={
                step === 1
                  ? `Review ${formatCurrency(dollars)}`
                  : `Proceed to Checkout (${formatCurrency(total)})`
              }
              onPress={step === 1 ? handleProceedToReview : () => setStep(3)}
              size="lg"
              icon="arrow-forward"
              iconPosition="right"
              fullWidth
            />
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

export function ThankYouScreen({ route, navigation }: any) {
  const { campaignId, amount, receiptNo, estimatedReach, fee, total } = route.params;
  const campaigns = useCampaignStore((s) => s.campaigns);
  const campaign = useMemo(
    () => campaigns.find((c) => c.id === campaignId || c.slug === campaignId),
    [campaigns, campaignId]
  );
  const followedCampaignIds = usePreferencesStore((s) => s.followedCampaignIds);
  const isFollowing = useMemo(
    () => followedCampaignIds.includes(campaignId),
    [followedCampaignIds, campaignId]
  );
  const toggleFollow = usePreferencesStore((s) => s.toggleFollowCampaign);

  const [followed, setFollowed] = useState(isFollowing);
  const [displayReach, setDisplayReach] = useState(0);
  const animatedProgress = useSharedValue(0);

  const targetReach = estimatedReach || 0;
  const targetPercent = campaign?.percentFunded ?? 100;

  useEffect(() => {
    let isMounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((reducedMotion) => {
      if (!isMounted) return;

      if (reducedMotion) {
        setDisplayReach(targetReach);
        animatedProgress.value = targetPercent;
        return;
      }

      // Animate progress bar via Reanimated
      animatedProgress.value = withTiming(targetPercent, {
        duration: 1200,
        easing: Easing.out(Easing.cubic),
      });

      // Count up estimated people
      const startTime = Date.now();
      const duration = 1200;
      const step = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        if (isMounted) {
          setDisplayReach(Math.round(eased * targetReach));
          if (progress < 1) {
            requestAnimationFrame(step);
          }
        }
      };
      requestAnimationFrame(step);
    });

    return () => {
      isMounted = false;
    };
  }, [targetPercent, targetReach]);

  const animatedBarStyle = useAnimatedStyle(() => ({
    width: `${Math.min(100, Math.max(0, animatedProgress.value))}%`,
  }));

  const handleToggleFollow = () => {
    toggleFollow(campaignId);
    setFollowed(!followed);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I just amplified "${campaign?.title || 'this campaign'}" with a $${amount} contribution to help reach more people! Check it out:`,
        title: campaign?.title || 'Campaign Amplification',
      });
    } catch {}
  };

  const isGoalReached = campaign && campaign.amountRaised >= campaign.fundingGoal;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header */}
      <View
        style={{
          paddingTop: 52,
          paddingBottom: 12,
          paddingHorizontal: 20,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text style={{ fontSize: 16, fontFamily: fonts.serifSemiBold, color: colors.ink }}>
          Contribution Confirmed
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Home')}
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
          accessibilityRole="button"
          accessibilityLabel="Close and return to Home"
        >
          <Ionicons name="close" size={20} color={colors.ink} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* Editorial Confirmation Header */}
        <View style={{ alignItems: 'center', paddingVertical: 18 }}>
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 4,
              backgroundColor: colors.surfaceSecondary,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: tokens.radii.xs,
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontFamily: fonts.sansBold,
                color: colors.positive,
                letterSpacing: 0.9,
                textTransform: 'uppercase',
              }}
            >
              CONFIRMED • TEST MODE
            </Text>
          </View>

          <Text style={{ fontSize: 26, fontFamily: fonts.serifBold, color: colors.ink, textAlign: 'center', lineHeight: 32 }}>
            Thank You for Amplifying
          </Text>

          <Text style={{ fontSize: 14, fontFamily: fonts.sansRegular, color: colors.inkSecondary, textAlign: 'center', marginTop: 8, lineHeight: 21, paddingHorizontal: 10 }}>
            Your contribution of <Text style={{ fontFamily: fonts.sansSemiBold, color: colors.ink }}>{formatCurrency(amount)}</Text> pools to fund targeted digital advertising for this checkable message.
          </Text>

          {/* Animated Hero Numbers - Newspaper Graphic (Requirement 6) */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: tokens.radii.md,
              padding: 16,
              marginTop: 18,
              width: '100%',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontFamily: fonts.sansBold,
                color: colors.inkMuted,
                letterSpacing: 0.9,
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              PROJECTED AUDIENCE REACH (ESTIMATE)
            </Text>
            <Text style={{ fontSize: 36, fontFamily: fonts.serifBold, color: colors.ink, lineHeight: 42 }}>
              ~{formatNumber(displayReach)}
            </Text>
            <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary, marginTop: 4 }}>
              people estimated to see this message
            </Text>
          </View>
        </View>

        {/* Goal Reached Notice if this contribution pushed the campaign over goal */}
        {isGoalReached && (
          <View
            style={{
              backgroundColor: colors.positiveFaint,
              borderColor: colors.positive,
              borderWidth: 1,
              borderRadius: tokens.radii.sm,
              padding: 14,
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 12, fontFamily: fonts.sansBold, color: colors.positive, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
              100% Distribution Goal Reached
            </Text>
            <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.ink, lineHeight: 17 }}>
              Backers have fully funded the distribution budget. Content, sources, and audience targeting will be finalized during platform review before advertising distribution begins. Goal reached does NOT start ads immediately.
            </Text>
          </View>
        )}

        {/* Updated Campaign Funding Progress Card with Reanimated Bar */}
        {campaign && (
          <Card style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontFamily: fonts.serifSemiBold, color: colors.ink, marginBottom: 8 }}>
              {campaign.title}
            </Text>
            {/* Animated Progress Bar */}
            <View style={{ height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden', width: '100%' }}>
              <Animated.View
                style={[
                  { height: '100%', backgroundColor: colors.accent, borderRadius: 2 },
                  animatedBarStyle,
                ]}
              />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
              <Text style={{ fontSize: 13, fontFamily: fonts.serifBold, color: colors.accent }}>
                {campaign.percentFunded}% funded
              </Text>
              <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary }}>
                {formatCurrency(campaign.amountRaised)} of {formatCurrency(campaign.fundingGoal)}
              </Text>
            </View>
          </Card>
        )}

        {/* Digital Receipt Card */}
        <Card style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 14, fontFamily: fonts.sansSemiBold, color: colors.ink }}>
              Digital Receipt
            </Text>
            <View style={{ backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, borderRadius: tokens.radii.xs, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ fontSize: 10, fontFamily: fonts.sansBold, color: colors.inkSecondary }}>
                #{receiptNo || 'REC-2026-DEMO'}
              </Text>
            </View>
          </View>

          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, fontFamily: fonts.sansRegular, color: colors.inkSecondary }}>Contribution</Text>
              <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.ink }}>{formatCurrency(amount)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, fontFamily: fonts.sansRegular, color: colors.inkSecondary }}>Payment fee (2.9% + $0.30)</Text>
              <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.ink }}>
                {fee ? formatCurrency(fee) : '$1.75'}
              </Text>
            </View>
            <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 6 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 14, fontFamily: fonts.serifBold, color: colors.ink }}>Total Paid</Text>
              <Text style={{ fontSize: 16, fontFamily: fonts.serifBold, color: colors.accent }}>
                {total ? formatCurrency(total) : formatCurrency(amount + 1.75)}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkMuted }}>Payment Status</Text>
              <Text style={{ fontSize: 12, fontFamily: fonts.sansBold, color: colors.positive }}>Succeeded (Settled)</Text>
            </View>
            <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 6 }} />
            <Text style={{ fontSize: 11, fontFamily: fonts.sansRegular, color: colors.inkSecondary, fontStyle: 'italic', textAlign: 'center' }}>
              Notice: Message amplification reach, not a charitable donation.
            </Text>
          </View>
        </Card>

        {/* Step 6 Actions: Track & Share */}
        <View style={{ gap: 10 }}>
          <Button
            title="Share Campaign"
            onPress={handleShare}
            variant="primary"
            fullWidth
            size="lg"
          />

          <Button
            title={followed ? 'Following Campaign ✓' : 'Follow for Campaign Updates'}
            onPress={handleToggleFollow}
            variant={followed ? 'secondary' : 'outline'}
            fullWidth
          />

          <Button
            title="Return to Home Feed"
            onPress={() => navigation.navigate('Home')}
            variant="secondary"
            fullWidth
          />
        </View>
      </ScrollView>
    </View>
  );
}
