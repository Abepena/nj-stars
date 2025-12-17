# Google Maps API Setup Guide

This guide walks you through setting up Google Maps API for displaying event locations on the NJ Stars platform.

---

## Prerequisites

- Google Cloud project (can reuse the project from Google OAuth setup)
- Billing enabled on the Google Cloud project (required for Maps API)

> **Note:** Google Maps Platform offers a $200/month free credit, which covers approximately:
> - 28,000 map loads (Dynamic Maps)
> - 40,000 geocoding requests
> - This is more than sufficient for this application

---

## Required APIs

| API | Purpose | Required? |
|-----|---------|-----------|
| **Maps JavaScript API** | Display interactive maps | Yes |
| **Geocoding API** | Convert addresses to lat/lng | Optional |
| **Places API** | Location autocomplete | Optional |

---

## Setup Steps

### Step 1: Enable Maps JavaScript API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (or create one)
3. Go to **APIs & Services** → **Library**
4. Search for "Maps JavaScript API"
5. Click on it → Click "Enable"

### Step 2: Enable Geocoding API (Optional)

If you want to automatically convert text addresses to coordinates:

1. In the API Library, search for "Geocoding API"
2. Click on it → Click "Enable"

### Step 3: Enable Billing

Google Maps APIs require billing to be enabled (even for free tier usage):

1. Go to **Billing** in the Cloud Console
2. Link a billing account to your project
3. The free $200/month credit will be applied automatically

### Step 4: Create an API Key

1. Go to **APIs & Services** → **Credentials**
2. Click "Create Credentials" → "API Key"
3. Copy the API key
4. Click "Edit API Key" to add restrictions

### Step 5: Restrict the API Key (Important for Security)

**Application Restrictions:**
- Select "HTTP referrers (websites)"
- Add website restrictions:
  ```
  http://localhost:3000/*
  https://njstarselite.com/*
  https://*.vercel.app/*
  ```

**API Restrictions:**
- Select "Restrict key"
- Select only the APIs you need:
  - Maps JavaScript API
  - Geocoding API (if using)
  - Places API (if using)

5. Click "Save"

---

## Environment Variables

### Development

**Frontend (`frontend/.env.local`):**
```bash
# Google Maps API Key (public - restricted by HTTP referrer)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...your_key_here
```

### Production

**Vercel:**
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add:
   - Name: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - Value: Your production API key
   - Environment: Production (and Preview if needed)

> **Tip:** Consider using separate API keys for development and production with different restrictions.

---

## Usage in Code

### Installing the Package

```bash
cd frontend
npm install @react-google-maps/api
```

### Basic Map Component

```typescript
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api'

const mapContainerStyle = {
  width: '100%',
  height: '400px'
}

const center = {
  lat: 40.0583,  // New Jersey center
  lng: -74.4057
}

export function EventMap() {
  return (
    <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={10}
      >
        <Marker position={center} />
      </GoogleMap>
    </LoadScript>
  )
}
```

### With Multiple Markers

```typescript
interface Event {
  id: number
  title: string
  latitude: number
  longitude: number
}

function EventMap({ events }: { events: Event[] }) {
  return (
    <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={10}>
      {events.map(event => (
        <Marker
          key={event.id}
          position={{ lat: event.latitude, lng: event.longitude }}
          title={event.title}
        />
      ))}
    </GoogleMap>
  )
}
```

---

## Geocoding (Converting Addresses to Coordinates)

### Option A: Manual Entry (Recommended for MVP)

1. Find coordinates using Google Maps:
   - Go to [Google Maps](https://maps.google.com)
   - Search for the venue
   - Right-click → "What's here?"
   - Copy the coordinates shown

2. Enter in Django Admin when creating events

### Option B: Frontend Geocoding

```typescript
const geocoder = new google.maps.Geocoder()

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const { lat, lng } = results[0].geometry.location
        resolve({ lat: lat(), lng: lng() })
      } else {
        resolve(null)
      }
    })
  })
}
```

### Option C: Backend Geocoding (Python)

```python
import requests
from django.conf import settings

def geocode_address(address: str) -> tuple[float, float] | None:
    """Convert address to lat/lng coordinates."""
    api_key = settings.GOOGLE_MAPS_API_KEY
    url = 'https://maps.googleapis.com/maps/api/geocode/json'

    response = requests.get(url, params={
        'address': address,
        'key': api_key
    })

    if response.ok:
        data = response.json()
        if data['results']:
            location = data['results'][0]['geometry']['location']
            return (location['lat'], location['lng'])

    return None
```

---

## Billing and Usage Monitoring

### Setting Up Budget Alerts

1. Go to **Billing** → **Budgets & alerts**
2. Click "Create Budget"
3. Set budget amount (e.g., $50/month)
4. Set alert thresholds (50%, 90%, 100%)
5. Add email notifications

### Monitoring Usage

1. Go to **APIs & Services** → **Dashboard**
2. Select "Maps JavaScript API"
3. View metrics:
   - Traffic
   - Errors
   - Latency

### Cost Estimation

| API | Free Tier | Cost After |
|-----|-----------|------------|
| Maps JavaScript (Dynamic) | 28,000 loads/month | $7 per 1,000 |
| Geocoding | 40,000 requests/month | $5 per 1,000 |
| Places Autocomplete | 10,000 requests/month | $2.83 per 1,000 |

---

## Testing

### Verify API Key Works

1. Add the environment variable to `frontend/.env.local`
2. Create a simple test page:

```typescript
// frontend/src/app/test-map/page.tsx
'use client'
import { GoogleMap, LoadScript } from '@react-google-maps/api'

export default function TestMapPage() {
  return (
    <div className="h-screen">
      <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={{ lat: 40.0583, lng: -74.4057 }}
          zoom={10}
        />
      </LoadScript>
    </div>
  )
}
```

3. Visit `http://localhost:3000/test-map`
4. You should see an interactive map centered on New Jersey

### Checklist

- [ ] API key is set in environment variables
- [ ] Map loads without errors
- [ ] Console shows no API key errors
- [ ] Map is interactive (can pan/zoom)
- [ ] Markers display correctly
- [ ] Production URL is in HTTP referrer restrictions

---

## Troubleshooting

### "Google Maps JavaScript API error: RefererNotAllowedMapError"
- The current URL is not in the allowed HTTP referrers
- Add the exact URL pattern to your API key restrictions
- Remember to include `/*` at the end (e.g., `http://localhost:3000/*`)

### "Google Maps JavaScript API error: ApiNotActivatedMapError"
- The Maps JavaScript API is not enabled
- Go to APIs & Services → Library → Enable Maps JavaScript API

### "Google Maps JavaScript API error: InvalidKeyMapError"
- The API key is invalid or restricted incorrectly
- Check for typos in the key
- Verify API restrictions match your use case

### Map shows "For development purposes only" watermark
- Billing is not enabled on the project
- Enable billing to remove the watermark

### Geocoding returns no results
- Address may be too vague or misspelled
- Try a more specific address
- Check Geocoding API is enabled

---

## Security Best Practices

1. **Always restrict API keys** - Never use unrestricted keys in production
2. **Use HTTP referrer restrictions** - Prevent key misuse from other domains
3. **Monitor usage** - Set up billing alerts to catch anomalies
4. **Use separate keys** - Different keys for development and production
5. **Don't expose backend keys** - Backend API keys should never be in frontend code

---

## Related Documentation

- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [@react-google-maps/api Documentation](https://react-google-maps-api-docs.netlify.app/)
- [Geocoding API](https://developers.google.com/maps/documentation/geocoding)
