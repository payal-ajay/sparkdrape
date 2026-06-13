ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS health_score integer DEFAULT 0;
ALTER TABLE public.messages  ADD COLUMN IF NOT EXISTS variant text DEFAULT 'A';
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS ab_test_enabled boolean DEFAULT false;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS variant_a_description text;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS variant_b_description text;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS winner_variant text;

ALTER TABLE public.campaigns REPLICA IDENTITY FULL;
ALTER TABLE public.messages  REPLICA IDENTITY FULL;
DO $$ BEGIN
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.campaigns';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.messages';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Backfill health_score
UPDATE public.customers SET health_score = LEAST(100, GREATEST(0,
  -- recency (max 30)
  CASE
    WHEN days_since_last_order IS NULL THEN 0
    WHEN days_since_last_order <= 30 THEN 30
    WHEN days_since_last_order <= 60 THEN 20
    WHEN days_since_last_order <= 90 THEN 10
    ELSE 0
  END
  +
  -- frequency (max 25)
  CASE
    WHEN order_count IS NULL OR order_count < 1 THEN 0
    WHEN order_count = 1 THEN 5
    WHEN order_count BETWEEN 2 AND 3 THEN 10
    WHEN order_count BETWEEN 4 AND 6 THEN 18
    WHEN order_count BETWEEN 7 AND 10 THEN 22
    ELSE 25
  END
  +
  -- monetary (max 25)
  CASE
    WHEN total_spent IS NULL OR total_spent < 2000 THEN 5
    WHEN total_spent < 8000 THEN 12
    WHEN total_spent < 20000 THEN 20
    ELSE 25
  END
  +
  -- loyalty (max 10)
  CASE loyalty_tier WHEN 'Fan' THEN 2 WHEN 'Muse' THEN 6 WHEN 'Icon' THEN 10 ELSE 0 END
  +
  -- engagement (max 10)
  (CASE WHEN last_review_rating >= 4 THEN 5 ELSE 0 END
   + CASE WHEN try_on_items IS NOT NULL AND array_length(try_on_items,1) > 0 THEN 3 ELSE 0 END
   + CASE WHEN referral_count > 0 THEN 2 ELSE 0 END)
));