# Yin-yang ink logo

`yin-yang.png` was generated with the built-in image generator on 2026-10-12, with `transparent_background: true`. It is retained unmodified, including its alpha channel. The static build copies it under a content-hashed name and uses it as the masthead mark, colophon mark, and favicon.

Prompt:

> Use case: logo-brand. Asset type: a yin-yang logo for a contemplative Tao Te Ching reading website. Create a single elegantly balanced traditional taijitu (yin-yang) emblem, centered with generous transparent margin, black sumi ink on transparent background. The two interlocking teardrop shapes and the opposing circular dots must be anatomically correct and unmistakable; light regions are transparent negative space. Old handmade Chinese ink brush aesthetic, subtle capillary spreading, soft feathered edges, dry-brush breaks, tiny natural ink blots and varied black density, but overall clean restrained silhouette readable at 48 pixels. Flat scanned ink artwork, no paper rectangle, no letters, no text, no shadow, no mockup, no extra ornament. Square image.

The animated warm-ink contours are drawn procedurally in `src/app.js`, independently of this raster asset.

## Geometry correction

The active logo was corrected with the built-in image generator on 2026-10-12, using the original as an edit reference and `transparent_background: true`. The lower black lobe is now filled around a single transparent dot; the upper light lobe contains the opposite black dot. The previous hollow lower ring was removed. The replacement remains at `assets/art/yin-yang.png` and is used consistently in the masthead, favicon, and colophon.

Correction prompt:

> Correct the geometry of this yin-yang logo while retaining the old Chinese ink-brush texture and gentle feathering. The current lower lobe is WRONG: it has a large pale hollow ring around a black dot. Replace the symbol with a geometrically correct classic taijitu: one circular disc, divided into TWO EQUAL interlocking comma-shaped halves by ONE smooth S curve. The upper lobe belongs to the LIGHT HALF and contains ONE small solid BLACK circular dot centered in that upper lobe. The lower lobe belongs to the BLACK HALF: it must be FILLED SOLID BLACK all around ONE small TRANSPARENT circular dot centered in that lower lobe. The upper and lower dots have exactly the same diameter, approximately 1/6 of the whole disc diameter. No ring around either dot. No black dot inside the transparent lower dot. In the lower half of the disc, the black region must bulge into a full round lobe rather than forming a hollow C shape. Preserve a thin irregular ink outline around the LIGHT outer edge, subtle spreading and blotting on the silhouette, restrained texture. Transparent background, also transparent light half and transparent dot; black and transparent only. Center the single logo with generous transparent margin. No letters, no decoration, no extra circles. This must be immediately recognizable as the traditional yin-yang ☯ with equal halves and opposite dots.
