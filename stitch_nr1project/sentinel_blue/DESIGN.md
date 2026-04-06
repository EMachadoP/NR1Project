# Design System Specification: Institutional Intelligence

## 1. Overview & Creative North Star: "The Digital Architect"
This design system moves away from the "generic SaaS" aesthetic toward a philosophy of **Institutional Intelligence**. The goal is to provide a sense of architectural stability and high-end editorial clarity. Instead of a standard dashboard, the UI should feel like a custom-built physical console—authoritative, permanent, and meticulously organized.

**Creative North Star: The Digital Architect**
We reject the clutter of traditional grids. We embrace "The Digital Architect" by prioritizing structural breathing room, tonal depth, and intentional asymmetry. The respondent’s mobile experience feels like a guided editorial journey, while the HR portal operates with the precision of a high-density data terminal.

---

## 2. Colors & Surface Philosophy
The palette centers on deep institutional blues and neutral greys to establish trust. However, the execution must avoid "flatness."

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to define sections or containers. Boundaries must be defined exclusively through background color shifts or tonal transitions.
- Use `surface-container-low` for large section backgrounds.
- Use `surface-container-lowest` (pure white) for high-priority cards.
- Use `surface` as the global canvas.

### Surface Hierarchy & Nesting
Think of the interface as stacked sheets of fine, heavy-weight paper. 
- **Level 0 (Canvas):** `surface` (#f7f9ff)
- **Level 1 (Sectioning):** `surface-container` (#ebeef4)
- **Level 2 (Active Cards):** `surface-container-lowest` (#ffffff)
- **Level 3 (Interactions/Popovers):** Glassmorphism (Surface color at 80% opacity + 12px Backdrop Blur).

### Signature Textures & Gradients
To provide a "professional soul," use subtle gradients on primary CTAs and progress indicators. 
- **The Power Gradient:** Linear 135° from `primary` (#003d7c) to `primary_container` (#0054a6). This creates a soft, metallic sheen that feels more "custom" than a flat hex code.

---

## 3. Typography: The Editorial Edge
We utilize a two-family system to balance institutional authority with technical precision.

- **The Display Family (Public Sans):** Used for headlines and big numbers. It is sturdy, geometric, and carries the "Institutional" weight.
- **The Functional Family (Inter):** Used for titles, body text, and data. It provides maximum legibility at small scales, essential for complex risk reports.

**The Contrast Rule:** To achieve an editorial look, use extreme scale differences. Pair a `display-lg` headline (3.5rem) with a `label-md` (0.75rem) descriptor to create a clear visual hierarchy that feels designed, not just populated.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are too "web-standard." We use **Ambient Depth**.

- **The Layering Principle:** Instead of a shadow, place a `surface-container-lowest` card on a `surface-container-low` background. The slight shift in brightness creates a sophisticated "lift" without the "fuzz" of a shadow.
- **Ambient Shadows:** When a floating element (like a modal) is required, use a shadow with a blur radius of 32px or higher at only 6% opacity. Use the `on_surface` color for the shadow tint to maintain color harmony.
- **The Ghost Border:** If a divider is functionally required, use `outline_variant` at 20% opacity. A full-strength border is considered a failure of the layout.

---

## 5. Components

### Buttons: The Weighted Action
- **Primary:** No borders. 135° Gradient (`primary` to `primary_container`). Large horizontal padding (24px) to feel substantial. `md` roundedness (0.375rem).
- **Secondary:** `surface-container-highest` background with `on_primary_fixed_variant` text.
- **Tertiary:** Purely typographic with an underline that appears only on hover.

### Risk Badges (The Status Indicators)
Risk badges must not just use color, but "tonal weight."
- **Low Risk:** `surface-container-low` background with green text.
- **Critical Risk:** `tertiary` (#6a2b00) background with `on_tertiary` text.
- *Note:* Use high-contrast "pill" shapes (`full` roundedness) to make these stand out against the architectural squareness of the rest of the UI.

### Data Lists & Cards
- **The "No-Divider" Rule:** Forbid the use of line dividers. Use `surface_container_low` bands or 16px-24px vertical white space to separate list items.
- **Mobile Surveys:** One question per screen. Use a `surface-container-lowest` card that occupies 90% of the viewport width, floating over a `surface-container` background.

### Progress Bars: The "Flow" State
Progress bars should use a 2px height for the background (`surface-variant`) and a 4px height for the active state (`primary`), creating a "stepping" effect where the active progress visually "sits on top" of the track.

---

## 6. Do's and Don'ts

### Do
- **Do** use asymmetrical layouts for the HR Portal. For example, a wide data column next to a narrow "Insights" column.
- **Do** use `on_surface_variant` for secondary text to reduce visual noise.
- **Do** utilize "Glassmorphism" for mobile navigation bars (80% opacity + blur).

### Don't
- **Don't** use 100% black. Use `on_background` (#181c20).
- **Don't** use sharp 0px corners. We are institutional, but not aggressive. Use the `md` (0.375rem) or `lg` (0.5rem) scale.
- **Don't** use standard "drop shadows" on cards. Rely on tonal background shifts first.
- **Don't** crowd the data. If a table feels full, increase the `surface-container` padding rather than shrinking the text.