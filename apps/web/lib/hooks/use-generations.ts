import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import { API_URL } from '@/lib/api-config';

interface Generation {
  id: string;
  prompt: string;
  originalImage: string;
  resultImage: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}

interface GenerationsResponse {
  generations: Generation[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

const fetcher = async (url: string, token: string): Promise<GenerationsResponse> => {
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch generations');
  }

  return response.json();
};

export function useGenerations(token: string | null, page = 1, limit = 12) {
  const { data, error, isLoading, mutate } = useSWR(
    token ? [`${API_URL}/generation?page=${page}&limit=${limit}`, token] : null,
    ([url, token]) => fetcher(url, token),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  return {
    generations: data?.generations || [],
    total: data?.total || 0,
    hasMore: data?.hasMore || false,
    isLoading,
    error,
    mutate,
  };
}

export function useInfiniteGenerations(token: string | null) {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { data, error, isLoading, mutate } = useSWR(
    token ? [`${API_URL}/generation?page=${page}&limit=12`, token] : null,
    ([url, token]) => fetcher(url, token),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      // Add caching for better performance
      revalidateIfStale: false,
      revalidateOnMount: true,
      refreshInterval: 0,
      // Cache for 5 minutes
      focusThrottleInterval: 300000,
    }
  );

  useEffect(() => {
    if (data) {
      if (page === 1) {
        setGenerations(data.generations);
      } else {
        setGenerations(prev => [...prev, ...data.generations]);
      }
      setHasMore(data.hasMore);
      setIsLoadingMore(false);
    }
  }, [data, page]);

  const loadMore = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      setIsLoadingMore(true);
      setPage(prev => prev + 1);
    }
  }, [hasMore, isLoadingMore]);

  const refresh = useCallback(async () => {
    // Reset to first page but keep showing existing items until data arrives
    setPage(1);
    setHasMore(true);
    // Fetch fresh page 1 manually to avoid flicker/clearing UI
    try {
      if (!token) return;
      const fresh = await fetcher(`${API_URL}/generation?page=1&limit=12`, token);
      setGenerations(fresh.generations);
      setHasMore(fresh.hasMore);
      // Update SWR cache silently
      await mutate({ ...fresh } as any, { revalidate: false });
    } catch {
      // noop; UI still shows previous data
    }
  }, [token, mutate]);

  return {
    generations,
    isLoading: isLoading && page === 1,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}
