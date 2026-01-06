"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  NeonCard,
  NeonCardHeader,
  NeonCardTitle,
  NeonCardDescription,
  NeonCardContent,
  NeonCardFooter,
  NeonBadge,
} from "@/components/ui/neon-card"
import { ChromaticText, GlitchText, NeonText } from "@/components/ui/chromatic-text"
import { Calendar, Trophy, Users, Zap, ShoppingBag, Star } from "lucide-react"

/**
 * Opus Design Demo
 *
 * This page demonstrates the difference between the Haiku-designed
 * components (conservative, subtle) and the Opus approach (bold,
 * impactful, fully utilizing the neon court aesthetic).
 *
 * Key design philosophy differences:
 *
 * HAIKU APPROACH:
 * - 15% opacity glows (barely visible)
 * - Single shadow layers
 * - Static demonstrations
 * - Color mapping without intensity variations
 *
 * OPUS APPROACH:
 * - Layered box-shadows for authentic neon (35-55% intensities)
 * - Progressive enhancement (works static, enhanced with animation)
 * - CSS variable-driven for runtime theming
 * - Composable component architecture
 * - Full accessibility (reduced motion, focus states)
 * - Court grid integration as design language
 */

export default function OpusDesignDemo() {
  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Hero Section with Court Grid */}
      <section className="relative overflow-hidden">
        {/* Court grid background */}
        <div className="absolute inset-0 court-grid-overlay opacity-40" />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-bg-primary via-transparent to-bg-primary" />

        {/* Ambient glow spots */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-[hsl(var(--neon-pink)/0.15)] rounded-full blur-[100px]" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-[hsl(var(--neon-cyan)/0.12)] rounded-full blur-[100px]" />

        <div className="relative z-10 container mx-auto px-4 py-24 text-center">
          {/* Chromatic Title */}
          <ChromaticText
            as="h1"
            intensity="strong"
            glow="dual"
            size="2xl"
            className="mb-6"
          >
            OPUS DESIGN
          </ChromaticText>

          <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-8">
            Premium neon court aesthetic for Gen Z basketball culture.
            <br />
            <span className="text-text-tertiary">
              Compare with the{" "}
              <Link href="/gradient-grid-demo" className="text-primary hover:underline">
                Haiku demo
              </Link>
            </span>
          </p>

          {/* Intensity Comparison */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <NeonBadge variant="pink">Intense Glows</NeonBadge>
            <NeonBadge variant="cyan">Chromatic Text</NeonBadge>
            <NeonBadge variant="purple">Animated Borders</NeonBadge>
          </div>
        </div>
      </section>

      {/* Text Effects Showcase */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
          Text Effects
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Chromatic Intensities */}
          <div className="text-center space-y-4">
            <p className="text-sm text-text-tertiary uppercase tracking-wider">Subtle</p>
            <ChromaticText intensity="subtle" size="md">GAME TIME</ChromaticText>
          </div>

          <div className="text-center space-y-4">
            <p className="text-sm text-text-tertiary uppercase tracking-wider">Medium (Static)</p>
            <ChromaticText intensity="medium" size="md">GAME TIME</ChromaticText>
          </div>

          <div className="text-center space-y-4">
            <p className="text-sm text-text-tertiary uppercase tracking-wider">Strong (Animated)</p>
            <ChromaticText intensity="strong" size="md">GAME TIME</ChromaticText>
          </div>

          <div className="text-center space-y-4">
            <p className="text-sm text-text-tertiary uppercase tracking-wider">Extreme</p>
            <ChromaticText intensity="extreme" size="md">GAME TIME</ChromaticText>
          </div>
        </div>

        {/* Neon Text Colors */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center space-y-4">
            <p className="text-sm text-text-tertiary uppercase tracking-wider">Neon Pink</p>
            <NeonText color="pink" className="text-4xl">ELITE</NeonText>
          </div>

          <div className="text-center space-y-4">
            <p className="text-sm text-text-tertiary uppercase tracking-wider">Neon Cyan</p>
            <NeonText color="cyan" className="text-4xl">STARS</NeonText>
          </div>

          <div className="text-center space-y-4">
            <p className="text-sm text-text-tertiary uppercase tracking-wider">Glitch Title</p>
            <GlitchText>NJ STARS</GlitchText>
          </div>
        </div>
      </section>

      {/* Card Variants */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
          Card Glow Intensities
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Subtle Glow */}
          <NeonCard glow="subtle" className="p-6">
            <NeonCardHeader className="p-0 pb-4">
              <div className="w-12 h-12 rounded-lg bg-bg-tertiary flex items-center justify-center mb-3">
                <Calendar className="w-6 h-6 text-text-secondary" />
              </div>
              <NeonCardTitle>Subtle Glow</NeonCardTitle>
              <NeonCardDescription>
                15% opacity - barely visible but adds depth on hover.
              </NeonCardDescription>
            </NeonCardHeader>
          </NeonCard>

          {/* Medium Glow (Default) */}
          <NeonCard glow="medium" className="p-6">
            <NeonCardHeader className="p-0 pb-4">
              <div className="w-12 h-12 rounded-lg bg-bg-tertiary flex items-center justify-center mb-3">
                <Trophy className="w-6 h-6 text-text-secondary" />
              </div>
              <NeonCardTitle>Medium Glow</NeonCardTitle>
              <NeonCardDescription>
                25% opacity - noticeable neon effect, good for most cards.
              </NeonCardDescription>
            </NeonCardHeader>
          </NeonCard>

          {/* Intense Glow */}
          <NeonCard glow="intense" className="p-6">
            <NeonCardHeader className="p-0 pb-4">
              <div className="w-12 h-12 rounded-lg bg-bg-tertiary flex items-center justify-center mb-3">
                <Zap className="w-6 h-6 text-text-secondary" />
              </div>
              <NeonCardTitle>Intense Glow</NeonCardTitle>
              <NeonCardDescription>
                35% with multiple layers - premium feel, use sparingly.
              </NeonCardDescription>
            </NeonCardHeader>
          </NeonCard>

          {/* Dual Color Glow */}
          <NeonCard glow="dual" className="p-6">
            <NeonCardHeader className="p-0 pb-4">
              <div className="w-12 h-12 rounded-lg bg-bg-tertiary flex items-center justify-center mb-3">
                <Star className="w-6 h-6 text-text-secondary" />
              </div>
              <NeonCardTitle chromatic>Dual Glow</NeonCardTitle>
              <NeonCardDescription>
                Cyan left, pink right - creates dimensional depth.
              </NeonCardDescription>
            </NeonCardHeader>
          </NeonCard>
        </div>

        {/* Border Variants */}
        <h3 className="text-xl font-semibold text-foreground mt-16 mb-6 text-center">
          Border Styles
        </h3>

        <div className="grid md:grid-cols-3 gap-6">
          <NeonCard border="default" glow="medium" className="p-6">
            <NeonCardTitle>Default Border</NeonCardTitle>
            <NeonCardDescription className="mt-2">
              Subtle white border that brightens on hover.
            </NeonCardDescription>
          </NeonCard>

          <NeonCard border="gradient" glow="medium" className="p-6">
            <NeonCardTitle>Gradient Border</NeonCardTitle>
            <NeonCardDescription className="mt-2">
              Static cyan-to-pink gradient border.
            </NeonCardDescription>
          </NeonCard>

          <NeonCard border="animated" glow="medium" className="p-6">
            <NeonCardTitle>Animated Border</NeonCardTitle>
            <NeonCardDescription className="mt-2">
              Flowing gradient animation - high impact.
            </NeonCardDescription>
          </NeonCard>
        </div>
      </section>

      {/* Feature Cards - Real World Example */}
      <section className="relative py-16 overflow-hidden">
        {/* Background treatment */}
        <div className="absolute inset-0 bg-gradient-to-b from-bg-primary via-bg-secondary/50 to-bg-primary" />
        <div className="absolute inset-0 court-grid-overlay opacity-20" />

        <div className="relative z-10 container mx-auto px-4">
          <div className="text-center mb-12">
            <ChromaticText as="h2" intensity="medium" size="lg" className="mb-4">
              REAL-WORLD EXAMPLE
            </ChromaticText>
            <p className="text-text-secondary">
              How these cards would look in the actual NJ Stars interface
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Tryouts Card */}
            <NeonCard
              glow="intense"
              color="cyan"
              border="gradient"
              href="/events"
              className="p-0 overflow-hidden"
            >
              <div className="aspect-[4/3] bg-gradient-to-br from-bg-tertiary to-bg-secondary flex items-center justify-center">
                <Users className="w-16 h-16 text-[hsl(var(--neon-cyan))]" />
              </div>
              <NeonCardContent className="p-6">
                <NeonBadge variant="cyan" className="mb-3">TRYOUTS</NeonBadge>
                <NeonCardTitle>Spring 2025 Tryouts</NeonCardTitle>
                <NeonCardDescription className="mt-2">
                  Join the elite. Show us what you got.
                </NeonCardDescription>
              </NeonCardContent>
              <NeonCardFooter glowBorder className="p-6 pt-4">
                <span className="text-sm text-text-tertiary">March 15, 2025</span>
              </NeonCardFooter>
            </NeonCard>

            {/* Merch Card */}
            <NeonCard
              glow="intense"
              border="animated"
              href="/shop"
              className="p-0 overflow-hidden"
            >
              <div className="aspect-[4/3] bg-gradient-to-br from-bg-tertiary to-bg-secondary flex items-center justify-center">
                <ShoppingBag className="w-16 h-16 text-[hsl(var(--neon-pink))]" />
              </div>
              <NeonCardContent className="p-6">
                <NeonBadge variant="pink" className="mb-3">NEW DROP</NeonBadge>
                <NeonCardTitle chromatic>Limited Edition Hoodie</NeonCardTitle>
                <NeonCardDescription className="mt-2">
                  Rep the squad. Limited to 50 pieces.
                </NeonCardDescription>
              </NeonCardContent>
              <NeonCardFooter glowBorder className="p-6 pt-4">
                <span className="text-lg font-bold text-primary">$85</span>
              </NeonCardFooter>
            </NeonCard>

            {/* Tournament Card */}
            <NeonCard
              glow="dual"
              border="gradient"
              href="/events"
              className="p-0 overflow-hidden"
            >
              <div className="aspect-[4/3] bg-gradient-to-br from-bg-tertiary to-bg-secondary flex items-center justify-center">
                <Trophy className="w-16 h-16 text-[hsl(var(--neon-purple))]" />
              </div>
              <NeonCardContent className="p-6">
                <NeonBadge variant="purple" className="mb-3">TOURNAMENT</NeonBadge>
                <NeonCardTitle>Garden State Classic</NeonCardTitle>
                <NeonCardDescription className="mt-2">
                  Championship weekend. Eyes on the prize.
                </NeonCardDescription>
              </NeonCardContent>
              <NeonCardFooter glowBorder className="p-6 pt-4">
                <span className="text-sm text-text-tertiary">April 20-22, 2025</span>
              </NeonCardFooter>
            </NeonCard>
          </div>
        </div>
      </section>

      {/* ============================================================
          BUTTON PROPOSALS
          High contrast, mobile-first button variants
          ============================================================ */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <ChromaticText as="h2" intensity="medium" size="lg" className="mb-4">
            BUTTON PROPOSALS
          </ChromaticText>
          <p className="text-text-secondary max-w-2xl mx-auto">
            High-contrast, mobile-friendly buttons with clear tap targets (min 44px).
            All buttons maintain WCAG AA contrast ratios.
          </p>
        </div>

        {/* Primary Actions */}
        <div className="mb-12">
          <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-primary" />
            Primary Actions
          </h3>
          <div className="flex flex-wrap gap-4">
            <Button size="lg" className="min-h-[48px] min-w-[140px]">
              Add to Bag
            </Button>
            <Button size="lg" className="min-h-[48px] min-w-[140px] neon-glow-pink">
              Register Now
            </Button>
            <Button
              size="lg"
              className="min-h-[48px] min-w-[140px] bg-primary hover:bg-primary/90 shadow-[0_4px_20px_hsl(var(--neon-pink)/0.4)] hover:shadow-[0_6px_30px_hsl(var(--neon-pink)/0.5)] transition-all"
            >
              Neon Glow
            </Button>
          </div>
        </div>

        {/* Secondary Actions */}
        <div className="mb-12">
          <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-white/60" />
            Secondary Actions
          </h3>
          <div className="flex flex-wrap gap-4">
            <Button variant="outline" size="lg" className="min-h-[48px] min-w-[140px]">
              Learn More
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="min-h-[48px] min-w-[140px] border-white/30 hover:border-white/60 hover:bg-white/5"
            >
              Ghost Outline
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="min-h-[48px] min-w-[140px] hover:bg-white/10"
            >
              Ghost Button
            </Button>
          </div>
        </div>

        {/* CTA / Hero Buttons */}
        <div className="mb-12">
          <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gradient-to-r from-[hsl(var(--neon-cyan))] to-[hsl(var(--neon-pink))]" />
            Hero CTAs (High Impact)
          </h3>
          <div className="flex flex-wrap gap-4">
            <Button variant="cta" size="lg" className="min-h-[52px] px-8 text-base">
              Get in the Game →
            </Button>
            <button className="min-h-[52px] px-8 text-base font-bold rounded-md bg-gradient-to-r from-[hsl(var(--neon-pink))] to-[hsl(var(--neon-purple))] text-white shadow-[0_4px_20px_hsl(var(--neon-pink)/0.4)] hover:shadow-[0_6px_30px_hsl(var(--neon-pink)/0.5)] hover:scale-[1.02] transition-all">
              Gradient CTA →
            </button>
            <button className="min-h-[52px] px-8 text-base font-bold rounded-md neon-border-animated bg-bg-secondary text-foreground hover:bg-bg-tertiary transition-all">
              Animated Border
            </button>
          </div>
        </div>

        {/* Semantic Status */}
        <div className="mb-12">
          <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-success" />
            Status & Semantic
          </h3>
          <div className="flex flex-wrap gap-4">
            <Button variant="success" size="lg" className="min-h-[48px]">
              Confirm
            </Button>
            <Button variant="destructive" size="lg" className="min-h-[48px]">
              Delete
            </Button>
            <Button variant="accent" size="lg" className="min-h-[48px]">
              Urgent Action
            </Button>
          </div>
        </div>

        {/* Size Comparison */}
        <div className="bg-bg-secondary/50 border border-white/10 rounded-xl p-6">
          <h4 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-4">
            Size Comparison (Mobile Touch Targets)
          </h4>
          <div className="flex flex-wrap items-end gap-4">
            <div className="text-center">
              <Button size="sm">Small</Button>
              <p className="text-xs text-text-tertiary mt-2">36px</p>
            </div>
            <div className="text-center">
              <Button size="default">Default</Button>
              <p className="text-xs text-text-tertiary mt-2">40px</p>
            </div>
            <div className="text-center">
              <Button size="lg">Large</Button>
              <p className="text-xs text-text-tertiary mt-2">44px</p>
            </div>
            <div className="text-center">
              <Button size="lg" className="min-h-[52px] px-8">XL CTA</Button>
              <p className="text-xs text-text-tertiary mt-2">52px ✓</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          BADGE PROPOSALS
          Readable status and category indicators
          ============================================================ */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <ChromaticText as="h2" intensity="medium" size="lg" className="mb-4">
            BADGE PROPOSALS
          </ChromaticText>
          <p className="text-text-secondary max-w-2xl mx-auto">
            High-contrast badges for categories, status, and labels.
            All use foreground text on muted backgrounds for readability.
          </p>
        </div>

        {/* Event Category Badges */}
        <div className="mb-12">
          <h3 className="text-lg font-semibold text-foreground mb-6">Event Categories</h3>
          <div className="flex flex-wrap gap-3">
            <span className="badge-tryout px-3 py-1.5 rounded-md text-sm font-medium">Tryouts</span>
            <span className="badge-tournament px-3 py-1.5 rounded-md text-sm font-medium">Tournament</span>
            <span className="badge-game px-3 py-1.5 rounded-md text-sm font-medium">Game</span>
            <span className="badge-practice px-3 py-1.5 rounded-md text-sm font-medium">Practice</span>
            <span className="badge-open-gym px-3 py-1.5 rounded-md text-sm font-medium">Open Gym</span>
            <span className="badge-camp px-3 py-1.5 rounded-md text-sm font-medium">Camp</span>
          </div>
        </div>

        {/* Neon Badges */}
        <div className="mb-12">
          <h3 className="text-lg font-semibold text-foreground mb-6">Neon Style (High Impact)</h3>
          <div className="flex flex-wrap gap-3">
            <NeonBadge variant="pink">NEW DROP</NeonBadge>
            <NeonBadge variant="cyan">FEATURED</NeonBadge>
            <NeonBadge variant="purple">LIMITED</NeonBadge>
            <span className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-bold bg-gradient-to-r from-[hsl(var(--neon-pink)/0.2)] to-[hsl(var(--neon-purple)/0.2)] border border-[hsl(var(--neon-pink)/0.5)] text-foreground shadow-[0_0_12px_hsl(var(--neon-pink)/0.3)]">
              GRADIENT
            </span>
          </div>
        </div>

        {/* Status Badges */}
        <div className="mb-12">
          <h3 className="text-lg font-semibold text-foreground mb-6">Status Indicators</h3>
          <div className="flex flex-wrap gap-3">
            <span className="badge-success px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Active
            </span>
            <span className="badge-warning px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-warning" />
              Pending
            </span>
            <span className="badge-error px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-accent" />
              Expired
            </span>
            <span className="badge-info px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-info" />
              Info
            </span>
            <span className="badge-muted px-3 py-1.5 rounded-md text-sm font-medium">
              Archived
            </span>
          </div>
        </div>

        {/* Pill Badges */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-6">Pill Style (Softer)</h3>
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-primary/20 text-foreground border border-primary/30">
              2nd Grade
            </span>
            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-primary/20 text-foreground border border-primary/30">
              5th Grade
            </span>
            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-primary/20 text-foreground border border-primary/30">
              8th Grade
            </span>
            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-white/10 text-foreground border border-white/20">
              All Ages
            </span>
          </div>
        </div>
      </section>

      {/* ============================================================
          COMMON COMPONENTS
          Form inputs, toggles, cards
          ============================================================ */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <ChromaticText as="h2" intensity="medium" size="lg" className="mb-4">
            COMMON COMPONENTS
          </ChromaticText>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Form elements, inputs, and interactive components optimized for mobile and accessibility.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Fields */}
          <div className="bg-bg-secondary/50 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">Input Fields</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Default Input</label>
                <input
                  type="text"
                  placeholder="Enter your email"
                  className="w-full h-12 px-4 rounded-lg bg-bg-tertiary border border-white/10 text-foreground placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Neon Focus</label>
                <input
                  type="text"
                  placeholder="Neon glow on focus"
                  className="w-full h-12 px-4 rounded-lg bg-bg-tertiary border border-white/10 text-foreground placeholder:text-text-tertiary focus:outline-none focus:border-[hsl(var(--neon-pink))] focus:shadow-[0_0_0_3px_hsl(var(--neon-pink)/0.2),0_0_20px_hsl(var(--neon-pink)/0.15)] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">With Icon</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search events..."
                    className="w-full h-12 pl-12 pr-4 rounded-lg bg-bg-tertiary border border-white/10 text-foreground placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                </div>
              </div>
            </div>
          </div>

          {/* Toggle / Checkbox */}
          <div className="bg-bg-secondary/50 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">Toggles & Checkboxes</h3>
            <div className="space-y-6">
              {/* Toggle Switch */}
              <div className="flex items-center justify-between">
                <span className="text-foreground">Email Notifications</span>
                <button className="relative w-14 h-8 rounded-full bg-primary p-1 transition-colors">
                  <span className="block w-6 h-6 rounded-full bg-white shadow-md transform translate-x-6 transition-transform" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground">Dark Mode (forced)</span>
                <button className="relative w-14 h-8 rounded-full bg-bg-tertiary border border-white/20 p-1 transition-colors cursor-not-allowed opacity-50">
                  <span className="block w-6 h-6 rounded-full bg-white/80 shadow-md transform translate-x-0 transition-transform" />
                </button>
              </div>
              {/* Checkbox */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-foreground">I agree to the terms and waiver agreement</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded border-2 border-white/30 bg-transparent flex-shrink-0 mt-0.5" />
                <span className="text-text-secondary">Send me promotional emails</span>
              </div>
            </div>
          </div>

          {/* Select / Dropdown */}
          <div className="bg-bg-secondary/50 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">Select / Dropdown</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Grade Level</label>
                <select className="w-full h-12 px-4 rounded-lg bg-bg-tertiary border border-white/10 text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer">
                  <option>Select grade...</option>
                  <option>2nd Grade</option>
                  <option>3rd Grade</option>
                  <option>4th Grade</option>
                  <option>5th Grade</option>
                </select>
              </div>
            </div>
          </div>

          {/* Progress / Loading */}
          <div className="bg-bg-secondary/50 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">Progress & Loading</h3>
            <div className="space-y-6">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-text-secondary">Registration Progress</span>
                  <span className="text-primary font-medium">75%</span>
                </div>
                <div className="h-3 bg-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-[hsl(var(--neon-pink))] rounded-full shadow-[0_0_10px_hsl(var(--neon-pink)/0.5)]"
                    style={{ width: "75%" }}
                  />
                </div>
              </div>
              {/* Loading Spinner */}
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span className="text-text-secondary">Loading...</span>
              </div>
              {/* Skeleton */}
              <div className="space-y-3">
                <div className="h-4 bg-bg-tertiary rounded animate-pulse w-3/4" />
                <div className="h-4 bg-bg-tertiary rounded animate-pulse w-1/2" />
              </div>
            </div>
          </div>
        </div>

        {/* Alert / Notification Examples */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-foreground mb-6">Alerts & Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-success/10 border border-success/30">
              <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-foreground">Registration Complete!</p>
                <p className="text-sm text-text-secondary mt-1">You're all set for Spring Tryouts. Check your email for confirmation.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg bg-warning/10 border border-warning/30">
              <div className="w-6 h-6 rounded-full bg-warning flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-black">!</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Payment Pending</p>
                <p className="text-sm text-text-secondary mt-1">Complete your payment to secure your spot.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg bg-[hsl(var(--neon-pink)/0.1)] border border-[hsl(var(--neon-pink)/0.3)] shadow-[0_0_20px_hsl(var(--neon-pink)/0.1)]">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <Star className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-medium text-foreground">New Merch Drop!</p>
                <p className="text-sm text-text-secondary mt-1">Limited edition hoodies just dropped. Get yours before they're gone.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CSS Utilities Reference */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
          CSS Utility Classes
        </h2>

        <div className="max-w-4xl mx-auto bg-bg-secondary/50 border border-white/10 rounded-xl p-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Glow Effects</h3>
              <ul className="space-y-2 text-sm text-text-secondary font-mono">
                <li><code className="text-primary">.neon-glow-pink</code></li>
                <li><code className="text-primary">.neon-glow-pink-intense</code></li>
                <li><code className="text-primary">.neon-glow-cyan</code></li>
                <li><code className="text-primary">.neon-glow-cyan-intense</code></li>
                <li><code className="text-primary">.neon-glow-dual</code></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Text Effects</h3>
              <ul className="space-y-2 text-sm text-text-secondary font-mono">
                <li><code className="text-secondary">.chromatic-text</code> (animated)</li>
                <li><code className="text-secondary">.chromatic-text-static</code></li>
                <li><code className="text-secondary">.chromatic-subtle</code></li>
                <li><code className="text-secondary">.chromatic-extreme</code></li>
                <li><code className="text-secondary">.neon-text-pink</code></li>
                <li><code className="text-secondary">.neon-text-cyan</code></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Borders</h3>
              <ul className="space-y-2 text-sm text-text-secondary font-mono">
                <li><code className="text-accent">.neon-border-gradient</code></li>
                <li><code className="text-accent">.neon-border-animated</code></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Animations</h3>
              <ul className="space-y-2 text-sm text-text-secondary font-mono">
                <li><code className="text-warning">.animate-neon-pulse</code></li>
                <li><code className="text-warning">.animate-neon-pulse-cyan</code></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/10">
            <h3 className="text-lg font-semibold text-foreground mb-4">CSS Variables</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm font-mono">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[hsl(331.7,95%,60%)]" />
                <code className="text-text-secondary">--neon-pink</code>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[hsl(188.7,100%,55%)]" />
                <code className="text-text-secondary">--neon-cyan</code>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[hsl(270,100%,65%)]" />
                <code className="text-text-secondary">--neon-purple</code>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/">
            <Button variant="outline" className="gap-2">
              ← Back to Home
            </Button>
          </Link>
          <Link href="/gradient-grid-demo">
            <Button variant="outline" className="gap-2">
              View Haiku Demo →
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
