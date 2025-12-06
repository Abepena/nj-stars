interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

export function LoadingSpinner({ size = 'md', className = '', text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <div
        className={`animate-spin rounded-full border-2 border-bg-tertiary border-t-primary ${sizeClasses[size]}`}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
      {text && <p className="text-sm text-text-secondary">{text}</p>}
    </div>
  )
}

export function LoadingOverlay({ text }: { text?: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-bg-accent/80 backdrop-blur-sm">
      <LoadingSpinner size="lg" text={text} />
    </div>
  )
}
