
## 2025-05-14 - POS Performance Optimization
**Learning:** High-interaction pages like POS can suffer from cascading re-renders if parent callbacks are not memoized and large child components (like product lists) are not wrapped in React.memo. Additionally, using useMemo for filtering instead of useEffect+useState saves one render cycle per keystroke.
**Action:** Always memoize callbacks passed to large list components and use useMemo for derived state like filtering.

## 2025-05-15 - Eliminating N+1 Query in ScheduledOrdersView
**Learning:** Fetching data in a loop (Promise.all with individual queries) causes significant network overhead. Batching related data using Supabase's `.in()` operator and aggregating in-memory with a Map is much more efficient.
**Action:** Always look for N+1 query patterns in database-heavy views and replace them with batched fetches and Map-based aggregation.
