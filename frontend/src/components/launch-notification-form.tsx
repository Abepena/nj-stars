"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, User, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface LaunchNotificationFormProps {
  className?: string;
}

export function LaunchNotificationForm({
  className,
}: LaunchNotificationFormProps) {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

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
        body: JSON.stringify({
          email,
          first_name: firstName,
          source: "launch-notification",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        // Handle DRF field-level errors (email: ["error message"])
        const emailError = data.email?.[0];
        throw new Error(emailError || data.error || "Subscription failed");
      }

      setStatus("success");
      setFirstName("");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong"
      );
    }
  };

  // Clear error when user starts typing
  const handleInputChange =
    (setter: (value: string) => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
      if (status === "error") {
        setStatus("idle");
        setErrorMessage("");
      }
    };

  if (status === "success") {
    return (
      <div className={cn("w-full max-w-md mx-auto", className)}>
        <div className="bg-success/10 border border-success/20 rounded-lg p-6 text-center">
          <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-success mb-2">
            You&apos;re on the list!
          </h3>
          <p className="text-muted-foreground text-sm">
            We&apos;ll reach out when the site goes live. Get ready for the 2026
            season!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      <div className="text-center mb-3 md:mb-4">
        <h2 className="text-lg md:text-xl font-bold mb-1">Get Notified When We Launch</h2>
        <p className="text-muted-foreground text-xs md:text-sm">
          Be the first to know about tryouts, camps, and the 2026 season
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2.5 md:space-y-3">
        {/* First Name Field */}
        <div className="space-y-2">
          <Label htmlFor="first-name" className="sr-only">
            First Name
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="first-name"
              type="text"
              placeholder="First name"
              value={firstName}
              onChange={handleInputChange(setFirstName)}
              className="pl-10"
              disabled={status === "loading"}
            />
          </div>
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="launch-email" className="sr-only">
            Email Address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="launch-email"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={handleInputChange(setEmail)}
              required
              className={cn("pl-10", status === "error" && "border-destructive")}
              disabled={status === "loading"}
              aria-describedby={
                status === "error" ? "launch-error" : undefined
              }
              aria-invalid={status === "error"}
            />
          </div>
        </div>

        {/* Error Message */}
        {status === "error" && (
          <div
            id="launch-error"
            className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-lg p-3"
          >
            <XCircle className="h-5 w-5 text-destructive shrink-0" />
            <p className="text-destructive text-sm">
              {errorMessage || "Please enter a valid email address"}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="cta"
          size="lg"
          disabled={status === "loading"}
          className="w-full"
        >
          {status === "loading" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing up...
            </>
          ) : (
            "Notify Me"
          )}
        </Button>
      </form>
    </div>
  );
}
