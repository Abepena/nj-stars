# Portal Permissions & Role-Based Access

## User Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| **Superuser** | Django superuser | Full system access |
| **Staff** | Coaches, admins | Admin tabs + own family |
| **Parent** | Parents/guardians | Own profile + linked children |
| **Player (13+)** | Teen players with own account | Own profile only |

---

## Role Determination

### Backend (Django)

```python
# apps/portal/models.py
class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('parent', 'Parent/Guardian'),
        ('player', 'Player (13+)'),
        ('staff', 'Staff'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='parent')

    @property
    def is_staff_member(self):
        """Staff role OR Django is_staff flag"""
        return self.role == 'staff' or self.user.is_staff

    @property
    def is_parent(self):
        return self.role == 'parent'

    @property
    def is_player(self):
        return self.role == 'player'
```

### Frontend (NextAuth)

```typescript
// Extend session to include role
interface Session {
  user: {
    id: string
    email: string
    name: string
    role: 'parent' | 'player' | 'staff'
    isAdmin: boolean
  }
}
```

---

## Permission Classes

### IsParentOrStaff
- **Use case:** Accessing player data
- Staff: Can access ANY player
- Parents: Can only access players linked via GuardianRelationship

```python
class IsParentOrStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        user = request.user

        # Staff can access everything
        if user.is_staff or (hasattr(user, 'profile') and user.profile.is_staff_member):
            return True

        # For Player objects - check guardian relationship
        if hasattr(obj, 'guardian_relationships'):
            return obj.guardian_relationships.filter(guardian=user).exists()

        # For objects with player FK
        if hasattr(obj, 'player'):
            return obj.player.guardian_relationships.filter(guardian=user).exists()

        # For objects with user FK
        if hasattr(obj, 'user'):
            return obj.user == user

        return False
```

### IsPlayerOrGuardian
- **Use case:** Player profile access
- Player: Can access their OWN profile
- Guardian: Can access LINKED player profiles

```python
class IsPlayerOrGuardian(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        user = request.user

        # Player accessing their own profile
        if hasattr(obj, 'user') and obj.user == user:
            return True

        # Guardian accessing linked player
        if hasattr(obj, 'guardian_relationships'):
            return obj.guardian_relationships.filter(guardian=user).exists()

        return False
```

### IsStaffMember
- **Use case:** Admin-only actions (check-ins, roster management)

```python
class IsStaffMember(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.is_staff or (
            hasattr(request.user, 'profile') and
            request.user.profile.is_staff_member
        )
```

---

## Access Matrix

### Dashboard Endpoints

| Endpoint | Superuser | Staff | Parent | Player |
|----------|-----------|-------|--------|--------|
| `GET /dashboard/` | ✅ | ✅ | ✅ | ✅ |
| `GET /dashboard/staff/` | ✅ | ✅ | ❌ | ❌ |

### Player Endpoints

| Endpoint | Superuser | Staff | Parent (own child) | Parent (other) | Player (self) | Player (other) |
|----------|-----------|-------|-------------------|----------------|---------------|----------------|
| `GET /players/` | All | All | Linked only | ❌ | Self only | ❌ |
| `GET /players/{id}/` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| `POST /players/` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `PATCH /players/{id}/` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |

### Billing Endpoints

| Endpoint | Superuser | Staff | Parent | Player |
|----------|-----------|-------|--------|--------|
| `GET /payment-methods/` | ✅ | ✅ | ✅ (own) | ✅ (own) |
| `POST /payment-methods/` | ✅ | ✅ | ✅ | ❌ |
| `DELETE /payment-methods/{id}/` | ✅ | ✅ | ✅ (own) | ❌ |

### Check-In Endpoints

| Endpoint | Superuser | Staff | Parent | Player |
|----------|-----------|-------|--------|--------|
| `GET /check-ins/` | All | All | Children only | Self only |
| `POST /check-ins/{id}/check_in/` | ✅ | ✅ | ❌ | ❌ |
| `POST /check-ins/{id}/check_out/` | ✅ | ✅ | ❌ | ❌ |

---

## Frontend Route Protection

### Layout-Level Protection

```tsx
// portal/dashboard/layout.tsx
export default function PortalLayout({ children }) {
  const { data: session, status } = useSession()

  if (status === "unauthenticated") {
    redirect("/portal/login")
  }

  return <>{children}</>
}
```

### Role-Based UI

```tsx
// Show staff nav only if staff
const isStaff = session?.user?.role === "staff" || session?.user?.isAdmin

{isStaff && (
  <nav>
    {staffNavItems.map(item => <NavLink ... />)}
  </nav>
)}
```

### Page-Level Protection

```tsx
// portal/admin/page.tsx
export default function AdminPage() {
  const { data: session } = useSession()

  const isStaff = session?.user?.role === "staff" || session?.user?.isAdmin

  if (!isStaff) {
    redirect("/portal/dashboard")
  }

  return <AdminDashboard />
}
```

---

## Guardian Relationship Rules

### Adding a Guardian

1. When parent registers a child, they become the PRIMARY guardian
2. Primary guardian can add additional guardians
3. Additional guardians have same view access, but only primary can edit

### Removing a Guardian

1. Guardians can remove themselves from a relationship
2. Primary guardian can remove other guardians
3. Primary cannot be removed unless transferred to another guardian

### Player 13+ Transition

1. When player turns 13, system prompts to create their own account
2. Player account links to existing Player record
3. Player can then view their own profile directly
4. Parent access remains through guardian relationship

---

## COPPA Compliance

Players under 13:
- **Cannot** have their own account
- **Must** be managed through a parent/guardian account
- Parent consent is implicit through account ownership
- No direct email communication to players under 13
- Personal data stored only as needed for registration

Players 13+:
- **Can** have their own account (optional)
- Can manage their own profile
- Can view their schedule and team info
- **Cannot** make payments or manage billing
