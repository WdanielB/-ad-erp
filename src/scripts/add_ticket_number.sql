-- Add ticket_number column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ticket_number VARCHAR(20);

-- Create index for ticket_number
CREATE INDEX IF NOT EXISTS idx_orders_ticket_number ON orders(ticket_number);

COMMENT ON COLUMN orders.ticket_number IS 'Ticket number in format T001-0311 (sequential + short date)';
