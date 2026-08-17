'use client'

import { useEffect, useState } from 'react'
import { SALON_IMAGES, HOLD_MS, FADE_MS } from '@/lib/salon-images'

/**
 * The rotating salon pictures that sit behind the hero and the booking card.
 *
 * Three things this has to get right:
 *  - the words on top stay readable, which is what the cream scrim is for
 *  - a picture that fails to load never leaves a broken frame on the page
 *  - anyone who has asked their machine to stop moving things gets one still
 *    picture and no fading
 */
export default function SalonBackdrop() {
  const [ok, setOk] = useState<boolean[]>(() => SALON_IMAGES.map(() => true))
  const usable = SALON_IMAGES.filter((_, i) => ok[i])

  const [at, setAt] = useState(0)
  const [still, setStill] = useState(false)

  useEffect(() => {
    const ask = window.matchMedia('(prefers-reduced-motion: reduce)')
    setStill(ask.matches)
    const onChange = () => setStill(ask.matches)
    ask.addEventListener('change', onChange)
    return () => ask.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (still || usable.length < 2) return
    const t = setInterval(() => setAt((n) => (n + 1) % usable.length), HOLD_MS)
    return () => clearInterval(t)
  }, [still, usable.length])

  if (usable.length === 0) return null

  return (
    <div className="mg-backdrop" aria-hidden="true">
      {usable.map((img, i) => (
        <img
          key={img.src}
          src={img.src}
          alt=""
          className="mg-backdrop-img"
          style={{
            opacity: i === (still ? 0 : at) ? 1 : 0,
            transitionDuration: `${FADE_MS}ms`,
            animationPlayState: still ? 'paused' : 'running',
          }}
          onError={() => setOk((prev) => prev.map((v, n) => (n === i ? false : v)))}
        />
      ))}
      <div className="mg-backdrop-scrim" />
    </div>
  )
}
