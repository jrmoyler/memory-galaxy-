import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'teal' | 'gold' | 'silver' | 'custom'
  color?: string
}

export function Badge({ className, tone = 'silver', color, style, ...props }: BadgeProps) {
  const tones = {
    teal: 'bg-teal/10 text-teal border-teal/30',
    gold: 'bg-gold/10 text-gold border-gold/30',
    silver: 'bg-silver/10 text-silver border-silver/25',
    custom: '',
  }
  const customStyle =
    tone === 'custom' && color
      ? { color, borderColor: `${color}55`, backgroundColor: `${color}1a`, ...style }
      : style
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium leading-tight',
        tones[tone],
        className,
      )}
      style={customStyle}
      {...props}
    />
  )
}
