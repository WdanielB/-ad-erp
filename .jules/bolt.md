# Bolt's Performance Journal

## 2025-05-15 - Initial Performance Audit
**Learning:** Found that the POS system (a high-interaction area) has several common React performance anti-patterns:
- Event handlers in the parent `POSPage` are recreated on every render.
- Large child components like `ProductBrowser` are not memoized, causing full re-renders of the product grid whenever an item is added to the cart.
- `ProductBrowser` uses `useEffect` + `useState` for derived state (`filteredProducts`), leading to redundant render cycles.
- Product images are not lazy-loaded.

**Action:** Implement `useCallback` for parent handlers, `React.memo` for the product grid, and `useMemo` for derived filtering state.
