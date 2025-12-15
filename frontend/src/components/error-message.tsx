import type { APIError } from '@/lib/api-client'

interface ErrorMessageProps {
  error: APIError | Error | string | null
  className?: string
}

export function ErrorMessage({ error, className = '' }: ErrorMessageProps) {
  if (!error) return null

  const message = typeof error === 'string'
    ? error
    : 'message' in error
    ? error.message
    : 'An unexpected error occurred'

  const fieldErrors = typeof error === 'object' && 'errors' in error
    ? error.errors
    : undefined

  return (
    <div className={`bg-card border border-border rounded-lg p-4 shadow-md border-l-4 border-l-accent flex flex-col gap-1 ${className}`}>
      <div className="font-bold text-sm text-foreground">{message}</div>
      {fieldErrors && (
        <div className="text-muted-foreground text-sm">
          <ul className="list-disc space-y-1 pl-5">
            {Object.entries(fieldErrors).map(([field, errors]) => (
              <li key={field}>
                <span className="font-semibold capitalize">{field}:</span>{' '}
                {Array.isArray(errors) ? errors.join(', ') : errors}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
