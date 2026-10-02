import { useCallback, useState } from 'react';
import { useStore } from './store';

/** Drives a RefreshControl: pull down to sync with the Google Sheet. */
export function usePullSync() {
  const { sync } = useStore();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await sync();
    } finally {
      setRefreshing(false);
    }
  }, [sync]);

  return { refreshing, onRefresh };
}
