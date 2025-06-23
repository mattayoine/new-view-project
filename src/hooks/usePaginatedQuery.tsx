
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PaginationOptions {
  pageSize?: number;
  initialPage?: number;
}

interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export const usePaginatedQuery = <T>(
  queryKey: string[],
  fetchFunction: (limit: number, offset: number) => Promise<any>,
  options: PaginationOptions = {}
) => {
  const { pageSize = 10, initialPage = 1 } = options;
  const [currentPage, setCurrentPage] = useState(initialPage);

  const query = useQuery({
    queryKey: [...queryKey, currentPage, pageSize],
    queryFn: async () => {
      const offset = (currentPage - 1) * pageSize;
      return await fetchFunction(pageSize, offset);
    }
  });

  const totalCount = query.data?.[0]?.total_count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const nextPage = () => goToPage(currentPage + 1);
  const previousPage = () => goToPage(currentPage - 1);

  return {
    ...query,
    data: query.data || [],
    currentPage,
    totalPages,
    totalCount,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    goToPage,
    nextPage,
    previousPage
  };
};

export const usePaginatedSessions = (assignmentId?: string, status?: string) => {
  return usePaginatedQuery(
    ['paginated-sessions', assignmentId, status],
    async (limit: number, offset: number) => {
      const { data, error } = await supabase.rpc('get_paginated_sessions', {
        p_assignment_id: assignmentId || null,
        p_limit: limit,
        p_offset: offset,
        p_status: status || null
      });
      
      if (error) throw error;
      return data;
    }
  );
};

export const usePaginatedNotifications = (userId: string, unreadOnly = false) => {
  return usePaginatedQuery(
    ['paginated-notifications', userId, unreadOnly],
    async (limit: number, offset: number) => {
      const { data, error } = await supabase.rpc('get_paginated_notifications', {
        p_user_id: userId,
        p_limit: limit,
        p_offset: offset,
        p_unread_only: unreadOnly
      });
      
      if (error) throw error;
      return data;
    }
  );
};
