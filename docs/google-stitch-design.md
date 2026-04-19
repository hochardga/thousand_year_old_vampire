# Design System Strategy: The Living Archive

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Haunted Archivist."**

We are not building a game menu; we are curating a digital reliquary. This system rejects the sterile, symmetrical perfection of modern SaaS UI in favor of a "tactile history." The interface must feel like a rare library volume that has been handled by many hands—some perhaps not human.

To break the "template" look, we utilize **intentional asymmetry**. Elements should appear as if they were pasted, tucked, or clipped into a ledger. Content blocks should not always align to a rigid center; they should lean into the margins, overlap like scattered catalog cards, and use varying vertical rhythms to evoke a sense of a physical, lived-in object.

---

## 2. Colors & Surface Logic
This palette is rooted in organic decay and historical pigments. It moves away from "digital black" into deep oxbloods and graphite inks.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to define sections or separate content.
Boundaries in this design system are defined by:
1.  **Background Color Shifts:** A `surface-container-low` section sitting on a `surface` background.
2.  **Tonal Transitions:** Moving from `surface-variant` to `surface-container-high` to imply a physical edge or fold in the paper.
3.  **The Ghost Border:** If a boundary is functional for accessibility, use the `outline-variant` token at 15% opacity to create a "pressed" or "embossed" look rather than a drawn line.

### Surface Hierarchy & Nesting
Treat the UI as a stack of physical layers.
- **Base Layer (`surface` / `#fff8f1`):** The primary page or parchment.
- **The Tucked Note (`surface-container-low`):** Used for secondary asides or archived thoughts.
- **The Catalog Card (`surface-container-highest`):** Used for interactive elements that need to feel "closer" to the user.
- **The "Ink Bleed" Gradient:** For high-impact areas, use a subtle linear gradient transitioning from `primary` (`#2a0002`) to `primary-container` (`#500308`) to give CTAs a liquid, "wet ink" soul.

### Glass & Shadow
While we avoid "modern" glass, we use **Glassmorphism** to represent "Vellum" or "Spirit." Use semi-transparent `surface` colors with a 4px backdrop blur for floating overlays to allow the underlying "paper grain" and "ink" to peek through, maintaining the illusion of a single physical object.

---

## 3. Typography: The Literary Voice
Typography is our primary tool for storytelling. We use a hierarchy that mimics 19th-century typesetting.

- **The Display Voice (`display-lg/md/sm`):** Set in **Noto Serif**. These must always be styled in *italics* to evoke the "Title Page" of a gothic novel. They carry the weight of the haunting.
- **The Narrative Voice (`body-lg/md/sm`):** Set in **Newsreader**. This is our literary workhorse. It is designed for long-form reading, echoing the readability of an old cloth-bound book.
- **The Marginalia (`label-md/sm`):** Though the token is Newsreader, these should be styled to represent the "Archivist’s Hand"—use increased letter spacing and, where the engine allows, swap for a **Monospaced/Typewriter** face to represent dates, archival stamps, and catalog numbers.

---

## 4. Elevation & Depth: Tonal Layering
We reject the 90-degree drop shadow. Elevation is achieved through **Tonal Layering** and **Ambient Light.**

### The Layering Principle
Instead of a shadow, place a `surface-container-lowest` card on a `surface-container-low` section. The slight shift in "warm bone" vs "parchment ivory" creates a natural, soft lift.

### Ambient Shadows
When an element must "float" (e.g., a modal scrap of paper), use a shadow with:
- **Blur:** 24px - 40px (Extra-diffused).
- **Opacity:** 6% - 10%.
- **Color:** Use a tinted version of `on-surface` (`#211b0c`) rather than grey. This mimics a shadow cast on old paper under candlelight.

### Sharpness (The 0px Scale)
There are no rounded corners in this system. **All `borderRadius` tokens are set to 0px.** Paper is cut, not molded. Even buttons and containers must maintain their sharp, architectural edges to preserve the "historical artifact" feel.

---

## 5. Components

### Buttons (The "Pasted Label")
- **Primary:** Background `primary` (`#2a0002`), text `on-primary` (`#ffffff`). No border.
- **Secondary:** Background `secondary-container` (`#d2e2ec`), text `on-secondary-container`. Should look like a faded indigo stamp.
- **Tertiary:** Text-only in `primary`, but with an `outline-variant` "Ghost Border" that only appears on hover to simulate a faint indentation.

### Input Fields (The "Ledger Line")
- **Style:** Avoid boxed inputs. Use a single bottom border using `outline` (`#877270`) at 40% opacity.
- **States:** When active, the border color shifts to `primary` (Oxblood) and thickens to 2px, resembling a fresh ink stroke.

### Chips (The "Library Tag")
- **Selection Chips:** Use `surface-container-highest` with `label-sm` text. They should look like small strips of paper pinned to the UI.

### Cards & Lists (The "Collage")
- **Forbid Dividers:** Do not use horizontal lines between list items. Use 16px of vertical white space (from the Spacing Scale) or alternating background shifts between `surface-container-low` and `surface-container-lowest`.
- **Asymmetric Borders:** Use the "Red floral/engraved border" imagery only on the *top and bottom* of a container, never a full four-sided box. This keeps the layout feeling open and editorial.

### Special Component: The "Scrap"
- A container using `surface-variant` (`#ede1c9`) with a slight rotation (-1 to +1 degree) to look like a piece of paper laid down carelessly.

---

## 6. Do's and Don'ts

### Do
- **Do** use `primary-fixed-dim` (`#ffb3ae`) for subtle highlights in text that needs attention without breaking the "historical" vibe.
- **Do** lean into white space. A "lonely" mood requires breathing room between the "artifacts."
- **Do** use `tertiary` (`#180d00`) for the heaviest text weights; it is a graphite black that feels softer and more "ink-like" than pure hex #000.

### Don't
- **Don't** use standard "Success" greens. If an action is successful, signify it through subtle iconography or a transition to `secondary` (muted indigo).
- **Don't** use center-alignment for everything. If a title is center-aligned, perhaps the body text is slightly offset to the left to create an "asymmetric but orderly" composition.
- **Don't** use any corner radius. A single rounded corner will instantly break the "historical artifact" illusion.
