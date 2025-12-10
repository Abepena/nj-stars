from django.db import models
from django.contrib.auth import get_user_model
from modelcluster.fields import ParentalKey
from wagtail import blocks
from wagtail.admin.panels import FieldPanel, InlinePanel, MultiFieldPanel
from wagtail.api import APIField
from wagtail.fields import RichTextField, StreamField
from wagtail.images.api.fields import ImageRenditionField
from wagtail.images.blocks import ImageChooserBlock
from wagtail.models import Orderable, Page

User = get_user_model()


class HomePage(Page):
	"""Homepage with hero and flexible content blocks."""

	# Hero section
	hero_heading = models.CharField(
		max_length=120,
		blank=True,
		help_text="Main headline (e.g., 'Elite Training.')"
	)
	hero_tagline = models.CharField(
		max_length=120,
		blank=True,
		help_text="Secondary tagline (e.g., 'Built for Rising Stars.')"
	)
	hero_subheading = models.CharField(
		max_length=240,
		blank=True,
		help_text="Paragraph text below the headline"
	)
	hero_image = models.ForeignKey(
		"wagtailimages.Image",
		null=True,
		blank=True,
		on_delete=models.SET_NULL,
		related_name="home_hero_images",
	)
	cta_label = models.CharField(max_length=80, blank=True)
	cta_url = models.URLField(blank=True)

	# Newsletter section
	show_newsletter_signup = models.BooleanField(default=True)
	newsletter_heading = models.CharField(max_length=120, blank=True, default="Stay Updated")
	newsletter_subheading = models.CharField(max_length=240, blank=True, default="Get the latest news and updates")

	# Huddle (News Feed) section
	show_huddle_section = models.BooleanField(default=True, help_text="Show The Huddle news feed section")
	huddle_limit = models.IntegerField(default=4, help_text="Number of posts to show (1-12)")

	# Merch section
	show_merch_section = models.BooleanField(default=True, help_text="Show featured merch section")
	merch_limit = models.IntegerField(default=6, help_text="Number of products to show (1-12)")

	# Body content
	body = StreamField(
		[
			("rich_text", blocks.RichTextBlock()),
			(
				"highlight",
				blocks.StructBlock(
					[
						("title", blocks.CharBlock(required=False)),
						("text", blocks.TextBlock(required=False)),
						("image", ImageChooserBlock(required=False)),
					]
				),
			),
		],
		use_json_field=True,
		blank=True,
	)

	content_panels = Page.content_panels + [
		MultiFieldPanel(
			[
				FieldPanel("hero_heading"),
				FieldPanel("hero_tagline"),
				FieldPanel("hero_subheading"),
				FieldPanel("hero_image"),
				FieldPanel("cta_label"),
				FieldPanel("cta_url"),
			],
			heading="Hero Section",
		),
		MultiFieldPanel(
			[
				FieldPanel("show_huddle_section"),
				FieldPanel("huddle_limit"),
			],
			heading="The Huddle (News Feed) Section",
		),
		MultiFieldPanel(
			[
				FieldPanel("show_merch_section"),
				FieldPanel("merch_limit"),
			],
			heading="Featured Merch Section",
		),
		MultiFieldPanel(
			[
				FieldPanel("show_newsletter_signup"),
				FieldPanel("newsletter_heading"),
				FieldPanel("newsletter_subheading"),
			],
			heading="Newsletter Section",
		),
		FieldPanel("body"),
	]

	# API fields
	api_fields = [
		APIField("hero_heading"),
		APIField("hero_tagline"),
		APIField("hero_subheading"),
		APIField("hero_image", serializer=ImageRenditionField("fill-800x600")),
		APIField("cta_label"),
		APIField("cta_url"),
		APIField("show_huddle_section"),
		APIField("huddle_limit"),
		APIField("show_merch_section"),
		APIField("merch_limit"),
		APIField("show_newsletter_signup"),
		APIField("newsletter_heading"),
		APIField("newsletter_subheading"),
		APIField("body"),
	]

	# Only allow one HomePage
	max_count = 1


