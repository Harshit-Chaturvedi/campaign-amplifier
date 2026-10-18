import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCampaigns } from '../../api/hooks';
import { CampaignCard } from '../../components/campaign/CampaignCard';
import { getCategoryColor } from '../../theme/colors';
import { CampaignCardSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { BottomSheet } from '../../components/ui/BottomSheet';
import type { CampaignCategory } from '../../types/campaign';

const CATEGORIES: { key: CampaignCategory | 'all'; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'all', label: 'All', icon: 'grid-outline' },
  { key: 'environment', label: 'Environment', icon: 'leaf-outline' },
  { key: 'health', label: 'Health', icon: 'heart-outline' },
  { key: 'science', label: 'Science', icon: 'flask-outline' },
  { key: 'education', label: 'Education', icon: 'school-outline' },
  { key: 'public_policy', label: 'Public Policy', icon: 'flag-outline' },
  { key: 'economic_policy', label: 'Economic Policy', icon: 'trending-up-outline' },
  { key: 'community', label: 'Community', icon: 'people-outline' },
  { key: 'arts_culture', label: 'Arts & Culture', icon: 'color-palette-outline' },
  { key: 'business', label: 'Business', icon: 'briefcase-outline' },
  { key: 'other', label: 'Other', icon: 'layers-outline' },
];

const SORT_OPTIONS = [
  { key: 'trending', label: 'Trending', icon: 'flame-outline' },
  { key: 'newest', label: 'Newest', icon: 'sparkles-outline' },
  { key: 'most_funded', label: 'Most Funded', icon: 'cash-outline' },
  { key: 'ending_soon', label: 'Ending Soon', icon: 'time-outline' },
  { key: 'closest_to_goal', label: 'Closest to Goal', icon: 'trending-up-outline' },
];

const STATUS_FILTERS = [
  { key: 'all', label: 'All Public' },
  { key: 'available_for_funding', label: 'Available for Funding' },
  { key: 'promoting', label: 'Currently Promoting' },
  { key: 'completed', label: 'Completed' },
];

const FUNDING_FILTERS = [
  { key: '', label: 'Any Funding %' },
  { key: 'under50', label: 'Under 50%' },
  { key: '50to99', label: '50% to 99%' },
  { key: '100plus', label: 'Fully Funded (100%+)' },
];

