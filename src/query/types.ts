import type { QueryClient, QueryKey } from '@tanstack/react-query';

export interface PaginatedResponse<T> {
  content: T[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

export interface CacheConfig<T> {
  queryKey: QueryKey | QueryKey[];
  queryClient: QueryClient;
  isPaginated?: boolean;
  dataPath?: string[];
  keyExtractor?: (item: T) => string | number;
}

export type CacheData<T> = T[] | PaginatedResponse<T> | T | null;

export interface CacheHandlers<T> {
  onInvalidate: () => void;
  onReplace: (newData: CacheData<T>) => void;
  onCreate: (newItem: T, position?: 'start' | 'end') => void;
  onUpdate: (updatedItem: Partial<T>, customMatcher?: (item: T) => boolean) => void;
  onDelete: (itemOrId: T | string | number, customMatcher?: (item: T) => boolean) => void;
}
