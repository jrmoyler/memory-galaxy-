import { useMemo, useState, type ReactNode } from 'react'
import { Plus } from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Slider } from '@/components/ui/Slider'
import { Badge } from '@/components/ui/Badge'
import { useGalaxyStore } from '@/store/useGalaxyStore'
import { addMemoryInputSchema } from '@/schemas/memoryNode.schema'
import { NODE_TYPES, TYPE_COLOR, TYPE_LABEL } from '@/lib/constants'
import type { MemoryEdge, MemoryNode, NodeType } from '@/types/memory'

/**
 * Add Memory modal. Validates input with Zod, then inserts a new node (and an
 * edge to its galaxy + any related nodes) straight into Zustand state, so it
 * appears in the galaxy immediately. No backend in V1.
 */
export function AddMemoryModal() {
  const open = useGalaxyStore((s) => s.addMemoryOpen)
  const setOpen = useGalaxyStore((s) => s.setAddMemoryOpen)
  const graph = useGalaxyStore((s) => s.graph)
  const addNode = useGalaxyStore((s) => s.addNode)

  const galaxies = useMemo(() => graph.nodes.filter((n) => n.type === 'galaxy'), [graph])

  const [name, setName] = useState('')
  const [type, setType] = useState<NodeType>('concept')
  const [galaxyId, setGalaxyId] = useState(galaxies[0]?.id ?? '')
  const [description, setDescription] = useState('')
  const [tagsRaw, setTagsRaw] = useState('')
  const [importance, setImportance] = useState(60)
  const [relatedIds, setRelatedIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const relatableNodes = useMemo(
    () => graph.nodes.filter((n) => n.type !== 'agent').slice(0, 60),
    [graph],
  )

  const reset = () => {
    setName('')
    setType('concept')
    setGalaxyId(galaxies[0]?.id ?? '')
    setDescription('')
    setTagsRaw('')
    setImportance(60)
    setRelatedIds([])
    setError(null)
  }

  const close = () => {
    setOpen(false)
    reset()
  }

  const submit = () => {
    const tags = tagsRaw
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean)

    const parsed = addMemoryInputSchema.safeParse({
      name,
      type,
      galaxyId,
      description,
      tags,
      importance,
      relatedIds,
    })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid input')
      return
    }

    const galaxy = graph.nodes.find((n) => n.id === galaxyId)
    const base = galaxy?.position ?? { x: 0, y: 0, z: 0 }
    // Scatter the new node in a shell around its galaxy.
    const angle = Math.random() * Math.PI * 2
    const radius = 8 + Math.random() * 14
    const position = {
      x: base.x + Math.cos(angle) * radius,
      y: base.y + (Math.random() - 0.5) * 10,
      z: base.z + Math.sin(angle) * radius,
    }

    const now = new Date().toISOString()
    const id = `user-${Date.now().toString(36)}`
    const node: MemoryNode = {
      id,
      name: parsed.data.name,
      type: parsed.data.type,
      description: parsed.data.description || 'A freshly captured memory.',
      category: 'Captured',
      parentId: galaxyId,
      position,
      color: TYPE_COLOR[parsed.data.type],
      size: type === 'galaxy' ? 5 : type === 'system' ? 3 : type === 'planet' ? 1.6 : 1,
      importance: parsed.data.importance,
      memoryCount: 1,
      relatedIds: parsed.data.relatedIds,
      createdAt: now,
      updatedAt: now,
      tags: parsed.data.tags,
    }

    const edges: MemoryEdge[] = []
    edges.push({
      id: `eu-${id}-galaxy`,
      source: galaxyId,
      target: id,
      relation: 'powers',
      weight: 0.5,
    })
    parsed.data.relatedIds.forEach((rid, i) => {
      edges.push({
        id: `eu-${id}-${i}`,
        source: id,
        target: rid,
        relation: 'related-to',
        weight: 0.6,
      })
    })

    addNode(node, edges)
    close()
  }

  const toggleRelated = (id: string) =>
    setRelatedIds((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]))

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Add Memory"
      description="Capture a new node and watch it appear in the galaxy."
    >
      <div className="space-y-4">
        {/* Title */}
        <Field label="Title">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Aegis Protocol audit"
            autoFocus
          />
        </Field>

        {/* Type + Galaxy */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <div className="flex flex-wrap gap-1.5">
              {NODE_TYPES.filter((t) => t !== 'agent').map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`rounded-md border px-2 py-1 text-[11px] transition-all ${
                    type === t ? 'text-ink' : 'border-galaxy-border text-silver hover:text-ink'
                  }`}
                  style={
                    type === t
                      ? { borderColor: `${TYPE_COLOR[t]}88`, backgroundColor: `${TYPE_COLOR[t]}1a`, color: TYPE_COLOR[t] }
                      : undefined
                  }
                >
                  {TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Galaxy">
            <select
              value={galaxyId}
              onChange={(e) => setGalaxyId(e.target.value)}
              className="w-full rounded-lg border border-galaxy-border bg-background/60 px-3 py-2 text-sm text-ink focus:border-teal/60 focus:outline-none"
            >
              {galaxies.map((g) => (
                <option key={g.id} value={g.id} className="bg-card">
                  {g.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {/* Description */}
        <Field label="Description">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this memory about?"
            rows={3}
          />
        </Field>

        {/* Tags */}
        <Field label="Tags (comma separated)">
          <Input value={tagsRaw} onChange={(e) => setTagsRaw(e.target.value)} placeholder="security, audit, terra" />
        </Field>

        {/* Importance */}
        <Field label={`Importance · ${importance}`}>
          <Slider value={importance} min={0} max={100} step={1} onValueChange={setImportance} />
        </Field>

        {/* Related */}
        <Field label={`Related nodes${relatedIds.length ? ` · ${relatedIds.length}` : ''}`}>
          <div className="max-h-28 overflow-y-auto rounded-lg border border-galaxy-border bg-background/30 p-2">
            <div className="flex flex-wrap gap-1.5">
              {relatableNodes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => toggleRelated(n.id)}
                  className={`rounded-md border px-2 py-0.5 text-[11px] transition-all ${
                    relatedIds.includes(n.id)
                      ? 'border-teal/50 bg-teal/10 text-teal'
                      : 'border-galaxy-border text-silver/80 hover:text-ink'
                  }`}
                >
                  {n.name}
                </button>
              ))}
            </div>
          </div>
        </Field>

        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-[11px] text-silver/70">
            <Badge tone="custom" color={TYPE_COLOR[type]}>
              {TYPE_LABEL[type]}
            </Badge>
            will join the galaxy instantly
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={close}>
              Cancel
            </Button>
            <Button variant="gold" size="sm" onClick={submit}>
              <Plus size={15} /> Add to Galaxy
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-silver/70">
        {label}
      </div>
      {children}
    </div>
  )
}
