import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="bg-card border-b border-border py-16 md:py-20 min-h-[50vh] flex items-center">
      <div className="max-w-6xl mx-auto px-4">
        <div className="max-w-6xl mx-auto md:mx-6 text-left">
          <h1 className="text-5xl pb-2 sm:text-8xl font-black tracking-tight leading-none bg-gradient-to-br from-foreground to-accent bg-clip-text text-transparent">
            <span className="block">Elite Training.</span>
            <span className="block text-4xl sm:text-6xl mt-1">
              Built for Rising Stars.
            </span>
          </h1>

          <p className="mt-2 text-base sm:text-xl text-muted-foreground leading-relaxed max-w-xl md:mx-0">
            Focused training and real competition for players serious about
            their game.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row sm:justify-center md:justify-start gap-3 sm:gap-4">
            <Link href="/events">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-br from-foreground/40 to-accent text-background font-bold hover:text-foreground hover:scale-105 transition-transform px-8"
              >
                Register for Tryouts →
              </Button>
            </Link>
            <Link href="/events/tryouts">
              <Button
                size="lg"
                variant="outline"
                className="text-foreground w-full sm:w-auto border-border hover:bg-muted hover:text-accent  hover:scale-105 transition-all px-8"
              >
                View Schedule
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
