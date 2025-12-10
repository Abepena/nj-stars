# Portal Example Pages

This document describes the example/demo pages created for reviewing the portal UI across different user types.

## Overview

Example pages provide a way to preview how the portal looks and functions for different user roles without needing real data or authentication. They use **mock data** and are **blocked in production**.

## Access

**Development URL:** `http://localhost:3000/portal/examples`

### Security
- ✅ **Development mode:** Full access
- ✅ **Vercel preview deployments:** Full access
- 🚫 **Production:** Redirects to `/portal/dashboard`

The protection is implemented in `/frontend/src/app/portal/examples/layout.tsx` using environment detection.

---

## Available Examples

### 1. Parent Dashboard
**Route:** `/portal/examples/parent`

Shows the portal from a parent's perspective with 2 enrolled children.

**Mock Scenario:**
- User: Sarah Johnson (parent)
- Children: Marcus (14, U15 Elite) and Jaylen (11, U12 Select)
- Balance due: $175.00
- Promo credits: $25.00
- Auto-pay enabled
- One active check-in

**Features Demonstrated:**
- Welcome header with personalized greeting
- Profile completion nudge (85% complete)
- Quick stats cards (children, events, balance, credits)
- Active check-in alert (green card)
- Children tabs with individual profiles
- Upcoming events list
- Quick action cards

---

### 2. Player Dashboard (13+)
**Route:** `/portal/examples/player`

Shows the portal from a player's perspective who has their own account.

**Mock Scenario:**
- User: Marcus Johnson (14, Point Guard)
- Team: U15 Elite, #23
- Currently checked in to practice
- Dues balance: $75.00
- Attendance: 80% (12/15 practices)

**Features Demonstrated:**
- Large profile header with avatar
- Check-in status badge
- Personal stats (attendance, tournaments, games)
- Progress bar for attendance
- Current event card (when checked in)
- Personal schedule view
- Teammates list
- Simplified quick actions

---

### 3. Staff Dashboard
**Route:** `/portal/examples/staff`

Shows the portal from a staff member's perspective with admin tools.

**Mock Scenario:**
- User: Coach Mike Thompson (staff)
- 3 events scheduled today
- 4 pending check-ins
- 2 active check-ins
- 12 accounts with balance due

**Features Demonstrated:**
- Admin stats grid
- Today's events with attendance tracking
- Pending check-ins with quick check-in buttons
- Active check-ins with check-out buttons
- Recent registrations feed
- Quick access to check-in management and roster

---

### 4. Superuser Dashboard
**Route:** `/portal/examples/superuser`

Shows the portal from an admin's perspective with full system access.

**Mock Scenario:**
- User: Admin User (superuser)
- 156 total users in system
- MTD revenue: $12,450 (83% of goal)
- 32 active subscriptions
- 3 pending issues to resolve

**Features Demonstrated:**
- Revenue metrics with progress bar
- Month-over-month comparison
- Year-to-date totals
- System-wide stats
- Quick action grid (user management, billing, orders, reports)
- Pending issues queue with priority indicators
- Recent activity feed (system-wide)
- Top performing events by revenue
- Links to Django Admin and Wagtail CMS

---

## File Structure

```
frontend/src/app/portal/examples/
├── layout.tsx          # Dev-only protection wrapper
├── page.tsx            # Index with all example links
├── parent/
│   └── page.tsx        # Parent dashboard example
├── player/
│   └── page.tsx        # Player dashboard example
├── staff/
│   └── page.tsx        # Staff dashboard example
└── superuser/
    └── page.tsx        # Superuser dashboard example
```

---

## Visual Indicators

Each example page includes:
1. **Yellow dev-mode banner** at the top indicating these are example pages
2. **Role badge** showing which user type is being demonstrated
3. **"Exit Examples" button** to return to the real portal

---

## Use Cases

### Design Review
Share example URLs with stakeholders to review the UI before launch.

### QA Testing
Compare real portal behavior against expected mock layouts.

### Onboarding
Show new staff members what different user types see.

### Development Reference
Use as a visual reference when building new features.

---

## Adding New Examples

To add a new example:

1. Create a new folder under `/portal/examples/`
2. Add a `page.tsx` with mock data at the top
3. Include the role badge for clarity
4. Add a link in `/portal/examples/page.tsx`
5. Update this documentation

---

## Related Documentation

- [Portal Checklist](./PORTAL_CHECKLIST.md)
- [Parent Dashboard Spec](./PARENT_DASHBOARD.md)
- [API Reference](./API_REFERENCE.md)
- [Permissions](./PERMISSIONS.md)
