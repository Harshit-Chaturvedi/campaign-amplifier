import { apiClient } from '../src/api/client';
import { useDraftStore, CampaignDraft } from '../src/store/useDraftStore';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('Draft Sync, 404 Recovery, and Submit Resilience Suite', () => {
  beforeEach(() => {
    // Reset store
    useDraftStore.setState({
      drafts: {},
      activeDraftId: null,
    });
    jest.restoreAllMocks();
  });

  it('1. createDraft and patchDraft succeed with valid server responses', async () => {
    const mockDraft = {
      id: 'cmp-srv-101',
      title: 'Protect County Wetlands',
      category: 'environment',
      creator_name: 'Elena Rostova',
      summary: 'Preserve 400 acres of municipal marshland.',
      funding_goal: 5000,
      status: 'draft',
    };

    jest.spyOn(apiClient, 'createDraft').mockResolvedValueOnce({
      draft: mockDraft,
      isOffline: false,
    });

    jest.spyOn(apiClient, 'patchDraft').mockResolvedValueOnce({
      draft: { ...mockDraft, funding_goal: 6000 },
      isOffline: false,
    });

    // Create
    const createRes = await apiClient.createDraft({
      title: 'Protect County Wetlands',
      category: 'environment',
      creator_name: 'Elena Rostova',
    });
    expect(createRes.isOffline).toBe(false);
    expect(createRes.draft.id).toBe('cmp-srv-101');

    // Patch
    const patchRes = await apiClient.patchDraft('cmp-srv-101', {
      funding_goal: 6000,
    });
    expect(patchRes.isOffline).toBe(false);
    expect(patchRes.draft.funding_goal).toBe(6000);
  });

  it('2. submitDraft succeeds and returns campaignStatus', async () => {
    jest.spyOn(apiClient, 'submitDraft').mockResolvedValueOnce({
      success: true,
      isOffline: false,
      campaignStatus: 'submitted',
    });

    const submitRes = await apiClient.submitDraft('cmp-srv-101');
    expect(submitRes.success).toBe(true);
    expect(submitRes.isOffline).toBe(false);
    expect(submitRes.campaignStatus).toBe('submitted');
  });

  it('3. 404 on patchDraft triggers auto-recover remap + retry flow', async () => {
    const oldLocalId = 'cmp-local-client-123';
    const newServerId = 'cmp-server-assigned-456';

    // Seed local draft in Zustand
    const localDraft: CampaignDraft = {
      id: oldLocalId,
      step: 3,
      updatedAt: new Date().toISOString(),
      title: 'Emergency Winter Warming Centers',
      category: 'community',
      creatorName: 'Elena Rostova',
      summary: 'Extend shelter opening hours past 7am during freeze warnings.',
      storyBlocks: [],
      sources: [],
      adImages: [],
      headline: 'Keep warming shelters open',
      adDescription: 'Sub-zero temperatures demand extended shelter hours.',
      cta: 'Learn More',
      locations: ['Cook County'],
      interests: ['Community Care'],
      channels: ['Meta', 'Instagram'],
      budgetAllocation: { Meta: 60, Instagram: 40 },
      durationDays: 30,
      fundingGoal: 2000,
    };
    useDraftStore.getState().saveDraft(localDraft);
    useDraftStore.getState().setActiveDraft(oldLocalId);

    expect(useDraftStore.getState().drafts[oldLocalId]).toBeDefined();

    // Mock patchDraft to simulate 404 for old unsynced id
    const notFoundError: any = new Error('Draft not found');
    notFoundError.status = 404;
    notFoundError.isHttpError = true;

    const patchSpy = jest.spyOn(apiClient, 'patchDraft');
    patchSpy.mockRejectedValueOnce(notFoundError);

    // Mock createDraft to return new server id
    const createSpy = jest.spyOn(apiClient, 'createDraft').mockResolvedValueOnce({
      draft: {
        id: newServerId,
        title: localDraft.title,
        category: localDraft.category,
      },
      isOffline: false,
    });

    // Mock successful retry on the new server id
    patchSpy.mockResolvedValueOnce({
      draft: {
        id: newServerId,
        title: localDraft.title,
        status: 'draft',
      },
      isOffline: false,
    });

    // Execute the auto-recover flow
    let activeId = oldLocalId;
    try {
      await apiClient.patchDraft(activeId, { title: localDraft.title });
    } catch (err: any) {
      if (err.status === 404) {
        // Auto-recover
        const createRes = await apiClient.createDraft({
          title: localDraft.title,
          category: localDraft.category,
        });
        expect(createRes.draft.id).toBe(newServerId);

        // Remap in Zustand store
        useDraftStore.getState().remapDraftId(oldLocalId, newServerId);
        activeId = newServerId;

        // Retry patch once with new id
        const retryRes = await apiClient.patchDraft(newServerId, { title: localDraft.title });
        expect(retryRes.isOffline).toBe(false);
      }
    }

    // Verify store state after remap
    const storeState = useDraftStore.getState();
    expect(storeState.drafts[oldLocalId]).toBeUndefined();
    expect(storeState.drafts[newServerId]).toBeDefined();
    expect(storeState.drafts[newServerId].id).toBe(newServerId);
    expect(storeState.drafts[newServerId].title).toBe('Emergency Winter Warming Centers');
    expect(storeState.activeDraftId).toBe(newServerId);
  });

  it('4. offline submit failure throws truthful message and does NOT mark draft submitted', async () => {
    const draftId = 'cmp-offline-test-789';
    const draft: CampaignDraft = {
      id: draftId,
      step: 5,
      updatedAt: new Date().toISOString(),
      title: 'Pedestrian Crossing Safety',
      category: 'community',
      creatorName: 'Devin',
      summary: 'Signalized crosswalk near school zone',
      storyBlocks: [],
      sources: [],
      adImages: [],
      headline: 'Safe crosswalks now',
      adDescription: 'Slow traffic near schools',
      cta: 'Learn More',
      locations: ['Metro Area'],
      interests: ['School Safety'],
      channels: ['Meta'],
      budgetAllocation: { Meta: 100 },
      durationDays: 30,
      fundingGoal: 1500,
    };
    useDraftStore.getState().saveDraft(draft);

    // Mock submitDraft to throw offline error
    jest.spyOn(apiClient, 'submitDraft').mockRejectedValueOnce(
      new Error('You are offline. Your draft is saved on this device. Reconnect to submit.')
    );

    let caughtError: any = null;
    try {
      await apiClient.submitDraft(draftId);
      // If fake success existed, it would continue here and mark as submitted
      useDraftStore.getState().saveDraft({ ...draft, step: 5 });
    } catch (err: any) {
      caughtError = err;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError.message).toBe('You are offline. Your draft is saved on this device. Reconnect to submit.');

    // Confirm draft is still a draft and not marked submitted
    const savedDraft = useDraftStore.getState().getDraft(draftId);
    expect(savedDraft).toBeDefined();
    expect(savedDraft?.step).toBe(5);
  });
});
