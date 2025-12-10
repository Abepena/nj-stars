from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class UserProfile(models.Model):
    """Extended profile for authenticated users (parents, staff, players 13+)"""

    ROLE_CHOICES = [
        ('parent', 'Parent/Guardian'),
        ('player', 'Player (13+)'),
        ('staff', 'Staff'),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='parent')

    # Contact info
    phone = models.CharField(max_length=20, blank=True)
    address_line1 = models.CharField(max_length=255, blank=True)
    address_line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=50, default='NJ')
    zip_code = models.CharField(max_length=20, blank=True)

    # Waiver - signed once, covers all registrations
    waiver_signed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Date/time the liability waiver was signed"
    )
    waiver_version = models.CharField(
        max_length=20,
        blank=True,
        help_text="Version of waiver that was signed (e.g., '2024.1')"
    )
    waiver_signer_name = models.CharField(
        max_length=200,
        blank=True,
        help_text="Name as signed on the waiver"
    )

    # Preferences
    auto_pay_enabled = models.BooleanField(default=False)
    notification_email = models.BooleanField(default=True)
    notification_sms = models.BooleanField(default=False)

    # Stripe Customer ID for saved payment methods
    stripe_customer_id = models.CharField(max_length=255, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'

    def __str__(self):
        return f"{self.user.email} ({self.get_role_display()})"

    @property
    def is_staff_member(self):
        """Check if user is a staff member (role or Django flag)"""
        return self.role == 'staff' or self.user.is_staff

    @property
    def is_parent(self):
        return self.role == 'parent'

    @property
    def is_player(self):
        return self.role == 'player'

    @property
    def full_name(self):
        return self.user.get_full_name() or self.user.email

    @property
    def profile_completeness(self):
        """Calculate profile completeness percentage"""
        fields = [
            self.phone,
            self.address_line1,
            self.city,
            self.zip_code,
            self.user.first_name,
            self.user.last_name,
        ]
        filled = sum(1 for f in fields if f)
        return int((filled / len(fields)) * 100)

    @property
    def has_signed_waiver(self):
        """Check if user has a signed waiver on file"""
        return self.waiver_signed_at is not None

    def sign_waiver(self, signer_name: str, version: str = "2024.1"):
        """Sign the liability waiver"""
        self.waiver_signed_at = timezone.now()
        self.waiver_version = version
        self.waiver_signer_name = signer_name
        self.save()


class Player(models.Model):
    """Player profile - managed by parent or self (if 13+)"""

    # If linked to user account (player 13+ with own login)
    user = models.OneToOneField(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='player_profile'
    )

    # Basic info
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)

    # Team info
    jersey_number = models.CharField(max_length=10, blank=True)
    position = models.CharField(max_length=50, blank=True)
    team_name = models.CharField(max_length=100, blank=True)

    # Photo
    photo = models.ImageField(upload_to='players/', blank=True, null=True)
    photo_url = models.URLField(max_length=500, blank=True)

    # Medical/Emergency
    medical_notes = models.TextField(blank=True)
    emergency_contact_name = models.CharField(max_length=100)
    emergency_contact_phone = models.CharField(max_length=20)
    emergency_contact_relationship = models.CharField(
        max_length=50,
        default='Parent/Guardian'
    )

    # Status
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['last_name', 'first_name']
        verbose_name = 'Player'
        verbose_name_plural = 'Players'

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def age(self):
        """Calculate age from date of birth"""
        today = timezone.now().date()
        return today.year - self.date_of_birth.year - (
            (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )

    @property
    def can_have_own_account(self):
        """COPPA compliance - 13+ can have own account"""
        return self.age >= 13

    @property
    def primary_photo_url(self):
        """Get photo URL - either uploaded file or external URL"""
        if self.photo:
            return self.photo.url
        return self.photo_url or None


class GuardianRelationship(models.Model):
    """Many-to-many relationship between guardians and players"""

    RELATIONSHIP_CHOICES = [
        ('parent', 'Parent'),
        ('guardian', 'Legal Guardian'),
        ('grandparent', 'Grandparent'),
        ('relative', 'Other Relative'),
        ('coach', 'Coach'),
        ('other', 'Other'),
    ]

    guardian = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='guardian_relationships'
    )
    player = models.ForeignKey(
        Player,
        on_delete=models.CASCADE,
        related_name='guardian_relationships'
    )
    relationship = models.CharField(
        max_length=20,
        choices=RELATIONSHIP_CHOICES,
        default='parent'
    )
    is_primary = models.BooleanField(
        default=False,
        help_text="Primary contact for this player"
    )
    can_pickup = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['guardian', 'player']
        verbose_name = 'Guardian Relationship'
        verbose_name_plural = 'Guardian Relationships'

    def __str__(self):
        return f"{self.guardian.email} -> {self.player.full_name} ({self.get_relationship_display()})"

    def save(self, *args, **kwargs):
        # If this is the first guardian for this player, make them primary
        if not self.pk:
            existing = GuardianRelationship.objects.filter(player=self.player).exists()
            if not existing:
                self.is_primary = True
        super().save(*args, **kwargs)


