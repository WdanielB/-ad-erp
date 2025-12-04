CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('campaign', 'milestone', 'other')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Create policy for full access (since we are in single-tenant mode for now, or adjust as needed)
CREATE POLICY "Enable all access for authenticated users" ON calendar_events
    FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON calendar_events TO authenticated;
GRANT ALL ON calendar_events TO service_role;
