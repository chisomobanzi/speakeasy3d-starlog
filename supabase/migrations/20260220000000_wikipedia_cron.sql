-- Enable required extensions for scheduled HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule fetch-wikipedia-signals every 10 minutes
SELECT cron.schedule(
  'fetch-wikipedia-signals',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://foilkicwpcmeyhhohefy.supabase.co/functions/v1/fetch-wikipedia-signals',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer sb_publishable_MRebspJ8P7_vxoRbAmEBJQ__zUj6igg'
    ),
    body := jsonb_build_object('language_code', 'sn', 'limit', 50)
  );
  $$
);
