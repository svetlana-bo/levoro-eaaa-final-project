
-- Backfill blank template_name on opened/clicked events by matching resend_message_id to sent events
UPDATE email_events AS opened
SET template_name = sent.template_name
FROM email_events AS sent
WHERE opened.template_name = ''
  AND opened.event_type IN ('opened', 'clicked')
  AND sent.event_type = 'sent'
  AND sent.template_name != ''
  AND (opened.metadata->>'resend_message_id' = sent.metadata->>'resend_id'
    OR opened.metadata->>'email_id' = sent.metadata->>'resend_id')
  AND opened.recipient_email = sent.recipient_email;
