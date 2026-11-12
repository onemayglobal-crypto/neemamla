import { useCallback, useEffect, useRef, useState } from 'react'
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  useReducedMotion,
} from 'framer-motion'
import type { MotionValue } from 'framer-motion'
import './scroll-sequence.css'

// Keep the sequence, loading strategy, and story timing together for easy edits.
const FIRST_FRAME_COUNT = 180
const SECOND_FRAME_COUNT = 299
const FRAME_PATH = (frame: number) => `/assets/img/${frame + 1}.jpg`
const SECOND_FRAME_PATHS = Object.entries(import.meta.glob<string>('../assets/img/neem*.jpg', {
  eager: true,
  query: '?url',
  import: 'default',
}))
  .sort(([left], [right]) => {
    const frameNumber = (path: string) => Number(path.match(/\((\d+)\)\.jpg$/)?.[1] ?? 0)
    return frameNumber(left) - frameNumber(right)
  })
  .map(([, path]) => path)
const SECOND_FRAME_PATH = (frame: number) => SECOND_FRAME_PATHS[frame] ?? FRAME_PATH(frame)
const BG = '#061c17'
const BATCH_SIZE = 10
const SPRING = { stiffness: 90, damping: 28, mass: 0.6 }
type Beat = {
  range: [number, number, number, number]
  eyebrow: string
  title: string
  body: string
  kind?: 'hero' | 'details' | 'closing'
  chips?: [string, string, string]
}

const FIRST_BEATS: Beat[] = [
  { range: [0, 0.025, 0.12, 0.16], eyebrow: 'THE BOTANICAL HAIR RITUAL', title: 'Neemamla', body: 'Roots of nature. Strength of Ayurveda.', kind: 'hero' },
  { range: [0.15, 0.19, 0.34, 0.39], eyebrow: '01 — PURIFY', title: 'Rooted in Neem', body: 'A time-honoured botanical to care for the scalp and roots.' },
  { range: [0.38, 0.42, 0.57, 0.62], eyebrow: '02 — NOURISH', title: 'Charged with Amla', body: 'Amla-rich nourishment for hair that feels soft, glossy, and alive.' },
  { range: [0.61, 0.66, 0.79, 0.84], eyebrow: 'A LITTLE CARE GOES A LONG WAY', title: 'Pure oil. Visible strength.', body: 'A light, comforting ritual made for your everyday wash day.', kind: 'details' },
  { range: [0.83, 0.88, 0.98, 1], eyebrow: 'NATURE, IN EVERY DROP', title: 'Find Your Flavor', body: 'Make a little room for a ritual that feels like yours.', kind: 'closing' },
]

