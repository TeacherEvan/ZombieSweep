---
name: animation-polish
description: "Add purposeful animations and micro-interactions to an existing frontend feature. Use for motion polish, entrance choreography, state transitions, hover/click feedback, reduced-motion support, and production-grade UI delight without generic AI aesthetics."
argument-hint: "Feature, page, component, or user flow to animate"
user-invocable: true
---

# Animation Polish

This skill guides creation of distinctive, production-grade frontend motion that avoids generic “AI slop” aesthetics. Implement real working code with exceptional attention to aesthetic details, interaction quality, and creative choices.

## Design Direction

Commit to a **bold** aesthetic direction before touching code:

- **Purpose**: What problem does this interface solve, and who uses it?
- **Tone**: Pick an extreme and commit — brutally minimal, maximalist chaos, retro-futuristic, editorial, luxury, playful, raw, art deco, industrial, soft, organic, and so on.
- **Constraints**: Framework, performance budget, accessibility needs, and device targets.
- **Differentiation**: What is the one unforgettable detail or signature motion beat?

Bold maximalism and refined minimalism can both work. The key is precision and intent, not volume.

## Mandatory Preparation

### Context Gathering First

You cannot do strong motion work without the exact context:

- target audience
- primary use cases
- brand personality / tone
- performance constraints

Attempt to gather those from the thread and the codebase.

1. If you do **not** have exact information and would need to infer it, stop and ask targeted clarifying questions using the available question tool.
2. If your confidence is medium or lower, stop and ask clarifying questions before proceeding.

Do not guess. Guessing leads to inappropriate or excessive animation.

### Frontend Design Guidance

If a `frontend-design` skill exists in the workspace or user profile, use it first.
If it does not exist, consult the local reference files before proceeding:

- `./references/typography.md`
- `./references/color-and-contrast.md`
- `./references/spatial-design.md`
- `./references/motion-design.md`
- `./references/interaction-design.md`
- `./references/responsive-design.md`
- `./references/ux-writing.md`

Do not proceed until you know the core do’s and don’ts.

## AI-Slop Test

Ask this before and after implementation:

> If someone saw this interface and said “AI made this,” would they believe it immediately?

If yes, that is the problem. A distinctive interface should make people ask _how_ it was made, not _which model_ made it.

## Your Task

Analyze a feature and strategically add animations and micro-interactions that enhance understanding, provide feedback, and create delight.

The result should be:

- production-grade and functional
- visually striking and memorable
- cohesive with a clear aesthetic point-of-view
- meticulously refined in timing, spacing, and feedback

## Assess Animation Opportunities

Analyze where motion would improve the experience.

### 1. Identify Static Areas

Look for:

- **Missing feedback**: actions without acknowledgment
- **Jarring transitions**: abrupt show / hide or state changes
- **Unclear relationships**: spatial or hierarchical links that motion could explain
- **Lack of delight**: functional but joyless interactions
- **Missed guidance**: opportunities to direct attention or teach behavior

### 2. Understand the Context

Make sure you understand:

- the personality: playful vs serious, energetic vs calm
- the performance budget: mobile-first, heavy page, lightweight panel, etc.
- the audience: motion-sensitive users, expert users, casual users
- what matters most: one hero animation or many small interactions

If any of these are unclear, stop and ask clarifying questions.

**Critical:** always respect `prefers-reduced-motion` and provide reduced-motion alternatives.

## Plan the Animation Strategy

Create a purposeful motion plan with four layers:

- **Hero moment**: the one signature animation
- **Feedback layer**: the interactions that need acknowledgment
- **Transition layer**: the state changes that need smoothing
- **Delight layer**: the few places where surprise adds personality

One well-orchestrated experience beats scattered motion everywhere.

## Implement Animations

Add motion systematically.

### Entrance Animations

- page-load choreography with staggered reveals
- dramatic entrance for primary content
- content reveals on scroll when appropriate
- modal / drawer entry with smooth slide + fade

### Micro-Interactions

- button hover / press / loading states
- input focus and validation feedback
- toggle, checkbox, and radio transitions
- favorite / save / confirm delight moments

### State Transitions

- show / hide
- expand / collapse
- loading / loaded
- success / error
- enable / disable

### Navigation and Flow

- page or scene transitions
- tab switching
- carousel / slider movement
- scroll-based state changes

### Feedback and Guidance

- hover hints and tooltips
- drag / drop feedback
- copy confirmation
- focus-path guidance in workflows

### Delight Moments

- empty-state motion
- completed-action celebrations
- small easter eggs
- contextual animation tied to product personality

## Technical Implementation

Use techniques that match the job.

### Timing and Easing

Use these ranges intentionally:

- **100–150ms**: instant feedback
- **200–300ms**: hover and simple state changes
- **300–500ms**: layout-related transitions
- **500–800ms**: entrance choreography

Exit animations should usually be about 75% of entrance duration.

Recommended easing curves:

```css
--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
--ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1);
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);

/* Avoid */
/* bounce: cubic-bezier(0.34, 1.56, 0.64, 1); */
/* elastic: cubic-bezier(0.68, -0.6, 0.32, 1.6); */
```

### CSS Animation Guidance

Prefer CSS for:

- transitions between states
- short keyframed sequences
- `transform` + `opacity` animation

### JavaScript Animation Guidance

Prefer JavaScript or framework-native motion tools for:

- orchestrated sequences
- stateful interaction
- gesture-driven motion
- route or scene choreography

### Performance Rules

- prefer `transform` and `opacity`
- avoid animating layout properties like `width`, `height`, `top`, and `left`
- use `will-change` sparingly
- minimize paint-heavy effects
- keep the experience smooth on target devices

### Accessibility Rules

Always provide reduced-motion handling:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Never ignore reduced motion. Never let animation hide critical state. Never block interaction unless intentionally modal.

## Quality Verification

Before finishing, verify that the motion:

- runs smoothly and feels natural
- improves clarity or responsiveness
- matches the chosen tone
- respects reduced-motion preferences
- does not overwhelm the interface
- adds real value instead of decoration

## Output Expectations

When using this skill:

- summarize the chosen motion direction in one short paragraph
- identify the hero moment, feedback layer, transition layer, and delight layer
- implement the changes in working code
- verify performance and accessibility constraints
- report exactly what changed and how it was validated
