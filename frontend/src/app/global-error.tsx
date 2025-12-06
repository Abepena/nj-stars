"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html>
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          backgroundColor: '#1a1a1a',
          color: '#fff'
        }}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h1 style={{ fontSize: '4rem', fontWeight: 'bold', color: '#f87171', marginBottom: '1rem' }}>
              500
            </h1>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
              Something Went Wrong
            </h2>
            <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>
              An unexpected error occurred. Please try again.
            </p>
            <button
              onClick={reset}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#ec4899',
                color: '#fff',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
