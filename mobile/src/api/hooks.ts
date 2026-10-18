import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, CampaignsQueryParams, CampaignsResult, CampaignResult } from './client';

export const campaignKeys = {
  all: ['campaigns'] as const,
  lists: () => [...campaignKeys.all, 'list'] as const,
  list: (params: CampaignsQueryParams) => [...campaignKeys.lists(), params] as const,
  details: () => [...campaignKeys.all, 'detail'] as const,
  detail: (id: string) => [...campaignKeys.details(), id] as const,
  featured: () => [...campaignKeys.all, 'featured'] as const,
};

export function useCampaigns(params: CampaignsQueryParams = {}) {
  return useQuery<CampaignsResult>({
    queryKey: campaignKeys.list(params),
    queryFn: () => apiClient.getCampaigns(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useFeaturedCampaigns() {
  return useQuery<CampaignsResult>({
    queryKey: campaignKeys.featured(),
    queryFn: async () => {
      const res = await apiClient.getCampaigns({ limit: 5 });
      // Filter top featured
      const featuredIds = ['cmp-clean-water', 'cmp-transit-map', 'cmp-tree-canopy', 'cmp-night-shelter'];
      const featuredItems = res.items.filter((c) => featuredIds.includes(c.id));
      return {
        items: featuredItems.length > 0 ? featuredItems : res.items.slice(0, 3),
        total: featuredItems.length > 0 ? featuredItems.length : Math.min(3, res.items.length),
        isOffline: res.isOffline,
      };
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useCampaign(idOrSlug: string) {
  return useQuery<CampaignResult>({
    queryKey: campaignKeys.detail(idOrSlug),
    queryFn: () => apiClient.getCampaign(idOrSlug),
    enabled: Boolean(idOrSlug),
    staleTime: 1000 * 60 * 2,
  });
}

export function useSubmitFeedback(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (feedback: { visualsKeptReading: string; changedMind: string }) =>
      apiClient.submitFeedback(campaignId, feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(campaignId) });
    },
  });
}

export function useMyCampaigns(status?: string) {
  return useQuery({
    queryKey: ['my-campaigns', status],
    queryFn: () => apiClient.getMyCampaigns(status),
    staleTime: 1000 * 30, // 30s
  });
}

export function useSubmitDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (draftId: string) => apiClient.submitDraft(draftId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-campaigns'] });
      queryClient.invalidateQueries({ queryKey: campaignKeys.all });
    },
  });
}

