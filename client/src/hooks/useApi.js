import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '../api/axios';

/**
 * GET helper with loading / error / retry. Keeps the last data while refetching
 * so panels dim instead of flashing empty.
 *
 *   const { data, error, loading, reload } = useApi(() => api.get('/x', { params }), [params...]);
 */
export default function useApi(request, deps, { fallback = 'Something went wrong', enabled = true } = {}) {
  const [state, setState] = useState({ data: null, error: '', loading: enabled });
  const [tick, setTick] = useState(0);
  const latest = useRef(request);
  latest.current = request;

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: '' }));
    latest
      .current()
      .then((res) => !cancelled && setState({ data: res.data, error: '', loading: false }))
      .catch((err) => !cancelled && setState((s) => ({ ...s, loading: false, error: errorMessage(err, fallback) })));
    return () => {
      cancelled = true;
    };
  }, [...deps, tick, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}
