
## 2025-05-14 - POS Performance Optimization
**Learning:** High-interaction pages like POS can suffer from cascading re-renders if parent callbacks are not memoized and large child components (like product lists) are not wrapped in React.memo. Additionally, using useMemo for filtering instead of useEffect+useState saves one render cycle per keystroke.
**Action:** Always memoize callbacks passed to large list components and use useMemo for derived state like filtering.

## 2025-05-15 - N+1 Query Optimization in Data Tables
**Learning:** Fetching related data (like transactions for orders) inside a loop or `.map()` creates an N+1 query bottleneck. This drastically slows down the application as the number of records grows.
**Action:** Use batched fetches (e.g., Supabase `.in()` operator) to retrieve all related records in a single request and perform in-memory aggregation using a `Map` for O(1) enrichment.
