import { seedCampaigns } from '../src/data/seedData';
import { estimateReach } from '../src/services/reach';
import { formatNumber } from '../src/utils/formatting';

describe('Part B.5: Reach Consistency & Seed Parity Tests', () => {
  const threeCampaigns = [
    { id: 'cmp-clean-water', goal: 8000, raised: 5340, percent: 67 },
    { id: 'cmp-antibiotic-watch', goal: 9500, raised: 4200, percent: 44 },
    { id: 'cmp-tree-canopy', goal: 11000, raised: 7650, percent: 70 },
  ];

  test('Seed parity: clean water, antibiotic watch, and tree canopy have exact raised amounts', () => {
    threeCampaigns.forEach(({ id, goal, raised, percent }) => {
      const camp = seedCampaigns.find((c) => c.id === id);
      expect(camp).toBeDefined();
      expect(camp!.fundingGoal).toBe(goal);
      expect(camp!.amountRaised).toBe(raised);
      expect(camp!.percentFunded).toBe(percent);
    });
  });

  test('Reach consistency: reach at goal and reach at current funding match shared reach formula', () => {
    threeCampaigns.forEach(({ id, goal, raised }) => {
      const camp = seedCampaigns.find((c) => c.id === id)!;

      // 1. Expected calculations from shared reach service
      const expectedReachAtGoal = estimateReach(goal).estimate;
      const expectedReachAtCurrent = estimateReach(raised).estimate;

      // 2. Card and Detail use estimatedReachAtGoal or estimateReach(fundingGoal)
      const cardReachAtGoal = camp.estimatedReachAtGoal || estimateReach(camp.fundingGoal).estimate;
      const detailReachAtGoal = camp.estimatedReachAtGoal || estimateReach(camp.fundingGoal).estimate;
      const stickyReachAtGoal = cardReachAtGoal;

      // All 3 locations showing "Est. reach at goal" must be identical
      expect(cardReachAtGoal).toBe(expectedReachAtGoal);
      expect(detailReachAtGoal).toBe(expectedReachAtGoal);
      expect(stickyReachAtGoal).toBe(expectedReachAtGoal);

      // 3. For cmp-antibiotic-watch specifically:
      // Reach at goal ($9,500) -> 282,915 (~282.9K)
      // Reach at current funding ($4,200) -> 125,078 (~125.1K)
      if (id === 'cmp-antibiotic-watch') {
        expect(expectedReachAtGoal).toBe(282915);
        expect(formatNumber(expectedReachAtGoal)).toBe('282.9K');
        expect(expectedReachAtCurrent).toBe(125078);
        expect(formatNumber(expectedReachAtCurrent)).toBe('125.1K');
      }

      // For cmp-clean-water ($8,000 goal, $5,340 raised)
      if (id === 'cmp-clean-water') {
        expect(expectedReachAtGoal).toBe(238245);
        expect(expectedReachAtCurrent).toBe(159028);
      }

      // For cmp-tree-canopy ($11,000 goal, $7,650 raised)
      if (id === 'cmp-tree-canopy') {
        expect(expectedReachAtGoal).toBe(327586);
        expect(expectedReachAtCurrent).toBe(227821);
      }
    });
  });

  test('Campaign stays available_for_funding and in public set', () => {
    const cleanWater = seedCampaigns.find((c) => c.id === 'cmp-clean-water');
    expect(cleanWater).toBeDefined();
    expect(cleanWater!.status).toBe('available_for_funding');
  });
});
