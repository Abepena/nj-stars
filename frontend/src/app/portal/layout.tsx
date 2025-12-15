import { LayoutShell } from "@/components/layout-shell"

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <LayoutShell>
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </LayoutShell>
  )
}
