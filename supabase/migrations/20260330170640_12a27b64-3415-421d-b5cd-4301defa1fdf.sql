ALTER TABLE marketing_email_sends
  ADD COLUMN IF NOT EXISTS is_opened boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_clicked boolean NOT NULL DEFAULT false;

UPDATE marketing_email_sends SET is_opened = true WHERE opened_at IS NOT NULL;
UPDATE marketing_email_sends SET is_clicked = true WHERE clicked_at IS NOT NULL;