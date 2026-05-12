import { useState, useEffect, useCallback, useRef } from 'react';

// FETCH HOOK
export function useFetch(fetchFn, deps = [], onSuccess = null) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (!mountedRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetchFn();

      if (mountedRef.current) {
        setData(res.data);
        if (onSuccess) onSuccess(res.data);
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e?.response?.data?.message || e.message || 'Ошибка');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}

// DEBOUNCE HOOK (ОЧЕНЬ ВАЖНО: только ОДИН!)
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}