'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';

interface SearchLimitInfo {
  searchCount: number;
  isLimitReached: boolean;
  canSearch: boolean;
}

interface SubscriptionInfo {
  isVip: boolean;
  hasActiveSubscription: boolean;
  subscription: any;
}

const FREE_SEARCH_LIMIT = 1;

export function useSearchLimit() {
  const { user, isSignedIn } = useUser();
  const [searchLimitInfo, setSearchLimitInfo] = useState<SearchLimitInfo>({
    searchCount: 0,
    isLimitReached: false,
    canSearch: true
  });
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo>({
    isVip: false,
    hasActiveSubscription: false,
    subscription: null
  });
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  // Check subscription status from API
  const checkSubscriptionStatus = useCallback(async () => {
    if (!isSignedIn || !user) {
      setSubscriptionInfo({
        isVip: false,
        hasActiveSubscription: false,
        subscription: null
      });
      return;
    }

    setSubscriptionLoading(true);
    try {
      const email = user.emailAddresses?.[0]?.emailAddress;
      const response = await fetch(`/api/subscription/check?email=${encodeURIComponent(email || '')}`);
      
      if (response.ok) {
        const data = await response.json();
        setSubscriptionInfo({
          isVip: data.isVip,
          hasActiveSubscription: data.hasActiveSubscription,
          subscription: data.subscription
        });
      } else {
        // Fallback to hardcoded VIP check for existing user
        const isVip = email === 'pgtherealmvp@gmail.com';
        setSubscriptionInfo({
          isVip,
          hasActiveSubscription: isVip,
          subscription: null
        });
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
      // Fallback to hardcoded VIP check
      const email = user.emailAddresses?.[0]?.emailAddress;
      const isVip = email === 'pgtherealmvp@gmail.com';
      setSubscriptionInfo({
        isVip,
        hasActiveSubscription: isVip,
        subscription: null
      });
    } finally {
      setSubscriptionLoading(false);
    }
  }, [user, isSignedIn]);

  // Unlimited if VIP or has an active subscription
  const isVipUser = useCallback(() => {
    return subscriptionInfo.isVip || subscriptionInfo.hasActiveSubscription;
  }, [subscriptionInfo.isVip, subscriptionInfo.hasActiveSubscription]);

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

  // Load search count and subscription status on mount and when user changes
  useEffect(() => {
    loadSearchCount();
    checkSubscriptionStatus();
  }, [loadSearchCount, checkSubscriptionStatus]);

  return {
    ...searchLimitInfo,
    isVipUser: isVipUser(),
    hasActiveSubscription: subscriptionInfo.hasActiveSubscription,
    subscription: subscriptionInfo.subscription,
    subscriptionLoading,
    incrementSearchCount,
    resetSearchCount,
    loadSearchCount,
    checkSubscriptionStatus
  };
}
