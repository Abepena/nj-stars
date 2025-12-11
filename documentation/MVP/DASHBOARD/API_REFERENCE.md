# Portal API Reference

Base URL: `/api/portal/`

All endpoints require authentication unless noted.

---

## Dashboard

### Get Parent Dashboard
```
GET /dashboard/
```
Returns aggregated dashboard data for the authenticated parent.

**Response 200:**
```json
{
  "profile": { UserProfile },
  "children": [ PlayerSummary ],
  "total_balance": "150.00",
  "auto_pay_enabled": true,
  "upcoming_events": [
    {
      "player_name": "string",
      "event_title": "string",
      "event_date": "datetime",
      "registration_id": "integer"
    }
  ],
  "recent_orders": [ Order ],
  "promo_credit_total": "25.00",
  "active_check_ins": [
    {
      "player_name": "string",
      "event_title": "string",
      "checked_in_at": "datetime"
    }
  ]
}
```

### Get Staff Dashboard
```
GET /dashboard/staff/
```
**Permissions:** Staff only

Extends parent dashboard with admin stats.

**Additional fields:**
```json
{
  "admin_stats": {
    "total_players": "integer",
    "todays_events": "integer",
    "pending_payments": "integer",
    "check_ins_today": "integer"
  },
  "pending_check_ins": [ EventCheckIn ],
  "recent_registrations": [ EventRegistration ]
}
```

---

## User Profile

### Get Profile
```
GET /profile/
```
Returns the authenticated user's profile.

### Update Profile
```
PATCH /profile/
```
**Body:**
```json
{
  "phone": "string",
  "address_line1": "string",
  "address_line2": "string",
  "city": "string",
  "state": "string",
  "zip_code": "string",
  "auto_pay_enabled": "boolean",
  "notification_email": "boolean",
  "notification_sms": "boolean"
}
```

---

## Players (Children)

### List Players
```
GET /players/
```
Returns all players linked to the authenticated user.

**Response 200:**
```json
{
  "results": [
    {
      "id": 1,
      "first_name": "Marcus",
      "last_name": "Johnson",
      "age": 13,
      "team_name": "U14 Elite",
      "photo_url": null,
      "is_active": true
    }
  ]
}
```

### Get Player Detail
```
GET /players/{id}/
```
**Permissions:** Guardian of this player or staff

**Response 200:**
```json
{
  "id": 1,
  "first_name": "Marcus",
  "last_name": "Johnson",
  "date_of_birth": "2012-03-15",
  "age": 13,
  "email": "marcus@example.com",
  "phone": "",
  "jersey_number": "23",
  "position": "Point Guard",
  "team_name": "U14 Elite",
  "photo_url": null,
  "medical_notes": "",
  "emergency_contact_name": "Sarah Johnson",
  "emergency_contact_phone": "555-123-4567",
  "emergency_contact_relationship": "Parent/Guardian",
  "is_active": true,
  "dues_balance": "150.00",
  "upcoming_events_count": 3
}
```

### Create Player
```
POST /players/
```
Creates a new player and links to the authenticated user as guardian.

**Body:**
```json
{
  "first_name": "string (required)",
  "last_name": "string (required)",
  "date_of_birth": "date (required)",
  "email": "string",
  "phone": "string",
  "jersey_number": "string",
  "position": "string",
  "team_name": "string",
  "medical_notes": "string",
  "emergency_contact_name": "string (required)",
  "emergency_contact_phone": "string (required)",
  "emergency_contact_relationship": "string"
}
```

### Update Player
```
PATCH /players/{id}/
```
**Permissions:** Guardian of this player or staff

### Get Player Schedule
```
GET /players/{id}/schedule/
```
Returns upcoming events for this player.

**Response 200:**
```json
[
  {
    "id": 42,
    "event": { Event },
    "payment_status": "completed",
    "registered_at": "datetime"
  }
]
```

### Get Player Dues
```
GET /players/{id}/dues/
```
Returns dues account for this player.

**Response 200:**
```json
{
  "id": 1,
  "player": 1,
  "player_name": "Marcus Johnson",
  "balance": "150.00",
  "is_good_standing": true,
  "last_payment_date": "2025-11-15T00:00:00Z",
  "recent_transactions": [
    {
      "id": 1,
      "transaction_type": "charge",
      "amount": "75.00",
      "description": "December Monthly Dues",
      "balance_after": "150.00",
      "created_at": "datetime"
    }
  ]
}
```

---

## Dues Accounts

### List Dues Accounts
```
GET /dues-accounts/
```
Returns dues accounts for all children linked to user.

### Get Dues Account
```
GET /dues-accounts/{id}/
```

### Get Transactions
```
GET /dues-accounts/{id}/transactions/
```
Returns full transaction history for account.

---

## Payment Methods

### List Payment Methods
```
GET /payment-methods/
```

**Response 200:**
```json
{
  "results": [
    {
      "id": 1,
      "card_brand": "visa",
      "card_last4": "4242",
      "card_exp_month": 12,
      "card_exp_year": 2027,
      "is_default": true,
      "nickname": "Personal Card",
      "display_name": "Personal Card (Visa ****4242)"
    }
  ]
}
```

### Add Payment Method
```
POST /payment-methods/
```
**Note:** This should be handled via Stripe Setup Intent on frontend.

### Set Default
```
POST /payment-methods/{id}/set_default/
```

### Delete Payment Method
```
DELETE /payment-methods/{id}/
```

---

## Promo Credits

### List Credits
```
GET /promo-credits/
```
Returns active promo credits for user.

**Response 200:**
```json
{
  "results": [
    {
      "id": 1,
      "credit_type": "referral",
      "amount": "25.00",
      "remaining_amount": "25.00",
      "description": "Referral bonus for John Smith",
      "expires_at": null,
      "is_active": true,
      "is_expired": false
    }
  ]
}
```

---

## Check-Ins

### List Check-Ins
```
GET /check-ins/
```
Parents see their children's check-ins. Staff see all.

### Mark Check-In (Staff Only)
```
POST /check-ins/{id}/check_in/
```
**Permissions:** Staff only

### Mark Check-Out (Staff Only)
```
POST /check-ins/{id}/check_out/
```
**Permissions:** Staff only

---

## Error Responses

### 400 Bad Request
```json
{
  "field_name": ["Error message"]
}
```

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden
```json
{
  "detail": "You do not have permission to perform this action."
}
```

### 404 Not Found
```json
{
  "detail": "Not found."
}
```
