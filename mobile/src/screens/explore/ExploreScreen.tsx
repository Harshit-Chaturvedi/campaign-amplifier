import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCampaigns } from '../../api/hooks';
import { useServerStatusStore } from '../../api/client';
import { CampaignCard } from '../../components/campaign/CampaignCard';
import { CampaignCardSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { BrandLogo } from '../../components/ui/BrandLogo';
import { colors, fonts, tokens } from '../../theme/tokens';
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
  const isServerWakingUp = useServerStatusStore((s) => s.isWakingUp);

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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="dark-content" />

      {/* Header with Search & Filter controls */}
      <View
        style={{
          paddingTop: 52,
          paddingBottom: 12,
          paddingHorizontal: 20,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <BrandLogo size="sm" showWordmark={false} />
            <Text style={{ fontSize: 24, fontFamily: fonts.sansBold, color: colors.ink }}>
              Explore
            </Text>
          </View>
          {isServerWakingUp ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceSecondary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
              <ActivityIndicator size="small" color={colors.accent} style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 11, fontFamily: fonts.sansMedium, color: colors.ink }}>Waking server...</Text>
            </View>
          ) : isOffline ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.warningFaint, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: colors.warning }}>
              <Ionicons name="cloud-offline-outline" size={13} color={colors.warning} style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 11, fontFamily: fonts.sansMedium, color: colors.warning }}>Offline demo</Text>
            </View>
          ) : null}
        </View>

        {/* Search bar + filter toggle */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surfaceSecondary,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: 14,
              height: 48,
            }}
          >
            <Ionicons name="search" size={18} color={colors.inkMuted} />
            <TextInput
              accessibilityLabel="Search campaigns by title, topic, creator"
              value={searchInput}
              onChangeText={setSearchInput}
              placeholder="Search by title, topic, creator..."
              placeholderTextColor={colors.inkMuted}
              style={{ flex: 1, fontSize: 14, fontFamily: fonts.sansRegular, color: colors.ink, marginLeft: 8 }}
            />
            {searchInput.length > 0 && (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Clear search text"
                onPress={() => setSearchInput('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={18} color={colors.inkMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter button with badge */}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Filter campaigns (${activeFiltersCount} active)`}
            onPress={() => setFilterSheetVisible(true)}
            style={{
              height: 48,
              width: 48,
              borderRadius: 12,
              backgroundColor: activeFiltersCount > 0 ? colors.accentFaint : colors.surfaceSecondary,
              borderColor: activeFiltersCount > 0 ? colors.accent : colors.border,
              borderWidth: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons
              name="options-outline"
              size={19}
              color={activeFiltersCount > 0 ? colors.accent : colors.inkSecondary}
            />
            {activeFiltersCount > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: 5,
                  right: 5,
                  width: 7,
                  height: 7,
                  borderRadius: 3.5,
                  backgroundColor: colors.accent,
                }}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Sort & Filter pills row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Change sorting order"
            onPress={() => setSortSheetVisible(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: tokens.radii.xs,
              paddingHorizontal: 10,
              paddingVertical: 5,
            }}
          >
            <Ionicons name="swap-vertical" size={13} color={colors.inkSecondary} style={{ marginRight: 4 }} />
            <Text style={{ fontSize: 12, fontFamily: fonts.sansMedium, color: colors.inkSecondary }}>
              Sort: {currentSortLabel}
            </Text>
            <Ionicons name="chevron-down" size={13} color={colors.inkMuted} style={{ marginLeft: 4 }} />
          </TouchableOpacity>

          {activeFiltersCount > 0 && (
            <TouchableOpacity onPress={clearAllFilters} style={{ paddingVertical: 4 }}>
              <Text style={{ fontSize: 12, fontFamily: fonts.sansMedium, color: colors.danger }}>
                Reset filters ({activeFiltersCount})
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Chips */}
      <View style={{ backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}
        >
          {CATEGORIES.map((cat) => {
            const selected = category === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                onPress={() => setCategory(cat.key)}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: tokens.radii.xs,
                  marginRight: 8,
                  backgroundColor: selected ? colors.accent : colors.surfaceSecondary,
                  borderWidth: 1,
                  borderColor: selected ? colors.accent : colors.border,
                }}
              >
                <Ionicons
                  name={cat.icon}
                  size={13}
                  color={selected ? colors.inkInverse : colors.inkSecondary}
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: selected ? fonts.sansSemiBold : fonts.sansMedium,
                    color: selected ? colors.inkInverse : colors.inkSecondary,
                    letterSpacing: 0.3,
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
          <RefreshControl refreshing={isRefetching} onRefresh={() => { refetch(); }} tintColor={colors.accent} />
        }
      >
        {/* Results count header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 13, fontFamily: fonts.sansMedium, color: colors.inkSecondary }}>
            {isLoading
              ? 'Loading campaigns...'
              : `${campaigns.length} campaign${campaigns.length !== 1 ? 's' : ''} found`}
          </Text>
          {debouncedSearch && (
            <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkMuted }}>
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
          <Text style={{ fontSize: 14, fontFamily: fonts.sansSemiBold, color: colors.ink, marginBottom: 10 }}>
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
                    paddingVertical: 7,
                    borderRadius: tokens.radii.xs,
                    backgroundColor: selected ? colors.accent : colors.surfaceSecondary,
                    borderWidth: 1,
                    borderColor: selected ? colors.accent : colors.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: selected ? fonts.sansSemiBold : fonts.sansMedium,
                      color: selected ? colors.inkInverse : colors.ink,
                    }}
                  >
                    {s.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Funding % section */}
          <Text style={{ fontSize: 14, fontFamily: fonts.sansSemiBold, color: colors.ink, marginBottom: 10 }}>
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
                    paddingVertical: 7,
                    borderRadius: tokens.radii.xs,
                    backgroundColor: selected ? colors.accent : colors.surfaceSecondary,
                    borderWidth: 1,
                    borderColor: selected ? colors.accent : colors.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: selected ? fonts.sansSemiBold : fonts.sansMedium,
                      color: selected ? colors.inkInverse : colors.ink,
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
                borderRadius: tokens.radii.sm,
                backgroundColor: colors.surfaceSecondary,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 13, fontFamily: fonts.sansMedium, color: colors.inkSecondary }}>
                Reset All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFilterSheetVisible(false)}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: tokens.radii.sm,
                backgroundColor: colors.accent,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.inkInverse }}>
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
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  borderRadius: tokens.radii.xs,
                  backgroundColor: selected ? colors.accentFaint : 'transparent',
                  marginBottom: 4,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons
                    name={opt.icon as any}
                    size={18}
                    color={selected ? colors.accent : colors.inkSecondary}
                    style={{ marginRight: 12 }}
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: selected ? fonts.sansSemiBold : fonts.sansRegular,
                      color: selected ? colors.accent : colors.ink,
                    }}
                  >
                    {opt.label}
                  </Text>
                </View>
                {selected && <Ionicons name="checkmark" size={16} color={colors.accent} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </BottomSheet>
    </View>
  );
}
