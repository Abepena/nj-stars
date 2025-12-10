# Parent Dashboard Specification

## Overview

The Parent Dashboard is the **top priority** for the MVP. Parents are the paying clients and need a clean, mobile-first interface to manage their children's activities.

---

## User Stories

### As a parent, I want to:
1. **See all my children at a glance** with their team info and status
2. **View upcoming events** for each child in one place
3. **Check my current balance** and make payments easily
4. **See check-in status** when my child is at an event
5. **Manage my saved payment methods** and toggle auto-pay
6. **View order history** from the shop
7. **Use promo credits** I've earned through referrals
8. **Edit my profile** and my children's profiles

---

## Dashboard Sections

### 1. Welcome Header
```
Welcome back, Sarah!
Here's what's happening with your family
```
- Personalized with first name
- Subtitle provides context

### 2. Quick Stats Row (4 Cards)
| Card | Content |
|------|---------|
| Children | Count of active children, e.g., "2 active" |
| Upcoming Events | Next event name, e.g., "Practice - Tomorrow" |
| Balance Due | Amount in green (paid) or amber (due), e.g., "$150.00" |
| Promo Credits | Available credit, e.g., "$25.00" |

### 3. Active Check-Ins Alert
- **Only shows when a child is currently checked in**
- Green bordered card with CheckCircle icon
- Shows: `[Child Name] - [Event Title] - Checked In`
- Real-time status (future: WebSocket updates)

### 4. My Children Section
- **Tabs**: "All" + one tab per child
- **All view**: Grid of ChildCards
- **Individual tab**: ChildDetailView with schedule/dues quick links

**ChildCard Component:**
```
┌─────────────────────────┐
│ [Avatar]  Marcus Johnson │
│           U14 Elite     │
│           Age 13        │
│                    →    │
└─────────────────────────┘
```

**ChildDetailView Component:**
```
┌───────────────────────────────────────────┐
│ [Large Avatar]  Marcus Johnson            │
│                 U14 Elite | Age 13        │
│                          [View Profile]   │
├───────────────────────────────────────────┤
│ Upcoming Events          │ Quick Actions  │
│ • Practice - Dec 10      │ [Schedule]     │
│ • Game vs Hawks - Dec 14 │ [View Dues]    │
│ • Tournament - Dec 20    │                │
└───────────────────────────────────────────┘
```

### 5. Upcoming Events List
- Shows next 5-10 events across ALL children
- Sorted by date
- Each row shows: Event title, child name, date, status badge

### 6. Quick Actions Grid
Three clickable cards:
1. **Make a Payment** - Links to /portal/billing
2. **View Orders** - Links to /portal/orders
3. **Payment Methods** - Links to /portal/billing/payment-methods

---

## Mobile Layout

On mobile (< 768px):
- Stats cards: 2x2 grid
- Children section: Horizontal scrollable tabs
- Events: Vertical list
- Quick actions: Full-width stacked cards

---

## API Integration

### Endpoint: `GET /api/portal/dashboard/`

**Response:**
```json
{
  "profile": {
    "id": 1,
    "email": "sarah@example.com",
    "full_name": "Sarah Johnson",
    "role": "parent",
    "phone": "555-123-4567",
    "auto_pay_enabled": true
  },
  "children": [
    {
      "id": 1,
      "first_name": "Marcus",
      "last_name": "Johnson",
      "age": 13,
      "team_name": "U14 Elite",
      "photo_url": null,
      "is_active": true
    }
  ],
  "total_balance": "150.00",
  "auto_pay_enabled": true,
  "upcoming_events": [
    {
      "player_name": "Marcus Johnson",
      "event_title": "Weekly Practice",
      "event_date": "2025-12-10T18:00:00Z",
      "registration_id": 42
    }
  ],
  "recent_orders": [],
  "promo_credit_total": "25.00",
  "active_check_ins": [
    {
      "player_name": "Marcus Johnson",
      "event_title": "Saturday Scrimmage",
      "checked_in_at": "2025-12-09T09:15:00Z"
    }
  ]
}
```

---

## State Management

```typescript
interface ParentDashboardState {
  dashboard: DashboardData | null
  loading: boolean
  error: string | null
  selectedChild: string  // "all" or child ID
}
```

Fetch on mount with useEffect, refresh on focus.

---

## Error States

1. **Loading**: Skeleton UI matching layout
2. **No children**: Empty state with "Add Your First Child" CTA
3. **API error**: Toast notification + retry button
4. **No events**: "No upcoming events" message with link to events page

---

## Accessibility

- All interactive elements keyboard accessible
- Tab order follows visual flow
- Status badges have aria-labels
- Color is not the only indicator (icons + text)
- Focus indicators match brand colors

---

## Performance

- Dashboard data fetched in single API call
- Images lazy loaded with blur placeholder
- Skeleton UI for perceived performance
- Consider SWR/React Query for caching
