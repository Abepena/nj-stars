import { PageHeader } from "@/components/page-header"
import { LayoutShell } from "@/components/layout-shell"
import { CoachesSection } from "@/components/coaches-section"
import { Breadcrumbs } from "@/components/breadcrumbs"

export default function AboutPage() {
  return (
    <LayoutShell>
      <PageHeader
        title="About NJ Stars Elite"
        subtitle="Building elite basketball players and young leaders in New Jersey."
      />

      <section className="py-8">
        <div className="container mx-auto px-4">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "About" },
            ]}
          />
        </div>
      </section>

      {/* Meet Our Coaches */}
      <CoachesSection />
    </LayoutShell>
  )
}
