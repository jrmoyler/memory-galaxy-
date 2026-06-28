import { useCallback } from 'react'
import { useGalaxyStore } from '@/store/useGalaxyStore'

export interface CommandResult {
  ok: boolean
  message: string
}

/**
 * Tiny natural-language-ish command parser for the Memory Command Bar.
 * V1 supports a fixed vocabulary; V2 swaps this for a real LLM/agent call.
 */
export function useGalaxyCommands() {
  const focusNode = useGalaxyStore((s) => s.focusNode)
  const setGalaxyFilter = useGalaxyStore((s) => s.setGalaxyFilter)
  const toggleTypeFilter = useGalaxyStore((s) => s.toggleTypeFilter)
  const typeFilters = useGalaxyStore((s) => s.typeFilters)
  const resetView = useGalaxyStore((s) => s.resetView)
  const setSearchQuery = useGalaxyStore((s) => s.setSearchQuery)

  const run = useCallback(
    (raw: string): CommandResult => {
      const cmd = raw.trim().toLowerCase()
      if (!cmd) return { ok: false, message: 'Type a command…' }

      // reset view
      if (cmd.includes('reset')) {
        resetView()
        return { ok: true, message: 'View reset to full galaxy.' }
      }

      // find agents → ensure agent type shown + search
      if (cmd.includes('agent')) {
        if (!typeFilters.has('agent')) toggleTypeFilter('agent')
        setSearchQuery('agent')
        focusNode('a-hermes')
        return { ok: true, message: 'Highlighting AI agents.' }
      }

      // show zenflow
      if (cmd.includes('zenflow')) {
        focusNode('s-zenflow')
        return { ok: true, message: 'Flying to ZenFlow System.' }
      }

      // show hybrid living
      if (cmd.includes('hybrid')) {
        focusNode('s-hybrid')
        return { ok: true, message: 'Flying to Hybrid Living System.' }
      }

      // show research
      if (cmd.includes('research')) {
        setGalaxyFilter('g-research')
        focusNode('g-research')
        return { ok: true, message: 'Filtering to the Research Galaxy.' }
      }

      // show nexus
      if (cmd.includes('nexus')) {
        focusNode('s-nexus')
        return { ok: true, message: 'Flying to Nexus Labs System.' }
      }

      // show terra
      if (cmd.includes('terra')) {
        focusNode('s-terra')
        return { ok: true, message: 'Flying to Terra Axis System.' }
      }

      // show personal
      if (cmd.includes('personal') || cmd.includes('life')) {
        setGalaxyFilter('g-personal')
        focusNode('g-personal')
        return { ok: true, message: 'Filtering to the Personal Life Galaxy.' }
      }

      // fallback: treat as a search query
      setSearchQuery(raw.trim())
      return { ok: true, message: `Searching for “${raw.trim()}”.` }
    },
    [focusNode, setGalaxyFilter, toggleTypeFilter, typeFilters, resetView, setSearchQuery],
  )

  return { run }
}

/** Suggested commands surfaced in the command bar UI. */
export const COMMAND_SUGGESTIONS = [
  'show zenflow',
  'show hybrid living',
  'show research',
  'find agents',
  'reset view',
] as const
