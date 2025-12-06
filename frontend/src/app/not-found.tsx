import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LayoutShell } from "@/components/layout-shell"

export default function NotFound() {
  return (
    <LayoutShell>
      <section className="py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-8xl font-bold text-primary mb-4">404</h1>
          <h2 className="text-3xl font-semibold mb-4">Page Not Found</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link href="/">
            <Button variant="cta" size="lg">
              Return Home
            </Button>
          </Link>
        </div>
      </section>
    </LayoutShell>
  )
}
