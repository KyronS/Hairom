# UAT One-Page Checklist

Staging URL: https://hairom.vercel.app/
UAT window: 2 weeks (starts when you confirm the staging URL)
Final approver: Kyron

## Quick Instructions
- Use Chrome (latest) as primary browser.
- Test on at least one mobile and one tablet device.
- Log issues into the provided bug tracker (import `bug-report-template.csv` into Google Sheets).

## Critical Flows to Test
- Authentication: signup/login/password reset/profile/logout
- Booking/Scheduling: select date/time, complete booking, receive confirmation email
- Forms: contact, newsletter, admin forms (validate errors and success)

## Content & UI
- Verify text, images, links, contact details, and page titles
- Check responsive layout: header, navigation, footer, CTAs

## Integrations & System
- Analytics, email notifications, Google Sheets sync, maps, payment gateway (sandbox)
- Confirm staging is in sandbox/test modes and not indexed (robots)

## Reporting
- For each bug, include steps to reproduce, device/browser, screenshot, and expected vs actual results.

## Acceptance Criteria
- All critical flows work end-to-end
- No critical/high defects open at sign-off
- Content approved and no blocking UI issues

## Sign-off
- After fixes, re-test critical items and update the bug tracker. Final sign-off: "I, Kyron, approve this site for launch." Date: _______
