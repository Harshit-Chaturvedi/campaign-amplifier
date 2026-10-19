import React from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';
import {
  Headline,
  Subheading,
  BodyText,
  SmallCapsLabel,
  MetaLabel,
  Text,
} from '../../components/ui/Typography';
import { colors, fonts, tokens } from '../../theme/tokens';

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
    icon: 'checkmark-circle-outline',
  },
  {
    key: 'review',
    title: 'In Review',
    status: 'current',
    description: 'Our team reviews all claims against cited sources, ad copy, visuals, and targeting.',
    icon: 'time-outline',
  },
  {
    key: 'decision',
    title: 'Changes Requested or Approved',
    status: 'upcoming',
    description: 'If approved, your campaign goes live. If revisions are required, you will receive editorial feedback.',
    icon: 'swap-horizontal-outline',
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
          backgroundColor: 'rgba(22, 19, 15, 0.6)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
      >
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: tokens.radius.md,
            width: '100%',
            maxWidth: 440,
            maxHeight: '90%',
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: colors.hairline,
          }}
        >
          {/* Header Banner */}
          <View
            style={{
              backgroundColor: colors.paperSecondary,
              paddingVertical: 20,
              paddingHorizontal: tokens.spacing.lg,
              alignItems: 'center',
              borderBottomWidth: 1,
              borderBottomColor: colors.hairline,
            }}
          >
            <View
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: colors.positive,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10,
              }}
            >
              <Ionicons name="checkmark" size={28} color={colors.surface} />
            </View>
            <Headline
              style={{
                fontSize: 20,
                color: colors.ink,
                textAlign: 'center',
              }}
            >
              Submitted for Review
            </Headline>
            <MetaLabel
              style={{
                textAlign: 'center',
                marginTop: 4,
              }}
            >
              Content, sources, creative and targeting queued for review.
            </MetaLabel>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: tokens.spacing.lg }}
          >
            {/* Campaign Summary Card */}
            <View
              style={{
                backgroundColor: colors.paperSecondary,
                borderRadius: tokens.radius.sm,
                padding: 12,
                borderWidth: 1,
                borderColor: colors.hairline,
                marginBottom: tokens.spacing.md,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: fonts.sansSemiBold,
                  color: colors.ink,
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
                  marginTop: 6,
                }}
              >
                <MetaLabel>
                  ID: {campaignId.slice(0, 14)}...
                </MetaLabel>
                {fundingGoal > 0 && (
                  <Text style={{ fontSize: 13, fontFamily: fonts.sansBold, color: colors.accent }}>
                    Goal: ${fundingGoal.toLocaleString()}
                  </Text>
                )}
              </View>
            </View>

            {/* Status Timeline */}
            <SmallCapsLabel
              style={{
                color: colors.mutedInk,
                marginBottom: 12,
              }}
            >
              STATUS TIMELINE
            </SmallCapsLabel>

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
                          top: 24,
                          left: 13,
                          width: 1,
                          bottom: -4,
                          backgroundColor: isCompleted ? colors.positive : colors.hairline,
                          zIndex: 1,
                        }}
                      />
                    )}

                    {/* Step Icon Node */}
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: isCompleted
                          ? colors.positive
                          : isCurrent
                          ? colors.accent
                          : colors.paperSecondary,
                        borderWidth: 1,
                        borderColor: isCompleted
                          ? colors.positive
                          : isCurrent
                          ? colors.accent
                          : colors.hairline,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                        zIndex: 2,
                      }}
                    >
                      <Ionicons
                        name={step.icon as any}
                        size={14}
                        color={isCompleted || isCurrent ? colors.surface : colors.mutedInk}
                      />
                    </View>

                    {/* Step Text Info */}
                    <View style={{ flex: 1, paddingBottom: isLast ? 8 : 16 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text
                          style={{
                            fontSize: 14,
                            fontFamily: isCurrent || isCompleted ? fonts.sansSemiBold : fonts.sansRegular,
                            color: isCurrent
                              ? colors.accent
                              : isCompleted
                              ? colors.positive
                              : colors.mutedInk,
                          }}
                        >
                          {step.title}
                        </Text>
                        {isCurrent && (
                          <View
                            style={{
                              backgroundColor: colors.paperSecondary,
                              borderWidth: 1,
                              borderColor: colors.hairline,
                              paddingHorizontal: 5,
                              paddingVertical: 1,
                              borderRadius: tokens.radius.xs,
                            }}
                          >
                            <SmallCapsLabel style={{ fontSize: 9, color: colors.accent }}>
                              IN PROGRESS
                            </SmallCapsLabel>
                          </View>
                        )}
                        {isCompleted && (
                          <View
                            style={{
                              backgroundColor: colors.paperSecondary,
                              borderWidth: 1,
                              borderColor: colors.hairline,
                              paddingHorizontal: 5,
                              paddingVertical: 1,
                              borderRadius: tokens.radius.xs,
                            }}
                          >
                            <SmallCapsLabel style={{ fontSize: 9, color: colors.positive }}>
                              DONE
                            </SmallCapsLabel>
                          </View>
                        )}
                      </View>
                      <BodyText
                        style={{
                          fontSize: 12,
                          color: colors.mutedInk,
                          marginTop: 2,
                          lineHeight: 16,
                        }}
                      >
                        {step.description}
                      </BodyText>
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
                backgroundColor: colors.paperSecondary,
                padding: 12,
                borderRadius: tokens.radius.xs,
                borderWidth: 1,
                borderColor: colors.hairline,
                marginBottom: tokens.spacing.lg,
              }}
            >
              <Ionicons name="notifications-outline" size={16} color={colors.accent} style={{ marginRight: 8 }} />
              <BodyText style={{ fontSize: 12, color: colors.mutedInk, flex: 1, lineHeight: 16 }}>
                You will receive an in-app notification when the review decision is published.
              </BodyText>
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
