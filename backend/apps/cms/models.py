from django.db import models
from modelcluster.fields import ParentalKey
from wagtail import blocks
from wagtail.admin.panels import FieldPanel, InlinePanel, MultiFieldPanel
from wagtail.fields import RichTextField, StreamField
from wagtail.images.blocks import ImageChooserBlock
from wagtail.models import Orderable, Page


class HomePage(Page):
	"""Homepage with hero and flexible content blocks."""

	hero_heading = models.CharField(max_length=120, blank=True)
	hero_subheading = models.CharField(max_length=240, blank=True)
	hero_image = models.ForeignKey(
		"wagtailimages.Image",
		null=True,
		blank=True,
		on_delete=models.SET_NULL,
		related_name="home_hero_images",
	)
	cta_label = models.CharField(max_length=80, blank=True)
	cta_url = models.URLField(blank=True)

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
				FieldPanel("hero_subheading"),
				FieldPanel("hero_image"),
				FieldPanel("cta_label"),
				FieldPanel("cta_url"),
			],
			heading="Hero",
		),
		FieldPanel("body"),
	]


class BlogIndexPage(Page):
	"""List page for blog posts."""

	intro = RichTextField(blank=True)

	content_panels = Page.content_panels + [
		FieldPanel("intro"),
	]

	subpage_types = ["cms.BlogPage"]


class BlogPage(Page):
	"""Individual blog post."""

	date = models.DateField("Post date")
	intro = models.CharField(max_length=250, blank=True)
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
		FieldPanel("intro"),
		FieldPanel("body"),
	]

	parent_page_types = ["cms.BlogIndexPage"]


class TeamPage(Page):
	"""Team roster page."""

	intro = RichTextField(blank=True)

	content_panels = Page.content_panels + [
		FieldPanel("intro"),
		InlinePanel("players", label="Player"),
	]


class PlayerProfile(Orderable):
	"""Player profile attached to TeamPage."""

	page = ParentalKey(TeamPage, on_delete=models.CASCADE, related_name="players")
	name = models.CharField(max_length=120)
	position = models.CharField(max_length=80, blank=True)
	number = models.CharField(max_length=10, blank=True)
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
		FieldPanel("headshot"),
	]
