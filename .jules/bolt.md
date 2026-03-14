
## 2025-05-14 - POS Performance Optimization
**Learning:** High-interaction pages like POS can suffer from cascading re-renders if parent callbacks are not memoized and large child components (like product lists) are not wrapped in React.memo. Additionally, using useMemo for filtering instead of useEffect+useState saves one render cycle per keystroke.
**Action:** Always memoize callbacks passed to large list components and use useMemo for derived state like filtering.

## 2025-05-15 - N+1 Query in Scheduled Orders
**Learning:** Performing database queries inside a loop (N+1 problem) in components like `ScheduledOrdersView` significantly degrades performance as the number of orders grows. Using a single batched query with the `.in()` operator and aggregating results in-memory with a `Map` is much more efficient.
**Action:** Always look for loops containing database queries and replace them with batched fetches and in-memory Map aggregation.
