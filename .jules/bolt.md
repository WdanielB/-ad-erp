
## 2025-05-14 - POS Performance Optimization
**Learning:** High-interaction pages like POS can suffer from cascading re-renders if parent callbacks are not memoized and large child components (like product lists) are not wrapped in React.memo. Additionally, using useMemo for filtering instead of useEffect+useState saves one render cycle per keystroke.
**Action:** Always memoize callbacks passed to large list components and use useMemo for derived state like filtering.

## 2025-05-15 - N+1 Query and Component Memoization
**Learning:** Data fetching in loops (e.g., using .map() with async calls) creates O(N) database queries, which can significantly slow down pages with many items. Using the Supabase .in() operator allows batching these requests into a single O(1) query. Additionally, memoizing high-interaction components like OrderSummary and ScheduledOrdersView prevents redundant re-renders when switching tabs or updating unrelated state.
**Action:** Always look for batched query opportunities when fetching related data for a list. Use React.memo for components in complex pages like the POS.
