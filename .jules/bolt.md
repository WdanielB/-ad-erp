
## 2025-05-14 - POS Performance Optimization
**Learning:** High-interaction pages like POS can suffer from cascading re-renders if parent callbacks are not memoized and large child components (like product lists) are not wrapped in React.memo. Additionally, using useMemo for filtering instead of useEffect+useState saves one render cycle per keystroke.
**Action:** Always memoize callbacks passed to large list components and use useMemo for derived state like filtering.

## 2026-03-09 - Batched Transaction Fetching in Scheduled Orders
**Learning:** Database-heavy views with many related records (like payments per order) can easily fall into the N+1 query trap if using Supabase/PostgREST in a loop or Promise.all. Batching these with the `.in()` operator and aggregating locally with a Map is significantly faster and avoids hitting connection limits.
**Action:** Use batched queries and local Map aggregation for all list views that require additional data from related tables.
