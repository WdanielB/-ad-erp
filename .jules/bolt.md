
## 2025-05-14 - POS Performance Optimization
**Learning:** High-interaction pages like POS can suffer from cascading re-renders if parent callbacks are not memoized and large child components (like product lists) are not wrapped in React.memo. Additionally, using useMemo for filtering instead of useEffect+useState saves one render cycle per keystroke.
**Action:** Always memoize callbacks passed to large list components and use useMemo for derived state like filtering.

## 2025-05-14 - Batching Database Requests to Avoid N+1 Queries
**Learning:** Fetching related data (like transactions for orders) in a loop using separate Supabase calls creates an N+1 query bottleneck. This significantly increases latency as the number of items grows. Using the `.in()` filter to batch these requests into a single query reduces network overhead and improves load times.
**Action:** Identify loops containing database calls and refactor them to use batch fetching with in-memory grouping.
