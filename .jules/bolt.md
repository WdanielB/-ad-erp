
## 2025-05-14 - POS Performance Optimization
**Learning:** High-interaction pages like POS can suffer from cascading re-renders if parent callbacks are not memoized and large child components (like product lists) are not wrapped in React.memo. Additionally, using useMemo for filtering instead of useEffect+useState saves one render cycle per keystroke.
**Action:** Always memoize callbacks passed to large list components and use useMemo for derived state like filtering.

## 2025-05-15 - N+1 Query in ScheduledOrdersView
**Learning:** Found a classic N+1 query pattern in `fetchScheduledOrders` despite memory suggesting it was already optimized. This bottleneck occurs when fetching related transactions in a loop. Batching with `.in()` and memory aggregation is significantly more efficient.
**Action:** Always verify the actual implementation of data-fetching functions even if memory claims they are optimized.
