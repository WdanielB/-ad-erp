
## 2025-05-14 - POS Performance Optimization
**Learning:** High-interaction pages like POS can suffer from cascading re-renders if parent callbacks are not memoized and large child components (like product lists) are not wrapped in React.memo. Additionally, using useMemo for filtering instead of useEffect+useState saves one render cycle per keystroke.
**Action:** Always memoize callbacks passed to large list components and use useMemo for derived state like filtering.

## 2025-05-22 - Batching Database Requests to Fix N+1 Bottleneck
**Learning:** Database queries within a `.map()` or `Promise.all` loop (N+1 problem) create significant latency in data-heavy views like `ScheduledOrdersView`. Batching related data (e.g., transactions for a list of orders) into a single query using the `.in()` operator and aggregating results in-memory with a `Map` drastically reduces network overhead and improves perceived performance.
**Action:** Always look for N+1 query patterns in data-fetching hooks or functions and replace them with batched fetches and in-memory aggregation.
