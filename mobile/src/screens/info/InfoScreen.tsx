import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { colors, fonts, tokens } from '../../theme/tokens';

export interface InfoPageContent {
  slug: string;
  title: string;
  category: string;
  lastUpdated: string;
  summary: string;
  sections: {
    heading: string;
    paragraphs?: string[];
    bullets?: string[];
    callout?: {
      type: 'info' | 'warning' | 'policy';
      text: string;
    };
  }[];
}

export const INFO_PAGES: Record<string, InfoPageContent> = {
  about: {
    slug: 'about',
    title: 'About Campaign Amplifier',
    category: 'Platform Purpose',
    lastUpdated: 'October 2026',
    summary:
      'Campaign Amplifier is a civic message distribution platform. We pool micro-contributions from community members to run targeted digital ads that bring checkable messages in front of decision makers and affected residents.',
    sections: [
      {
        heading: 'What We Do',
        paragraphs: [
          'Many critical local issues—from lead pipe replacements in older schools to public transit route redesigns—sit unresolved in municipal minutes and government documents.',
          'Campaign Amplifier provides the infrastructure for community members and civic organizations to pool funds to buy digital advertising reach that puts grounded facts into the feeds of the people who can act.',
        ],
        callout: {
          type: 'policy',
          text: 'Message amplification, not a donation. Funds pay for advertising distribution, not direct charity or campaign funding to the organizer.',
        },
      },
      {
        heading: 'Core Principles',
        bullets: [
          'Traceable Evidence: Every campaign must cite documented public records or checkable data sources.',
          'Transparent Economics: Backers see exactly how contributions are split between ad spend (95%) and platform operations (5%).',
          'Privacy by Default: Backer identities and guest emails are kept private by default.',
          'Review Before Delivery: Reaching the funding goal does NOT start ads automatically; editorial and compliance review takes place before live distribution.',
        ],
      },
    ],
  },

  'how-it-works': {
    slug: 'how-it-works',
    title: 'How It Works',
    category: 'Sequence & Process',
    lastUpdated: 'October 2026',
    summary:
      'A clear sequence from message to reach. Learn how campaigns are drafted, reviewed, funded, and amplified.',
    sections: [
      {
        heading: 'Step 1: Create & Source',
        paragraphs: [
          'Creators draft their message manually or use our voice-guided workflow. All claims must be anchored by traceable sources.',
          'Creators set their own funding goal based on the reach they need. The platform never sets a default goal.',
        ],
      },
      {
        heading: 'Step 2: Editorial Review',
        paragraphs: [
          'Before any campaign can accept funding, our team reviews the copy, source citations, and targeting parameters.',
          'Campaigns that need clearer citations or balanced framing receive specific feedback and can be revised.',
        ],
      },
      {
        heading: 'Step 3: Community Funding',
        paragraphs: [
          'Anyone can browse and back approved campaigns. Guests can back without creating an account.',
          'Reach estimates update live based on standard digital ad inventory rates ($14.50 CPM and 2.2x frequency).',
        ],
      },
      {
        heading: 'Step 4: Targeted Amplification',
        paragraphs: [
          'When 100% of the goal is funded, the campaign transitions to goal reached. Ads do NOT launch automatically.',
          'Our ad operations team configures placements across Meta, Instagram, and Reddit, ensures compliance, and commences delivery.',
        ],
        callout: {
          type: 'info',
          text: 'Final distribution reports are published upon campaign completion with measured impressions, clicks, and reach clearly labelled as Measured (demo data).',
        },
      },
    ],
  },

  faqs: {
    slug: 'faqs',
    title: 'Frequently Asked Questions',
    category: 'Help & Knowledge',
    lastUpdated: 'October 2026',
    summary:
      'Common questions regarding backing, reach estimates, review policies, and fees.',
    sections: [
      {
        heading: 'Is my contribution a charitable donation?',
        paragraphs: [
          'No. Contributions are payments for advertising inventory and distribution services to spread a specific public-interest message. Contributions are not tax-deductible charitable gifts.',
        ],
      },
      {
        heading: 'What happens if a campaign does not reach its goal?',
        paragraphs: [
          'Campaigns operate under a 30-day funding window. If a campaign is cancelled or fails to launch, all unspent backer funds are refunded.',
        ],
      },
      {
        heading: 'How is estimated reach calculated?',
        paragraphs: [
          'Estimated reach is derived from the net ad budget divided by standard advertising CPM ($14.50 per 1,000 impressions) and divided by an average frequency of 2.2 impressions per individual.',
          'All reach figures prior to delivery are labelled as Estimates and are not guarantees of delivery.',
        ],
      },
      {
        heading: 'Are my name and email visible to others?',
        paragraphs: [
          'No. Backer names are private by default. When backing, you must explicitly opt in if you wish to display your name. Guest emails are never published or shared.',
        ],
      },
    ],
  },

  help: {
    slug: 'help',
    title: 'Help & Support',
    category: 'Support Resources',
    lastUpdated: 'October 2026',
    summary:
      'Assistance with account issues, backing troubleshooting, receipt lookups, and campaign creation.',
    sections: [
      {
        heading: 'Need Immediate Help?',
        paragraphs: [
          'If you encounter an issue while backing or drafting a campaign, please check our troubleshooting guides below or reach out to our team.',
        ],
        bullets: [
          'Receipt Lookup: Every completed contribution displays a digital receipt number (#REC-YYYY-XXXXXX). Save this number to reference your transaction.',
          'Draft Autosave: All drafts automatically autosave locally on this device and sync to the server when connected.',
          'Payment Status: In the demo environment, simulated payments can be toggled between Success, Pending, Failed, and Cancelled states.',
        ],
      },
    ],
  },

  contact: {
    slug: 'contact',
    title: 'Contact the Team',
    category: 'Communication',
    lastUpdated: 'October 2026',
    summary:
      'Get in touch with platform editors, ad operations, or technical support.',
    sections: [
      {
        heading: 'Direct Inquiries',
        paragraphs: [
          'For campaign review inquiries, editorial questions, or prototype feedback:',
        ],
        bullets: [
          'Email: support@campaign-amplifier.demo.org',
          'Review Desk: review@campaign-amplifier.demo.org',
          'Demo Hours: Monday – Friday, 9am – 6pm EST',
        ],
        callout: {
          type: 'info',
          text: 'This prototype is configured for demonstration purposes. Messages sent to demo email addresses are received by the test harness.',
        },
      },
    ],
  },

  terms: {
    slug: 'terms',
    title: 'Terms of Service',
    category: 'Legal & Agreement',
    lastUpdated: 'October 2026',
    summary:
      'User agreement governing campaign creation, message amplification, and backer conduct.',
    sections: [
      {
        heading: '1. Platform Purpose & Scope',
        paragraphs: [
          'Campaign Amplifier facilitates the pooling of funds for digital advertising distribution. Users agree that all campaigns must present checkable claims supported by cited sources.',
        ],
      },
      {
        heading: '2. Prohibited Content',
        bullets: [
          'No defamatory, deceptive, or hate speech.',
          'No harassment or targeting of private individuals.',
          'No promotion of ungrounded health treatments or electoral misinformation.',
        ],
      },
      {
        heading: '3. Editorial Authority',
        paragraphs: [
          'Platform editors reserve the right to request changes, pause funding, or reject campaigns that do not adhere to evidence and framing standards. Decisions are logged with audit trails.',
        ],
      },
    ],
  },

  privacy: {
    slug: 'privacy',
    title: 'Privacy Policy',
    category: 'Data Protection',
    lastUpdated: 'October 2026',
    summary:
      'Our commitment to backer anonymity, private defaults, and responsible data handling.',
    sections: [
      {
        heading: 'Backer Privacy by Default',
        paragraphs: [
          'We believe in protecting civic participation. Backer names are never displayed publicly unless you deliberately toggle the public name option during backing.',
          'Guest backers may contribute without registering. Guest email addresses are utilized solely for delivering receipts and status notifications.',
        ],
        callout: {
          type: 'policy',
          text: 'We never sell, rent, or monetize backer lists or targeting profiles.',
        },
      },
      {
        heading: 'Data Collected & Stored',
        bullets: [
          'Authentication: Secure bcrypt password hashing with signed JWT bearer tokens.',
          'Local Storage: Drafts and preferences are stored locally on your device using AsyncStorage.',
          'Audit Logs: Moderation actions are recorded in moderation event logs without exposing personal emails.',
        ],
      },
    ],
  },

  'community-guidelines': {
    slug: 'community-guidelines',
    title: 'Community Guidelines',
    category: 'Standards & Ethics',
    lastUpdated: 'October 2026',
    summary:
      'Standards for constructive, evidence-based civic discourse and responsible advertising.',
    sections: [
      {
        heading: 'Expectations for Creators',
        bullets: [
          'Anchor in Public Records: Cite local government records, published studies, or news reporting.',
          'Proportionate Framing: Avoid sensationalized claims; keep headlines grounded in the evidence.',
          'Respectful Ask: Propose constructive community action, public comment, or administrative change.',
        ],
      },
    ],
  },

  'fees-and-refunds': {
    slug: 'fees-and-refunds',
    title: 'Fees & Refund Policy',
    category: 'Financial Policies',
    lastUpdated: 'October 2026',
    summary:
      'Complete transparency regarding payment processing, platform fees, and refund criteria.',
    sections: [
      {
        heading: 'Fee Structure',
        bullets: [
          'Payment Processing Fee: 2.9% + $0.30 per contribution, paid by the backer so that 100% of chosen contribution funds the campaign.',
          'Platform Operations Fee: 5% of the campaign contribution. This fee is allocated to support editorial review, compliance, and distribution infrastructure.',
          'Net Advertising Spend: 95% of every contributed dollar directly purchases digital advertising reach.',
        ],
      },
      {
        heading: 'Refund Conditions',
        paragraphs: [
          'If a campaign is cancelled prior to launch or does not meet minimum viability requirements, unspent ad funds are refunded to backers.',
          'Once advertising delivery has commenced and impressions are served, expended advertising inventory is non-refundable.',
        ],
        callout: {
          type: 'info',
          text: 'All fees and refund policies are enforced via automated accounting and recorded on your digital receipt.',
        },
      },
    ],
  },
};

