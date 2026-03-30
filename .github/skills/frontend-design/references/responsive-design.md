# Responsive Design Reference

Responsive design should adapt the interface, not amputate it.

## Principles

- build mobile-first
- adapt layout and behavior, not just size
- keep critical functionality available everywhere

## Container Query Example

```css
.panel {
  container-type: inline-size;
}

@container (min-width: 42rem) {
  .panel__meta {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 1rem;
  }
}
```

## Do

- use fluid scales and spacing
- let components respond to their containers
- rewrite dense desktop compositions for narrow screens
- preserve interaction clarity on touch devices

## Avoid

- hiding essential controls on mobile
- assuming desktop hover behavior exists everywhere
- shrinking complex layouts without changing hierarchy
