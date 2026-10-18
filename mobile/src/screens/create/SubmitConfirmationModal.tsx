import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';

interface SubmitConfirmationModalProps {
  visible: boolean;
  campaignTitle: string;
  campaignId: string;
  fundingGoal: number;
  onGoToMyCampaigns: () => void;
  onGoHome: () => void;
}

const TIMELINE_STEPS = [
  {
    key: 'submitted',
    title: 'Submitted',
    status: 'completed',
    description: 'Your campaign draft has been received and entered into the moderation queue.',
    icon: 'checkmark-circle',
  },
  {
    key: 'review',
    title: 'In Review',
    status: 'current',
    description: 'Our team reviews all claims against cited sources, ad copy, visuals, and targeting.',
    icon: 'time',
  },
  {
    key: 'decision',
    title: 'Changes Requested or Approved',
    status: 'upcoming',
    description: 'If approved, your campaign goes live. If revisions are required, you will receive editorial feedback.',
    icon: 'swap-horizontal',
  },
  {
    key: 'funding',
    title: 'Available for Funding',
    status: 'upcoming',
    description: 'Backers contribute to amplify reach across the selected channels.',
    icon: 'megaphone-outline',
  },
];

export function SubmitConfirmationModal({
  visible,
  campaignTitle,
  campaignId,
  fundingGoal,
  onGoToMyCampaigns,
  onGoHome,
}: SubmitConfirmationModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onGoHome}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
      >
        <View
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 24,
            width: '100%',
            maxWidth: 440,
            maxHeight: '90%',
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.25,
            shadowRadius: 20,
            elevation: 10,
          }}
        >
          {/* Header Banner */}
          <View
            style={{
              backgroundColor: '#eef2ff',
              paddingVertical: 24,
              paddingHorizontal: 20,
              alignItems: 'center',
              borderBottomWidth: 1,
              borderBottomColor: '#e0e7ff',
            }}
          >
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: '#22c55e',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <Ionicons name="checkmark" size={36} color="#ffffff" />
            </View>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '800',
                color: '#0f172a',
                textAlign: 'center',
              }}
            >
              Submitted for Review
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: '#475569',
                textAlign: 'center',
                marginTop: 4,
              }}
            >
              Content, sources, creative and targeting queued for review.
            </Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 20 }}
          >
            {/* Campaign Summary Card */}
            <View
              style={{
                backgroundColor: '#f8fafc',
                borderRadius: 12,
                padding: 14,
                borderWidth: 1,
                borderColor: '#e2e8f0',
                marginBottom: 20,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '700',
                  color: '#0f172a',
                }}
                numberOfLines={2}
              >
                {campaignTitle || 'Campaign Title'}
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 8,
                }}
              >
                <Text style={{ fontSize: 12, color: '#64748b' }}>
                  ID: {campaignId.slice(0, 14)}...
                </Text>
                {fundingGoal > 0 && (
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#4f46e5' }}>
                    Goal: ${fundingGoal.toLocaleString()}
                  </Text>
                )}
              </View>
            </View>

            {/* Status Timeline */}
            <Text
              style={{
                fontSize: 13,
                fontWeight: '800',
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: 0.6,
                marginBottom: 14,
              }}
            >
              Status Timeline
            </Text>

            <View style={{ marginBottom: 12 }}>
              {TIMELINE_STEPS.map((step, idx) => {
                const isCompleted = step.status === 'completed';
                const isCurrent = step.status === 'current';
                const isLast = idx === TIMELINE_STEPS.length - 1;

                return (
                  <View key={step.key} style={{ flexDirection: 'row', position: 'relative' }}>
                    {/* Timeline Line */}
                    {!isLast && (
                      <View
                        style={{
                          position: 'absolute',
                          top: 26,
                          left: 14,
                          width: 2,
                          bottom: -4,
                          backgroundColor: isCompleted ? '#22c55e' : '#e2e8f0',
                          zIndex: 1,
                        }}
                      />
                    )}

                    {/* Step Icon Node */}
                    <View
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 15,
                        backgroundColor: isCompleted
                          ? '#22c55e'
                          : isCurrent
                          ? '#4f46e5'
                          : '#f1f5f9',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                        zIndex: 2,
                      }}
                    >
                      <Ionicons
                        name={step.icon as any}
                        size={16}
                        color={isCompleted || isCurrent ? '#ffffff' : '#94a3b8'}
                      />
                    </View>

                    {/* Step Text Info */}
                    <View style={{ flex: 1, paddingBottom: isLast ? 8 : 18 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: isCurrent || isCompleted ? '700' : '600',
                            color: isCurrent
                              ? '#4f46e5'
                              : isCompleted
                              ? '#15803d'
                              : '#64748b',
                          }}
                        >
                          {step.title}
                        </Text>
                        {isCurrent && (
                          <View
                            style={{
                              backgroundColor: '#eef2ff',
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 4,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 10,
                                fontWeight: '700',
                                color: '#4f46e5',
                                textTransform: 'uppercase',
                              }}
                            >
                              In Progress
                            </Text>
                          </View>
                        )}
                        {isCompleted && (
                          <View
                            style={{
                              backgroundColor: '#dcfce7',
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 4,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 10,
                                fontWeight: '700',
                                color: '#16a34a',
                                textTransform: 'uppercase',
                              }}
                            >
                              Done
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text
                        style={{
                          fontSize: 12,
                          color: '#64748b',
                          marginTop: 3,
                          lineHeight: 16,
                        }}
                      >
                        {step.description}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* In-app Notification Note */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#f0fdf4',
                padding: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#bbf7d0',
                marginBottom: 20,
              }}
            >
              <Ionicons name="notifications-outline" size={18} color="#16a34a" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 12, color: '#166534', flex: 1, lineHeight: 16 }}>
                You will receive an in-app notification when the review decision is published.
              </Text>
            </View>

            {/* Actions */}
            <View style={{ gap: 10 }}>
              <Button
                title="View in My Campaigns"
                variant="primary"
                size="md"
                onPress={onGoToMyCampaigns}
                fullWidth
              />
              <Button
                title="Return to Home"
                variant="secondary"
                size="md"
                onPress={onGoHome}
                fullWidth
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
