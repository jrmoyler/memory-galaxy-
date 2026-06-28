import { forwardRef } from 'react'
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-lg bg-background/60 border border-galaxy-border px-3 py-2 text-sm text-ink',
        'placeholder:text-silver/60 transition-colors',
        'focus:outline-none focus:border-teal/60 focus:ring-1 focus:ring-teal/40',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'w-full rounded-lg bg-background/60 border border-galaxy-border px-3 py-2 text-sm text-ink',
      'placeholder:text-silver/60 transition-colors resize-none',
      'focus:outline-none focus:border-teal/60 focus:ring-1 focus:ring-teal/40',
      className,
    )}
    {...props}
  />
))
Textarea.displayName = 'Textarea'
