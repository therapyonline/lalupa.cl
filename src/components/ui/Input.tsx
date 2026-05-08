'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  hint?: string
  error?: string
  type?: 'text' | 'number' | 'email' | 'tel'
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, className, id, type = 'text', ...props }, ref) => {
    const reactId = React.useId()
    const inputId = id ?? reactId
    const descId = error || hint ? `${inputId}-desc` : undefined
    const isError = Boolean(error)

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[13px] font-bold text-ink"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          aria-invalid={isError || undefined}
          aria-describedby={descId}
          className={cn(
            'min-h-12 w-full rounded-md border-[1.5px] bg-white px-4 py-3.5 text-base text-ink transition-colors',
            'placeholder:text-soft',
            'focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15',
            'disabled:cursor-not-allowed disabled:opacity-50',
            isError
              ? 'border-danger focus:border-danger focus:ring-danger/15'
              : 'border-border',
            className,
          )}
          {...props}
        />
        {(error || hint) && (
          <p
            id={descId}
            className={cn(
              'text-[13px]',
              isError ? 'text-danger' : 'text-soft',
            )}
          >
            {error || hint}
          </p>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'
