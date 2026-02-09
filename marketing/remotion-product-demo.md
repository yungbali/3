# KOTOMO Product Demo — Remotion Build Spec

**For:** Motion Graphics Designer (Remotion)
**Format:** 1920x1080, 30fps, ~60 seconds
**Output:** MP4 (H.264) + WebM for web embedding
**Repo:** `npx create-video@latest` → Use the `Blank` template

---

## Table of Contents

1. [Project Setup](#1-project-setup)
2. [Design Tokens](#2-design-tokens)
3. [Video Structure (Timeline)](#3-video-structure-timeline)
4. [Scene-by-Scene Breakdown](#4-scene-by-scene-breakdown)
5. [Component Reference (What to Rebuild)](#5-component-reference)
6. [Animation Patterns](#6-animation-patterns)
7. [Audio & SFX Notes](#7-audio--sfx-notes)
8. [Asset Checklist](#8-asset-checklist)

---

## 1. Project Setup

```bash
npx create-video@latest kotomo-demo
cd kotomo-demo
npm i
```

**Composition config (in `src/Root.tsx`):**

```tsx
import { Composition } from 'remotion';
import { KotomoDemo } from './KotomoDemo';

export const RemotionRoot = () => {
  return (
    <Composition
      id="KotomoDemo"
      component={KotomoDemo}
      durationInFrames={1800}  // 60s at 30fps
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
```

**Install Google Fonts:**

```bash
npm i @remotion/google-fonts
```

```tsx
import { loadFont as loadManrope } from '@remotion/google-fonts/Manrope';
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { loadFont as loadJetBrainsMono } from '@remotion/google-fonts/JetBrainsMono';

const { fontFamily: manrope } = loadManrope();
const { fontFamily: inter } = loadInter();
const { fontFamily: jetbrains } = loadJetBrainsMono();
```

---

## 2. Design Tokens

These are the **exact** values from the KOTOMO codebase. Use them verbatim.

### Colors

| Token | Hex | Usage |
|---|---|---|
| `BG_PRIMARY` | `#050507` | Video background, void |
| `BG_SURFACE` | `#0a0a0f` | Card backgrounds, input fields |
| `TEXT_PRIMARY` | `#ededed` | Headlines, bold text |
| `TEXT_SECONDARY` | `#a1a1aa` | Descriptions, muted labels |
| `ACCENT_PURPLE` | `#7b39fc` | Buttons, active states, progress bars, logo bg |
| `ACCENT_GREEN` | `#22c55e` | Success indicators, "Ready" badges, checkmarks |
| `BORDER` | `rgba(255, 255, 255, 0.08)` | Card borders, dividers |
| `BORDER_HOVER` | `rgba(255, 255, 255, 0.16)` | Hover state borders |

### Typography

| Role | Font | Weight | Size (px) |
|---|---|---|---|
| Hero Title | Inter | 500 (Medium) | 72–96 |
| Section Title | Inter | 500 | 36–48 |
| Body | Manrope | 300–400 | 18–24 |
| Labels/Badges | JetBrains Mono | 400 | 10–12 |
| Input Text | JetBrains Mono | 400 | 14–16 |

### Card Style (`.linear-card`)

```tsx
const linearCard: React.CSSProperties = {
  background: 'rgba(10, 10, 15, 0.6)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
  borderRadius: 12,
};
```

### Button Style (`.btn-primary`)

```tsx
const btnPrimary: React.CSSProperties = {
  background: 'radial-gradient(circle at top, #8b5cf6, #7c3aed)',
  boxShadow: '0 0 20px -5px rgba(124, 58, 237, 0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
  borderRadius: 6,
  color: 'white',
  fontFamily: manrope,
  fontWeight: 500,
  fontSize: 13,
  padding: '10px 20px',
};
```

---

## 3. Video Structure (Timeline)

Total: **1800 frames** (60 seconds at 30fps)

```
FRAME    TIME     SCENE
─────────────────────────────────────────────
0-90     0-3s     Scene 1: Brand Intro (Logo reveal)
90-270   3-9s     Scene 2: Hero Text Fade-In
270-480  9-16s    Scene 3: Input Interaction (Typing)
480-720  16-24s   Scene 4: Generation Process (Steps)
720-1020 24-34s   Scene 5: Audio Player (Result)
1020-1260 34-42s  Scene 6: Feature Cards
1260-1500 42-50s  Scene 7: Dual Voice Demo (Audio Playing)
1500-1680 50-56s  Scene 8: Stats & Social Proof
1680-1800 56-60s  Scene 9: CTA + Logo Outro
```

**In Remotion (top-level composition):**

```tsx
import { AbsoluteFill, Series } from 'remotion';

export const KotomoDemo = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#050507' }}>
      {/* Background Layer (always visible) */}
      <VideoBackground />

      <Series>
        <Series.Sequence durationInFrames={90}>
          <SceneBrandIntro />
        </Series.Sequence>
        <Series.Sequence durationInFrames={180}>
          <SceneHeroText />
        </Series.Sequence>
        <Series.Sequence durationInFrames={210}>
          <SceneInputTyping />
        </Series.Sequence>
        <Series.Sequence durationInFrames={240}>
          <SceneGeneration />
        </Series.Sequence>
        <Series.Sequence durationInFrames={300}>
          <SceneAudioPlayer />
        </Series.Sequence>
        <Series.Sequence durationInFrames={240}>
          <SceneFeatureCards />
        </Series.Sequence>
        <Series.Sequence durationInFrames={240}>
          <SceneDualVoice />
        </Series.Sequence>
        <Series.Sequence durationInFrames={180}>
          <SceneStats />
        </Series.Sequence>
        <Series.Sequence durationInFrames={120}>
          <SceneCTAOutro />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
```

---

## 4. Scene-by-Scene Breakdown

### Scene 1: Brand Intro (Frames 0–90 / 0–3s)

**What happens:**
1. Frame 0–30: Black screen. A single thin white horizontal line appears at center, width animates from 0 → 200px.
2. Frame 30–60: The line morphs into the audio waveform bars (15 vertical bars, staggered `spring()` animations).
3. Frame 60–80: The bars settle into the rounded-square logo shape. Purple fill fades in (`#7b39fc`).
4. Frame 80–90: "KOTOMO" wordmark fades in below the logo.

**Animation API:**
```tsx
const frame = useCurrentFrame();
const { fps } = useVideoConfig();

// Line width
const lineWidth = spring({ frame, fps, config: { damping: 12 } });
const width = interpolate(lineWidth, [0, 1], [0, 200]);

// Logo opacity
const logoOpacity = interpolate(frame, [60, 80], [0, 1], { extrapolateRight: 'clamp' });

// Wordmark
const wordmarkOpacity = interpolate(frame, [75, 90], [0, 1], { extrapolateRight: 'clamp' });
const wordmarkY = interpolate(frame, [75, 90], [10, 0], { extrapolateRight: 'clamp' });
```

**Layout:**
- Centered on screen.
- Logo: 64x64px rounded square.
- Wordmark: JetBrains Mono, 16px, semibold, tracking wide, white.

---

### Scene 2: Hero Text (Frames 90–270 / 3–9s)

**What happens:**
1. Frame 90–120: Badge fades in — `"System v1.0 Operational"` with pulsing green dot.
2. Frame 120–180: Main headline types in or fades in line-by-line:
   - Line 1: `"Turn raw ideas into"`
   - Line 2: `"studio podcasts."` (with gradient fade from white → grey)
3. Frame 180–230: Subtext fades in: `"Generate immersive audio episodes from a single topic."`
4. Frame 230–270: Hold / breathe.

**Text styles:**
- Headline: Inter, 72px, medium weight, tracking-tight, leading 1.1.
- `"studio podcasts."` gets a CSS gradient text fill: `from-white to-[#a1a1aa]`.
- Subtext: Manrope, 24px, light (300), color `#a1a1aa`.
- Badge: JetBrains Mono, 10px, uppercase, tracking-wide. Green dot = `#22c55e` with pulse animation.

---

### Scene 3: Input Interaction (Frames 270–480 / 9–16s)

**What happens:**
1. Frame 270–300: The input field slides in from below. It has the gradient glow border (purple → green blur behind it).
2. Frame 300–420: Simulated typing animation: `"The Future of React Server Components"` appears character by character (~3 chars/frame).
3. Frame 420–450: The "Generate" button glows brighter (purple pulse).
4. Frame 450–480: A simulated cursor click on the button. Button scales down slightly (0.98) then back to 1.0.

**Key elements to build:**
- Input container: `bg-[#0a0a0f]`, border `white/10`, rounded-lg, padding 6px.
- Left icon: Command icon (Lucide `Command`), color `#a1a1aa`.
- Text inside input: JetBrains Mono, 14px, white.
- Gradient glow: `absolute -inset-0.5`, gradient `from-[#7b39fc] to-[#22c55e]`, blur, opacity 30→50%.
- Generate button: `.btn-primary` styles. Contains sparkle icon + "Generate" text.

**Typing animation:**
```tsx
const frame = useCurrentFrame();
const text = "The Future of React Server Components";
const charsToShow = Math.min(Math.floor((frame - 30) * 3), text.length);
const visibleText = text.slice(0, Math.max(0, charsToShow));
```

---

### Scene 4: Generation Process (Frames 480–720 / 16–24s)

**What happens:**
1. Frame 480–510: The input area pushes left (or fades). The right-side Generation card slides in.
2. Frame 510–570: Step 1 `"Analyze Topic Semantics"` — spinner plays → checkmark appears, text gets strikethrough.
3. Frame 570–630: Step 2 `"Generate Multi-Speaker Script"` — same animation.
4. Frame 630–690: Step 3 `"Synthesizing Audio (Neural Model)"` — spinner stays active (pulsing).
5. Frame 690–720: Step 3 completes → checkmark. The "Processing" badge transitions to "Ready" (purple → green).

**Elements:**
- Card: `.linear-card` with noise texture overlay.
- Header: Podcast icon (purple bg, 48x48 rounded-lg) + "Processing" badge.
- Each step row:
  - Incomplete: Empty circle, `border: white/10`.
  - Active: Spinner ring, `border: #7b39fc`, `border-t: transparent`, `animate-spin`.
  - Complete: Green circle bg (`#22c55e/10`), green check icon, text strikethrough.

**Spinner animation (CSS-in-Remotion):**
```tsx
const rotation = interpolate(frame, [0, 30], [0, 360]);
// Apply as: transform: `rotate(${rotation % 360}deg)`
```

---

### Scene 5: Audio Player (Frames 720–1020 / 24–34s)

**What happens:**
1. Frame 720–750: The Generation card morphs/transitions into the Audio Player card.
2. Frame 750–780: The header shows: podcast icon + `"The Future of React Server Components"` + "Ready" badge (green).
3. Frame 780–900: Visualizer bars start bouncing (the 15-bar waveform animation).
4. Frame 780–1020: Progress bar animates from 0% → ~35% width. Timestamps update: `00:00` → `04:12`.
5. Frame 840–860: Play button appears (white circle, pause icon inside = implies it's playing).

**Visualizer bars:**
- 15 bars, each `w-1` (4px) wide, `bg-[#7b39fc]`, rounded-full.
- Heights: `[8, 12, 6, 10, 14, 8, 16, 10, 5, 12, 8, 4, 10, 14, 8]` px (static).
- Animated: Each bar oscillates using a sine wave with offset:

```tsx
const barHeight = interpolate(
  Math.sin((frame + index * 4) * 0.15),
  [-1, 1],
  [4, 20]
);
```

**Progress bar:**
```tsx
const progress = interpolate(frame, [0, 300], [0, 35], { extrapolateRight: 'clamp' });
// width: `${progress}%`
```

**Controls:** Skip Back, Play/Pause (white circle), Skip Forward. Static but visible.

---

### Scene 6: Feature Cards (Frames 1020–1260 / 34–42s)

**What happens:**
1. Frame 1020–1050: Section title fades in: `"Technical Specifications"`.
2. Frame 1050–1080: Subtitle: `"Built for developers and creators who demand precision."` fades in.
3. Frame 1080–1260: Three cards stagger in from bottom, 15 frames apart:
   - Card 1: **Multi-Agent Conversation** (Users icon)
   - Card 2: **Granular Control** (SlidersHorizontal icon)
   - Card 3: **Instant Publishing** (CloudUpload icon)

**Stagger animation:**
```tsx
// For card at index i:
const delay = i * 15;
const slideUp = spring({ frame: frame - delay, fps, config: { damping: 14 } });
const y = interpolate(slideUp, [0, 1], [40, 0]);
const opacity = interpolate(slideUp, [0, 1], [0, 1]);
```

**Card layout:**
- `.linear-card`, padding 24px, rounded-xl.
- Icon box: 40x40, rounded, `bg-[#0a0a0f]`, `border: white/10`.
- Title: Inter, 14px, medium, white.
- Description: Manrope, 12px, `#a1a1aa`, leading relaxed.

---

### Scene 7: Dual Voice Demo (Frames 1260–1500 / 42–50s)

**What happens:**
This is the "money shot" — it shows the actual output quality.

1. Frame 1260–1290: Transition back to the Audio Player card (center of screen).
2. Frame 1290–1500: Two speech bubbles alternate, simulating a live conversation transcript:
   - **Voice A** (left-aligned): `"So, server components... isn't that just going back to PHP?"`
   - **Voice B** (right-aligned): `"It feels like it, right? But the difference is hydration."`
3. Visualizer is active. Progress bar continues from ~35% → ~55%.

**Speech bubble styling:**
- Voice A: Left-aligned, `bg: rgba(255,255,255,0.05)`, border-left `3px solid #7b39fc`. Name: JetBrains Mono, 10px, `#7b39fc`.
- Voice B: Right-aligned, `bg: rgba(255,255,255,0.05)`, border-left `3px solid #22c55e`. Name: JetBrains Mono, 10px, `#22c55e`.
- Text types in character by character (same pattern as Scene 3).

---

### Scene 8: Stats (Frames 1500–1680 / 50–56s)

**What happens:**
1. Frame 1500–1530: Stats counter animation. Three numbers count up:
   - `< 60s` → Generation Time
   - `2` → AI Speakers
   - `48kHz` → Audio Quality
2. Frame 1530–1600: Below the stats, a row of tech logos/badges fades in:
   - `Claude 3.5` / `Cartesia Sonic-3` / `Next.js` / `Tailwind`
3. Frame 1600–1680: Hold.

**Counter animation:**
```tsx
const count = interpolate(frame, [0, 45], [0, 60], { extrapolateRight: 'clamp' });
// Display: `< ${Math.round(count)}s`
```

**Layout:** Centered, three columns, each with:
- Number: Inter, 48px, bold, white.
- Label: JetBrains Mono, 11px, uppercase, tracking-wider, `#a1a1aa`.

---

### Scene 9: CTA + Logo Outro (Frames 1680–1800 / 56–60s)

**What happens:**
1. Frame 1680–1710: Everything fades to black.
2. Frame 1710–1740: Logo fades in (same as Scene 1 final state).
3. Frame 1740–1770: Tagline types in below: `"Your personal audio studio."`
4. Frame 1770–1800: CTA text: `"Get Early Access → kotomo.app"`. Gentle purple glow pulse.

**Layout:** Centered vertically and horizontally. Simple and clean.

---

## 5. Component Reference

These are the actual KOTOMO components the designer should visually replicate:

| Component | Source File | Description |
|---|---|---|
| Video Background | `src/components/VideoBackground.tsx` | HLS video with 90% dark overlay + purple gradient mesh |
| Topic Form | `src/components/TopicForm.tsx` | Gradient-bordered input + Generate button |
| Generation Status | `src/components/GenerationStatus.tsx` | Step list with spinner/check states |
| Audio Player | `src/components/AudioPlayer.tsx` | Player card with header, visualizer, progress, controls |
| Visualizer | `src/components/Visualizer.tsx` | 15-bar animated waveform |
| Nav Bar | `src/app/page.tsx` (lines 79–105) | Fixed top bar with logo, links, CTA |
| Feature Cards | `src/app/page.tsx` (lines 309–349) | Three-column grid of linear cards |

---

## 6. Animation Patterns

Use these consistently across all scenes:

| Pattern | Remotion API | Values |
|---|---|---|
| **Fade In** | `interpolate(frame, [start, start+20], [0, 1])` | 20 frames (~0.66s) |
| **Slide Up** | `spring({ frame, fps, config: { damping: 14 } })` mapped to Y 30→0 | Physics-based |
| **Scale Click** | `spring()` mapped to scale 1→0.97→1 | Quick, 10 frames |
| **Typing** | Character slice per frame | ~3 chars/frame |
| **Progress Bar** | `interpolate(frame, [0, duration], [0, target%])` | Linear |
| **Stagger** | Delay each item by `index * 15` frames | 15-frame offset |

**Easing:** Use `spring()` for all element entrances. Use `interpolate` with `clamp` for progress-style animations.

---

## 7. Audio & SFX Notes

| Timestamp | Audio |
|---|---|
| 0–3s | Subtle digital hum → crisp "click" on logo resolve |
| 3–9s | Soft ambient pad (dark/cinematic) starts and loops |
| 9–16s | Keyboard typing SFX (mechanical, soft) |
| 16–24s | Subtle "processing" beep per completed step |
| 24–50s | AI-generated podcast audio sample plays (actual Cartesia output) |
| 50–56s | Ambient pad continues |
| 56–60s | Pad fades out → silence on final frame |

**Music:** A royalty-free dark ambient track. Suggested style: "Interstellar meets Linear". 80–90 BPM, minor key, synth pad.

---

## 8. Asset Checklist

The designer will need these files before starting:

- [ ] **KOTOMO Logo** (SVG, both icon-only and full wordmark)
- [ ] **Background video** (MP4, the HLS source or a local version of the abstract fluid mesh)
- [ ] **Noise texture** (SVG/PNG, the grain overlay from `grainy-gradients.vercel.app`)
- [ ] **Lucide Icons** (install via `npm i lucide-react`): `AudioWaveform`, `Command`, `Sparkles`, `Check`, `Users`, `SlidersHorizontal`, `CloudUpload`, `SkipBack`, `SkipForward`, `Play`, `Pause`
- [ ] **Audio sample** (MP3, a real generated KOTOMO episode for the dual-voice demo scene)
- [ ] **Google Fonts** (via `@remotion/google-fonts`): Manrope, Inter, JetBrains Mono
- [ ] **Screenshot reference** (PNG, a full-page screenshot of the live KOTOMO site at `localhost:3000`)
