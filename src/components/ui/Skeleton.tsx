import { cn } from '@/lib/utils'

/**
 * Bloque skeleton genérico con animación pulse. Usar dentro de páginas
 * que cargan datos async para evitar layout shift y comunicar progreso.
 *
 * Props:
 *   - className: tamaño + bordes (ej. "h-6 w-32 rounded-md")
 *   - aria-label: opcional para anunciar a screen readers cuándo aparece.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="presentation"
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded-md bg-ink/10',
        className,
      )}
      {...props}
    />
  )
}

/**
 * Logo spinner, usado en loading.tsx globales y de fallback. La animación
 * gira el círculo del medio del logo (que también es la lupa). Se ajusta
 * automáticamente al color del fondo en el que está embebido.
 */
export function LogoSpinner({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      className={cn('h-12 w-12 animate-spin text-ink', className)}
      role="img"
      aria-label="Cargando"
    >
      <line
        x1="20"
        y1="20"
        x2="26"
        y2="26"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.4"
      />
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.4"
      />
      <circle cx="12" cy="12" r="4" fill="#FF6B35" />
    </svg>
  )
}
