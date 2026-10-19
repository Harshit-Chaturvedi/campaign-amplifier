import { extractKeywords, capitalize, extractSummary, detectCategory } from '../utils/keywords';
import type { GeneratedCampaignContent } from '../types/campaign';

export function generateCampaignContent(issueText: string): GeneratedCampaignContent {
  const keywords = extractKeywords(issueText);
  const summary = extractSummary(issueText) || 'A local issue that requires community awareness.';
  const category = detectCategory(issueText);
  const firstWord = keywords[0] ? capitalize(keywords[0]) : 'This issue';
  const secondWord = keywords[1] || 'the people affected';

  return {
    title: summary.replace(/[.!?]$/, '').slice(0, 60) || `${firstWord}: what has to change`,
    category,
    tagline: `${firstWord} is a solvable problem that needs distribution.`,
    summary,
    storyBlocks: [
      { type: 'heading', text: `${firstWord}: The Current Reality`, level: 1 },
      { type: 'paragraph', text: summary },
      {
        type: 'paragraph',
        text: `Most residents never hear about ${secondWord} through ordinary media channels because local coverage has diminished. Community-funded advertising distributes this message directly to the audience that can act on it.`,
      },
      {
        type: 'quote',
        quote: 'When the community pools distribution resources, critical evidence reaches decision-makers before policy windows close.',
        attribution: 'Community Briefing',
      },
    ],
    sources: [],
    targetAudience: `Residents and decision-makers in the affected area interested in ${keywords.slice(0, 2).join(' and ') || 'this issue'}.`,
    adHeadline: `${firstWord}. The evidence is public.`.slice(0, 60),
    adPrimaryText: `${summary} Back this campaign to fund ad reach that spreads the facts.`,
    adImagePrompt: `A clear documentary photograph representing ${keywords.slice(0, 3).join(', ') || 'community civic advocacy'}, natural daylight`,
  };
}
