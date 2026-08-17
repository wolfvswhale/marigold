// The rotating pictures behind the booking card.
//
// Made with Nano Banana 2 on Replicate; see scripts/make-salon-images.mjs.
// Full-size originals are kept out of the build in assets/salon-original/.
// Drop files into `public/salon/` and list them here. Anything in this list
// shows up; an empty list falls back to the plain warm wash, so the page never
// breaks waiting on artwork.
//
// Aim for landscape, roughly 1600x1000 or larger, under about 400KB each once
// exported. Four is a good number: enough variety, short enough loop.

export type SalonImage = { src: string; alt: string }

export const SALON_IMAGES: SalonImage[] = [
  { src: '/salon/1.jpg', alt: 'The room seen down its length, chairs beside a tall window' },
  { src: '/salon/2.jpg', alt: 'A single leather styling chair in afternoon light' },
  { src: '/salon/3.jpg', alt: 'Two basins on an oak counter with folded towels' },
  { src: '/salon/4.jpg', alt: 'A shelf of amber and glass bottles along a cream wall' },
]

// How long each picture holds, and how long the fade between them takes.
export const HOLD_MS = 6500
export const FADE_MS = 1600
