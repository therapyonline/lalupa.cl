import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const pillVariants = cva(
  'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-medium tracking-[0.04em]',
  {
    variants: {
      tone: {
        light: 'bg-white border-ink text-ink',
        dark: 'bg-white/[0.08] border-white/25 text-cream',
      },
    },
    defaultVariants: {
      tone: 'light',
    },
  },
)

const DOT_COLOR = {
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-primary',
} as const

type PillVariant = keyof typeof DOT_COLOR

export interface PillProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof pillVariants> {
  variant?: PillVariant
}

export function Pill({
  variant = 'accent',
  tone,
  className,
  children,
  ...props
}: PillProps) {
  return (
    <span className={cn(pillVariants({ tone }), className)} {...props}>
      <span
        aria-hidden
        className={cn('h-1.5 w-1.5 shrink-0 rounded-full', DOT_COLOR[variant])}
      />
      {children}
    </span>
  )
}

export { pillVariants }
