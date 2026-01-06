/**
 * Color normalization utilities for product variants
 *
 * Handles:
 * - Missing/incorrect hex values from Printify
 * - Grouping similar colors (e.g., "Black" and "Pigment Black")
 * - Normalizing color names (trimming whitespace, consistent casing)
 */

// Correct hex values for colors with missing/incorrect values
const COLOR_HEX_OVERRIDES: Record<string, string> = {
  'charcoal grey': '#36454F',
  'dark chocolate': '#3D2314',
  'dark heather': '#4b5563',
  'athletic heather': '#9ca3af',
  'sport grey': '#9ca3af',
  // Military/earth tones
  'army': '#4b5320',
  'olive': '#556b2f',
  'military green': '#4b5320',
  'khaki': '#c3b091',
  // Additional colors
  'navy blazer': '#1e3a5f',
  'heather navy': '#2c3e50',
}

// Group similar colors together (maps variant name → display name)
const COLOR_GROUPS: Record<string, string> = {
  'pigment black': 'Black',
  'pigment maroon': 'Maroon',
  // Add more mappings as needed
}

export interface NormalizedColor {
  name: string
  hex: string
  originalName: string
}

/**
 * Normalize a color name and hex value
 */
export function normalizeColor(name: string, hex: string): NormalizedColor {
  // Clean up the name (trim whitespace, tabs, etc.)
  const cleanName = name.trim().replace(/\s+/g, ' ')
  const lowerName = cleanName.toLowerCase()

  // Get the display name (grouped if applicable)
  const displayName = COLOR_GROUPS[lowerName] || cleanName

  // Get the correct hex value
  let finalHex = hex
  if (!hex || hex === '#' || hex === '') {
    // Use override if available
    finalHex = COLOR_HEX_OVERRIDES[lowerName] || '#808080' // Default gray if unknown
  }

  return {
    name: displayName,
    hex: finalHex,
    originalName: cleanName,
  }
}

/**
 * Normalize and deduplicate an array of colors
 * Groups similar colors and returns unique display colors
 */
export function normalizeColors(colors: { name: string; hex: string }[]): { name: string; hex: string }[] {
  const colorMap = new Map<string, string>()

  colors.forEach(color => {
    const normalized = normalizeColor(color.name, color.hex)
    const key = normalized.name.toLowerCase()

    // Only add if not already present (first one wins for hex)
    if (!colorMap.has(key)) {
      colorMap.set(key, normalized.hex)
    }
  })

  // Convert to array and sort
  return Array.from(colorMap.entries())
    .map(([name, hex]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      hex,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Check if a product's colors match any of the selected filter colors
 * Handles color grouping (e.g., "Pigment Black" matches "Black" filter)
 */
export function productMatchesColorFilter(
  productColors: { name: string; hex: string }[],
  selectedColors: string[]
): boolean {
  if (selectedColors.length === 0) return true

  const selectedLower = selectedColors.map(c => c.toLowerCase())

  return productColors.some(color => {
    const normalized = normalizeColor(color.name, color.hex)
    return selectedLower.includes(normalized.name.toLowerCase())
  })
}

/**
 * Get the correct hex value for a color (fixes missing/incorrect values)
 * Use this for display without changing the color name
 */
export function getColorHex(name: string, hex: string): string {
  const cleanName = name.trim().replace(/\s+/g, ' ').toLowerCase()

  // If hex is missing or empty, use override or default
  if (!hex || hex === '#' || hex === '') {
    return COLOR_HEX_OVERRIDES[cleanName] || '#808080'
  }

  // Even if hex is provided, use override if we have a better value
  if (COLOR_HEX_OVERRIDES[cleanName]) {
    return COLOR_HEX_OVERRIDES[cleanName]
  }

  return hex
}
