
## 2025-05-14 - POS Performance Optimization
**Learning:** High-interaction pages like POS can suffer from cascading re-renders if parent callbacks are not memoized and large child components (like product lists) are not wrapped in React.memo. Additionally, using useMemo for filtering instead of useEffect+useState saves one render cycle per keystroke.
**Action:** Always memoize callbacks passed to large list components and use useMemo for derived state like filtering.

## 2025-05-15 - N+1 Query Optimization in Scheduled Orders
**Learning:** React components that fetch a list of items and then fetch additional data for each item in a loop create a significant performance bottleneck (N+1 query problem). This is especially noticeable with Supabase or other remote databases where network latency adds up for each request.
**Action:** Batch related data fetches using operators like `.in()` and perform in-memory aggregation using a `Map` to enrich the main dataset efficiently.
