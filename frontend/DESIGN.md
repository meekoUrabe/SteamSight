---
name: Obsidian Neon
colors:
  surface: '#051424'
  surface-dim: '#051424'
  surface-bright: '#2c3a4c'
  surface-container-lowest: '#010f1f'
  surface-container-low: '#0d1c2d'
  surface-container: '#122131'
  surface-container-high: '#1c2b3c'
  surface-container-highest: '#273647'
  on-surface: '#d4e4fa'
  on-surface-variant: '#bac9cc'
  inverse-surface: '#d4e4fa'
  inverse-on-surface: '#233143'
  outline: '#849396'
  outline-variant: '#3b494c'
  surface-tint: '#00daf3'
  primary: '#c3f5ff'
  on-primary: '#00363d'
  primary-container: '#00e5ff'
  on-primary-container: '#00626e'
  inverse-primary: '#006875'
  secondary: '#d1bcff'
  on-secondary: '#3c0090'
  secondary-container: '#7000ff'
  on-secondary-container: '#ddcdff'
  tertiary: '#efebee'
  on-tertiary: '#313032'
  tertiary-container: '#d2cfd2'
  on-tertiary-container: '#59585b'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#9cf0ff'
  primary-fixed-dim: '#00daf3'
  on-primary-fixed: '#001f24'
  on-primary-fixed-variant: '#004f58'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d1bcff'
  on-secondary-fixed: '#23005b'
  on-secondary-fixed-variant: '#5700c9'
  tertiary-fixed: '#e5e1e4'
  tertiary-fixed-dim: '#c8c6c8'
  on-tertiary-fixed: '#1c1b1d'
  on-tertiary-fixed-variant: '#474649'
  background: '#051424'
  on-background: '#d4e4fa'
  surface-variant: '#273647'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.08em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-desktop: 40px
  margin-mobile: 16px
  panel-padding: 24px
---

## Brand & Style

The design system is a fusion of **High-End Tech** and **Refined Cyberpunk**. It moves away from the chaotic neon aesthetic into a more disciplined, luxury "Dark-Mode First" environment. The visual language is defined by the contrast between an infinite void (Deep Black) and razor-sharp, luminous data points. 

The target audience is game developers, publishers, and high-stakes investors who require data density without the clutter. The UI evokes a sense of "Mission Control" sophistication—authoritative, futuristic, and impeccably organized. We utilize **Glassmorphism** to create layers of information that appear to float in a multi-dimensional space, using light and blur rather than shadows to define hierarchy.

## Colors

The palette is anchored in absolute darkness to maximize the luminosity of data visualizations.

- **Primary (Cyber Blue):** Reserved for active states, primary actions, and critical data trends. It should appear to "glow" against the dark background.
- **Secondary (Aether Purple):** Used sparingly for secondary data series or hover states to provide depth.
- **Surface:** The background is a true `#000000` to allow glass panels to pop.
- **Glass Stroke:** A semi-transparent white (`rgba(255, 255, 255, 0.1)`) is used for panel borders to catch the "light" of the background.
- **Typography:** High-contrast White (`#FFFFFF`) for headers and Slate Gray (`#94A3B8`) for metadata.

## Typography

This design system utilizes a trio of typefaces to establish its technical pedigree. **Geist** provides a sharp, geometric feel for large headings. **Inter** handles the heavy lifting of data reading with its exceptional legibility. **JetBrains Mono** is used for all "technical" data points—coordinates, timestamps, and currency values—to reinforce the analytics/developer-centric nature of the platform.

All labels should be set in uppercase when using the Monospace font to mimic terminal readouts.

## Layout & Spacing

The layout follows a **Fixed-Fluid Hybrid** model. The sidebar remains fixed at 280px, while the main content area utilizes a 12-column grid that expands to a maximum width of 1600px to ensure data visualizations remain readable on ultra-wide monitors.

Spacing follows a strict 4px base unit. Data-dense tables should use compact 8px vertical padding, while dashboard "hero" cards utilize 32px of internal padding to create a sense of luxury and breathing room. Gutters are kept wide (24px) to prevent the glass refraction effects of neighboring panels from bleeding into one another visually.

## Elevation & Depth

In this design system, depth is not created with shadows, but through **Optical Refraction**.

- **Level 0 (Floor):** Pure Black `#000000`.
- **Level 1 (Panels):** `rgba(255, 255, 255, 0.03)` with a `16px` backdrop-blur.
- **Level 2 (Modals/Overlays):** `rgba(255, 255, 255, 0.08)` with a `32px` backdrop-blur and a more prominent white top-border to simulate a light source from above.

Avoid dropshadows unless they are "Glow" shadows. A glow shadow uses the primary color (Cyan) with high spread and low opacity (e.g., `0 0 20px rgba(0, 229, 255, 0.3)`) to make an active element appear as if it is emitting light.

## Shapes

The shape language is **Technological Precision**. We use a "Soft" radius (4px to 8px) rather than fully rounded or pill shapes. This maintains a professional, engineered look. 

Buttons and input fields should have a `4px` radius. Large data containers and glass cards use an `8px` radius. This subtle rounding prevents the UI from feeling "sharp" or aggressive (Brutalist) while remaining much more serious than consumer-grade "bubbly" apps.

## Components

- **Glass Cards:** The signature component. Must have a `1px` solid border at `rgba(255, 255, 255, 0.1)`. The top border should be slightly brighter than the bottom to simulate a "rim light."
- **Neon Buttons:** Ghost-style by default with a Cyan border. On hover, the button fills with a subtle Cyan gradient and gains a soft outer glow.
- **Data Tables:** No vertical lines. Horizontal lines should be `rgba(255, 255, 255, 0.05)`. Header cells use `label-sm` (Monospace) in all caps with a muted gray color.
- **Sleek Sidebar:** A semi-transparent vertical bar on the left. Active items are indicated by a vertical Cyan "light bar" on the immediate left edge and a subtle text glow.
- **Status Indicators:** Small, circular "pips" with a heavy outer glow to indicate live telemetry.
- **Input Fields:** Darker than the background panels (`rgba(0,0,0,0.4)`) with a "bottom-only" or "subtle-outline" focus state in Cyan.