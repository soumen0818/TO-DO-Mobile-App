import { useEffect, useState, useCallback } from 'react';

/**
 * Custom hook to fetch data from Supabase with loading state
 * Similar to Convex's useQuery hook
 */
export function useSupabaseQuery<T>(
  queryFn: (() => Promise<T>) | null,
  dependencies: any[] = []
): T | undefined {
  const [data, setData] = useState<T | undefined>(undefined);

  const fetchData = useCallback(async () => {
    if (!queryFn) {
      setData(undefined);
      return;
    }

    try {
      const result = await queryFn();
      setData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryFn, ...dependencies]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return data;
}

/**
 * Custom hook to create a mutation function for Supabase
 * Similar to Convex's useMutation hook
 */
export function useSupabaseMutation<TArgs, TResult>(
  mutationFn: (args: TArgs) => Promise<TResult>
) {
  return useCallback(
    async (args: TArgs) => {
      try {
        return await mutationFn(args);
      } catch (error) {
        console.error('Mutation error:', error);
        throw error;
      }
    },
    [mutationFn]
  );
}
