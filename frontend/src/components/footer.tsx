export function Footer() {
  return (
    <footer className="bg-muted py-8 border-t border-border">
      <div className="container mx-auto px-4 text-center">
        <p className="text-muted-foreground">
          © {new Date().getFullYear()} NJ Stars Elite Basketball. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
