// The rotating pictures behind the booking card.
//
// Drop files into `public/salon/` and list them here. Anything in this list
// shows up; an empty list falls back to the plain warm wash, so the page never
// breaks waiting on artwork.
//
// Aim for landscape, roughly 1600x1000 or larger, under about 400KB each once
// exported. Four is a good number: enough variety, short enough loop.

export type SalonImage = { src: string; alt: string }

export const SALON_IMAGES: SalonImage[] = [
  { src: '/salon/1.jpg', alt: 'The front of the salon in morning light' },
  { src: '/salon/2.jpg', alt: 'A styling chair beside a tall window' },
  { src: '/salon/3.jpg', alt: 'The wash basins and folded towels' },
  { src: '/salon/4.jpg', alt: 'The shelf of bottles along the back wall' },
]

// How long each picture holds, and how long the fade between them takes.
export const HOLD_MS = 6500
export const FADE_MS = 1600
