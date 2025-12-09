/**
 * Calendar utility functions for generating calendar links and exports.
 * These work without any API keys - they use public URL schemes.
 */

interface CalendarEvent {
  title: string
  description?: string
  location?: string
  start_datetime: string
  end_datetime: string
  slug?: string
}

/**
 * Format date for Google Calendar URL (YYYYMMDDTHHmmssZ)
 */
function formatGoogleDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

/**
 * Generate a Google Calendar "Add Event" URL.
 * When clicked, opens Google Calendar with a pre-filled event form.
 * No API key required - uses public URL scheme.
 *
 * @see https://github.com/nicokosi/github-events-to-calendar for reference
 */
export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const baseUrl = 'https://calendar.google.com/calendar/render'

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatGoogleDate(event.start_datetime)}/${formatGoogleDate(event.end_datetime)}`,
  })

  // Add optional fields
  if (event.location) {
    params.set('location', event.location)
  }

  // Build description with link to event page
  let description = event.description || ''
  if (event.slug) {
    const eventUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://njstarselite.com'}/events/${event.slug}`
    description = description
      ? `${description}\n\nView details: ${eventUrl}`
      : `View details: ${eventUrl}`
  }
  if (description) {
    params.set('details', description)
  }

  return `${baseUrl}?${params.toString()}`
}

/**
 * Generate an Outlook/Office 365 Calendar "Add Event" URL.
 * Works with Outlook.com and Office 365 online calendars.
 * No API key required.
 */
export function generateOutlookCalendarUrl(event: CalendarEvent): string {
  const baseUrl = 'https://outlook.live.com/calendar/0/deeplink/compose'

  const params = new URLSearchParams({
    subject: event.title,
    startdt: event.start_datetime,
    enddt: event.end_datetime,
    path: '/calendar/action/compose',
    rru: 'addevent',
  })

  if (event.location) {
    params.set('location', event.location)
  }

  let body = event.description || ''
  if (event.slug) {
    const eventUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://njstarselite.com'}/events/${event.slug}`
    body = body ? `${body}\n\nView details: ${eventUrl}` : `View details: ${eventUrl}`
  }
  if (body) {
    params.set('body', body)
  }

  return `${baseUrl}?${params.toString()}`
}

/**
 * Generate iCalendar (.ics) file content for a single event.
 * Can be downloaded and imported into any calendar app.
 * No API key required - iCalendar is just a file format standard (RFC 5545).
 */
export function generateIcsContent(event: CalendarEvent): string {
  const formatIcsDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  }

  const escapeIcs = (text: string): string => {
    if (!text) return ''
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
  }

  const uid = `njstars-event-${event.slug || Date.now()}@njstarselite.com`
  const eventUrl = event.slug
    ? `${process.env.NEXT_PUBLIC_SITE_URL || 'https://njstarselite.com'}/events/${event.slug}`
    : ''

  let description = escapeIcs(event.description || '')
  if (eventUrl) {
    description = description
      ? `${description}\\n\\nView details: ${eventUrl}`
      : `View details: ${eventUrl}`
  }

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NJ Stars Elite AAU//Event//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatIcsDate(new Date().toISOString())}`,
    `DTSTART:${formatIcsDate(event.start_datetime)}`,
    `DTEND:${formatIcsDate(event.end_datetime)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
  ]

  if (description) {
    lines.push(`DESCRIPTION:${description}`)
  }
  if (event.location) {
    lines.push(`LOCATION:${escapeIcs(event.location)}`)
  }
  if (eventUrl) {
    lines.push(`URL:${eventUrl}`)
  }

  lines.push('STATUS:CONFIRMED', 'END:VEVENT', 'END:VCALENDAR')

  return lines.join('\r\n')
}

/**
 * Download an ICS file for a single event.
 * Triggers browser download of a .ics file.
 */
export function downloadEventIcs(event: CalendarEvent): void {
  const icsContent = generateIcsContent(event)
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `${event.slug || 'event'}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Get the iCalendar subscription URL for user's registered events.
 * This URL can be added to calendar apps for automatic syncing.
 */
export function getICalendarSubscriptionUrl(): string {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  return `${apiBase}/api/events/registrations/calendar.ics`
}

/**
 * Get the webcal:// URL for subscribing to calendar in supported apps.
 * webcal:// is a URI scheme that tells apps to subscribe to a calendar feed.
 */
export function getWebcalSubscriptionUrl(): string {
  const httpUrl = getICalendarSubscriptionUrl()
  return httpUrl.replace(/^https?:\/\//, 'webcal://')
}
