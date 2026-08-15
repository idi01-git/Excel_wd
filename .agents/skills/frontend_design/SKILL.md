---
name: Frontend Design and UI Guidelines
description: Use this skill whenever you are creating or modifying frontend components, pages, or UI elements. It ensures consistency with the established editorial and minimalist design language.
---

# Frontend Design and UI Guidelines

When building or updating React/Next.js components for this project, you must adhere to the following design principles and styling conventions:

## 1. Typography
- **Headings**: Use `font-serif` for primary headings (H1, H2, titles, quotes). Make them bold and elegant (e.g., `font-serif text-4xl font-bold`).
- **Body & UI**: Use `font-sans` for regular text, descriptions, and buttons.
- **Labels/Metadata**: For tags, categories, dates, and small UI labels, use tiny, bold, uppercase text with wide tracking (e.g., `text-[10px] font-bold uppercase tracking-widest`).

## 2. Colors & Theming (Light/Dark Mode)
Always support both light and dark modes using Tailwind's `dark:` variant.
- **Backgrounds**: Light mode relies on white and `gray-50`. Dark mode uses `black` or `neutral-900`/`neutral-950`.
- **Borders**: Light mode uses `gray-100` or `gray-200`. Dark mode uses `neutral-800`.
- **Text**: Black/white for primary text. `gray-500`/`gray-600` (light) and `neutral-400`/`neutral-500` (dark) for secondary text.
- **Accents**: Use `violet-600` for light mode accents/hovers and `cyan-400` for dark mode accents/hovers.

## 3. UI Components & Borders
- **Cards & Containers**: Prefer subtle borders over shadows for the resting state. Add premium hover shadows like `hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgb(255,255,255,0.02)]`.
- **Dividers**: Separate sections using `border-b border-gray-200 dark:border-neutral-800` (occasionally `border-dashed` for a stylized look).
- **Buttons**: Use `rounded-full` for pill-shaped buttons and tabs.

## 4. Animations (Framer Motion)
Make the UI feel fluid and alive using `motion/react`:
- **Mount/Unmount**: Use `AnimatePresence` with `mode="popLayout"` and variants like `initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}`.
- **Layout Transitions**: Use `layoutId` for sliding pill indicators (tabs/toggles) with a spring transition: `transition={{ type: "spring", stiffness: 260, damping: 25, mass: 1 }}`.
- **Image Hovers**: Add slow zooms to images inside links: `group-hover:scale-105 transition duration-700 ease-out`.

## 5. Overall Taste
Aim for an **Editorial, Elegant, and Restrained** aesthetic. Let the whitespace breathe, keep noise to a minimum, and ensure all interactive elements have smooth, satisfying micro-animations.
