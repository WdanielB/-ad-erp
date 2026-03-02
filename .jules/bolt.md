
## 2025-05-14 - POS Performance Optimization
**Learning:** High-interaction pages like POS can suffer from cascading re-renders if parent callbacks are not memoized and large child components (like product lists) are not wrapped in React.memo. Additionally, using useMemo for filtering instead of useEffect+useState saves one render cycle per keystroke.
**Action:** Always memoize callbacks passed to large list components and use useMemo for derived state like filtering.

## 2026-03-02 - Batched Query Optimization
**Learning:** Database-heavy views like `ScheduledOrdersView` can easily fall into N+1 query patterns when fetching related data (e.g., transactions) for each item in a list. This creates massive latency as the dataset grows. Batching with `.in()` reduced requests from O(N) to O(1).
**Action:** Always check list-fetching logic for nested await calls and batch related data fetches using the `.in()` operator.
