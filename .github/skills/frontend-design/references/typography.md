# Typography Reference

Use typography to create identity before adding decoration.

## Goals

- Pair a distinctive display face with a refined supporting face.
- Build hierarchy with size, weight, case, spacing, and rhythm.
- Use fluid sizing with `clamp()`.

## Recommended Approach

### 1. Build a Type Scale

```css
:root {
  --step--1: clamp(0.875rem, 0.82rem + 0.2vw, 0.95rem);
  --step-0: clamp(1rem, 0.92rem + 0.35vw, 1.125rem);
  --step-1: clamp(1.2rem, 1.05rem + 0.7vw, 1.5rem);
  --step-2: clamp(1.5rem, 1.2rem + 1vw, 2.1rem);
  --step-3: clamp(1.9rem, 1.45rem + 1.6vw, 3rem);
}
```

### 2. Create Clear Roles

- **Display**: hero lines, scene labels, high-attention markers
- **Body**: reading, UI copy, helper text
- **Micro type**: captions, metadata, status, overlines

### 3. Control Texture

- tighten tracking for bold display lines
- increase tracking for small uppercase metadata
- avoid making every heading huge
- leave room for silence around important lines

## Do

- use a modular scale
- vary weight and size intentionally
- load only the weights you need
- choose type that matches the concept

## Avoid

- Inter / Roboto / Arial / Open Sans as defaults
- using monospace as a shortcut for “technical” tone
- identical heading styles across every section
- decorative icon-above-heading patterns that feel templated
