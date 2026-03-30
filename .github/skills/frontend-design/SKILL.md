---
name: frontend-design
description: "Create distinctive, production-grade frontend interfaces with strong art direction and anti-template design discipline. Use for UI redesigns, visual systems, typography, color, layout, responsive behavior, and avoiding generic AI aesthetics."
argument-hint: "Feature, page, flow, or interface to design"
user-invocable: true
---

# Frontend Design

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic “AI slop” aesthetics. Implement real working code with exceptional attention to aesthetic detail, creative choices, and clear design intent.

## When to Use

Use this skill when you need to:

- design or redesign a page, feature, or user flow
- establish a strong visual direction for a frontend surface
- improve typography, color, layout, spacing, or interaction hierarchy
- refactor a UI that feels generic, templated, or visually timid
- create a memorable but production-ready interface system
- audit an interface against modern anti-slop design standards

## Mandatory Preparation

### Context Gathering First

You cannot do strong design work without the exact context:

- target audience
- primary use cases
- brand personality / tone
- technical constraints
- accessibility requirements
- performance constraints

Attempt to gather those from the thread and codebase first.

1. If you do **not** have exact information and would need to infer it, stop and ask targeted clarifying questions using the available question tool.
2. If confidence is medium or lower, stop and clarify before designing.

Do not guess. Guessing produces mismatched or over-designed interfaces.

### References to Review

Consult these references before implementation:

- `./references/typography.md`
- `./references/color-and-contrast.md`
- `./references/spatial-design.md`
- `./references/motion-design.md`
- `./references/interaction-design.md`
- `./references/responsive-design.md`
- `./references/ux-writing.md`

## Design Direction

Commit to a **bold** aesthetic direction:

- **Purpose**: What problem does the interface solve, and for whom?
- **Tone**: Pick a clear extreme — brutally minimal, maximalist chaos, retro-futuristic, organic, luxury, playful, editorial, brutalist, art deco, soft, industrial, and so on.
- **Constraints**: Respect framework, device, performance, and accessibility realities.
- **Differentiation**: Identify the one detail people will remember.

Bold maximalism and refined minimalism can both succeed. Intentionality is the goal.

Then implement working code that is:

- production-grade and functional
- visually striking and memorable
- cohesive with a clear point of view
- refined in spacing, typography, hierarchy, and interaction

## Frontend Aesthetics Guidelines

### Typography

Choose fonts that feel beautiful, interesting, and context-appropriate. Pair a distinctive display face with a refined supporting face.

**Do:**

- use fluid modular type scales with `clamp()`
- vary weight and size to create hierarchy
- use tracking and case intentionally

**Avoid:**

- Inter, Roboto, Arial, Open Sans, or generic defaults by reflex
- monospace as a lazy shortcut for “technical” tone
- templated heading stacks with decorative icons that add no meaning

### Color and Theme

Commit to a cohesive palette with a strong dominant hue and sharp accents.

**Do:**

- use `oklch()`, `color-mix()`, and hue-tinted neutrals where practical
- choose text colors that belong to the palette
- use contrast deliberately for hierarchy and clarity

**Avoid:**

- pure black / pure white
- gray text on colored backgrounds
- neon dark-mode clichés and purple-blue gradient defaults
- gradient text for “impact”

### Layout and Space

Create rhythm through varied spacing and composition.

**Do:**

- use fluid spacing with `clamp()`
- embrace asymmetry and intentional grid breaks
- keep text mostly left-aligned unless the concept truly calls for centering

**Avoid:**

- wrapping everything in cards
- nesting cards inside cards
- repetitive identical card grids
- uniform spacing everywhere
- centering every element by default

### Visual Details

Use decorative elements that reinforce the concept.

**Avoid:**

- generic glassmorphism
- lazy accent borders
- decorative sparklines with no meaning
- interchangeable rounded rectangles with drop shadows
- modals where inline design would work better

### Motion

Motion should clarify state and improve feel, not act as decoration.

**Do:**

- use motion to explain entrances, exits, and state changes
- prefer exponential ease-out curves
- use transform/opacity over layout animation

**Avoid:**

- bounce or elastic curves
- animating width, height, padding, margin, top, or left
- motion that exists only to look “fancy”

### Interaction

Make the interface feel fast and intentional.

**Do:**

- use progressive disclosure
- create clear action hierarchy
- design empty states that teach
- make every interactive surface feel responsive

**Avoid:**

- repeating visible information in labels or body copy
- making every button primary
- vague, generic microcopy

### Responsive Design

Adapt the interface for context instead of merely shrinking it.

**Do:**

- use component-level responsiveness and container queries where appropriate
- recompose layouts for smaller screens
- keep important actions available on touch devices

**Avoid:**

- hiding critical functionality on mobile
- assuming hover exists everywhere
- shrinking dense desktop layouts without rethinking hierarchy

### UX Writing

Every word should earn its place.

**Do:**

- use direct, specific language
- write labels around user intent
- make errors and empty states actionable

**Avoid:**

- filler copy
- duplicate headers and intros
- “manage everything in one place”-style vagueness

## AI-Slop Test

Ask this before finishing:

> If you showed this interface to someone and said “AI made this,” would they believe you immediately?

If yes, that is the problem. A strong interface should feel designed, not generated.

## Implementation Principles

Match implementation complexity to the aesthetic vision.

- maximalist designs may need richer code, layered compositions, and detailed interaction states
- restrained designs need precision, spacing discipline, and subtle but intentional hierarchy
- do not converge on the same fonts, colors, or layout patterns by habit

Interpret creatively. Make unexpected choices that still feel correct for the product.

## Execution Flow

1. Gather context from the thread and codebase.
2. Define a clear design direction.
3. Review the reference files relevant to typography, color, layout, interaction, motion, responsive design, and UX writing.
4. Audit the current interface for generic patterns and hierarchy problems.
5. Redesign the feature in working code.
6. Verify usability, accessibility, responsiveness, and performance.
7. Run the anti-slop check before wrapping up.

## Output Expectations

When using this skill:

- summarize the chosen design direction in one short paragraph
- name the intended audience, tone, constraints, and memorable differentiator
- implement real working code, not mock prose
- explain the typography, color, layout, and interaction decisions
- validate the result against accessibility and responsiveness constraints
- report exactly what changed and how it was verified
