import { useEffect, useState } from 'react';
import { accountApi } from '@client/src/api';
import type { AccountMeResponse } from '@shared/api.interface';

type Listener = (data: AccountMeResponse | null) => void;

let cached: AccountMeResponse | null = null;
let loaded = false;
const listeners = new Set<Listener>();

export async function refreshAccount(): Promise<AccountMeResponse | null> {
  try {
    cached = await accountApi.getMe();
  } catch (error) {
    cached = null;
  } finally {
    loaded = true;
    listeners.forEach((listener: Listener) => listener(cached));
  }
  return cached;
}

export function getCachedAccount(): AccountMeResponse | null {
  return cached;
}

/** 当前登录人的身份档案与绑定关系 */
export function useAccount(): {
  data: AccountMeResponse | null;
  loading: boolean;
  reload: () => Promise<AccountMeResponse | null>;
} {
  const [data, setData] = useState<AccountMeResponse | null>(cached);
  const [loading, setLoading] = useState<boolean>(!loaded);

  useEffect(() => {
    const listener: Listener = (next: AccountMeResponse | null) => {
      setData(next);
      setLoading(false);
    };
    listeners.add(listener);
    if (!loaded) {
      refreshAccount();
    } else {
      setData(cached);
      setLoading(false);
    }
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return { data, loading, reload: refreshAccount };
}
