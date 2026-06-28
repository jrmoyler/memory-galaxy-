import { Providers } from './providers'
import { AppShell } from '@/components/layout/AppShell'

export default function App() {
  return (
    <Providers>
      <AppShell />
    </Providers>
  )
}
