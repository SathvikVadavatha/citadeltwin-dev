# Replace the hero blueprint with a 3D digital twin

## Outcome
The landing page hero will show a crisp, interactive civil-engineering model instead of the abstract floor-plan animation.

## Changes
- Build a lightweight React Three Fiber hero scene with a detailed structural building cutaway, foundation slab, columns, beams, floor plates, and a restrained FEA stress overlay.
- Use directional lighting, contact shadows, material variation, and a fixed product-focused camera for sharp depth and legibility.
- Add gentle automatic rotation and pointer orbit controls, with motion disabled when reduced motion is requested.
- Overlay compact product telemetry for model status and structural analysis without obscuring the model.
- Replace only the current hero visual; retain the existing headline, calls to action, brand palette, and page structure.
- Validate the scene at desktop and mobile sizes, including interaction, framing, loading, and browser console errors.

## Technical details
- Use the project’s existing React Three Fiber, Drei, Three.js, and Framer Motion packages.
- Keep geometry procedural and optimized because this is a generated digital-twin visualization rather than a specific real-world building asset.
- Keep WebGL pixel ratio capped and shadow resolution within the mobile performance budget.
