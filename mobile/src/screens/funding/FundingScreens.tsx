import React, { useState } from 'react';
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
} from 'react-native';
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

export function FundCampaignScreen({ route, navigation }: any) {
  const { campaignId, initialAmount } = route.params;
  const campaign = useCampaignStore((s) => s.getCampaign(campaignId));
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
      <View style={{ flex: 1, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>Campaign not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 12 }}>
          <Text style={{ color: '#4f46e5', fontWeight: '600' }}>Go Back</Text>
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
      Alert.alert('Payment Error', err.message || 'Unable to process contribution.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header */}
      <View
        style={{
          paddingTop: 52,
          paddingBottom: 12,
          paddingHorizontal: 16,
          backgroundColor: '#fff',
          borderBottomWidth: 1,
          borderBottomColor: '#f1f5f9',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
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
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#f1f5f9',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="arrow-back" size={20} color="#0f172a" />
          </TouchableOpacity>
          <View style={{ marginLeft: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>
              Back This Campaign
            </Text>
            <Text style={{ fontSize: 12, color: '#64748b' }}>
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
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: s === step ? '#4f46e5' : s < step ? '#22c55e' : '#cbd5e1',
              }}
            />
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Campaign Header Summary */}
        <Card style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: '#4f46e5',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {campaign.category.replace('_', ' ')}
            </Text>
            <TouchableOpacity
              onPress={() => setShowInspectModal(!showInspectModal)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Ionicons
                name={showInspectModal ? 'chevron-up-circle' : 'information-circle-outline'}
                size={16}
                color="#6366f1"
              />
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#6366f1' }}>
                {showInspectModal ? 'Hide Details' : 'Inspect'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }} numberOfLines={2}>
            {campaign.title}
          </Text>
          <Text style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            by {campaign.creatorName} • {formatCurrency(remaining)} needed to reach advertising goal
          </Text>

          {/* Quick inspect drawer */}
          {showInspectModal && (
            <View
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: '#f1f5f9',
                gap: 8,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#1e293b' }}>
                Campaign Distribution Specs:
              </Text>
              <Text style={{ fontSize: 12, color: '#475569', lineHeight: 18 }}>
                • Visible Sources: {campaign.sources?.length || 2} citations checkable by backers.
              </Text>
              <Text style={{ fontSize: 12, color: '#475569', lineHeight: 18 }}>
                • Distribution split: 95% goes directly to targeted ad platforms (Meta, Instagram, Reddit).
              </Text>
              <Text style={{ fontSize: 12, color: '#475569', lineHeight: 18 }}>
                • 5% platform operations fee supports review, policy enforcement, and infrastructure.
              </Text>
              <Text style={{ fontSize: 12, color: '#475569', lineHeight: 18 }}>
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

            <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 12 }}>
              Select Contribution Amount
            </Text>

            {/* Presets */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
              {demoConfig.presetAmounts.map((preset) => {
                const selected = selectedPreset === preset && !customAmount;
                return (
                  <TouchableOpacity
                    key={preset}
                    onPress={() => {
                      setSelectedPreset(preset);
                      setCustomAmount('');
                    }}
                    style={{
                      paddingHorizontal: 20,
                      paddingVertical: 14,
                      borderRadius: 14,
                      marginRight: 10,
                      marginBottom: 10,
                      backgroundColor: selected ? '#4f46e5' : '#fff',
                      borderWidth: 1.5,
                      borderColor: selected ? '#4f46e5' : '#e2e8f0',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: 1,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '800',
                        color: selected ? '#fff' : '#0f172a',
                      }}
                    >
                      ${preset}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Amount Input */}
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 }}>
              Or specify a custom amount
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#fff',
                borderWidth: 1.5,
                borderColor: customAmount ? '#4f46e5' : '#e2e8f0',
                borderRadius: 14,
                paddingHorizontal: 16,
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#0f172a' }}>$</Text>
              <TextInput
                value={customAmount}
                onChangeText={(t) => {
                  setCustomAmount(t);
                  setSelectedPreset(0);
                }}
                placeholder="0.00"
                placeholderTextColor="#94a3b8"
                keyboardType="decimal-pad"
                style={{
                  flex: 1,
                  fontSize: 22,
                  fontWeight: '800',
                  color: '#0f172a',
                  paddingVertical: 14,
                  marginLeft: 6,
                }}
              />
            </View>

            {/* Live Estimated Reach Preview */}
            <Card style={{ backgroundColor: '#eef2ff', borderColor: '#c7d2fe', marginBottom: 16 }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#3730a3' }}>
                  Estimated Audience Reach
                </Text>
                <DemoDataBadge size="sm" />
              </View>
              <View style={{ flexDirection: 'row', marginTop: 4 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 26, fontWeight: '800', color: '#312e81' }}>
                    {formatNumber(reachCalc.estimate)}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#6366f1', marginTop: 2 }}>
                    Est. people reached
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 26, fontWeight: '800', color: '#312e81' }}>
                    {formatNumber(reachCalc.impressions)}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#6366f1', marginTop: 2 }}>
                    Est. ad impressions
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 11, color: '#6366f1', marginTop: 12, lineHeight: 16 }}>
                Based on ${demoConfig.cpmUsd} CPM and {demoConfig.avgFrequency}x frequency. Labelled estimate, not a guarantee.
              </Text>
            </Card>

            {/* Quick Fee Summary */}
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <Text style={{ fontSize: 14, color: '#64748b' }}>Contribution</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }}>
                  {formatCurrency(dollars)}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <Text style={{ fontSize: 14, color: '#64748b' }}>Payment fee (2.9% + $0.30)</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }}>
                  {formatCurrency(fee)}
                </Text>
              </View>
              <View style={{ height: 1, backgroundColor: '#f1f5f9', marginVertical: 8 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a' }}>Total Payment</Text>
                <Text style={{ fontSize: 17, fontWeight: '800', color: '#4f46e5' }}>
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
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 12 }}>
              Contribution & Fee Breakdown
            </Text>

            {/* Itemized Fee Breakdown Card */}
            <Card style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#334155' }}>
                  Chosen Contribution
                </Text>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a' }}>
                  {formatCurrency(dollars)}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={{ fontSize: 14, color: '#64748b' }}>
                    Payment Processing Fee
                  </Text>
                  <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                    2.9% + $0.30 standard gateway fee
                  </Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }}>
                  +{formatCurrency(fee)}
                </Text>
              </View>

              <View style={{ height: 1, backgroundColor: '#f1f5f9', marginVertical: 10 }} />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a' }}>
                  Total Charged to Card
                </Text>
                <Text style={{ fontSize: 20, fontWeight: '800', color: '#4f46e5' }}>
                  {formatCurrency(total)}
                </Text>
              </View>

              {/* Fund deployment split subcard */}
              <View
                style={{
                  marginTop: 14,
                  backgroundColor: '#f8fafc',
                  borderRadius: 10,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: '#e2e8f0',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 6 }}>
                  Where Your {formatCurrency(dollars)} Contribution Goes:
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 12, color: '#64748b' }}>• Direct Ad Spend (95%)</Text>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#16a34a' }}>
                    {formatCurrency(netAdBudget)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 12, color: '#64748b' }}>• Platform Review & Ops (5%)</Text>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#475569' }}>
                    {formatCurrency(platformFee)}
                  </Text>
                </View>
              </View>
            </Card>

            {/* Impact & Progress Projection Card */}
            <Card style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 8 }}>
                Projected Impact on Campaign
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 13, color: '#64748b' }}>Current Funded Progress</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }}>
                  {campaign.percentFunded}% ({formatCurrency(campaign.amountRaised)})
                </Text>
              </View>
              <ProgressBar
                progress={Math.min(100, campaign.percentFunded + Math.round((dollars / campaign.fundingGoal) * 100))}
                color="#4f46e5"
                height={8}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                <Text style={{ fontSize: 12, color: '#475569' }}>
                  Projected with your backing:
                </Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#4f46e5' }}>
                  {Math.min(100, Math.round(((campaign.amountRaised + dollars) / campaign.fundingGoal) * 100))}% of goal
                </Text>
              </View>
            </Card>

            {/* Backer Privacy Option (Default OFF per Brief) */}
            <Card style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>
                    Show my name publicly
                  </Text>
                  <Text style={{ fontSize: 12, color: '#64748b', marginTop: 3, lineHeight: 17 }}>
                    Private by default. Turn on to display your name on the public campaign supporters list.
                  </Text>
                </View>
                <Switch
                  value={showName}
                  onValueChange={setShowName}
                  trackColor={{ false: '#cbd5e1', true: '#4f46e5' }}
                />
              </View>
            </Card>

            {/* Terms & Refund Policy */}
            <Card style={{ backgroundColor: '#fffbeb', borderColor: '#fef3c7', marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#92400e', marginBottom: 4 }}>
                Unspent Funds & Allocation Policy:
              </Text>
              <Text style={{ fontSize: 11, color: '#b45309', lineHeight: 16 }}>
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
                backgroundColor: '#eff6ff',
                borderColor: '#93c5fd',
                borderWidth: 1.5,
                borderRadius: 14,
                padding: 14,
                marginBottom: 16,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Ionicons name="card-outline" size={18} color="#2563eb" />
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#1d4ed8', textTransform: 'uppercase' }}>
                  Test mode - no real payment
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: '#1e40af', lineHeight: 17 }}>
                This is a prototype payment sandbox. No real credit card or bank account is billed. Use the simulation controls below to demonstrate success, pending, failed, and cancelled payment states.
              </Text>
            </View>

            {/* Backer identity info (Guest support) */}
            <Card style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 8 }}>
                Backer Information
              </Text>

              {user ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 10, padding: 12 }}>
                  <Ionicons name="person-circle" size={32} color="#4f46e5" />
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>{user.name}</Text>
                    <Text style={{ fontSize: 12, color: '#64748b' }}>{user.email}</Text>
                  </View>
                  <View style={{ backgroundColor: '#dcfce7', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#16a34a' }}>Signed In</Text>
                  </View>
                </View>
              ) : (
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Ionicons name="globe-outline" size={16} color="#64748b" />
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569', marginLeft: 6 }}>
                      Backing as a Guest (No account required)
                    </Text>
                  </View>
                  <Text style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                    Optional: Provide an email address to receive your confirmation and digital receipt.
                  </Text>
                  <TextInput
                    value={guestEmail}
                    onChangeText={setGuestEmail}
                    placeholder="you@example.com (optional)"
                    placeholderTextColor="#94a3b8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={{
                      backgroundColor: '#fff',
                      borderWidth: 1.5,
                      borderColor: '#e2e8f0',
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      fontSize: 14,
                      color: '#0f172a',
                    }}
                  />
                </View>
              )}
            </Card>

            {/* Mock Payment Card Widget */}
            <Card style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>
                  Simulated Payment Method
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="lock-closed" size={12} color="#16a34a" />
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#16a34a' }}>Encrypted</Text>
                </View>
              </View>

              <View
                style={{
                  backgroundColor: '#1e293b',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#94a3b8', letterSpacing: 1 }}>
                    DEMO VISA
                  </Text>
                  <Ionicons name="radio-outline" size={20} color="#94a3b8" />
                </View>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#ffffff', letterSpacing: 2, marginBottom: 16 }}>
                  •••• •••• •••• 4242
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase' }}>Cardholder</Text>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#ffffff', marginTop: 2 }}>
                      {showName && user ? user.name : 'COMMUNITY BACKER'}
                    </Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase' }}>Expires</Text>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#ffffff', marginTop: 2 }}>12/28</Text>
                  </View>
                </View>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748b' }}>Amount to Authorize:</Text>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#4f46e5' }}>
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
                      ? '#fef2f2'
                      : simulationState === 'pending'
                      ? '#fffbeb'
                      : '#f1f5f9',
                  borderColor:
                    simulationState === 'failed'
                      ? '#f87171'
                      : simulationState === 'pending'
                      ? '#fde68a'
                      : '#cbd5e1',
                  borderWidth: 1.5,
                  borderRadius: 14,
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
                    size={18}
                    color={
                      simulationState === 'failed'
                        ? '#dc2626'
                        : simulationState === 'pending'
                        ? '#b45309'
                        : '#475569'
                    }
                  />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '800',
                      color:
                        simulationState === 'failed'
                          ? '#dc2626'
                          : simulationState === 'pending'
                          ? '#92400e'
                          : '#334155',
                      textTransform: 'uppercase',
                    }}
                  >
                    State: {simulationState}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 12,
                    color:
                      simulationState === 'failed'
                        ? '#b91c1c'
                        : simulationState === 'pending'
                        ? '#b45309'
                        : '#475569',
                    lineHeight: 17,
                  }}
                >
                  {simulationMessage}
                </Text>
              </View>
            )}

            {/* 4 Outcome Simulation Buttons */}
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 10 }}>
              Simulate Payment Outcome:
            </Text>

            <View style={{ gap: 10, marginBottom: 20 }}>
              {/* 1. Simulate Success */}
              <TouchableOpacity
                onPress={() => handleSimulatePayment('success')}
                disabled={loading}
                activeOpacity={0.8}
                style={{
                  backgroundColor: '#16a34a',
                  paddingVertical: 14,
                  borderRadius: 14,
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
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>
                      Simulate Success ({formatCurrency(total)})
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* 2. Simulate Pending */}
              <TouchableOpacity
                onPress={() => handleSimulatePayment('pending')}
                disabled={loading}
                activeOpacity={0.8}
                style={{
                  backgroundColor: '#f59e0b',
                  paddingVertical: 12,
                  borderRadius: 14,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Ionicons name="time" size={18} color="#fff" />
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>
                  Simulate Pending (ACH/Clearing)
                </Text>
              </TouchableOpacity>

              {/* 3. Simulate Failed */}
              <TouchableOpacity
                onPress={() => handleSimulatePayment('failed')}
                disabled={loading}
                activeOpacity={0.8}
                style={{
                  backgroundColor: '#dc2626',
                  paddingVertical: 12,
                  borderRadius: 14,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Ionicons name="close-circle" size={18} color="#fff" />
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>
                  Simulate Failed (Card Declined)
                </Text>
              </TouchableOpacity>

              {/* 4. Simulate Cancelled */}
              <TouchableOpacity
                onPress={() => handleSimulatePayment('cancelled')}
                disabled={loading}
                activeOpacity={0.8}
                style={{
                  backgroundColor: '#fff',
                  borderWidth: 1.5,
                  borderColor: '#cbd5e1',
                  paddingVertical: 12,
                  borderRadius: 14,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Ionicons name="ban-outline" size={18} color="#64748b" />
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#64748b' }}>
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
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#f1f5f9',
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
    </View>
  );
}

export function ThankYouScreen({ route, navigation }: any) {
  const { campaignId, amount, receiptNo, estimatedReach, fee, total } = route.params;
  const campaign = useCampaignStore((s) => s.getCampaign(campaignId));
  const isFollowing = usePreferencesStore((s) => s.isFollowed(campaignId));
  const toggleFollow = usePreferencesStore((s) => s.toggleFollowCampaign);

  const [followed, setFollowed] = useState(isFollowing);

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
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header */}
      <View
        style={{
          paddingTop: 52,
          paddingBottom: 12,
          paddingHorizontal: 16,
          backgroundColor: '#fff',
          borderBottomWidth: 1,
          borderBottomColor: '#f1f5f9',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>
          Contribution Confirmed
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Home')}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: '#f1f5f9',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="close" size={20} color="#0f172a" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* Celebration Header */}
        <View style={{ alignItems: 'center', paddingVertical: 16 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: '#dcfce7',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <Ionicons name="checkmark-circle" size={44} color="#16a34a" />
          </View>
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#0f172a', textAlign: 'center' }}>
            Thank You for Amplifying!
          </Text>
          <Text style={{ fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 8, lineHeight: 21, paddingHorizontal: 10 }}>
            Your contribution of <Text style={{ fontWeight: '700', color: '#0f172a' }}>{formatCurrency(amount)}</Text> will fund digital advertising to deliver this message to an estimated{' '}
            <Text style={{ fontWeight: '700', color: '#4f46e5' }}>{formatNumber(estimatedReach || 0)} people</Text>.
          </Text>
          <Text style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 4 }}>
            (Configured demo reach estimate, not a guarantee)
          </Text>
        </View>

        {/* Goal Reached Notice if this contribution pushed the campaign over goal */}
        {isGoalReached && (
          <View
            style={{
              backgroundColor: '#ecfdf5',
              borderColor: '#6ee7b7',
              borderWidth: 1.5,
              borderRadius: 14,
              padding: 14,
              marginBottom: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Ionicons name="trophy" size={18} color="#059669" />
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#065f46', textTransform: 'uppercase' }}>
                100% Distribution Goal Reached!
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: '#047857', lineHeight: 17 }}>
              Backers have fully funded the distribution budget. Content, sources, and audience targeting will be finalized during platform review before advertising distribution begins. Goal reached does NOT start ads immediately.
            </Text>
          </View>
        )}

        {/* Updated Campaign Funding Progress Card */}
        {campaign && (
          <Card style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 6 }}>
              {campaign.title}
            </Text>
            <ProgressBar progress={campaign.percentFunded} color="#4f46e5" height={8} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#4f46e5' }}>
                {campaign.percentFunded}% funded
              </Text>
              <Text style={{ fontSize: 12, color: '#64748b' }}>
                {formatCurrency(campaign.amountRaised)} of {formatCurrency(campaign.fundingGoal)}
              </Text>
            </View>
          </Card>
        )}

        {/* Digital Receipt Card */}
        <Card style={{ marginBottom: 16, backgroundColor: '#ffffff' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="receipt-outline" size={18} color="#4f46e5" />
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>
                Digital Receipt
              </Text>
            </View>
            <View style={{ backgroundColor: '#f1f5f9', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>
                #{receiptNo || 'REC-2026-DEMO'}
              </Text>
            </View>
          </View>

          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, color: '#64748b' }}>Contribution</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#0f172a' }}>{formatCurrency(amount)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, color: '#64748b' }}>Payment fee (2.9% + $0.30)</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#0f172a' }}>
                {fee ? formatCurrency(fee) : '$1.75'}
              </Text>
            </View>
            <View style={{ height: 1, backgroundColor: '#f1f5f9', marginVertical: 6 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>Total Paid</Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#4f46e5' }}>
                {total ? formatCurrency(total) : formatCurrency(amount + 1.75)}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <Text style={{ fontSize: 12, color: '#94a3b8' }}>Payment Status</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#16a34a' }}>Succeeded (Settled)</Text>
            </View>
          </View>
        </Card>

        {/* Step 6 Actions: Track & Share */}
        <View style={{ gap: 12 }}>
          {/* Share */}
          <Button
            title="Share Campaign"
            onPress={handleShare}
            variant="primary"
            icon="share-social-outline"
            fullWidth
            size="lg"
          />

          {/* Follow toggle */}
          <Button
            title={followed ? 'Following Campaign ✓' : 'Follow for Campaign Updates'}
            onPress={handleToggleFollow}
            variant={followed ? 'secondary' : 'outline'}
            icon={followed ? 'checkmark-circle' : 'notifications-outline'}
            fullWidth
          />

          {/* Return Home */}
          <Button
            title="Return to Home Feed"
            onPress={() => navigation.navigate('Home')}
            variant="secondary"
            icon="home-outline"
            fullWidth
          />
        </View>
      </ScrollView>
    </View>
  );
}
