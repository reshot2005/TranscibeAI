# VoiceVault AI - Reactbits Animation Components Build

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open http://localhost:3000
```

## All 20 Reactbits Components Integrated

### ✅ Verified Component Usage

#### Hero Section (`components/sections/Hero.tsx`)
- **TrueFocusText** - "Intelligent Audio" headline fade-in
- **MorphingTextWrapper** - Cycling "Recordings" → "Conversations" → "Insights"
- **TextRevealWrapper** - Subtitle paragraph word-by-word reveal
- **ShinyButton** (×2) - Primary + Secondary CTAs with shine effect
- **BorderBeamWrapper** - Product mockup card with animated 4-side beams
- **TypingAnimationWrapper** - Live transcript with auto-reset loop
- **ParticlesWrapper** - Background particles (30 count in Cyprus color)
- **AuroraBackground** - Animated gradient background

#### Main Page (`app/page.tsx`)
- **BlurInHeading** - "Powerful Features" heading blur-in on scroll
- **SpotlightCardWrapper** - 6 feature cards with spotlight effect
- **CountUpNumber** - Stats with Intersection Observer triggers
- **NumberTickerWrapper** - Alternative counter implementation
- **MarqueeWrapper** - Continuous scrolling integration logos
- **GlowingEffectWrapper** - Integration cards with glow on hover
- **MeteorsWrapper** - Falling meteors in bottom CTA section
- **FadeTextLink** - Footer links with fade animation
- **DockNavigation** - Floating bottom navigation (appears after 500px scroll)
- **ScrollProgressBar** - Top-of-page reading progress indicator
- **AnimatedListWrapper** - Available for transcript/list animations

## Color System - Cyprus ↔ Sand

### Light Mode (Default)
```css
Background: #F0EDE5 (Sand)
Text: #004643 (Cyprus 700)
Accents: #00796B, #002E2C (Cyprus variations)
Borders: #D9D2C8 (Sand 400)
```

### Dark Mode (Toggle with 🌙 button)
```css
Background: #001F1D (Cyprus 900)
Text: #F0EDE5 (Sand 900)
Accents: #00796B, #004643 (Cyprus variations)
Borders: #004643 (Cyprus 700)
```

### Color Override Properties
Every Reactbits wrapper accepts color overrides:
```tsx
<ShinyButton bgColor={CYPRUS[700]} textColor={SAND[900]} />
<SpotlightCardWrapper spotlightColor={CYPRUS[400]} bgColor={SAND[100]} />
<BlurInHeading color={CYPRUS[700]}>...</BlurInHeading>
```

## File Structure

```
app/
├── layout.tsx (DarkModeProvider wrapper)
├── page.tsx (Main landing page)
├── globals.css (CSS custom properties for theming)

components/
├── DarkModeToggle.tsx (Navbar theme switcher)
├── reactbits/ (20 wrapper components)
│   ├── TrueFocusText.tsx
│   ├── SpotlightCardWrapper.tsx
│   ├── AuroraBackground.tsx
│   ├── BorderBeamWrapper.tsx
│   ├── ParticlesWrapper.tsx
│   ├── TextRevealWrapper.tsx
│   ├── MorphingTextWrapper.tsx
│   ├── NumberTickerWrapper.tsx
│   ├── AnimatedListWrapper.tsx
│   ├── TypingAnimationWrapper.tsx
│   ├── ShinyButton.tsx
│   ├── GlowingEffectWrapper.tsx
│   ├── BlurInHeading.tsx
│   ├── MeteorsWrapper.tsx
│   ├── MarqueeWrapper.tsx
│   ├── ScrollProgressBar.tsx
│   ├── CountUpNumber.tsx
│   ├── FlipTextWrapper.tsx
│   ├── FadeTextLink.tsx
│   └── DockNavigation.tsx
├── sections/
│   └── Hero.tsx (8 Reactbits components in hero)
└── ui/ (shadcn/ui components)

lib/
├── dark-mode.ts (Zustand store + React context)
├── animations.ts (Framer Motion variants)
├── constants.ts (Color tokens, feature data)
└── utils.ts (shadcn utilities)

package.json
├── framer-motion@^11.0.3 (added)
└── zustand@^4.4.7 (added)
```

## Key Animation Features

### Page Load Animation
1. Navbar enters (opacity + y: -20)
2. Badge enters (opacity + y: -20)
3. Headline TrueFocus word-by-word
4. Subtitle TextReveal word-by-word
5. CTA buttons appear (stagger 0.15s)
6. Mockup card enters (scale + translateY)
7. Hero particles start floating
8. Aurora background animates

### Scroll Triggers
- **BlurInHeading**: Section titles blur-in as viewport enters
- **ScrollProgressBar**: Top bar fills as page scrolls (0-100%)
- **DockNavigation**: Appears at 500px scroll, magnifies on hover
- **CountUpNumber**: Triggered by Intersection Observer on stats section
- **SpotlightCard**: Staggered reveal as features scroll into view

### Continuous Animations
- **ParticlesWrapper**: Floating up + side-to-side (10-15s duration)
- **MeteorsWrapper**: Falling meteors (Infinity repeat)
- **MarqueeWrapper**: Seamless logo scroll (50s duration)
- **Speaker Bars**: Height oscillation in hero mockup
- **Rotating Badge**: "BLOCKER DETECTED" subtle rotation (3s)

## Dark Mode System

### Zustand Store
```tsx
const { isDark, toggleDarkMode, setDarkMode } = useDarkMode()
```

### Automatic Features
- Persists theme to localStorage
- Respects system preference on first load
- Applies `dark` class to `<html>` element
- All CSS custom properties reactive

### Manual Toggle
Click the 🌙/☀️ button in navbar to switch themes

## Performance Optimizations

- **Viewport once: true** - Animations don't re-trigger on re-render
- **Transform/opacity only** - GPU-accelerated animations
- **Staggered children** - Prevents layout thrashing
- **Lazy particle generation** - 30 particles with managed duration
- **Intersection Observer** - Only counts visible elements

## Testing Color Compliance

### Verify No Default Colors
```bash
# Search for hardcoded colors in Reactbits components
grep -r "rgba\|#\|rgb(" components/reactbits/ | grep -v "color\|bgColor\|spotlightColor"
# Should return 0 results (all colors passed as props)
```

### Verify Dark Mode Switching
1. Open DevTools → Application → Cookies → voicevault-dark-mode
2. Toggle 🌙 button in navbar
3. Verify localStorage updates
4. Verify `<html class="dark">` appears in DOM
5. Verify all colors invert to Cyprus/Sand palette

## Troubleshooting

### Components not rendering colors?
- Check that color props are passed to wrapper components
- Verify CYPRUS/SAND constants imported from lib/constants.ts
- Check that 'use client' is at top of component files

### Dark mode not persisting?
- Check browser allows localStorage
- Verify zustand store is initialized
- Check DarkModeProvider wraps entire app in layout.tsx

### Animations not running?
- Verify framer-motion installed: `pnpm list framer-motion`
- Check console for animation errors
- Verify viewport settings on scroll animations
- Check GPU acceleration in DevTools (Performance tab)

## Production Deployment

```bash
# Build for production
pnpm build

# Test production build locally
pnpm start

# Deploy to Vercel
git push origin main
```

All components are SSR-safe with 'use client' directives where needed. No external API calls required—this is a fully self-contained demo.