const SECOND_BEATS: Beat[] = [
  { range: [0, 0.025, 0.12, 0.16], eyebrow: 'THE NEEMAMLA HAIR RITUAL', title: 'Touch. Nourish. Repeat.', body: 'Neem and amla meet in a hair ritual made for a slower kind of care.', kind: 'hero' },
  { range: [0.15, 0.19, 0.34, 0.39], eyebrow: '01 — BEGIN AT THE SCALP', title: 'Care in every touch', body: 'A gentle massage turns oiling into a moment of calm.' },
  { range: [0.38, 0.42, 0.57, 0.62], eyebrow: '02 — FOLLOW EVERY STRAND', title: 'Root to tip', body: 'Smooth oil through your lengths, giving each strand a little attention.' },
  { range: [0.61, 0.66, 0.79, 0.84], eyebrow: 'YOUR MOMENT, YOUR WAY', title: 'A ritual worth keeping', body: 'Warm. Massage. Nourish. Your time, your way.', kind: 'details', chips: ['WEEKLY PRE-WASH', 'SCALP + LENGTHS', 'ALL HAIR TYPES'] },
  { range: [0.83, 0.88, 0.98, 1], eyebrow: 'ROOTS OF NATURE. STRENGTH OF AYURVEDA.', title: 'Let care take root', body: 'Bring the goodness of neem and amla into your hair ritual.', kind: 'closing' },
]

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
function StoryBeat({ beat, progress, index, reduced, currentBeat, ctaHref, ctaLabel, zoomText }: {
  beat: Beat
  progress: MotionValue<number>
  index: number
  reduced: boolean
  currentBeat: number
  ctaHref: string
  ctaLabel: string
  zoomText: boolean
}) {
  const opacity = useTransform(progress, beat.range, [0, 1, 1, 0])
  const y = useTransform(progress, beat.range, [reduced ? 0 : 32, 0, 0, reduced ? 0 : -20])
  const scale = useTransform(progress, beat.range, reduced || !zoomText ? [1, 1, 1, 1] : [0.62, 1, 1.08, 0.86])
  const x = useTransform(progress, beat.range, zoomText ? ['-50%', '-50%', '-50%', '-50%'] : ['0%', '0%', '0%', '0%'])
  const ruleScale = useTransform(progress, beat.range, reduced ? [1, 1, 1, 1] : [0, 1, 1, 0])
  const filter = useTransform(progress, beat.range, reduced
    ? ['blur(0px)', 'blur(0px)', 'blur(0px)', 'blur(0px)']
    : ['blur(8px)', 'blur(0px)', 'blur(0px)', 'blur(8px)'])

  return (
    <motion.article className={`sequence-beat ${beat.kind ?? ''}`} style={{ opacity, x, y, scale, filter }} aria-hidden={currentBeat !== index + 1}>
      <motion.span className="sequence-rule" style={{ scaleX: ruleScale }} aria-hidden="true" />
      <p className="sequence-eyebrow">{beat.eyebrow}</p>
      <h1>{beat.title}</h1>
      <p className="sequence-body">{beat.body}</p>
      {beat.kind === 'details' && (
        <div className="sequence-chips" aria-label="Oil details">
          {(beat.chips ?? ['ALL HAIR TYPES', 'DRYNESS · BREAKAGE', 'LIGHTWEIGHT OIL']).map((chip) => <span key={chip}>{chip}</span>)}
        </div>
      )}
      {beat.kind === 'closing' && (
        <a className="sequence-cta" href={ctaHref}>{ctaLabel} <span aria-hidden="true">↗</span></a>
      )}
    </motion.article>
  )
}

function closestLoadedFrame(frames: (HTMLImageElement | undefined)[], target: number, frameCount: number) {
  for (let distance = 0; distance < frameCount; distance += 1) {
    const before = target - distance
    const after = target + distance
    if (before >= 0 && frames[before]?.complete && frames[before]?.naturalWidth) return before
    if (distance > 0 && after < frameCount && frames[after]?.complete && frames[after]?.naturalWidth) return after
  }
  return -1
}

function edgeColor(image: HTMLImageElement) {
  // A tiny downsample gives a frame-specific average of the outer edge for letterboxing.
  const sampler = document.createElement('canvas')
  sampler.width = 8
  sampler.height = 8
  const context = sampler.getContext('2d', { willReadFrequently: true })
  if (!context) return BG
  context.drawImage(image, 0, 0, 8, 8)
  const { data } = context.getImageData(0, 0, 8, 8)
  let red = 0
  let green = 0
  let blue = 0
  let samples = 0
  for (let x = 0; x < 8; x += 1) {
    for (const y of [0, 7]) {
      const offset = (y * 8 + x) * 4
      red += data[offset]
      green += data[offset + 1]
      blue += data[offset + 2]
      samples += 1
    }
  }
  for (let y = 1; y < 7; y += 1) {
    for (const x of [0, 7]) {
      const offset = (y * 8 + x) * 4
      red += data[offset]
      green += data[offset + 1]
      blue += data[offset + 2]
      samples += 1
    }
  }
  return `rgb(${Math.round(red / samples)}, ${Math.round(green / samples)}, ${Math.round(blue / samples)})`
}

type SequenceSectionProps = {
  sectionId: string
  sectionLabel: string
  beats: Beat[]
  frameCount: number
  framePath: (frame: number) => string
  navTarget: string
  navCopy: string
  ctaTarget: string
  ctaCopy: string
  loaderCopy: string
  lazyLoad?: boolean
  zoomText?: boolean
}

