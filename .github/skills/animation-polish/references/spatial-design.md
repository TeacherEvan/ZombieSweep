# Spatial Design Reference

Space creates rhythm, hierarchy, and memorability.

## Principles

- Use varied spacing instead of one repeated padding value.
- Group related elements tightly and separate unrelated elements generously.
- Break the grid with intent, not by accident.

## Fluid Spacing Example

```css
:root {
  --space-xs: clamp(0.35rem, 0.3rem + 0.2vw, 0.5rem);
  --space-sm: clamp(0.6rem, 0.5rem + 0.35vw, 0.85rem);
  --space-md: clamp(1rem, 0.8rem + 0.7vw, 1.4rem);
  --space-lg: clamp(1.6rem, 1.2rem + 1.2vw, 2.4rem);
  --space-xl: clamp(2.5rem, 2rem + 2vw, 4rem);
}
```

## Do

- keep text mostly left-aligned
- use asymmetry for emphasis
- allow negative space to carry tone
- vary density across the page

## Avoid

- wrapping everything in cards
- nesting cards inside cards
- identical card grids repeated section after section
- centering every block by default
- making every section use the same spacing rhythm
