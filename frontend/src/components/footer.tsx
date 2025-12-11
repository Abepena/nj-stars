export function Footer() {
  return (
    <footer className="bg-muted py-8 border-t border-border">
      <div className="container mx-auto px-4 text-center space-y-2">
        <p className="text-muted-foreground">
          © {new Date().getFullYear()} NJ Stars Elite Basketball. All rights reserved.
        </p>
        <p className="text-muted-foreground/60 text-sm">
          Powered by{" "}
          <span className="font-medium text-muted-foreground/80">LEAG</span>
        </p>
      </div>
    </footer>
  )
}
