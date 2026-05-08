import * as React from 'react'
import { cn } from '@/lib/utils'

type DivProps = React.HTMLAttributes<HTMLDivElement>
type HeadingProps = React.HTMLAttributes<HTMLHeadingElement>

function CardLightRoot({ className, children, ...props }: DivProps) {
  return (
    <div
      className={cn(
        'rounded-[20px] border border-border bg-white p-8',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function CardLightTitle({ className, children, ...props }: HeadingProps) {
  return (
    <h3
      className={cn(
        'text-2xl font-medium leading-tight tracking-tight text-ink',
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  )
}

function CardLightBody({ className, children, ...props }: DivProps) {
  return (
    <div
      className={cn('mt-3 leading-relaxed text-body', className)}
      {...props}
    >
      {children}
    </div>
  )
}

function CardLightFooter({ className, children, ...props }: DivProps) {
  return (
    <div
      className={cn('mt-6 border-t border-border pt-4 text-sm', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export const CardLight = Object.assign(CardLightRoot, {
  Title: CardLightTitle,
  Body: CardLightBody,
  Footer: CardLightFooter,
})

function CardGlassRoot({ className, children, ...props }: DivProps) {
  return (
    <div
      className={cn(
        'rounded-[20px] border border-white/[0.18] bg-white/10 p-8 text-cream backdrop-blur-[20px]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function CardGlassNumber({ className, children, ...props }: DivProps) {
  return (
    <div
      className={cn(
        'text-4xl font-medium leading-[1.05] tracking-tight [&_em]:not-italic [&_em]:text-accent',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function CardGlassLabel({ className, children, ...props }: DivProps) {
  return (
    <div className={cn('mt-2 text-sm text-cream/70', className)} {...props}>
      {children}
    </div>
  )
}

export const CardGlass = Object.assign(CardGlassRoot, {
  Number: CardGlassNumber,
  Label: CardGlassLabel,
})
