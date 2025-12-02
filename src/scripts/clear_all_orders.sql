-- DANGER: This script deletes ALL orders, order items, and transactions!
-- Use this only if you want to completely reset your sales data.

-- 1. Delete all items associated with orders
DELETE FROM order_items;

-- 2. Delete all transactions associated with orders
DELETE FROM transactions WHERE related_order_id IS NOT NULL;

-- 3. Delete all orders
DELETE FROM orders;

-- Optional: Reset the auto-increment counters if you were using them (not applicable for UUIDs usually, but good for sequences)
-- For UUIDs this isn't needed.
