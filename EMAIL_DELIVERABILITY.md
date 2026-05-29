# Email sender reputation setup — required before public launch

Replace Supabase's built-in email sender with Resend (or Postmark) as SMTP provider.

Configure custom sender domain (e.g., `noreply@sermoncoach.online` or `notifications@sermoncoach.online`).

Set up SPF, DKIM, and DMARC DNS records for the sending domain.

Verify deliverability to Gmail primary inbox (not spam/junk) before founding-member launch.

Test all three transactional emails: signup confirmation, password reset, and any future account emails.

---

## Context

During Session 4 verification, Supabase's default email sender delivered to Gmail's junk folder, not the inbox. This is fine for development but unacceptable for paying customers.

**Estimate:** one full session (~60 min) of focused work.
