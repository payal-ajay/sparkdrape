
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  city text,
  gender text,
  age int,
  persona text,
  preferred_channel text,
  total_spent numeric DEFAULT 0,
  order_count int DEFAULT 0,
  last_order_date date,
  days_since_last_order int,
  avg_order_value numeric DEFAULT 0,
  favorite_category text,
  discount_sensitivity text,
  loyalty_tier text DEFAULT 'Fan',
  loyalty_points int DEFAULT 0,
  try_on_items text[],
  last_review_rating int,
  referral_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO anon, authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public all customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
  order_date date,
  amount numeric,
  category text,
  items text,
  channel text,
  on_sale boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO anon, authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public all orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  filter_logic jsonb,
  customer_count int DEFAULT 0,
  created_by text DEFAULT 'ai',
  campaign_type text DEFAULT 'standard',
  created_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.segments TO anon, authenticated;
GRANT ALL ON public.segments TO service_role;
ALTER TABLE public.segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public all segments" ON public.segments FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  segment_id uuid REFERENCES public.segments(id) ON DELETE SET NULL,
  channel text,
  status text DEFAULT 'draft',
  campaign_type text DEFAULT 'standard',
  total_recipients int DEFAULT 0,
  sent_count int DEFAULT 0,
  delivered_count int DEFAULT 0,
  opened_count int DEFAULT 0,
  clicked_count int DEFAULT 0,
  failed_count int DEFAULT 0,
  message_template text,
  ai_generated boolean DEFAULT true,
  occasion_trigger text,
  created_at timestamptz DEFAULT now(),
  launched_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO anon, authenticated;
GRANT ALL ON public.campaigns TO service_role;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public all campaigns" ON public.campaigns FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
  personalized_content text,
  channel text,
  status text DEFAULT 'queued',
  persona_reasoning text,
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO anon, authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public all messages" ON public.messages FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.agent_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  content text NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_conversations TO anon, authenticated;
GRANT ALL ON public.agent_conversations TO service_role;
ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public all agent" ON public.agent_conversations FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.loyalty_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
  event_type text,
  points_earned int DEFAULT 0,
  description text,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loyalty_events TO anon, authenticated;
GRANT ALL ON public.loyalty_events TO service_role;
ALTER TABLE public.loyalty_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public all loyalty" ON public.loyalty_events FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaigns;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.campaigns REPLICA IDENTITY FULL;
