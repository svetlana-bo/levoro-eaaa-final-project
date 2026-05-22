-- Reset false opens that happened within 10 seconds of send (bot/proxy activity)
-- Only reset those that weren't also clicked (clicks are user-confirmed engagement)
UPDATE marketing_email_sends 
SET is_opened = false, opened_at = NULL, status = 'sent'
WHERE is_opened = true 
  AND opened_at IS NOT NULL 
  AND EXTRACT(EPOCH FROM (opened_at - created_at)) < 10
  AND is_clicked = false;