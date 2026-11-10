interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  // Brillo que recorre el bloque en lugar del parpadeo de animate-pulse.
  return (
    <div
      className={`animate-brillo rounded-md bg-linear-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-size-[200%_100%] dark:from-neutral-800 dark:via-neutral-700 dark:to-neutral-800 ${className}`}
    />
  )
}
