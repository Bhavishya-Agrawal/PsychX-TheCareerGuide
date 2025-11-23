# 🎨 Pearl Design System - PathFinder AI

## Overview
PathFinder AI has been redesigned with inspiration from the **Pearl Framer Template** (https://pearl.framer.website/), featuring a sophisticated, minimalist aesthetic with smooth animations and a warm, professional color palette.

---

## 🎨 Color Palette

### Primary Colors
```css
--cream: #F5F3EF         /* Main background - warm, soft beige */
--cream-dark: #E8E5DF    /* Borders and subtle dividers */
--navy: #1A1A1A          /* Primary text and buttons - deep navy/black */
--charcoal: #2D2D2D      /* Secondary text and elements */
--white: #FFFFFF         /* Card backgrounds and light surfaces */
```

### Text Colors
```css
--gray: #666666          /* Body text */
--gray-light: #999999    /* Subtle text and labels */
```

### Accent Colors
```css
--accent-peach: #FFD4C4     /* Soft peach for highlights */
--accent-mint: #C4E8D1      /* Mint green for success states */
--accent-lavender: #D4C4FF  /* Lavender for secondary accents */
--accent-blue: #C4D4FF      /* Light blue for info states */
```

---

## 📐 Layout & Spacing

### Grid & Containers
- **Section Padding**: 5rem (desktop), 3rem (mobile)
- **Card Radius**: 24px (large cards), 20px (standard), 16px (small)
- **Max Content Width**: 1200px centered
- **Generous Whitespace**: 2-3x more spacing than traditional designs

### Responsive Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

---

## 🔤 Typography

### Font Family
**Inter** - Clean, modern sans-serif with excellent readability
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Heading Styles
```css
/* Large Hero Headings */
.pearl-heading {
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.1;
  color: var(--navy);
}

/* Subheadings */
.pearl-subheading {
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--charcoal);
}

/* Body Text */
.pearl-body {
  font-weight: 400;
  line-height: 1.7;
  color: var(--gray);
}
```

### Type Scale
- **Hero**: 48-80px (mobile: 32-48px)
- **H1**: 40-48px
- **H2**: 32-36px
- **H3**: 24-28px
- **Body**: 16-18px
- **Small**: 14-16px

---

## 🎭 Components

### Buttons

#### Primary Button
```css
.pearl-btn-primary {
  background: var(--navy);
  color: var(--white);
  padding: 1rem 2rem;
  border-radius: 100px;  /* Fully rounded */
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(26, 26, 26, 0.15);
}

/* Hover State */
.pearl-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(26, 26, 26, 0.2);
}
```

#### Secondary Button
```css
.pearl-btn-secondary {
  background: transparent;
  color: var(--navy);
  border: 2px solid var(--navy);
  border-radius: 100px;
}

.pearl-btn-secondary:hover {
  background: var(--navy);
  color: var(--white);
}
```

### Cards

#### Standard Card
```css
.pearl-card {
  background: var(--white);
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(26, 26, 26, 0.06);
  border: 1px solid rgba(26, 26, 26, 0.06);
}
```

#### Minimal Card
```css
.pearl-card-minimal {
  background: var(--white);
  border-radius: 20px;
  padding: 1.5rem;
  border: 1px solid var(--cream-dark);
}
```

#### Hover Effect
```css
.pearl-card-hover:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 60px rgba(26, 26, 26, 0.12);
}
```

### Input Fields
```css
/* Text Inputs & Selects */
input, select {
  background: var(--white);
  border: 2px solid var(--cream-dark);
  border-radius: 20px;
  padding: 1rem 1.25rem;
  font-size: 1rem;
  color: var(--navy);
}

/* Focus State */
input:focus, select:focus {
  border-color: var(--navy);
  box-shadow: 0 0 0 3px rgba(26, 26, 26, 0.08);
  outline: none;
}
```

---

## ✨ Animations

### Easing Curve
All animations use the **Pearl Easing Function**:
```css
cubic-bezier(0.16, 1, 0.3, 1)
```
This creates smooth, natural-feeling motion with a slight elastic bounce.

### Animation Types

#### Fade In
```css
@keyframes pearlFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.animate-fade-in {
  animation: pearlFadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}
```

#### Slide Up
```css
@keyframes pearlSlideUp {
  from {
    transform: translateY(40px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

#### Scale In
```css
@keyframes pearlScaleIn {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
```

#### Hover Transitions
- **Duration**: 0.3-0.4s
- **Transform**: translateY(-4px to -8px)
- **Shadow**: Increase depth on hover
- **Scale**: Subtle scale (1.02-1.05) for emphasis

---

## 🎯 Design Principles

### 1. **Generous Whitespace**
- Never cram content together
- Use 2-3x more padding than you think necessary
- Let content breathe

### 2. **Subtle Depth**
- Use soft shadows (10-15% opacity)
- Layer elements with slight elevation changes
- Avoid harsh borders

### 3. **Smooth Motion**
- All interactions have transitions
- Use consistent easing curves
- Hover states provide visual feedback

### 4. **Typography Hierarchy**
- Large, bold headings with tight letter-spacing
- Clear size differences between levels
- Ample line-height for readability (1.6-1.8)

### 5. **Minimal Color Usage**
- Primarily monochrome (navy, charcoal, gray)
- Accent colors used sparingly
- Cream background provides warmth

### 6. **Rounded Everything**
- Buttons: Fully rounded (100px radius)
- Cards: Large radius (20-24px)
- Images: Rounded corners (16-20px)
- Inputs: Soft rounded (20px)

---

## 🔧 Implementation Details

### Global Classes

```css
/* Apply to any element for smooth transitions */
.pearl-transition {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Gradient text effect */
.pearl-gradient-text {
  background: linear-gradient(135deg, var(--navy) 0%, var(--charcoal) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Section wrapper */
.pearl-section {
  padding: var(--section-padding) 1rem;
}
```

### Scrollbar Customization
```css
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: var(--cream);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--gray-light);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--gray);
}
```

---

## 📱 Responsive Behavior

### Mobile Optimizations
- Reduce section padding to 3rem
- Hero text scales down to 32-40px
- Cards have 1.5rem padding instead of 2rem
- Buttons stack vertically with full width
- Navigation becomes hamburger menu
- Touch-friendly target sizes (44px minimum)

### Tablet Adjustments
- 2-column grid layouts
- Moderate spacing reductions
- Side-by-side form layouts

---

## 🎨 Component Library

### Navigation
- **Navbar**: Sticky, transparent backdrop-blur, 80px height
- **Sidebar**: 288px width, smooth slide transitions, navy active state
- **Menu Toggle**: Hamburger icon for mobile, smooth animation

### Forms
- **Input Fields**: 2px border, 20px radius, focus ring effect
- **Buttons**: Fully rounded, lift on hover, shadow depth
- **Select Dropdowns**: Matches input styling
- **Form Groups**: Vertical spacing of 1.5rem

### Content
- **Cards**: 24px radius, subtle shadow, hover lift
- **Modals**: Centered, backdrop blur, scale-in animation
- **Badges**: Small rounded pills with accent colors
- **Avatars**: Circular or rounded-square with navy background

---

## 🚀 Usage Examples

### Hero Section
```tsx
<section className="pearl-section" style={{ background: 'var(--cream)' }}>
  <h1 className="text-6xl font-bold mb-6 pearl-heading animate-slide-up">
    Your Career Journey Starts Here
  </h1>
  <p className="text-xl pearl-body mb-8">
    Data-driven insights to shape your future
  </p>
  <button className="pearl-btn-primary">
    Get Started
  </button>
</section>
```

### Card Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
  <div className="pearl-card pearl-card-hover animate-scale-in">
    <h3 className="text-2xl font-bold mb-3 pearl-heading">Feature One</h3>
    <p className="pearl-body">Description goes here...</p>
  </div>
</div>
```

---

## 🎯 Key Differentiators from Previous Design

| Aspect | Before | After (Pearl) |
|--------|--------|---------------|
| **Background** | Gradient (slate-indigo) | Solid cream (#F5F3EF) |
| **Primary Color** | Indigo (#4F46E5) | Navy (#1A1A1A) |
| **Border Radius** | 8-12px | 20-24px |
| **Button Style** | Rectangular | Fully rounded (pill) |
| **Shadows** | Medium depth | Subtle, soft shadows |
| **Typography** | Standard weights | Bold headings, tight spacing |
| **Animations** | Basic fade/slide | Smooth elastic easing |
| **Spacing** | Standard | Generous (2-3x more) |
| **Color Usage** | Multiple brand colors | Minimal, monochrome + accents |

---

## 📦 Files Modified

1. **index.css** - Complete design system, variables, animations
2. **Auth.tsx** - Pearl-styled login/signup page
3. **Layout.tsx** - Redesigned navbar and sidebar
4. **UI.tsx** - Pearl-styled Button, Input, Card, Modal components

---

## 🎨 Design Inspiration

**Pearl Template**: https://pearl.framer.website/

**Key Characteristics:**
- Minimalist elegance
- Warm, neutral palette
- Generous spacing
- Smooth, refined animations
- Professional yet approachable
- Strong typographic hierarchy

---

## ✅ Next Steps

To complete the Pearl transformation:

1. **Dashboard Pages**: Apply card grid layouts with hover effects
2. **Charts & Visualizations**: Use navy/charcoal with accent colors
3. **Assessment Flow**: Multi-step forms with progress indicators
4. **Consultation Room**: Video interface with minimal chrome
5. **Roadmap View**: Timeline with connected nodes and smooth scrolling
6. **Hero Sections**: Add large typography and centered layouts

---

**Design System Version**: 1.0  
**Last Updated**: November 23, 2025  
**Template Inspiration**: Pearl by Dawid Pietrasiak
