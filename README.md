<div align="center">

# 🌌 Memory Galaxy

**A 3D visual knowledge graph where memories, projects, documents, ideas, agents, and relationships become a living galaxy.**

Obsidian × Google Earth × No Man's Sky × Mass Effect Galaxy Map × AI dashboard.

</div>

---

## Overview

Memory Galaxy turns a knowledge base into an explorable universe. You fly through a
galaxy of knowledge where every level of the hierarchy is a cosmic object:

| Cosmic object | Knowledge meaning |
| --- | --- |
| 🌌 Galaxy | Domain |
| ☀️ Solar system | Project |
| 🪐 Planet | Knowledge base |
| 🏙️ City (document) | Document |
| 🏛️ Building (concept) | Concept |
| 👤 Citizen (fact) | Fact |
| 🛰️ Agent | Animated AI entity |
| 🌀 Wormhole | Semantic relationship |

Click any object to inspect it, ask the galaxy questions from the command bar,
scrub through time, and watch AI agents patrol between planets.

This is **V1** — polished, functional, and built to extend. The data layer is
local mock data today and Supabase-ready for tomorrow.

## Features

- **3D Galaxy View** — full-screen React Three Fiber canvas with a starfield,
  procedural nebula particle cloud, glowing planets/stars, curved "hyperspace
  lane" relationship lines, hover labels, selection pulse, animated rotation,
  and smooth **zoom-to-object** camera flights.
- **Memory Hierarchy** — galaxies → systems → planets → documents → concepts →
  facts, all from typed mock data (38 nodes / 45 relationships).
- **Inspector Panel** — name, type, description, tags, importance, memory count,
  related nodes, created/updated dates, and **suggested AI actions** with mock
  responses (Summarize, Find related ideas, Generate next steps, Create project
  brief, Export as markdown).
- **Left Navigator** — search, filter by type, filter by galaxy, full node list,
  bookmarks, and recently-updated nodes. Clicking focuses the 3D camera.
- **Memory Command Bar** — *"Ask your galaxy anything…"* Supports mock commands
  like `show zenflow`, `show hybrid living`, `show research`, `find agents`,
  `reset view`, and falls back to search.
- **Timeline Slider** — scrub time to fade nodes by their updated date.
- **Constellation Discoveries** — AI-style insight cards that fly you to the
  relevant nodes.
- **AI Agents** — Hermes (messenger), Memory Keeper (archive guardian), and
  Research Agent (observatory scout) drift along paths between planets with
  comet trails.
- **Add Memory** — a Zod-validated modal; new nodes appear in the galaxy
  instantly (local Zustand state).
- **Export** — download the current graph as JSON.

## Tech Stack

- **Vite** + **React 18** + **TypeScript** (strict)
- **React Three Fiber** + **Three.js** + **@react-three/drei** (Stars,
  OrbitControls, Html, Line, Trail, useGLTF)
- **Zustand** — app state
- **TanStack Query** — data-fetch boundary (mock today, Supabase-ready)
- **Tailwind CSS** + shadcn/ui-style primitives
- **Framer Motion** — panel/modal transitions
- **Zod** — schema validation
- **Lucide React** — icons

> The main galaxy objects are **real Three.js geometry, materials, particles,
> and procedural effects** — no SVGs.

## Install

```bash
pnpm install      # or: npm install
```

## Develop

```bash
pnpm dev          # start Vite dev server → http://localhost:5173
pnpm build        # type-check + production build
pnpm preview      # preview the production build
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint
```

> Uses **pnpm** if available; all commands work with **npm** too.

## Folder Structure

