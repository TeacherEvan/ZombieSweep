# Color and Contrast Reference

Use color as a system, not decoration.

## Principles

- Choose one dominant hue family and one sharp accent family.
- Tint neutrals toward the dominant hue.
- Keep contrast strong enough for real use, not just screenshots.

## Recommended Palette Construction

```css
:root {
  --bg: oklch(0.14 0.02 250);
  --surface: oklch(0.2 0.02 250);
  --surface-2: oklch(0.27 0.025 250);
  --text: oklch(0.9 0.02 95);
  --text-dim: oklch(0.72 0.02 95);
  --accent: oklch(0.65 0.19 28);
}
```

## Do

- use `oklch()` or `color-mix()` when possible
- tint grays toward the brand hue
- use background-aware text colors instead of generic gray
- reserve the strongest accent for the most important moments

## Avoid

- pure `#000` and pure `#fff`
- cyan-on-dark / purple-blue neon default palettes
- gradient text on headings or metrics
- evenly distributing all colors everywhere

## Contrast Check

- body text should be comfortably readable
- metadata can be dimmer, but not ghosted
- reduced-motion and high-focus states still need high contrast
