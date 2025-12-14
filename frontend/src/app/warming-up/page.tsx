"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { LaunchNotificationForm } from "@/components/launch-notification-form";

export default function UnderConstructionPage() {
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setMounted(true);

    // Calculate days until 2026
    const now = new Date();
    const newYear2026 = new Date("2026-01-01T00:00:00");
    const startOf2025 = new Date("2025-01-01T00:00:00");

    const totalDays =
      (newYear2026.getTime() - startOf2025.getTime()) / (1000 * 60 * 60 * 24);
    const daysPassed =
      (now.getTime() - startOf2025.getTime()) / (1000 * 60 * 60 * 24);

    setProgress(Math.min((daysPassed / totalDays) * 100, 100));
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, hsl(var(--primary)) 0%, transparent 50%),
                              radial-gradient(circle at 75% 75%, hsl(var(--secondary)) 0%, transparent 50%)`,
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-4 text-center">
        {/* Basketball & Hoop Animation - Responsive scaling */}
        <div className="relative w-[420px] h-[336px] sm:w-[512px] sm:h-[410px] md:w-[640px] md:h-[512px] mt-12 sm:mt-0">
          {/* Backboard - z-10 */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[252px] h-[169px] sm:w-[307px] sm:h-[205px] md:w-[410px] md:h-[256px] bg-card border-2 sm:border-4 border-border rounded-lg shadow-lg z-10">
            {/* Logo inset in backboard square */}
            <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 w-24 h-21 sm:w-32 sm:h-28 md:w-44 md:h-36 border sm:border-2 border-primary rounded overflow-hidden flex items-center justify-center bg-[#1a1614]">
              <Image
                src="/brand/logos/logo square thin.svg"
                alt="NJ Stars Elite"
                width={160}
                height={140}
                className="w-full h-full object-contain"
                priority
              />
            </div>
          </div>

          {/* Animated Basketball - z-index changes during animation */}
          <div className="absolute animate-shoot">
            <svg
              viewBox="0 0 50 50"
              className="w-[83px] h-[83px] sm:w-[100px] sm:h-[100px] md:w-[140px] md:h-[140px] drop-shadow-lg"
            >
              <circle cx="25" cy="25" r="23" fill="hsl(var(--primary))" />
              {/* Basketball lines */}
              <path
                d="M25 2 Q25 25 25 48 M2 25 Q25 25 48 25"
                stroke="hsl(var(--primary-foreground))"
                strokeWidth="2"
                fill="none"
                opacity="0.4"
              />
              <path
                d="M8 8 Q25 25 42 42 M42 8 Q25 25 8 42"
                stroke="hsl(var(--primary-foreground))"
                strokeWidth="1.5"
                fill="none"
                opacity="0.3"
              />
            </svg>
          </div>

          {/* Rim - z-20 (in front of ball when dropping) */}
          <div className="absolute top-[160px] sm:top-[192px] md:top-[243px] left-1/2 -translate-x-1/2 z-20">
            <div className="w-[106px] h-[17px] sm:w-32 sm:h-5 md:w-44 md:h-6 bg-primary rounded-full shadow-md" />
            {/* Net */}
            <svg
              viewBox="0 0 80 60"
              className="w-[106px] h-[78px] sm:w-32 sm:h-24 md:w-44 md:h-32 -mt-0.5 sm:-mt-1 animate-net"
            >
              <path
                d="M10 0 Q20 30 10 50 M25 0 Q30 25 25 50 M40 0 Q40 20 40 50 M55 0 Q50 25 55 50 M70 0 Q60 30 70 50"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth="2"
                fill="none"
                opacity="0.6"
              />
              <path
                d="M5 15 Q40 25 75 15 M5 30 Q40 40 75 30 M10 45 Q40 55 70 45"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth="1.5"
                fill="none"
                opacity="0.4"
              />
            </svg>
          </div>
        </div>

        {/* Text */}
        <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-br from-foreground to-primary bg-clip-text text-transparent animate-gradient bg-[length:200%_200%]">
          Pre-Game Warmups.
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-md">
          We're getting loose before the big reveal. The official 2026 season
          site is coming soon.
        </p>

        {/* Progress bar */}
        <div className="w-64 md:w-80 mb-8">
          <div className="text-sm text-muted-foreground mb-2">
            <span>Loading 2026 Season...</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-br from-foreground to-primary rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Email Capture Form */}
        <div className="w-full max-w-md mb-8">
          <LaunchNotificationForm />
        </div>

        {/* Contact links */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          {/* Instagram */}
          <a
            href="https://www.instagram.com/njstarselite_aau/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            <span className="text-sm">@njstarselite_aau</span>
          </a>

          {/* Phone */}
          <a
            href="tel:201-410-6957"
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            <span className="text-sm">201-410-6957</span>
          </a>

          {/* Email */}
          <a
            href="mailto:njstarsbasketball@gmail.com"
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm">njstarsbasketball@gmail.com</span>
          </a>
        </div>

        {/* Footer */}
        <p className="mt-12 text-sm text-muted-foreground/60">
          NJ Stars Elite &bull; Coming Soon 2026
        </p>
      </div>

      {/* Global styles for animations */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes shoot {
          0% { top: 75%; left: 10%; transform: scale(1) translateX(0); z-index: 30; }
          35% { top: 5%; left: 40%; transform: scale(0.9) translateX(0); z-index: 30; }
          45% { top: 12%; left: 50%; transform: scale(0.85) translateX(-50%); z-index: 30; }
          50% { top: 18%; left: 50%; transform: scale(0.85) translateX(-50%); z-index: 15; }
          60% { top: 38%; left: 50%; transform: scale(0.8) translateX(-50%); z-index: 15; opacity: 1; }
          75% { top: 55%; left: 50%; transform: scale(0.75) translateX(-50%); z-index: 15; opacity: 0.8; }
          90% { top: 72%; left: 50%; transform: scale(0.7) translateX(-50%); z-index: 15; opacity: 0.4; }
          100% { top: 85%; left: 50%; transform: scale(0.65) translateX(-50%); z-index: 15; opacity: 0; }
        }
        @keyframes netWobble {
          0%, 45% { transform: scaleX(1) scaleY(1); }
          50% { transform: scaleX(1.15) scaleY(0.9); }
          55% { transform: scaleX(0.9) scaleY(1.1); }
          60% { transform: scaleX(1.1) scaleY(0.95); }
          65% { transform: scaleX(0.95) scaleY(1.05); }
          70% { transform: scaleX(1.05) scaleY(0.98); }
          80% { transform: scaleX(0.98) scaleY(1.02); }
          90%, 100% { transform: scaleX(1) scaleY(1); }
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-shoot { animation: shoot 2.8s ease-in-out infinite; }
        .animate-net { animation: netWobble 2.8s ease-in-out infinite; transform-origin: top center; }
        .animate-gradient { animation: gradient 3s ease infinite; }
      `,
        }}
      />
    </div>
  );
}
