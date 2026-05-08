import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type CalloutTone = 'info' | 'warning' | 'success' | 'danger'

const TONE_BORDER: Record<CalloutTone, string> = {
  info: 'border-l-primary',
  warning: 'border-l-warning',
  success: 'border-l-success',
  danger: 'border-l-danger',
}

const TONE_TITLE: Record<CalloutTone, string> = {
  info: 'text-primary-deep',
  warning: 'text-warning',
  success: 'text-success',
  danger: 'text-danger',
}

export function Callout({
  tone = 'info',
  title,
  children,
}: {
  tone?: CalloutTone
  title?: string
  children: ReactNode
}) {
  return (
    <aside
      className={cn(
        'my-8 border-l-4 bg-cream-warm/30 px-6 py-5',
        TONE_BORDER[tone],
      )}
    >
      {title && (
        <p
          className={cn(
            'font-mono text-xs font-semibold uppercase tracking-[0.1em]',
            TONE_TITLE[tone],
          )}
        >
          {title}
        </p>
      )}
      <div
        className={cn(
          'text-[15px] leading-relaxed text-ink',
          title && 'mt-2',
        )}
      >
        {children}
      </div>
    </aside>
  )
}