class BlogIndexPage(Page):
	"""List page for blog posts."""

	intro = RichTextField(blank=True)

	content_panels = Page.content_panels + [
		FieldPanel("intro"),
	]

	subpage_types = ["cms.BlogPage"]

	# API fields
	api_fields = [
		APIField("intro"),
	]

	def get_blog_posts(self):
		"""Return published blog posts."""
		return BlogPage.objects.live().descendant_of(self).order_by("-date")


class BlogPage(Page):
	"""Individual blog post."""

	CATEGORY_CHOICES = [
		("news", "News"),
		("tryouts", "Tryouts"),
		("camp", "Camp"),
		("tournament", "Tournament"),
		("merch", "Merch Drop"),
		("sale", "Sale"),
		("announcement", "Announcement"),
	]

	date = models.DateField("Post date")
	category = models.CharField(
		max_length=20,
		choices=CATEGORY_CHOICES,
		default="news",
		help_text="Category for the post (used for filtering and display)"
	)
	author = models.ForeignKey(
		User,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="blog_posts",
	)
	intro = models.CharField(max_length=250, blank=True)
	featured_image = models.ForeignKey(
		"wagtailimages.Image",
		null=True,
		blank=True,
		on_delete=models.SET_NULL,
		related_name="blog_featured_images",
	)
	body = StreamField(
		[
			("heading", blocks.CharBlock(classname="full title")),
			("paragraph", blocks.RichTextBlock()),
			("image", ImageChooserBlock()),
		],
		use_json_field=True,
	)

	content_panels = Page.content_panels + [
		FieldPanel("date"),
		FieldPanel("category"),
		FieldPanel("author"),
		FieldPanel("intro"),
		FieldPanel("featured_image"),
		FieldPanel("body"),
	]

	parent_page_types = ["cms.BlogIndexPage"]

	# API fields
	api_fields = [
		APIField("date"),
		APIField("category"),
		APIField("author"),
		APIField("intro"),
		APIField("featured_image", serializer=ImageRenditionField("fill-1200x800")),
		APIField("body"),
	]


class TeamPage(Page):
	"""Team roster page."""

	intro = RichTextField(blank=True)

	content_panels = Page.content_panels + [
		FieldPanel("intro"),
		InlinePanel("players", label="Player"),
	]

	# API fields
	api_fields = [
		APIField("intro"),
		APIField("players"),
	]

	# Only allow one TeamPage
	max_count = 1


class PlayerProfile(Orderable):
	"""Player profile attached to TeamPage."""

	POSITION_CHOICES = [
		("PG", "Point Guard"),
		("SG", "Shooting Guard"),
		("SF", "Small Forward"),
		("PF", "Power Forward"),
		("C", "Center"),
	]

	page = ParentalKey(TeamPage, on_delete=models.CASCADE, related_name="players")
	name = models.CharField(max_length=120)
	position = models.CharField(max_length=2, choices=POSITION_CHOICES, blank=True)
	number = models.CharField(max_length=10, blank=True)
	grade = models.CharField(max_length=20, blank=True, help_text="e.g., '10th Grade' or 'Sophomore'")
	height = models.CharField(max_length=20, blank=True, help_text="e.g., '6'2\"'")
	bio = models.TextField(blank=True)
	headshot = models.ForeignKey(
		"wagtailimages.Image",
		null=True,
		blank=True,
		on_delete=models.SET_NULL,
		related_name="player_headshots",
	)

	panels = [
		FieldPanel("name"),
		FieldPanel("position"),
		FieldPanel("number"),
		FieldPanel("grade"),
		FieldPanel("height"),
		FieldPanel("headshot"),
		FieldPanel("bio"),
	]

	# API fields
	api_fields = [
		APIField("name"),
		APIField("position"),
		APIField("number"),
		APIField("grade"),
		APIField("height"),
		APIField("bio"),
		APIField("headshot", serializer=ImageRenditionField("fill-300x300")),
	]
