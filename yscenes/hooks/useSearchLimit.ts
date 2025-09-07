'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';

interface SearchLimitInfo {
  searchCount: number;
  isLimitReached: boolean;
  canSearch: boolean;
}

const FREE_SEARCH_LIMIT = 1;
const VIP_EMAIL = 'pgtherealmvp@gmail.com';

export function useSearchLimit() {
  const { user, isSignedIn } = useUser();
  const [searchLimitInfo, setSearchLimitInfo] = useState<SearchLimitInfo>({
    searchCount: 0,
    isLimitReached: false,
    canSearch: true
  });

  // Check if user is VIP (unlimited searches)
  const isVipUser = useCallback(() => {
    return user?.emailAddresses?.[0]?.emailAddress === VIP_EMAIL;
  }, [user]);

  // Get storage key for current user
  const getStorageKey = useCallback(() => {
    if (!isSignedIn || !user) return 'anonymous_search_count';
    return `search_count_${user.id}`;
  }, [isSignedIn, user]);

  // Load search count from localStorage
  const loadSearchCount = useCallback(() => {
    const key = getStorageKey();
    const stored = localStorage.getItem(key);
    const count = stored ? parseInt(stored, 10) : 0;
    
    const isLimitReached = count >= FREE_SEARCH_LIMIT && !isVipUser();
    const canSearch = isVipUser() || count < FREE_SEARCH_LIMIT;

    setSearchLimitInfo({
      searchCount: count,
      isLimitReached,
      canSearch
    });

    return { count, isLimitReached, canSearch };
  }, [getStorageKey, isVipUser]);

  // Increment search count
  const incrementSearchCount = useCallback(() => {
    if (isVipUser()) {
      // VIP users don't have limits
      return;
    }

    const key = getStorageKey();
    const currentCount = searchLimitInfo.searchCount;
    const newCount = currentCount + 1;
    
    localStorage.setItem(key, newCount.toString());
    
    const isLimitReached = newCount >= FREE_SEARCH_LIMIT;
    const canSearch = newCount < FREE_SEARCH_LIMIT;

    setSearchLimitInfo({
      searchCount: newCount,
      isLimitReached,
      canSearch
    });
  }, [getStorageKey, isVipUser, searchLimitInfo.searchCount]);

  // Reset search count (for testing or admin purposes)
  const resetSearchCount = useCallback(() => {
    const key = getStorageKey();
    localStorage.removeItem(key);
    setSearchLimitInfo({
      searchCount: 0,
      isLimitReached: false,
      canSearch: true
    });
  }, [getStorageKey]);

  // Load search count on mount and when user changes
  useEffect(() => {
    loadSearchCount();
  }, [loadSearchCount]);

  return {
    ...searchLimitInfo,
    isVipUser: isVipUser(),
    incrementSearchCount,
    resetSearchCount,
    loadSearchCount
  };
}
