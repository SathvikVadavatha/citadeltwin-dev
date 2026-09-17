# Animated Commercial Building Hero

## Goal
Replace the landing page’s abstract blueprint graphic with an interactive 3D commercial-building scene based on the annotated reference.

## Changes
- Add a dedicated landing-page 3D scene with a modern multi-story commercial building, site plane, structural/FEA accents, and subtle engineering annotations.
- Use a compact, locally hosted CC0 model where suitable, with lighting, shadows, and materials aligned to CitadelTwin’s slate-and-safety-orange visual system.
- Animate a slow presentation orbit, pause automatic motion for reduced-motion users, and allow restrained pointer orbiting without zooming the page unexpectedly.
- Keep the existing hero copy and calls to action unchanged.
- Provide a polished loading/fallback state so the hero never appears blank.
- Verify the scene visually at desktop and mobile sizes, check interaction and browser errors, then create one task commit.

## Technical details
- Build with React Three Fiber 8 and Drei 9 already present in the project.
- Keep the 3D canvas performance-conscious with capped pixel ratio, limited shadows, and no runtime CDN dependencies.
- Use existing semantic design tokens for surrounding interface styling.
