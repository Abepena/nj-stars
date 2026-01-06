/**
 * Color normalization utilities for product variants
 *
 * Handles:
 * - Missing/incorrect hex values from Printify
 * - Grouping similar colors (e.g., "Black" and "Pigment Black")
 * - Normalizing color names (trimming whitespace, consistent casing)
 */

// Comprehensive hex values for all colors in the database
// These are corrected to match actual product colors from Printify
const COLOR_HEX_MAP: Record<string, string> = {
  // Blacks & Greys
  'black': '#000000',
  'pigment black': '#1a1a1a',
  'charcoal': '#36454F',
  'charcoal grey': '#36454F',
  'charcoal heather': '#4a4a4a',
  'dark grey': '#3d3d3d',
  'dark heather': '#4b5563',
  'athletic heather': '#9ca3af',
  'sport grey': '#9ca3af',
  'grey heather': '#9ca3af',
  'heather grey': '#9ca3af',
  'oatmeal heather': '#c8b89a',
  'ash': '#b2beb5',

  // Whites & Neutrals
  'white': '#ffffff',
  'natural': '#faebd7',
  'bone': '#e3dac9',

  // Cream tones (butter, ecru, sand)
  'sand': '#d4c4a8',
  'sandstone': '#786d5f',
  'ecru': '#f5f0e1',
  'butter': '#f5f0dc',

  // Browns
  'toast': '#9a6e4c',
  'clay': '#b66a50',
  'cocoa': '#5c4033',
  'dark chocolate': '#3D2314',

  // Blues
  'navy': '#001f3f',
  'navy blazer': '#1e3a5f',
  'heather navy': '#2c3e50',
  'midnight blue': '#191970',
  'royal': '#4169e1',
  'carolina blue': '#56a0d3',
  'light blue': '#add8e6',
  'pigment light blue': '#a8d4e6',
  'blue aqua': '#00d4ff',
  'blue mist': '#bcd4e6',
  'sky': '#87ceeb',
  'slate blue': '#6a5acd',
  'pigment slate blue': '#5a4abd',
  'stone blue': '#6699cc',

  // Greens
  'forest green': '#228b22',
  'forest': '#228b22',
  'alpine green': '#2e5a3c',
  'pigment alpine green': '#2e5a3c',
  'pine green': '#01796f',
  'irish green': '#009a44',
  'safety green': '#c6ff00',
  'military green': '#4b5320',
  'army': '#4b5320',
  'army green': '#4b5320',
  'olive': '#556b2f',
  'cypress': '#545a3e',
  'eucalyptus': '#44d7a8',
  'pistachio': '#93c572',

  // Reds
  'red': '#cc0000',
  'maroon': '#800000',
  'pigment maroon': '#800000',
  'burgundy': '#722f37',
  'heliconia': '#d94f70',

  // Pinks (corrected to match actual products)
  'pink': '#ffc0cb',
  'pigment pink': '#ffb6c1',
  'classic pink': '#f7cac9',
  'light pink': '#ffb6c1',
  'soft pink': '#f5c6d0',
  'pale pink': '#fadadd',
  'pink lemonade': '#ffaec0',
  'orchid': '#e8dce8',  // Corrected: actually a pale lavender/pink, not bright magenta
  'lilac': '#c8a2c8',

  // Purples (corrected to match actual products)
  'purple': '#4a2c6a',  // Corrected: deep purple like the long sleeve tee
  'deep purple': '#3d2660',
  'plum': '#8e4585',
  'paragon': '#9d8fa8',  // Corrected: dusty lavender/mauve, not bright blue

  // Yellows & Oranges
  'gold': '#ffd700',
  'mustard': '#ffdb58',
  'orange': '#ffa500',

  // Other
  'khaki': '#c3b091',
}

// Group similar colors together (maps variant name → display name)
// This consolidates similar shades into one filter option
const COLOR_GROUPS: Record<string, string> = {
  // Pigment colors → base colors
  'pigment black': 'Black',
  'pigment maroon': 'Maroon',
  'pigment alpine green': 'Alpine Green',
  'pigment light blue': 'Light Blue',
  'pigment pink': 'Pink',
  'pigment slate blue': 'Slate Blue',

  // Cream tones → Cream
  'butter': 'Cream',
  'ecru': 'Cream',
  'sand': 'Cream',
  'natural': 'Cream',
  'bone': 'Cream',

  // All grey-ish tones → Grey (charcoal, heathers, sport grey, etc.)
  'charcoal': 'Grey',
  'charcoal grey': 'Grey',
  'charcoal heather': 'Grey',
  'dark grey': 'Grey',
  'dark heather': 'Grey',
  'athletic heather': 'Grey',
  'sport grey': 'Grey',
  'grey heather': 'Grey',
  'heather grey': 'Grey',
  'oatmeal heather': 'Grey',
  'ash': 'Grey',

  // Forest variants → Forest Green
  'forest': 'Forest Green',

  // Army variants → Army
  'army green': 'Army',

  // Paragon is actually a light purple/lavender
  'paragon': 'Purple',

  // Orchid groups with pink (it's a pale lavender-pink)
  'orchid': 'Pink',
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

  // Get the correct hex value - prefer our map, fall back to provided hex
  let finalHex = COLOR_HEX_MAP[lowerName] || hex
  if (!finalHex || finalHex === '#' || finalHex === '') {
    finalHex = '#808080' // Default gray if unknown
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

  // Prefer our hex map which has accurate values
  if (COLOR_HEX_MAP[cleanName]) {
    return COLOR_HEX_MAP[cleanName]
  }

  // Fall back to provided hex if valid
  if (hex && hex !== '#' && hex !== '') {
    return hex
  }

  // Default gray for unknown colors
  return '#808080'
}
