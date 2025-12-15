"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface NewsletterSignupProps {
  heading?: string;
  subheading?: string;
  show?: boolean;
  source?: string;
  /**
   * "section" - Full section with padding and background (default, for homepage)
   * "inline" - Just the form content, no wrapper (for embedding in other pages)
   */
  variant?: "section" | "inline";
  className?: string;
}

export function NewsletterSignup({
  heading = "Stay in the Game",
  subheading = "Get the latest news, event updates, and exclusive content delivered to your inbox.",
  show = true,
  source = "website",
  variant = "section",
  className,
}: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  if (!show) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch(`${API_BASE}/api/newsletter/subscribe/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, source }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.email?.[0] || data.error || "Subscription failed");
      }

      setStatus("success");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  // Clear error when user starts typing
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (status === "error") {
      setStatus("idle");
      setErrorMessage("");
    }
  };

  const formContent = (
    <>
      <h2 className={cn(
        "font-bold mb-2",
        variant === "section" ? "text-3xl" : "text-xl"
      )}>
        {heading}
      </h2>
      <p className={cn(
        "text-muted-foreground",
        variant === "section" ? "mb-8" : "mb-4 text-sm"
      )}>
        {subheading}
      </p>

      {status === "success" ? (
        <div className="bg-success/10 text-success rounded-lg p-4 flex items-center justify-center gap-2">
          <CheckCircle className="h-5 w-5" />
          <span>Thanks for subscribing! We&apos;ll keep you updated.</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <div className="flex-1 relative">
            <label htmlFor="newsletter-email" className="sr-only">
              Email Address
            </label>
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            <Input
              id="newsletter-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={handleEmailChange}
              required
              className={cn(
                "w-full pl-12",
                variant === "section" ? "h-12 text-base" : "h-10"
              )}
              disabled={status === "loading"}
              aria-describedby={status === "error" ? "newsletter-error" : undefined}
              aria-invalid={status === "error"}
            />
            {status === "error" && (
              <p id="newsletter-error" className="text-destructive text-sm mt-1.5 text-left">
                {errorMessage || "Please enter a valid email address"}
              </p>
            )}
          </div>
          <Button
            type="submit"
            variant="cta"
            disabled={status === "loading"}
            className={cn(
              "shrink-0",
              variant === "section" ? "h-12 px-8 text-base" : "h-10 px-6"
            )}
          >
            {status === "loading" ? "Subscribing..." : "Subscribe"}
          </Button>
        </form>
      )}
    </>
  );

  if (variant === "inline") {
    return (
      <div className={cn("text-center", className)}>
        {formContent}
      </div>
    );
  }

  return (
    <section className={cn("py-16 bg-card border-t border-border", className)}>
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          {formContent}
        </div>
      </div>
    </section>
  );
}
