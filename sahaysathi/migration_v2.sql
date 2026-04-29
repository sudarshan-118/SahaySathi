-- ============================================================
-- SahaySathi Database Migration v2
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add missing columns to requests
ALTER TABLE requests ADD COLUMN IF NOT EXISTS people_count INTEGER DEFAULT 1;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS requester_name TEXT;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS requester_phone TEXT;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS blood_group TEXT;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

-- 2. Add missing columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blood_group TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skills TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'Available';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vehicle_available BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_blood_donor BOOLEAN DEFAULT false;

-- 3. Create volunteer_assignments table (prevents double-volunteer)
CREATE TABLE IF NOT EXISTS volunteer_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id BIGINT REFERENCES requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(request_id, user_id)
);

-- 4. Create donations table
CREATE TABLE IF NOT EXISTS donations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  donor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  donor_name TEXT,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity TEXT,
  unit TEXT,
  notes TEXT,
  status TEXT DEFAULT 'available',
  request_id BIGINT REFERENCES requests(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create alerts table (NGO broadcast)
CREATE TABLE IF NOT EXISTS alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'info',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_priority ON requests(priority);
CREATE INDEX IF NOT EXISTS idx_requests_created ON requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vol_assign_request ON volunteer_assignments(request_id);
CREATE INDEX IF NOT EXISTS idx_vol_assign_user ON volunteer_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_category ON donations(category);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(active);

-- 7. Enable Realtime on new tables
ALTER PUBLICATION supabase_realtime ADD TABLE volunteer_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE donations;
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;

-- 8. Basic RLS policies
ALTER TABLE volunteer_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read assignments" ON volunteer_assignments FOR SELECT USING (true);
CREATE POLICY "Auth users can insert own assignment" ON volunteer_assignments FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read donations" ON donations FOR SELECT USING (true);
CREATE POLICY "Auth users can insert own donation" ON donations FOR INSERT WITH CHECK (auth.uid() = donor_id);
CREATE POLICY "Auth users can update own donation" ON donations FOR UPDATE USING (auth.uid() = donor_id);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active alerts" ON alerts FOR SELECT USING (active = true);
