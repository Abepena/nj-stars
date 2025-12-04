# Database Seed Script Documentation

## Overview

The `seed_data.py` script populates your PostgreSQL database with realistic mock data for development and testing purposes.

## What Gets Seeded

### 1. Users (5 accounts)

| Email | Password | Role | Provider |
|-------|----------|------|----------|
| admin@njstars.com | admin123 | Admin | Credentials |
| parent1@example.com | parent123 | Parent | Credentials |
| parent2@example.com | N/A | Parent | Google OAuth |
| player1@example.com | player123 | Player | Credentials |
| player2@example.com | player123 | Player | Credentials |

**Note:** Passwords are hashed using bcrypt before storage.

### 2. Blog Posts (5 articles)

- Championship victory announcement
- Summer training camp registration
- Player spotlight feature
- New facility partnership announcement
- Tournament success recap

All posts include:
- Title, content, excerpt
- Featured images (Unsplash URLs)
- Author attribution
- Realistic publication dates

### 3. Products (9 merch items)

**Jerseys:**
- NJ Stars Game Jersey - Home ($59.99)
- NJ Stars Game Jersey - Away ($59.99)

**Apparel:**
- Practice T-Shirt ($24.99)
- Hoodie ($49.99)
- Basketball Shorts ($34.99)

**Accessories:**
- Snapback Hat ($27.99)
- Water Bottle ($19.99)
- Backpack ($44.99)
- Limited Edition Championship Tee ($29.99, low stock)

All products include:
- Descriptions and pricing
- Stock quantities (varies by item)
- Category tags
- Product images

### 4. Events (8 scheduled events)

**Event Types:**
- Open Gyms (2)
- Tryouts (2)
- Practice Sessions (1)
- Games (1)
- Tournaments (1)
- Skills Workshop (1)

Events are scheduled for future dates (3-23 days out) with:
- Detailed descriptions
- Start and end times
- Location information
- Capacity limits (where applicable)
- Public/private visibility flags

### 5. Sample Orders (3 completed purchases)

Three completed Stripe orders demonstrating:
- Different products purchased
- Various order amounts
- Customer email tracking
- Stripe session IDs
- Payment intent references

## Usage

### First Time Setup

```bash
# From the backend directory
cd backend

# Ensure you have a PostgreSQL database created
createdb njstars

# Run the seed script
python seed_data.py
```

### Re-seeding Database

The script is **idempotent** - it clears all existing data before seeding:

```bash
# Safe to run multiple times
python seed_data.py
```

**Warning:** This will delete ALL existing data in the database. Use with caution in production!

## What Happens When You Run It

1. ✅ Creates database tables (if they don't exist)
2. 🗑️ Clears all existing data
3. 👥 Seeds users with hashed passwords
4. 📝 Seeds blog posts
5. 🛍️ Seeds products
6. 📅 Seeds events
7. 💳 Seeds sample orders
8. ✨ Displays summary of created data

## Output Example

```
==================================================
NJ STARS DATABASE SEEDER
==================================================

Ensuring database tables exist...
✓ Tables ready

Clearing existing data...
✓ Database cleared

Seeding users...
✓ Created 5 users
  - admin@njstars.com / admin123 (Admin)
  - parent1@example.com / parent123 (Parent)
  - player1@example.com / player123 (Player)

Seeding blog posts...
✓ Created 5 blog posts

Seeding products...
✓ Created 9 products

Seeding events...
✓ Created 8 events

Seeding sample orders...
✓ Created 3 sample orders

==================================================
✓ DATABASE SEEDING COMPLETE!
==================================================

You can now start the application and see sample data.

Test Accounts:
  Admin:  admin@njstars.com / admin123
  Parent: parent1@example.com / parent123
  Player: player1@example.com / player123
```

## Customization

To modify the seed data, edit the functions in `seed_data.py`:

- `seed_users()` - Add/modify user accounts
- `seed_blog_posts()` - Add/modify blog content
- `seed_products()` - Add/modify merch items
- `seed_events()` - Add/modify scheduled events
- `seed_orders()` - Add/modify sample orders

## Dependencies

The script requires:
- SQLAlchemy models from `app.models`
- Database connection from `app.core.database`
- Passlib for password hashing

All dependencies are included in `requirements.txt`.

## Testing Portal Features

Use the seeded accounts to test role-based access:

### Admin Account
```
Email: admin@njstars.com
Password: admin123
```
Can access:
- Admin dashboard
- Event management
- Order viewing
- Roster management

### Parent Account
```
Email: parent1@example.com
Password: parent123
```
Can access:
- Parent dashboard
- View schedules
- Payment features

### Player Account
```
Email: player1@example.com
Password: player123
```
Can access:
- Player dashboard
- View personal schedule
- Team information

## Troubleshooting

### "ModuleNotFoundError"
Ensure you're in the backend directory and have activated your virtual environment:
```bash
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### "Connection refused"
Make sure PostgreSQL is running and the database exists:
```bash
# Check if database exists
psql -l | grep njstars

# Create if needed
createdb njstars
```

### "Permission denied"
Ensure your PostgreSQL user has proper permissions:
```sql
GRANT ALL PRIVILEGES ON DATABASE njstars TO your_user;
```

## Production Warning

⚠️ **DO NOT run this script in production!**

This script is designed for development and testing only. It will:
- Delete all existing data
- Create test accounts with known passwords
- Use mock/sample data

For production deployments, use proper database migrations and data import procedures.
