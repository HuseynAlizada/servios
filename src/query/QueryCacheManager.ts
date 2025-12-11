import type { QueryKey } from '@tanstack/react-query';

import type { CacheConfig, CacheData, CacheHandlers, PaginatedResponse } from './types';

export class QueryCacheManager<T extends Record<string, any>> {
  private config: Required<Omit<CacheConfig<T>, 'queryKey'>> & { queryKeys: QueryKey[] };

  constructor(config: CacheConfig<T>) {
    const queryKeys = this.normalizeQueryKeys(config.queryKey);

    this.config = {
      dataPath: [],
      isPaginated: true,
      keyExtractor: (item: T) => (item.id ?? item._id) as string | number,
      ...config,
      queryKeys,
    };
  }

  private normalizeQueryKeys(queryKey: QueryKey | QueryKey[]): QueryKey[] {
    if (!queryKey) return [];

    if (Array.isArray(queryKey) && queryKey.length > 0 && Array.isArray(queryKey[0])) {
      return queryKey as QueryKey[];
    }

    return [queryKey as QueryKey];
  }

  private getDataByPath(data: any): any {
    return this.config.dataPath.reduce((current, path) => current?.[path], data);
  }

  private setDataByPath(data: any, newValue: any): any {
    if (this.config.dataPath.length === 0) {
      return newValue;
    }

    const result = { ...data };
    let current = result;

    for (let i = 0; i < this.config.dataPath.length - 1; i++) {
      const path = this.config.dataPath[i];
      current[path] = { ...current[path] };
      current = current[path];
    }

    current[this.config.dataPath[this.config.dataPath.length - 1]] = newValue;
    return result;
  }

  private applyToAllKeys(operation: (queryKey: QueryKey) => void): void {
    this.config.queryKeys.forEach((queryKey) => {
      try {
        operation(queryKey);
      } catch (err) {
        console.warn(`[QueryCacheManager] Operation failed for key:`, queryKey, err);
      }
    });
  }

  create(newItem: T, position: 'start' | 'end' = 'start'): void {
    this.applyToAllKeys((queryKey) => {
      this.config.queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData) return oldData;

        const targetData = this.getDataByPath(oldData);

        if (this.config.isPaginated) {
          const paginatedData = targetData as PaginatedResponse<T>;
          if (!paginatedData?.content) return oldData;

          const updatedContent =
            position === 'start'
              ? [newItem, ...paginatedData.content]
              : [...paginatedData.content, newItem];

          const updatedPaginatedData = {
            ...paginatedData,
            content: updatedContent,
            page: {
              ...paginatedData.page,
              totalElements: paginatedData.page.totalElements + 1,
              totalPages: Math.ceil(
                (paginatedData.page.totalElements + 1) / paginatedData.page.size,
              ),
            },
          };

          return this.setDataByPath(oldData, updatedPaginatedData);
        } else {
          if (Array.isArray(targetData)) {
            const updatedArray =
              position === 'start' ? [newItem, ...targetData] : [...targetData, newItem];

            return this.setDataByPath(oldData, updatedArray);
          }

          return this.setDataByPath(oldData, newItem);
        }
      });
    });
  }

  update(updatedItem: Partial<T>, customMatcher?: (item: T) => boolean): void {
    this.applyToAllKeys((queryKey) => {
      this.config.queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData) return oldData;

        const targetData = this.getDataByPath(oldData);
        const matcher =
          customMatcher ||
          ((item: T) => {
            const updatedKey = this.config.keyExtractor(updatedItem as T);
            const itemKey = this.config.keyExtractor(item);
            return itemKey === updatedKey;
          });

        if (this.config.isPaginated) {
          const paginatedData = targetData as PaginatedResponse<T>;
          if (!paginatedData?.content) return oldData;

          const updatedContent = paginatedData.content.map((item) =>
            matcher(item) ? { ...item, ...updatedItem } : item,
          );

          const updatedPaginatedData = {
            ...paginatedData,
            content: updatedContent,
          };

          return this.setDataByPath(oldData, updatedPaginatedData);
        } else {
          if (Array.isArray(targetData)) {
            const updatedArray = targetData.map((item) =>
              matcher(item) ? { ...item, ...updatedItem } : item,
            );

            return this.setDataByPath(oldData, updatedArray);
          }

          return this.setDataByPath(oldData, { ...targetData, ...updatedItem });
        }
      });
    });
  }

  delete(itemOrId: T | string | number, customMatcher?: (item: T) => boolean): void {
    this.applyToAllKeys((queryKey) => {
      this.config.queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData) return oldData;

        const targetData = this.getDataByPath(oldData);
        const matcher =
          customMatcher ||
          ((item: T) => {
            if (typeof itemOrId === 'object') {
              return this.config.keyExtractor(item) === this.config.keyExtractor(itemOrId as T);
            }
            return this.config.keyExtractor(item) === itemOrId;
          });

        if (this.config.isPaginated) {
          const paginatedData = targetData as PaginatedResponse<T>;
          if (!paginatedData?.content) return oldData;

          const updatedContent = paginatedData.content.filter((item) => !matcher(item));
          const newTotalElements = Math.max(paginatedData.page.totalElements - 1, 0);

          const updatedPaginatedData = {
            ...paginatedData,
            content: updatedContent,
            page: {
              ...paginatedData.page,
              totalElements: newTotalElements,
              totalPages: Math.ceil(newTotalElements / paginatedData.page.size),
            },
          };

          return this.setDataByPath(oldData, updatedPaginatedData);
        } else {
          if (Array.isArray(targetData)) {
            const updatedArray = targetData.filter((item) => !matcher(item));
            return this.setDataByPath(oldData, updatedArray);
          }

          return this.setDataByPath(oldData, null);
        }
      });
    });
  }

  replace(newData: CacheData<T>): void {
    this.applyToAllKeys((queryKey) => {
      this.config.queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData) return oldData;
        return this.setDataByPath(oldData, newData);
      });
    });
  }

  invalidate(): void {
    this.config.queryKeys.forEach((queryKey) => {
      this.config.queryClient.invalidateQueries({ queryKey });
    });
  }

  createHandlers(): CacheHandlers<T> {
    return {
      onCreate: (newItem: T, position?: 'start' | 'end') => this.create(newItem, position),
      onUpdate: (updatedItem: Partial<T>, customMatcher?: (item: T) => boolean) =>
        this.update(updatedItem, customMatcher),
      onDelete: (itemOrId: T | string | number, customMatcher?: (item: T) => boolean) =>
        this.delete(itemOrId, customMatcher),
      onReplace: (newData: CacheData<T>) => this.replace(newData),
      onInvalidate: () => this.invalidate(),
    };
  }
}
