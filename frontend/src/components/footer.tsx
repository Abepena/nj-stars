import Image from "next/image"

export function Footer() {
  return (
    <footer className="bg-muted py-8 border-t border-border">
      <div className="container mx-auto px-4 text-center space-y-2">
        <p className="text-muted-foreground">
          © {new Date().getFullYear()} NJ Stars Elite Basketball. All rights reserved.
        </p>
        <p className="text-muted-foreground/60 text-sm flex items-center justify-center gap-1.5">
          Powered by{" "}
          <a
            href="https://leag.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center hover:opacity-80 transition-opacity"
          >
            <Image
              src="/brand/logos/leag-logo.svg"
              alt="LEAG"
              width={48}
              height={48}
              className="h-20 w-auto"
              style={{
                filter: "brightness(0) saturate(100%) invert(85%) sepia(18%) saturate(747%) hue-rotate(88deg) brightness(101%) contrast(87%)"
              }}
            />
          </a>
        </p>
      </div>
    </footer>
  )
}
