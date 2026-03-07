
## 2025-05-14 - POS Performance Optimization
**Learning:** High-interaction pages like POS can suffer from cascading re-renders if parent callbacks are not memoized and large child components (like product lists) are not wrapped in React.memo. Additionally, using useMemo for filtering instead of useEffect+useState saves one render cycle per keystroke.
**Action:** Always memoize callbacks passed to large list components and use useMemo for derived state like filtering.

## 2026-03-07 - Database Fetching Optimization in ScheduledOrdersView
**Learning:** Client-side N+1 query patterns in database-heavy views (like fetching transactions for each order in a loop) create significant network bottlenecks as the number of records grows. Supabase's `.in()` operator is highly effective for batching these requests into a single call.
**Action:** Prevent N+1 query bottlenecks by batching related data fetches using the `.in()` operator instead of fetching inside loops.
