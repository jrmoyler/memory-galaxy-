import { z } from 'zod'

/**
 * Zod schemas mirror the domain types in `@/types/memory` and act as the
 * validation boundary for any externally-sourced or user-created node
 * (e.g. the Add Memory modal, or — in V2 — Supabase rows).
 */

export const nodeTypeSchema = z.enum([
  'galaxy',
  'system',
  'planet',
  'document',
  'concept',
  'fact',
  'agent',
])

export const relationTypeSchema = z.enum([
  'depends-on',
  'related-to',
  'derives-from',
  'references',
  'powers',
])

export const vec3Schema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
})

export const memoryNodeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Name is required'),
  type: nodeTypeSchema,
  description: z.string().default(''),
  category: z.string().default('General'),
  parentId: z.string().optional(),
  position: vec3Schema,
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Must be a hex color'),
  size: z.number().positive().max(20),
  importance: z.number().min(0).max(100),
  memoryCount: z.number().int().min(0),
  relatedIds: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
  tags: z.array(z.string()).default([]),
})

export const memoryEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  relation: relationTypeSchema,
  weight: z.number().min(0).max(1),
})

export const memoryGraphSchema = z.object({
  nodes: z.array(memoryNodeSchema),
  edges: z.array(memoryEdgeSchema),
})

/** Input schema used by the Add Memory modal form. */
export const addMemoryInputSchema = z.object({
  name: z.string().min(1, 'Title is required'),
  type: nodeTypeSchema,
  galaxyId: z.string().min(1, 'Pick a galaxy'),
  description: z.string().default(''),
  tags: z.array(z.string()).default([]),
  importance: z.number().min(0).max(100),
  relatedIds: z.array(z.string()).default([]),
})

export type MemoryNodeInput = z.infer<typeof memoryNodeSchema>
export type AddMemoryInput = z.infer<typeof addMemoryInputSchema>
