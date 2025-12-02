# Database Scripts

This directory contains SQL scripts to update the database schema.

## `add_delivery_coordinates.sql`

This script adds `delivery_latitude` and `delivery_longitude` columns to the `orders` table to support Google Maps integration.

### How to run:

1.  Go to your Supabase Dashboard.
2.  Open the **SQL Editor**.
3.  Copy the contents of `add_delivery_coordinates.sql`.
4.  Paste it into the editor and click **Run**.

Alternatively, if you have the Supabase CLI installed and linked:

```bash
supabase db push
```