```
src/
  app/
    App.tsx               # root component
    providers.tsx         # TanStack Query provider
  components/
    layout/               # AppShell, TopBar, LeftSidebar, InspectorPanel,
                          # CommandBar, TimelineSlider, DiscoveriesPanel, AddMemoryModal
    galaxy/               # GalaxyCanvas, GalaxyScene, GalaxyNode, PlanetNode,
                          # SolarSystemNode, WormholeLine, AgentOrb, NebulaField,
                          # StarField, CameraRig, ModelLoader
    ui/                   # Button, Card, Input, Badge, Dialog, Tabs, Slider
  data/
    mockMemoryGraph.ts    # 38 nodes / 45 edges + agents + discoveries
  hooks/
    useMemoryGraph.ts     # query + visibility/filter/timeline resolution
    useGalaxyCommands.ts  # command-bar parser
  lib/
    cn.ts  exportJson.ts  graphUtils.ts  constants.ts
  schemas/
    memoryNode.schema.ts  # Zod schemas
  store/
    useGalaxyStore.ts     # Zustand store
  types/
    memory.ts             # domain types
  styles/
    globals.css           # Tailwind + glassmorphism utilities
public/
  models/                 # ← drop Blender .glb/.gltf here
  textures/               # ← drop texture maps here
```

## Blender Asset Workflow

Memory Galaxy is ready for custom Blender-made assets.

1. **Model** your object in Blender.
2. **Export** via `File → Export → glTF 2.0 (.glb/.gltf)`:
   - Format: **glTF Binary (.glb)** (single self-contained file)
   - Enable **Apply Modifiers**, **+Y Up**, and **Materials**
   - Keep textures embedded, or place them in `public/textures`
3. **Drop** the `.glb` into `public/models/` (e.g. `public/models/planet.glb`).
4. **Use** the `ModelLoader` component, which loads via drei's `useGLTF`
   (GLTFLoader) and renders a **procedural fallback mesh** when the model is
   absent or still loading:

   ```tsx
   import { ModelLoader } from '@/components/galaxy/ModelLoader'

   <ModelLoader url="/models/planet.glb" fallbackColor="#00D9B5" scale={1.2} />
   ```

   To switch a node from the procedural mesh to a real model, render
   `<GltfModel />` (exported from the same file) once the asset exists, and
   optionally `useGLTF.preload('/models/planet.glb')`.

V1 ships **no** binary models, so the fallback meshes render by default — but the
entire GLTF path is wired and waiting.

## Future Supabase Schema Idea

V1 keeps the data layer behind TanStack Query (`useMemoryGraph.ts`) so V2 can
swap the mock `queryFn` for a Supabase client without touching components.

```sql
-- nodes (every object in the galaxy)
create table memory_nodes (
  id           text primary key,
  name         text not null,
  type         text not null,          -- galaxy | system | planet | document | concept | fact | agent
  description  text default '',
  category     text default 'General',
  parent_id    text references memory_nodes(id),
  position     jsonb not null,         -- { x, y, z }
  color        text not null,
  size         real not null,
  importance   int  not null,          -- 0..100
  memory_count int  not null default 0,
  tags         text[] default '{}',
  embedding    vector(1536),           -- pgvector for semantic search (V2)
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- edges (semantic relationships → wormholes)
create table memory_edges (
  id        text primary key,
  source    text references memory_nodes(id) on delete cascade,
  target    text references memory_nodes(id) on delete cascade,
  relation  text not null,             -- depends-on | related-to | derives-from | references | powers
  weight    real not null default 0.6
);
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (see `.env.example`).

## V2 Roadmap

- 🗄️ **Supabase persistence** — real CRUD + auth
- 🔎 **Real vector search** — pgvector semantic recall
- 🕸️ **Neo4j graph backend** — native graph queries at scale
- 🧠 **AI summarization** — wire the inspector actions to a real model
- 📥 **Google Drive import** & **Obsidian import**
- 📜 **Agent activity logs** — observe what agents touch
- 👥 **Multiplayer galaxies** — shared, live exploration
- 🔐 **Permissions / private galaxies**
- 🎙️ **Voice command mode**
- 🕶️ **WebXR / VR mode**

---

<div align="center">
<sub>Built with React Three Fiber. No secrets, no backend required for V1.</sub>
</div>
