# Motion Design Reference

Motion should explain, acknowledge, and delight.

## Timing

- **100–150ms**: press states, toggles, instant feedback
- **200–300ms**: hover, focus, menu open, local transitions
- **300–500ms**: accordions, drawers, content swaps
- **500–800ms**: hero entrances and page choreography

Exit motion is usually faster than entry motion.

## Easing

```css
:root {
  --ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
  --ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
}
```

Avoid bounce and elastic curves.

## Do

- animate `transform` and `opacity`
- orchestrate one memorable hero reveal
- use staggered entrances carefully
- simplify or disable motion for reduced-motion users

## Avoid

- animating `width`, `height`, `top`, `left`, `margin`, or `padding`
- long feedback animations that feel laggy
- constant looping motion that fights for attention
- decorative motion with no semantic purpose
