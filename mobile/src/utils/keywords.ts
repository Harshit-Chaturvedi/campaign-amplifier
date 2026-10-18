import type { CampaignCategory } from '../types/campaign';

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'for', 'to', 'of', 'in', 'on', 'at', 'by',
  'with', 'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'it', 'its',
  'this', 'that', 'these', 'those', 'we', 'our', 'they', 'their', 'you', 'your',
  'i', 'my', 'about', 'into', 'over', 'than', 'then', 'so', 'if', 'not', 'no',
  'can', 'will', 'would',
]);

export function extractKeywords(text: string, count = 6): string[] {
  const words = String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w));

  const freq = new Map<string, number>();
  words.forEach((w) => freq.set(w, (freq.get(w) || 0) + 1));

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, count)
    .map(([w]) => w);
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function extractSummary(text: string): string {
  const t = String(text || '').trim();
  const match = t.match(/^(.{20,160}?[.!?])\s/);
  return (match ? match[1] : t.slice(0, 160)).trim();
}

const CATEGORY_RULES: { key: CampaignCategory; words: string[] }[] = [
  { key: 'environment', words: ['climate', 'tree', 'water', 'air', 'heat', 'pollution', 'energy', 'recycling', 'noise', 'green'] },
  { key: 'health', words: ['health', 'hospital', 'clinic', 'lead', 'disease', 'care', 'mental', 'safety', 'medical', 'food'] },
  { key: 'science', words: ['research', 'laboratory', 'technology', 'space', 'data', 'physics', 'biology', 'ai', 'discovery'] },
  { key: 'education', words: ['school', 'student', 'teacher', 'library', 'classroom', 'literacy', 'tuition', 'college', 'books'] },
  { key: 'public_policy', words: ['ballot', 'council', 'transit', 'vote', 'policy', 'permit', 'ordinance', 'rights', 'law'] },
  { key: 'economic_policy', words: ['tax', 'inflation', 'wage', 'budget', 'debt', 'housing', 'interest', 'economy', 'jobs'] },
  { key: 'community', words: ['shelter', 'neighbour', 'neighbor', 'community', 'volunteer', 'park', 'playground', 'elderly'] },
  { key: 'arts_culture', words: ['museum', 'theater', 'music', 'art', 'heritage', 'festival', 'history', 'creative'] },
  { key: 'business', words: ['repair', 'price', 'fees', 'contract', 'warranty', 'refund', 'startup', 'farmer', 'retail'] },
  { key: 'other', words: ['general', 'miscellaneous'] },
];

export function detectCategory(text: string): CampaignCategory {
  const lower = String(text || '').toLowerCase();
  let bestKey: CampaignCategory = 'public_policy';
  let bestScore = 0;
  CATEGORY_RULES.forEach(({ key, words }) => {
    const score = words.reduce((s, w) => s + (lower.includes(w) ? 1 : 0), 0);
    if (score > bestScore) {
      bestKey = key;
      bestScore = score;
    }
  });
  return bestKey;
}