function SequenceSection({ sectionId, sectionLabel, beats, frameCount, framePath, navTarget, navCopy, ctaTarget, ctaCopy, loaderCopy, lazyLoad = false, zoomText = false }: SequenceSectionProps) {
  const wrapRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const images = useRef<(HTMLImageElement | undefined)[]>([])
  const colors = useRef(new WeakMap<HTMLImageElement, string>())
  const lastIndex = useRef(-1)
  const beatIndex = useRef(1)
  const raf = useRef(0)
  const [loadedCritical, setLoadedCritical] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [activated, setActivated] = useState(!lazyLoad)
  const [currentBeat, setCurrentBeat] = useState(1)
  const prefersReducedMotion = useReducedMotion()

  const { scrollY, scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ['start start', 'end end'],
  })
  const smoothProgress = useSpring(scrollYProgress, SPRING)
  const progress = prefersReducedMotion ? scrollYProgress : smoothProgress
  const framePosition = useTransform(progress, [0, 1], [0, frameCount - 1])
  const cameraScale = useTransform(progress, [0, 1], [1, prefersReducedMotion ? 1 : zoomText ? 1.12 : 1.055])
  const cameraX = useTransform(progress, [0, 1], [0, prefersReducedMotion ? 0 : zoomText ? -12 : -7])
  const cameraY = useTransform(progress, [0, 1], [0, prefersReducedMotion ? 0 : zoomText ? 8 : 5])
  const navOffset = useMotionValue(0)
  const navY = useSpring(navOffset, { stiffness: 150, damping: 24, mass: 0.7 })
  const scrollHintOpacity = useTransform(scrollYProgress, [0, 0.035], [1, 0])
  const sweepX = useTransform(progress, [0.13, 0.17, 0.37, 0.41, 0.60, 0.64, 0.82, 0.86], ['-110%', '110%', '-110%', '110%', '-110%', '110%', '-110%', '110%'])
  const sweepOpacity = useTransform(progress, [0.13, 0.17, 0.37, 0.41, 0.60, 0.64, 0.82, 0.86], [0, 0.42, 0, 0.42, 0, 0.42, 0, 0.42])
  const entryOpacity = useTransform(progress, [0, 0.035], [1, 0])
  const exitOpacity = useTransform(progress, [0.94, 1], [0, 0.52])

  useEffect(() => {
    if (!lazyLoad || activated || !wrapRef.current) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setActivated(true)
        observer.disconnect()
      }
    }, { rootMargin: '2200px 0px' })
    observer.observe(wrapRef.current)
    return () => observer.disconnect()
  }, [activated, lazyLoad])

  const drawFrame = useCallback((requested: number) => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    const index = closestLoadedFrame(images.current, clamp(requested, 0, frameCount - 1), frameCount)
    if (index < 0) return
    const image = images.current[index]
    if (!image) return
    const { width, height } = canvas
    const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight)
    const drawWidth = image.naturalWidth * scale
    const drawHeight = image.naturalHeight * scale
    let fill = colors.current.get(image)
    if (!fill) {
      try {
        fill = edgeColor(image)
        colors.current.set(image, fill)
      } catch {
        fill = BG
      }
    }
    context.fillStyle = fill
    context.fillRect(0, 0, width, height)
    context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight)
  }, [frameCount])

  const scheduleDraw = useCallback((index: number, force = false) => {
    const next = clamp(index, 0, frameCount - 1)
    if (!force && next === lastIndex.current) return
    lastIndex.current = next
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(() => drawFrame(next))
  }, [drawFrame, frameCount])

  useMotionValueEvent(framePosition, 'change', (value) => {
    scheduleDraw(Math.round(value))
  })

  useMotionValueEvent(scrollY, 'change', (value) => {
    const previous = scrollY.getPrevious() ?? value
    navOffset.set(value > 80 && value > previous ? -110 : 0)
  })

  useMotionValueEvent(progress, 'change', (value) => {
    const activeBeat = beats.findIndex(({ range }) => value >= range[0] && value <= range[3])
    const nextBeat = activeBeat < 0 ? (value < beats[0].range[0] ? 1 : beats.length) : activeBeat + 1
    if (beatIndex.current !== nextBeat) {
      beatIndex.current = nextBeat
      setCurrentBeat(nextBeat)
    }
  })

  useEffect(() => {
    if (!activated) return
    let cancelled = false
    let criticalDone = 0
    const isMobile = window.matchMedia('(max-width: 767px)').matches

    const loadFrame = (index: number) => new Promise<void>((resolve) => {
      if (images.current[index]?.complete && images.current[index]?.naturalWidth) {
        resolve()
        return
      }
      const image = images.current[index] ?? new Image()
      images.current[index] = image
      const finish = async () => {
        try {
          if (image.decode) await image.decode()
        } catch {
          // A decoded image may reject after load in some browsers; naturalWidth is still usable.
        }
        if (!cancelled) scheduleDraw(lastIndex.current < 0 ? 0 : lastIndex.current, true)
        resolve()
      }
      image.onload = () => { void finish() }
      image.onerror = () => resolve()
      image.src = framePath(index)
      if (image.complete && image.naturalWidth) void finish()
    })

    const loadBatch = async (indices: number[]) => {
      for (let start = 0; start < indices.length; start += BATCH_SIZE) {
        await Promise.all(indices.slice(start, start + BATCH_SIZE).map(loadFrame))
        if (cancelled) return
      }
    }

    const run = async () => {
      await loadFrame(0)
      if (cancelled) return
      drawFrame(0)
      const critical = isMobile
        ? Array.from({ length: frameCount }, (_, index) => index).filter((index) => (index + 1) % 2 === 1).slice(0, 30)
        : Array.from({ length: Math.min(30, frameCount) }, (_, index) => index)
      criticalDone = 1
      const remainingCritical = critical.filter((index) => index !== 0)
      for (let start = 0; start < remainingCritical.length; start += BATCH_SIZE) {
        const batch = remainingCritical.slice(start, start + BATCH_SIZE)
        await Promise.all(batch.map(async (index) => {
          await loadFrame(index)
          criticalDone += 1
          if (!cancelled) setLoadedCritical(Math.round((criticalDone / critical.length) * 100))
        }))
      }
      if (cancelled) return
      setLoadedCritical(100)
      setRevealed(true)
      scheduleDraw(0, true)
      const priority = new Set([0, ...critical])
      await loadBatch(Array.from({ length: frameCount }, (_, index) => index).filter((index) => !priority.has(index)))
    }

    void run()
    return () => {
      cancelled = true
      cancelAnimationFrame(raf.current)
    }
  }, [activated, drawFrame, frameCount, framePath, scheduleDraw])

  useEffect(() => {
    const canvas = canvasRef.current
    const stage = stageRef.current
    if (!canvas || !stage) return
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const { width, height } = stage.getBoundingClientRect()
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      scheduleDraw(Math.max(lastIndex.current, 0), true)
    }
    const observer = new ResizeObserver(resize)
    observer.observe(stage)
    resize()
    return () => observer.disconnect()
  }, [scheduleDraw])

  return (
    <div className="sequence-section">
      <section id={sectionId} ref={wrapRef} className={`sequence-scroll relative h-[500vh] max-md:h-[400vh] ${zoomText ? 'sequence-scroll--zoom' : ''}`} aria-label={sectionLabel}>
        <div ref={stageRef} className="sequence-stage sticky top-0 h-screen overflow-hidden">
          <motion.div className="sequence-canvas" style={{ scale: cameraScale, x: cameraX, y: cameraY }}>
            <canvas ref={canvasRef} className="sequence-frame" aria-label="Cinematic Neemamla oil and botanical image sequence controlled by scrolling" />
          </motion.div>

          <div className="sequence-vignette" aria-hidden="true" />
          {!prefersReducedMotion && <div className="sequence-grain" aria-hidden="true" />}
          <motion.div className="sequence-entry-wash" style={{ opacity: entryOpacity }} aria-hidden="true" />
          <motion.div className="sequence-sweep" style={{ x: sweepX, opacity: sweepOpacity }} aria-hidden="true" />
          <motion.div className="sequence-exit-wash" style={{ opacity: exitOpacity }} aria-hidden="true" />

          <motion.header className="sequence-nav" style={{ y: navY }}>
            <a className="sequence-wordmark" href="#top" aria-label="Neemamla home">neem<span>amla</span><i>®</i></a>
            <span className="sequence-nav-note">BOTANICAL HAIR OIL <span>·</span> EST. IN AYURVEDA</span>
            <a className="sequence-nav-link" href={navTarget}>{navCopy} <span aria-hidden="true">↗</span></a>
          </motion.header>

          <div className="sequence-copy" aria-live="polite">
            {beats.map((beat, index) => (
              <StoryBeat key={beat.title} beat={beat} progress={progress} index={index} reduced={Boolean(prefersReducedMotion)} currentBeat={currentBeat} ctaHref={ctaTarget} ctaLabel={ctaCopy} zoomText={zoomText} />
            ))}
          </div>

          <motion.div className="sequence-scroll-hint" style={{ opacity: scrollHintOpacity }} aria-hidden="true">
            <span>SCROLL TO EXPLORE</span><i />
          </motion.div>

          {activated && !revealed && (
            <div className="sequence-loader" role="status" aria-live="polite">
              <div className="sequence-loader-brand">neem<span>amla</span><i>®</i></div>
              <p>{loaderCopy}</p>
              <div className="sequence-loader-line"><span style={{ transform: `scaleX(${loadedCritical / 100})` }} /></div>
              <span className="sequence-loader-percent">{String(loadedCritical).padStart(2, '0')}<small>%</small></span>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function RootsInterlude() {
  const sectionRef = useRef<HTMLElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  })
  const smoothProgress = useSpring(scrollYProgress, SPRING)
  const progress = prefersReducedMotion ? scrollYProgress : smoothProgress
  const lineProgress = useTransform(progress, [0, 0.82], prefersReducedMotion ? [1, 1] : [0, 1])
  const haloScale = useTransform(progress, [0, 1], [0.72, 1.12])
  const haloRotate = useTransform(progress, [0, 1], prefersReducedMotion ? [0, 0] : [-10, 10])
  const auraOpacity = useTransform(progress, [0, 0.18, 0.84, 1], [0.2, 0.82, 0.74, 0.3])
  const copyOpacity = useTransform(progress, [0, 0.1, 0.78, 0.96, 1], [0, 1, 1, 0, 0])
  const copyY = useTransform(progress, [0, 0.2, 0.78, 1], [prefersReducedMotion ? 0 : 26, 0, 0, prefersReducedMotion ? 0 : -14])
  const copyScale = useTransform(progress, [0, 0.24, 0.8, 1], prefersReducedMotion ? [1, 1, 1, 1] : [0.94, 1, 1, 0.98])
  const gleamX = useTransform(progress, [0, 1], ['-25%', '25%'])

  const rootLines = [
    'M400 285 C399 340 401 395 402 455',
    'M399 323 C365 337 333 356 302 384 C275 408 252 438 235 477',
    'M401 339 C435 355 469 379 500 408 C526 432 547 461 563 497',
    'M402 375 C374 403 358 436 347 470 C337 502 321 528 295 551',
    'M403 386 C431 411 444 443 456 477 C469 511 492 539 522 560',
    'M400 317 C382 289 359 270 330 253 C302 237 281 215 267 186',
    'M401 316 C420 286 444 266 473 249 C502 232 523 210 537 181',
    'M307 383 C285 377 264 377 241 383 M302 384 C291 403 287 423 288 443',
    'M500 408 C523 400 545 399 570 405 M500 408 C510 428 514 449 512 470',
    'M348 469 C326 465 306 468 286 477 M456 477 C478 470 499 472 520 481',
  ]

  return (
    <section id="next-chapter" ref={sectionRef} className="roots-interlude relative h-[125vh] max-md:h-[120vh]" aria-label="Good things grow from the roots">
      <div className="roots-stage sticky top-0 h-screen overflow-hidden">
        <motion.div className="roots-aura" style={{ x: '-50%', y: '-50%', scale: haloScale, rotate: haloRotate, opacity: auraOpacity }} aria-hidden="true">
          <span className="roots-halo roots-halo--outer" />
          <span className="roots-halo roots-halo--inner" />
          <span className="roots-core" />
        </motion.div>

        <motion.svg className="roots-art" viewBox="0 0 800 650" fill="none" style={{ x: '-50%', y: '-50%' }} aria-hidden="true">
          <defs>
            <linearGradient id="root-gold" x1="400" y1="160" x2="400" y2="570" gradientUnits="userSpaceOnUse">
              <stop stopColor="#EBD8A8" />
              <stop offset="0.54" stopColor="#C9A66B" />
              <stop offset="1" stopColor="#668F73" />
            </linearGradient>
            <radialGradient id="root-glow">
              <stop stopColor="#EAD9B0" stopOpacity="0.5" />
              <stop offset="1" stopColor="#EAD9B0" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="400" cy="326" r="148" fill="url(#root-glow)" />
          <circle cx="400" cy="326" r="176" stroke="#EAD9B0" strokeOpacity="0.2" />
          <circle cx="400" cy="326" r="208" stroke="#C9A66B" strokeOpacity="0.12" strokeDasharray="1 9" />
          {rootLines.map((line) => (
            <motion.path key={line} d={line} pathLength="1" stroke="url(#root-gold)" strokeOpacity="0.76" strokeWidth="1.15" strokeLinecap="round" style={{ pathLength: lineProgress }} />
          ))}
          <motion.path d="M400 283 C377 253 367 226 371 196 C390 211 401 235 400 266 M402 281 C424 250 437 221 430 191 C411 206 401 232 402 266" pathLength="1" stroke="#EAD9B0" strokeOpacity="0.76" strokeWidth="1.2" strokeLinecap="round" style={{ pathLength: lineProgress }} />
          <motion.circle cx="400" cy="326" r="4" fill="#F0DCA9" style={{ opacity: auraOpacity }} />
        </motion.svg>

        <div className="roots-vignette" aria-hidden="true" />
        {!prefersReducedMotion && <div className="roots-stars" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>}
        <motion.div className="roots-gleam" style={{ x: gleamX }} aria-hidden="true" />

        <motion.div className="roots-copy" style={{ opacity: copyOpacity, y: copyY, scale: copyScale }}>
          <span className="roots-overline"><i /> THE ROOT OF EVERY RITUAL <i /></span>
          <h2>Good things grow<br /><em>from the roots.</em></h2>
          <span className="roots-divider" aria-hidden="true"><i /><b>✳</b><i /></span>
          <p>Neem and amla, brought together for the care your hair deserves.</p>
        </motion.div>

        <div className="roots-scroll-note" aria-hidden="true">
          <span>LET THE RITUAL UNFOLD</span><i />
        </div>
        <span className="roots-signature" aria-hidden="true">N<span>·</span>A</span>
      </div>
    </section>
  )
}

export default function ScrollSequence() {
  return (
    <main className="sequence-page">
      <SequenceSection
        sectionId="top"
        sectionLabel="Neemamla botanical hair oil story"
        beats={FIRST_BEATS}
        frameCount={FIRST_FRAME_COUNT}
        framePath={FRAME_PATH}
        navTarget="#next-chapter"
        navCopy="Discover the ritual"
        ctaTarget="#next-chapter"
        ctaCopy="Find Your Flavor"
        loaderCopy="A botanical ritual, coming into focus"
      />
      <RootsInterlude />
      <SequenceSection
        sectionId="second-story"
        sectionLabel="A closer look at the Neemamla hair oil ritual"
        beats={SECOND_BEATS}
        frameCount={SECOND_FRAME_COUNT}
        framePath={SECOND_FRAME_PATH}
        navTarget="#next-chapter"
        navCopy="The ritual"
        ctaTarget="#next-chapter"
        ctaCopy="Explore the ritual"
        loaderCopy="A closer look at the ritual"
        lazyLoad
        zoomText
      />
    </main>
  )
}
