# Supabase Auth email templates

These files are the source-controlled copies of the HTML configured under
**Supabase → Authentication → Email Templates** for the shared `grim-personal`
project.

## Important

- Supabase renders these templates and sends the resulting HTML through Resend
  SMTP. Resend's own saved-template feature is not used by Supabase SMTP.
- The project is shared, so the branding is intentionally app-neutral.
- Keep the Go-template variables intact:
  - `{{ .ConfirmationURL }}` — one-time sign-in link
  - `{{ .Token }}` — 8-digit one-time code
- Do not add remote images, tracking pixels, JavaScript, forms, secrets, or
  user-supplied content.
- The sender is configured separately as
  `Jason Grimberg Apps <auth@send.jasongrimberg.com>`.

The HTML uses table layout and inline styles for compatibility with Gmail,
Outlook, Apple Mail, and mobile clients.
