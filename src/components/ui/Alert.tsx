import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const alertVariants = cva(
  'flex items-start gap-3 rounded-lg border-l-4 px-6 py-5',
  {
    variants: {
      variant: {
        success:
          'border-success bg-success-soft [&_[data-slot=alert-title]]:text-success',
        warning:
          'border-warning bg-warning-soft [&_[data-slot=alert-title]]:text-warning',
        danger:
          'border-danger bg-danger-soft [&_[data-slot=alert-title]]:text-danger',
        info: 'border-primary bg-primary-soft [&_[data-slot=alert-title]]:text-primary',
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  },
)

type AlertVariant = NonNullable<VariantProps<typeof alertVariants>['variant']>

const ICON_MAP: Record<AlertVariant, LucideIcon> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
  info: Info,
}

const ICON_COLOR: Record<AlertVariant, string> = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-primary',
}

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

function AlertRoot({
  variant = 'info',
  className,
  children,
  ...props
}: AlertProps) {
  const resolved: AlertVariant = variant ?? 'info'
  const Icon = ICON_MAP[resolved]

  return (
    <div
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <Icon
        aria-hidden
        strokeWidth={1.5}
        className={cn('mt-0.5 h-[22px] w-[22px] shrink-0', ICON_COLOR[resolved])}
      />
      <div className="flex-1">{children}</div>
    </div>
  )
}

function AlertTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h4
      data-slot="alert-title"
      className={cn('font-bold leading-snug', className)}
      {...props}
    >
      {children}
    </h4>
  )
}

function AlertBody({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('mt-1 text-[14.5px] leading-relaxed text-ink', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export const Alert = Object.assign(AlertRoot, {
  Title: AlertTitle,
  Body: AlertBody,
})
