import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-full font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-cream hover:bg-primary-deep',
        dark: 'bg-ink text-cream hover:bg-primary-dark',
        accent: 'bg-accent text-cream hover:bg-accent-deep',
        light: 'bg-cream text-ink hover:bg-cream-warm',
        ghost:
          'bg-transparent border border-ink text-ink hover:bg-ink hover:text-cream',
      },
      size: {
        sm: 'px-3.5 py-2 text-xs',
        md: 'px-6 py-4 text-sm uppercase tracking-wide',
        lg: 'px-7 py-[18px] text-base uppercase',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

const ARROW_CHEVRON_COLOR = {
  primary: 'text-primary',
  dark: 'text-ink',
  accent: 'text-accent',
  light: 'text-cream',
} as const

type ArrowVariant = keyof typeof ARROW_CHEVRON_COLOR

function ArrowCircle({ variant }: { variant: ArrowVariant }) {
  const inverted = variant === 'light'
  return (
    <span
      aria-hidden
      className={cn(
        'ml-2 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
        inverted ? 'bg-ink' : 'bg-cream',
      )}
    >
      <ChevronRight
        className={cn('h-4 w-4', ARROW_CHEVRON_COLOR[variant])}
        strokeWidth={1.5}
      />
    </span>
  )
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      asChild = false,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button'
    const resolvedVariant = variant ?? 'primary'
    const arrow =
      resolvedVariant !== 'ghost' ? (
        <ArrowCircle variant={resolvedVariant} />
      ) : null

    let content: React.ReactNode = (
      <>
        {children}
        {arrow}
      </>
    )

    if (
      asChild &&
      React.isValidElement<{ children?: React.ReactNode }>(children)
    ) {
      content = React.cloneElement(
        children,
        undefined,
        <>
          {children.props.children}
          {arrow}
        </>,
      )
    }

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {content}
      </Comp>
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
