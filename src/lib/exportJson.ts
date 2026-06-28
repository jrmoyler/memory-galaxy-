import type { MemoryGraph } from '@/types/memory'

/**
 * Serialize the current memory graph and trigger a browser download.
 * Pure client-side — no backend required for V1.
 */
export function exportGraphAsJson(graph: MemoryGraph, filename = 'memory-galaxy.json') {
  const payload = {
    app: 'Memory Galaxy',
    version: 1,
    exportedAt: new Date().toISOString(),
    graph,
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}
