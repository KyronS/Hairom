# Staging Environment Checklist

- Staging URL reachable: https://hairom.vercel.app/
- Payments: sandbox/test mode enabled (no live charges)
- Test accounts created: admin, editor, user (provide credentials)
- Email notifications: use test SMTP or developer inbox; confirm test emails are delivered
- Google Sheets sync / API: connected to test sheet
- Analytics: set to staging property or disabled
- robots.txt: ensure staging is disallowed from indexing if required
- Sitemap: present and up-to-date
- CORS, environment variables, and secrets: verify test values
- Error logging: staging logs accessible to developers
- Backups: snapshot of production data not used; use anonymized test data
- Performance: CDN enabled for assets; staging cache cleared before test
- SSL: certificate valid for staging domain
- Browser testing: Chrome installed on test devices
- Mobile test build: if applicable, ensure responsive meta tags and touch targets
