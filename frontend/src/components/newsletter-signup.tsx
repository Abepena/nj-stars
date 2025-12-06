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
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1"
                disabled={status === "loading"}
              />
              <Button
                type="submit"
                disabled={status === "loading"}
                className="bg-gradient-to-br from-foreground/40 to-primary text-background font-bold hover:text-foreground hover:scale-[1.02] transition-all duration-200 ease-in-out px-8"
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
