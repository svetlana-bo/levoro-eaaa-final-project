
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- Schedule the evaluate-email-flows function to run every 5 minutes
SELECT cron.schedule(
  'evaluate-email-flows',
  '*/5 * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://scxzdhoaclusxlncjazm.supabase.co/functions/v1/evaluate-email-flows',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjeHpkaG9hY2x1c3hsbmNqYXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMDY4MTgsImV4cCI6MjA4ODU4MjgxOH0.hmQgHpLk90LLNJAzSpKP-f-KM-g3xQY6X_3QbiqNT1w"}'::jsonb,
      body := concat('{"time": "', now(), '"}')::jsonb
    ) AS request_id;
  $$
);
