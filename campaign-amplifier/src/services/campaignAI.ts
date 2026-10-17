import { extractKeywords, capitalize, extractSummary, detectCategory } from '../utils/keywords';
import type { GeneratedCampaignContent } from '../types/campaign';

export function generateCampaignContent(issueText: string): GeneratedCampaignContent {
  const keywords = extractKeywords(issueText);
  const summary = extractSummary(issueText) || 'A local change that is overdue.';
  const category = detectCategory(issueText);
  const firstWord = keywords[0] ? capitalize(keywords[0]) : 'This issue';
  const secondWord = keywords[1] || 'the people affected';

  return {
    title: summary.replace(/[.!?]$/, '').slice(0, 80) || `${firstWord}: what has to change`,
    category,
    tagline: `${firstWord} is not a small problem, and it is a fixable one.`,
    descriptionHtml: `<p>${summary}</p><p>Most people never hear about ${secondWord} because it does not surface in a feed. It shows up in records, in meeting minutes, and in the experience of the people living with it.</p><p>This campaign funds the reach to put that in front of the audience who can act on it.</p>`,
    sources: [],
    whyBackersShouldCareHtml:
      '<p>Nothing here asks anyone to take a position on faith. The claims are checkable, the sources are listed, and the ask is specific.</p>',
    targetAudience: `People in the affected area who already care about ${keywords.slice(0, 2).join(' and ') || 'this issue'}, plus the decision-makers who can act on it.`,
    adHeadline: `${firstWord}. The part nobody mentions.`,
    adPrimaryText: `${summary} Here is what the records actually show.`,
    adImagePrompt: `A documentary-style photograph illustrating ${keywords.slice(0, 3).join(', ') || 'the issue'}, natural light, no text`,
    slides: [
      { description: `Open on the problem: ${keywords[0] || 'the issue'} in one clear image.` },
      { description: 'Show the evidence: the number that makes it undeniable.' },
      { description: 'Close on the ask: what changes if this reaches the right people.' },
    ],
    slideshowSupportTitle: 'Help this reach the people who decide',
    slideshowBackButtonText: 'Back this campaign',
  };
}
