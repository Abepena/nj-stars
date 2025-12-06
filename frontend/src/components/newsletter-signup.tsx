"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface NewsletterSignupProps {
  heading?: string;
  subheading?: string;
  show?: boolean;
}

export function NewsletterSignup({
  heading = "Stay in the Game",
  subheading = "Get the latest news, event updates, and exclusive content delivered to your inbox.",
  show = true,
}: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  if (!show) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");

    // TODO: Implement actual newsletter signup API
    // For now, simulate a successful signup
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setStatus("success");
    setEmail("");
  };

  return (
    <section className="py-16 bg-card border-t border-border">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">{heading}</h2>
          <p className="text-muted-foreground mb-8">{subheading}</p>

          {status === "success" ? (
            <div className="bg-primary/10 text-primary rounded-md p-4">
              Thanks for subscribing! We&apos;ll keep you updated.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <div className="flex-1">
                <label htmlFor="newsletter-email" className="sr-only">
                  Email Address
                </label>
                <Input
                  id="newsletter-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                  disabled={status === "loading"}
                  aria-describedby={status === "error" ? "newsletter-error" : undefined}
                  aria-invalid={status === "error"}
                />
                {status === "error" && (
                  <p id="newsletter-error" className="text-destructive text-sm mt-1">
                    Please enter a valid email address
                  </p>
                )}
              </div>
              <Button
                type="submit"
                variant="cta"
                size="lg"
                disabled={status === "loading"}
              >
                {status === "loading" ? "Subscribing..." : "Subscribe"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
