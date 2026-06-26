# Homepage Soft Cream UI Design

## Goal

Refresh the current blog frontend so the whole site feels closer to the provided reference image: soft cream background, pale wave transition, warm but low-saturation accents, and lighter glass cards.

## Design Read

This is an editorial personal blog redesign for a design-sensitive solo site, with a soft anime-cafe visual language. Use warm cream neutrals, a restrained amber accent, a real image hero, and custom CSS/Tailwind polish.

Dial values:
- Design variance: 6. Preserve the current layout, but soften the composition and improve the hero-to-content transition.
- Motion intensity: 4. Keep simple entrance and wave motion only, with reduced-motion support.
- Visual density: 3. Make the lower content area lighter and more breathable.

## Scope

In scope:
- `components/HeroBanner.tsx` wave and hero polish.
- Global background tokens in `app/globals.css`.
- Homepage spacing and surface treatment in `app/page.tsx`.
- Key surface components touched by the existing redesign: search, cards, profile/nav cards, decorative effects.

Out of scope:
- Route structure, nav labels, content, markdown data, music logic, and dynamic admin work.
- Replacing the hero image.
- Changing the existing information architecture.

## Visual Direction

The target page should read as warm, bright, and calm. The wave should be pale cream with layered opacity and a soft highlight, not a saturated brown block. The content below the hero should sit on a continuous warm background with subtle radial light, not a separate dark band.

Use one accent family: amber. Avoid reintroducing purple-blue gradients as page-level accents. Cards can remain frosted, but should use warmer white fills, thinner borders, and softer shadows.

## Verification

Automated checks:
- A small Node test verifies the hero wave and global background use the intended cream tokens and do not contain the previous hard brown wave color.
- TypeScript and build/lint checks must run after implementation.

Visual checks:
- Inspect the homepage in desktop and mobile viewports.
- Confirm the hero wave is soft, the below-hero area is light, card text remains readable, and the nav stays on one line on desktop.
