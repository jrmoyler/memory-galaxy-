# 3D Models (.glb / .gltf)

Drop Blender-exported models here. They are served from `/models/<file>.glb` at runtime.

## How to use

```tsx
import { ModelLoader } from '@/components/galaxy/ModelLoader'

// Renders /public/models/planet.glb, falling back to a procedural mesh if missing.
<ModelLoader url="/models/planet.glb" fallbackColor="#00D9B5" scale={1.2} />
```

## Exporting from Blender

1. Select your object(s).
2. `File → Export → glTF 2.0 (.glb/.gltf)`.
3. Format: **glTF Binary (.glb)** (single self-contained file).
4. Enable **Apply Modifiers**, **+Y Up**, and include **Materials**.
5. Keep textures embedded, or place them in `/public/textures` and reference relatively.
6. Save the file into this directory.

See the project README ("Blender asset workflow") for the full guide.
