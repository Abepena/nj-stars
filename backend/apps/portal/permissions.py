from rest_framework import permissions


class IsParentOrStaff(permissions.BasePermission):
    """
    Allow access to staff (full access) or parents (linked children only).

    Use for: Player management, dues accounts, check-ins
    """

    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        user = request.user

        # Staff can access everything
        if user.is_staff:
            return True

        if hasattr(user, 'profile') and user.profile.is_staff_member:
            return True

        # For Player objects - check guardian relationship
        if hasattr(obj, 'guardian_relationships'):
            return obj.guardian_relationships.filter(guardian=user).exists()

        # For objects with player FK (DuesAccount, etc.)
        if hasattr(obj, 'player'):
            return obj.player.guardian_relationships.filter(guardian=user).exists()

        # For objects with user FK (direct ownership)
        if hasattr(obj, 'user'):
            return obj.user == user

        return False


class IsPlayerOrGuardian(permissions.BasePermission):
    """
    Player can access own profile, guardians can access linked players.

    Use for: Player profile detail views
    """

    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        user = request.user

        # Staff can access everything
        if user.is_staff:
            return True

        # Player accessing their own profile
        if hasattr(obj, 'user') and obj.user == user:
            return True

        # Guardian accessing linked player
        if hasattr(obj, 'guardian_relationships'):
            return obj.guardian_relationships.filter(guardian=user).exists()

        return False


class IsStaffMember(permissions.BasePermission):
    """
    Only staff members can access.

    Use for: Check-in management, roster editing, admin views
    """

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        # Django's is_staff flag
        if request.user.is_staff:
            return True

        # Profile role check
        if hasattr(request.user, 'profile') and request.user.profile.is_staff_member:
            return True

        return False


class IsOwnerOrStaff(permissions.BasePermission):
    """
    Owner of the object (via user FK) or staff can access.

    Use for: Payment methods, promo credits, user-owned resources
    """

    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        user = request.user

        # Staff can access everything
        if user.is_staff:
            return True

        # Owner check
        if hasattr(obj, 'user'):
            return obj.user == user

        return False


class ReadOnlyOrStaff(permissions.BasePermission):
    """
    Anyone authenticated can read, only staff can write.

    Use for: Roster viewing, event details
    """

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        # Read operations allowed for all authenticated
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write operations only for staff
        if request.user.is_staff:
            return True

        if hasattr(request.user, 'profile') and request.user.profile.is_staff_member:
            return True

        return False
