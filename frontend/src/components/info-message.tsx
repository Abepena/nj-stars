interface InfoMessageProps {
  title: string
  message?: string
  className?: string
}

export function InfoMessage({ title, message, className = '' }: InfoMessageProps) {
  return (
    <div className={`bg-bg-secondary border border-border rounded-lg p-4 shadow-md border-l-4 border-l-info flex flex-col gap-1 ${className}`}>
      <div className="font-bold text-sm text-foreground">{title}</div>
      {message && (
        <div className="text-text-secondary text-sm">{message}</div>
      )}
    </div>
  )
}
