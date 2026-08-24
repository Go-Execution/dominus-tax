/*
# Create appointments table for booking requests

1. New Tables
- `appointments`
  - `id` (uuid, primary key)
  - `name` (text, not null) — client full name
  - `email` (text, not null) — client email
  - `phone` (text, not null) — client phone
  - `service` (text, not null) — requested service type
  - `preferred_date` (date) — preferred appointment date
  - `preferred_time` (text) — preferred appointment time window
  - `message` (text) — optional notes from client
  - `status` (text, default 'pending') — booking status
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `appointments`.
- Allow anon + authenticated to INSERT new booking requests (public form, no sign-in).
- Allow anon + authenticated to SELECT so the client confirmation flow can reference a submission.
  Note: This is a no-auth public booking site, so anon access is intentional. The firm owner
  will manage appointments through the Supabase dashboard.
- UPDATE and DELETE restricted (no policy) so visitors cannot alter submitted bookings.
*/

CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  service text NOT NULL,
  preferred_date date,
  preferred_time text,
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_appointments" ON appointments;
CREATE POLICY "anon_insert_appointments"
ON appointments FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_appointments" ON appointments;
CREATE POLICY "anon_select_appointments"
ON appointments FOR SELECT
TO anon, authenticated USING (true);