export function ExploreScreen({ navigation }: any) {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState<CampaignCategory | 'all'>('all');
  const [sort, setSort] = useState('trending');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fundingPctFilter, setFundingPctFilter] = useState('');
  const [isFilterSheetVisible, setFilterSheetVisible] = useState(false);
  const [isSortSheetVisible, setSortSheetVisible] = useState(false);

  // 300ms debounce for search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Query campaigns with debounced search, category, sort, status, and funding filters
  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useCampaigns({
    q: debouncedSearch || undefined,
    category: category !== 'all' ? category : undefined,
    sort,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    fundingPct: fundingPctFilter || undefined,
  });

  const campaigns = data?.items || [];
  const isOffline = Boolean(data?.isOffline);

  // Active filter count
  const activeFiltersCount =
    (category !== 'all' ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0) +
    (fundingPctFilter ? 1 : 0) +
    (sort !== 'trending' ? 1 : 0);

  const clearAllFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setCategory('all');
    setSort('trending');
    setStatusFilter('all');
    setFundingPctFilter('');
  };

  const goToDetail = (id: string) =>
    navigation.navigate('CampaignDetail', { campaignId: id });
  const goToBack = (id: string) =>
    navigation.navigate('FundCampaign', { campaignId: id });

  const currentSortLabel =
    SORT_OPTIONS.find((s) => s.key === sort)?.label || 'Trending';

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <StatusBar barStyle="dark-content" />

      {/* Header with Search & Filter controls */}
      <View
        style={{
          paddingTop: 52,
          paddingBottom: 12,
          paddingHorizontal: 20,
          backgroundColor: '#fff',
          borderBottomWidth: 1,
          borderBottomColor: '#f1f5f9',
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#0f172a' }}>Explore</Text>
          {isOffline && (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fffbeb', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
              <Ionicons name="cloud-offline-outline" size={13} color="#b45309" style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#b45309' }}>Offline demo</Text>
            </View>
          )}
        </View>

        {/* Search bar + filter toggle */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#f1f5f9',
              borderRadius: 14,
              paddingHorizontal: 12,
              height: 44,
            }}
          >
            <Ionicons name="search" size={18} color="#94a3b8" />
            <TextInput
              value={searchInput}
              onChangeText={setSearchInput}
              placeholder="Search by title, topic, creator..."
              placeholderTextColor="#94a3b8"
              style={{ flex: 1, fontSize: 14, color: '#0f172a', marginLeft: 8 }}
            />
            {searchInput.length > 0 && (
              <TouchableOpacity onPress={() => setSearchInput('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={18} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter button with badge */}
          <TouchableOpacity
            onPress={() => setFilterSheetVisible(true)}
            style={{
              height: 44,
              width: 44,
              borderRadius: 14,
              backgroundColor: activeFiltersCount > 0 ? '#eef2ff' : '#f1f5f9',
              borderColor: activeFiltersCount > 0 ? '#c7d2fe' : '#f1f5f9',
              borderWidth: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={activeFiltersCount > 0 ? '#4f46e5' : '#475569'}
            />
            {activeFiltersCount > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#4f46e5',
                }}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Sort & Filter pills row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
          <TouchableOpacity
            onPress={() => setSortSheetVisible(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#f8fafc',
              borderColor: '#e2e8f0',
              borderWidth: 1,
              borderRadius: 10,
              paddingHorizontal: 10,
              paddingVertical: 5,
            }}
          >
            <Ionicons name="swap-vertical" size={14} color="#64748b" style={{ marginRight: 4 }} />
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#475569' }}>
              Sort: {currentSortLabel}
            </Text>
            <Ionicons name="chevron-down" size={14} color="#94a3b8" style={{ marginLeft: 4 }} />
          </TouchableOpacity>

          {activeFiltersCount > 0 && (
            <TouchableOpacity onPress={clearAllFilters} style={{ paddingVertical: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#ef4444' }}>
                Reset filters ({activeFiltersCount})
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 10 Category Chips */}
      <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}
        >
          {CATEGORIES.map((cat) => {
            const selected = category === cat.key;
            const color = cat.key === 'all' ? '#4f46e5' : getCategoryColor(cat.key);
            return (
              <TouchableOpacity
                key={cat.key}
                onPress={() => setCategory(cat.key)}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 20,
                  marginRight: 8,
                  backgroundColor: selected ? color : '#f8fafc',
                  borderWidth: 1,
                  borderColor: selected ? color : '#e2e8f0',
                }}
              >
                <Ionicons
                  name={cat.icon}
                  size={14}
                  color={selected ? '#fff' : color}
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: selected ? '700' : '600',
                    color: selected ? '#fff' : '#475569',
                  }}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Results Feed */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 80 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => { refetch(); }} tintColor="#4f46e5" />
        }
      >
        {/* Results count header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '500' }}>
            {isLoading
              ? 'Loading campaigns...'
              : `${campaigns.length} campaign${campaigns.length !== 1 ? 's' : ''} found`}
          </Text>
          {debouncedSearch && (
            <Text style={{ fontSize: 12, color: '#94a3b8' }}>
              Query: "{debouncedSearch}"
            </Text>
          )}
        </View>

        {/* Loading Skeletons */}
        {isLoading && !isRefetching && (
          <View>
            <CampaignCardSkeleton />
            <CampaignCardSkeleton />
            <CampaignCardSkeleton />
          </View>
        )}

        {/* Error State */}
        {isError && (
          <ErrorState
            title="Failed to fetch campaigns"
            message="We could not connect to the campaign server. Please check your network and retry."
            onRetry={refetch}
          />
        )}

        {/* Empty / No Results State */}
        {!isLoading && !isError && campaigns.length === 0 && (
          <EmptyState
            icon="search-outline"
            title="No campaigns match your filters"
            message={
              debouncedSearch
                ? `No active campaigns found matching "${debouncedSearch}". Try clearing filters or searching for another keyword.`
                : 'No campaigns match the selected category and funding status filters.'
            }
            actionLabel="Clear Filters"
            onAction={clearAllFilters}
          />
        )}

        {/* Results List */}
        {!isLoading &&
          !isError &&
          campaigns.map((c) => (
            <CampaignCard
              key={c.id}
              campaign={c}
              variant="default"
              onPress={() => goToDetail(c.id)}
              onBackPress={() => goToBack(c.id)}
            />
          ))}
      </ScrollView>

      {/* Filter Bottom Sheet */}
      <BottomSheet
        visible={isFilterSheetVisible}
        onClose={() => setFilterSheetVisible(false)}
        title="Filter Campaigns"
        subtitle="Narrow discovery by lifecycle status and funding progress"
      >
        <View style={{ paddingVertical: 8 }}>
          {/* Status section */}
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 10 }}>
            Campaign Status
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {STATUS_FILTERS.map((s) => {
              const selected = statusFilter === s.key;
              return (
                <TouchableOpacity
                  key={s.key}
                  onPress={() => setStatusFilter(s.key)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 12,
                    backgroundColor: selected ? '#4f46e5' : '#f1f5f9',
                    borderWidth: 1,
                    borderColor: selected ? '#4f46e5' : '#e2e8f0',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: selected ? '700' : '500',
                      color: selected ? '#fff' : '#334155',
                    }}
                  >
                    {s.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Funding % section */}
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 10 }}>
            Funding Progress
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            {FUNDING_FILTERS.map((f) => {
              const selected = fundingPctFilter === f.key;
              return (
                <TouchableOpacity
                  key={f.key || 'any'}
                  onPress={() => setFundingPctFilter(f.key)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 12,
                    backgroundColor: selected ? '#4f46e5' : '#f1f5f9',
                    borderWidth: 1,
                    borderColor: selected ? '#4f46e5' : '#e2e8f0',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: selected ? '700' : '500',
                      color: selected ? '#fff' : '#334155',
                    }}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Action buttons */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            <TouchableOpacity
              onPress={() => {
                clearAllFilters();
                setFilterSheetVisible(false);
              }}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: '#f1f5f9',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748b' }}>
                Reset All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFilterSheetVisible(false)}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: '#4f46e5',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>
                Show Results
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheet>

      {/* Sort Bottom Sheet */}
      <BottomSheet
        visible={isSortSheetVisible}
        onClose={() => setSortSheetVisible(false)}
        title="Sort Campaigns"
      >
        <View style={{ paddingVertical: 8 }}>
          {SORT_OPTIONS.map((opt) => {
            const selected = sort === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                onPress={() => {
                  setSort(opt.key);
                  setSortSheetVisible(false);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 14,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: selected ? '#eef2ff' : 'transparent',
                  marginBottom: 4,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons
                    name={opt.icon as any}
                    size={20}
                    color={selected ? '#4f46e5' : '#64748b'}
                    style={{ marginRight: 12 }}
                  />
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: selected ? '700' : '500',
                      color: selected ? '#4f46e5' : '#0f172a',
                    }}
                  >
                    {opt.label}
                  </Text>
                </View>
                {selected && <Ionicons name="checkmark" size={18} color="#4f46e5" />}
              </TouchableOpacity>
            );
          })}
        </View>
      </BottomSheet>
    </View>
  );
}
