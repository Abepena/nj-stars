interface PageHeaderProps {
  title: string
  subtitle: string
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <section className="bg-card border-b border-border py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="max-w-2xl mx-auto md:mx-0 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl">
            {subtitle}
          </p>
        </div>
      </div>
    </section>
  )
}
