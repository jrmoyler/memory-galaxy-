# Textures

Place texture maps here (albedo / normal / roughness / emissive, HDRIs, etc.).
They are served from `/textures/<file>` at runtime.

Recommended:
- Use `.webp` or `.ktx2` for compressed color maps.
- Keep individual maps <= 2K for smooth performance on laptops.
- Embed textures directly in `.glb` exports when possible to reduce HTTP requests.

Load with drei helpers, e.g. `useTexture('/textures/planet-albedo.webp')`.
