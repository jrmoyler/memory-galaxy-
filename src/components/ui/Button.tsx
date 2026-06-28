import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'gold'
type Size = 'sm' | 'md' | 'icon'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const variants: Record<Variant, string> = {
  primary:
    'bg-teal/15 text-teal border border-teal/40 hover:bg-teal/25 hover:shadow-glow',
  gold: 'bg-gold/15 text-gold border border-gold/40 hover:bg-gold/25 hover:shadow-glow-gold',
  secondary:
    'bg-galaxy-border/40 text-ink border border-galaxy-border hover:bg-galaxy-border/70',
  outline:
    'bg-transparent text-silver border border-galaxy-border hover:text-ink hover:border-teal/50',
  ghost: 'bg-transparent text-silver hover:text-ink hover:bg-galaxy-border/40 border border-transparent',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  icon: 'h-9 w-9 p-0 justify-center',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/50',
        'disabled:opacity-40 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
)
Button.displayName = 'Button'
