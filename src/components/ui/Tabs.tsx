import { cn } from '@/lib/cn'

interface TabsProps<T extends string> {
  tabs: { id: T; label: string }[]
  value: T
  onChange: (id: T) => void
  className?: string
}

export function Tabs<T extends string>({ tabs, value, onChange, className }: TabsProps<T>) {
  return (
    <div className={cn('inline-flex rounded-lg bg-background/50 p-1 border border-galaxy-border', className)}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            'rounded-md px-3 py-1.5 text-xs font-medium transition-all',
            value === t.id
              ? 'bg-teal/15 text-teal shadow-glow'
              : 'text-silver hover:text-ink',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
