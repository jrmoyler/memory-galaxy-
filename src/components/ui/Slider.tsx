import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number
  min?: number
  max?: number
  step?: number
  onValueChange: (v: number) => void
}

/**
 * Range slider styled with a teal fill. Uses a CSS gradient on the track to
 * indicate progress without extra DOM.
 */
export function Slider({
  value,
  min = 0,
  max = 1,
  step = 0.001,
  onValueChange,
  className,
  ...props
}: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onValueChange(parseFloat(e.target.value))}
      className={cn('mg-slider h-1.5 w-full cursor-pointer appearance-none rounded-full', className)}
      style={{
        background: `linear-gradient(to right, #00D9B5 0%, #00D9B5 ${pct}%, #1A2540 ${pct}%, #1A2540 100%)`,
      }}
      {...props}
    />
  )
}
