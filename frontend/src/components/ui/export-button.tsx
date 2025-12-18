"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { FileDown, FileSpreadsheet, FileText, Loader2 } from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface Column {
  key: string
  label: string
}

interface ExportButtonProps {
  /**
   * Data to export - array of objects
   */
  data: Record<string, any>[]
  /**
   * Column definitions for export headers
   */
  columns: Column[]
  /**
   * Base filename (without extension)
   */
  filename: string
  /**
   * Sheet name for Google Sheets export
   */
  sheetName?: string
  /**
   * Button variant
   */
  variant?: "default" | "outline" | "ghost"
  /**
   * Optional className
   */
  className?: string
}

export function ExportButton({
  data,
  columns,
  filename,
  sheetName,
  variant = "outline",
  className,
}: ExportButtonProps) {
  const { data: session } = useSession()
  const [exporting, setExporting] = useState<"csv" | "sheets" | "pdf" | null>(null)

  /**
   * Export data as CSV file (client-side)
   */
  const exportCSV = () => {
    setExporting("csv")

    try {
      // Build CSV headers
      const headers = columns.map((col) => col.label)

      // Build CSV rows
      const rows = data.map((row) =>
        columns.map((col) => {
          const value = row[col.key]
          // Handle special cases
          if (value === null || value === undefined) return ""
          if (typeof value === "number") return value.toString()
          if (typeof value === "boolean") return value ? "Yes" : "No"
          // Escape quotes and wrap in quotes if contains comma or newline
          const stringValue = String(value)
          if (stringValue.includes(",") || stringValue.includes("\n") || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`
          }
          return stringValue
        })
      )

      // Combine into CSV string
      const csvContent = [
        headers.map((h) => `"${h}"`).join(","),
        ...rows.map((row) => row.join(",")),
      ].join("\n")

      // Create download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `${filename}_${formatDate(new Date())}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } finally {
      setExporting(null)
    }
  }

  /**
   * Export data to Google Sheets (via backend API)
   */
  const exportGoogleSheets = async () => {
    setExporting("sheets")

    try {
      const apiToken = (session as any)?.apiToken

      const response = await fetch(`${API_BASE}/api/export/google-sheets/`, {
        method: "POST",
        headers: {
          Authorization: apiToken ? `Token ${apiToken}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data,
          columns,
          sheet_name: sheetName || filename,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to export to Google Sheets")
      }

      const result = await response.json()

      // Open the Google Sheet in a new tab
      if (result.sheet_url) {
        window.open(result.sheet_url, "_blank")
      }
    } catch (error) {
      console.error("Google Sheets export failed:", error)
      // Fallback to CSV
      alert("Google Sheets export is not configured. Downloading CSV instead.")
      exportCSV()
    } finally {
      setExporting(null)
    }
  }

  /**
   * Export data as PDF (via backend API or client-side)
   */
  const exportPDF = async () => {
    setExporting("pdf")

    try {
      // For now, create a printable HTML view
      const printWindow = window.open("", "_blank")
      if (!printWindow) {
        alert("Please allow popups to export PDF")
        return
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${filename}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 20px;
              max-width: 100%;
            }
            h1 {
              font-size: 18px;
              margin-bottom: 10px;
            }
            .date {
              color: #666;
              font-size: 12px;
              margin-bottom: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 6px 8px;
              text-align: left;
            }
            th {
              background: #f5f5f5;
              font-weight: 600;
            }
            tr:nth-child(even) {
              background: #fafafa;
            }
            @media print {
              body { padding: 0; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <h1>${sheetName || filename}</h1>
          <div class="date">Exported: ${new Date().toLocaleString()}</div>
          <table>
            <thead>
              <tr>
                ${columns.map((col) => `<th>${escapeHtml(col.label)}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${data
                .map(
                  (row) => `
                <tr>
                  ${columns
                    .map((col) => {
                      const value = row[col.key]
                      return `<td>${escapeHtml(formatValue(value))}</td>`
                    })
                    .join("")}
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
        </html>
      `

      printWindow.document.write(html)
      printWindow.document.close()
    } finally {
      setExporting(null)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} className={className} disabled={data.length === 0}>
          {exporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4 mr-2" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportCSV} disabled={exporting !== null}>
          <FileText className="h-4 w-4 mr-2" />
          Download CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportGoogleSheets} disabled={exporting !== null}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export to Google Sheets
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportPDF} disabled={exporting !== null}>
          <FileText className="h-4 w-4 mr-2" />
          Print / Save as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Utility functions
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return ""
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (typeof value === "number") return value.toLocaleString()
  return String(value)
}

function escapeHtml(text: string): string {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}