class DuesAccount(models.Model):
    """Track dues/balance for each player"""

    player = models.OneToOneField(
        Player,
        on_delete=models.CASCADE,
        related_name='dues_account'
    )

    # Current balance (positive = owes money, negative = credit)
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Subscription link (if on recurring plan)
    subscription = models.ForeignKey(
        'payments.Subscription',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='dues_accounts'
    )

    # Status
    is_good_standing = models.BooleanField(default=True)
    last_payment_date = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Dues Account'
        verbose_name_plural = 'Dues Accounts'

    def __str__(self):
        return f"{self.player.full_name} - ${self.balance}"

    def add_charge(self, amount, description, event_registration=None, created_by=None):
        """Add a charge to the account"""
        self.balance += amount
        self.save()
        return DuesTransaction.objects.create(
            account=self,
            transaction_type='charge',
            amount=amount,
            description=description,
            balance_after=self.balance,
            event_registration=event_registration,
            created_by=created_by
        )

    def add_payment(self, amount, description, payment=None, created_by=None):
        """Record a payment"""
        self.balance -= amount
        self.last_payment_date = timezone.now()
        self.is_good_standing = self.balance <= 0
        self.save()
        return DuesTransaction.objects.create(
            account=self,
            transaction_type='payment',
            amount=amount,
            description=description,
            balance_after=self.balance,
            payment=payment,
            created_by=created_by
        )


class DuesTransaction(models.Model):
    """Individual transactions for dues accounts"""

    TRANSACTION_TYPES = [
        ('charge', 'Charge'),
        ('payment', 'Payment'),
        ('credit', 'Credit'),
        ('refund', 'Refund'),
    ]

    account = models.ForeignKey(
        DuesAccount,
        on_delete=models.CASCADE,
        related_name='transactions'
    )
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.CharField(max_length=255)

    # Link to related objects
    payment = models.ForeignKey(
        'payments.Payment',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='dues_transactions'
    )
    event_registration = models.ForeignKey(
        'registrations.EventRegistration',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='dues_transactions'
    )

    # Balance after transaction
    balance_after = models.DecimalField(max_digits=10, decimal_places=2)

    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_dues_transactions'
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Dues Transaction'
        verbose_name_plural = 'Dues Transactions'

    def __str__(self):
        return f"{self.get_transaction_type_display()}: ${self.amount} - {self.description}"


class SavedPaymentMethod(models.Model):
    """Stripe saved payment methods for users"""

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='saved_payment_methods'
    )

    # Stripe identifiers
    stripe_payment_method_id = models.CharField(max_length=255, unique=True)

    # Display info (from Stripe)
    card_brand = models.CharField(max_length=50)
    card_last4 = models.CharField(max_length=4)
    card_exp_month = models.IntegerField()
    card_exp_year = models.IntegerField()

    # Settings
    is_default = models.BooleanField(default=False)
    nickname = models.CharField(max_length=50, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-is_default', '-created_at']
        verbose_name = 'Saved Payment Method'
        verbose_name_plural = 'Saved Payment Methods'

    def __str__(self):
        return f"{self.card_brand.title()} ****{self.card_last4}"

    @property
    def display_name(self):
        """User-friendly display name"""
        if self.nickname:
            return f"{self.nickname} ({self.card_brand.title()} ****{self.card_last4})"
        return f"{self.card_brand.title()} ****{self.card_last4}"

    @property
    def is_expired(self):
        """Check if card is expired"""
        today = timezone.now().date()
        # Card expires at end of expiry month
        from calendar import monthrange
        last_day = monthrange(self.card_exp_year, self.card_exp_month)[1]
        exp_date = timezone.datetime(
            self.card_exp_year, self.card_exp_month, last_day
        ).date()
        return today > exp_date

    def save(self, *args, **kwargs):
        # Ensure only one default per user
        if self.is_default:
            SavedPaymentMethod.objects.filter(
                user=self.user, is_default=True
            ).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)


class PromoCredit(models.Model):
    """Promotional credits and loyalty rewards"""

    CREDIT_TYPES = [
        ('referral', 'Referral Bonus'),
        ('loyalty', 'Loyalty Reward'),
        ('promo', 'Promotional Credit'),
        ('adjustment', 'Account Adjustment'),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='promo_credits'
    )
    credit_type = models.CharField(max_length=20, choices=CREDIT_TYPES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    remaining_amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.CharField(max_length=255)

    # Optional expiration
    expires_at = models.DateTimeField(null=True, blank=True)

    # Usage tracking
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['expires_at', '-created_at']
        verbose_name = 'Promo Credit'
        verbose_name_plural = 'Promo Credits'

    def __str__(self):
        return f"{self.get_credit_type_display()}: ${self.remaining_amount}"

    @property
    def is_expired(self):
        if not self.expires_at:
            return False
        return timezone.now() > self.expires_at

    def use_credit(self, amount):
        """Use some of this credit. Returns amount actually used."""
        if not self.is_active or self.is_expired:
            return 0
        use_amount = min(amount, self.remaining_amount)
        self.remaining_amount -= use_amount
        if self.remaining_amount <= 0:
            self.is_active = False
        self.save()
        return use_amount


class EventCheckIn(models.Model):
    """Track check-ins for events"""

    event_registration = models.OneToOneField(
        'registrations.EventRegistration',
        on_delete=models.CASCADE,
        related_name='check_in'
    )

    checked_in_at = models.DateTimeField(null=True, blank=True)
    checked_in_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='check_ins_performed'
    )

    checked_out_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Event Check-In'
        verbose_name_plural = 'Event Check-Ins'

    def __str__(self):
        status = "Checked In" if self.is_checked_in else "Not Checked In"
        return f"{self.event_registration} - {status}"

    @property
    def is_checked_in(self):
        """Currently checked in (in and not out)"""
        return self.checked_in_at is not None and self.checked_out_at is None

    @property
    def is_checked_out(self):
        """Has checked out"""
        return self.checked_out_at is not None

    def check_in(self, user=None):
        """Mark as checked in"""
        self.checked_in_at = timezone.now()
        self.checked_in_by = user
        self.checked_out_at = None
        self.save()

    def check_out(self):
        """Mark as checked out"""
        self.checked_out_at = timezone.now()
        self.save()