export function InfoScreen({ route, navigation }: any) {
  const slug = route?.params?.slug || 'about';
  const content = INFO_PAGES[slug] || INFO_PAGES.about;

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header */}
      <View
        style={{
          paddingTop: 52,
          paddingBottom: 14,
          paddingHorizontal: 16,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => navigation.goBack()}
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
        <Text style={{ fontSize: 16, fontFamily: fonts.serifBold, color: colors.ink }} numberOfLines={1}>
          {content.title}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* Hero Meta Card */}
        <Card style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <View style={{ backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 8, paddingVertical: 2, borderRadius: tokens.radii.xs }}>
              <Text style={{ fontSize: 10, fontFamily: fonts.sansBold, color: colors.accent, textTransform: 'uppercase', letterSpacing: 0.9 }}>
                {content.category}
              </Text>
            </View>
            <Text style={{ fontSize: 11, fontFamily: fonts.sansRegular, color: colors.inkMuted }}>Updated: {content.lastUpdated}</Text>
          </View>
          <Text style={{ fontSize: 22, fontFamily: fonts.serifBold, color: colors.ink, marginBottom: 8, lineHeight: 28 }}>
            {content.title}
          </Text>
          <Text style={{ fontSize: 14, fontFamily: fonts.sansRegular, color: colors.inkSecondary, lineHeight: 21 }}>
            {content.summary}
          </Text>
        </Card>

        {/* Content Sections */}
        {content.sections.map((sec, idx) => (
          <Card key={idx} style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontFamily: fonts.serifBold, color: colors.ink, marginBottom: 8 }}>
              {sec.heading}
            </Text>

            {sec.paragraphs?.map((p, pIdx) => (
              <Text key={pIdx} style={{ fontSize: 13, fontFamily: fonts.sansRegular, color: colors.inkSecondary, lineHeight: 20, marginBottom: 8 }}>
                {p}
              </Text>
            ))}

            {sec.bullets && (
              <View style={{ gap: 6, marginVertical: 6 }}>
                {sec.bullets.map((b, bIdx) => (
                  <View key={bIdx} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <Text style={{ color: colors.accent, fontFamily: fonts.sansBold, marginRight: 8, fontSize: 14 }}>•</Text>
                    <Text style={{ fontSize: 13, fontFamily: fonts.sansRegular, color: colors.inkSecondary, lineHeight: 19, flex: 1 }}>{b}</Text>
                  </View>
                ))}
              </View>
            )}

            {sec.callout && (
              <View
                style={{
                  marginTop: 10,
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: sec.callout.type === 'policy' ? colors.positive : colors.border,
                  borderWidth: 1,
                  borderRadius: tokens.radii.xs,
                  padding: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: fonts.sansMedium,
                    color: colors.ink,
                    lineHeight: 18,
                  }}
                >
                  {sec.callout.text}
                </Text>
              </View>
            )}
          </Card>
        ))}

        {/* Quick Links to other info pages */}
        <Card style={{ marginTop: 8 }}>
          <Text style={{ fontSize: 11, fontFamily: fonts.sansBold, color: colors.inkMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
            Related Information
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {Object.keys(INFO_PAGES)
              .filter((k) => k !== slug)
              .slice(0, 4)
              .map((k) => (
                <TouchableOpacity
                  key={k}
                  onPress={() => navigation.push('InfoPage', { slug: k })}
                  style={{
                    backgroundColor: colors.surfaceSecondary,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: tokens.radii.xs,
                  }}
                >
                  <Text style={{ fontSize: 12, fontFamily: fonts.sansMedium, color: colors.ink }}>
                    {INFO_PAGES[k].title}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}
