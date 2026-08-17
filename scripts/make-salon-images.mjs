// Generates the four salon backdrops with Nano Banana 2 on Replicate.
//
//   node scripts/make-salon-images.mjs
//
// The token is read from the shell environment, never written down here.
// Composition matters more than prettiness: the words on the page sit on the
// left, so every prompt pushes the interesting part of the room to the right
// and keeps the left side quiet.

import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const TOKEN = process.env.REPLICATE_API_TOKEN
if (!TOKEN) {
  console.error('REPLICATE_API_TOKEN is not set in this shell.')
  process.exit(1)
}

const OUT = path.resolve(import.meta.dirname, '..', 'public', 'salon')

const LOOK =
  'Warm cream and oak interior, brass fixtures, late afternoon sunlight, soft ' +
  'shadows, calm and uncluttered, no people, no text or signage of any kind, ' +
  'editorial interior photography, shot on 35mm, shallow depth of field.'

const SHOTS = [
  { n: 1, p: `A small hair salon interior, wide shot. Two styling chairs on the right of frame beside a tall window; the left side of the frame is a quiet empty cream wall. ${LOOK}` },
  { n: 2, p: `A single salon styling chair beside a tall window, positioned on the right of frame, a folded towel over the arm, golden light falling across an oak floor. The left third of the frame is empty wall. ${LOOK}` },
  { n: 3, p: `Two ceramic wash basins with brass taps and stacked white towels, arranged on the right of frame, soft light from a window out of shot. The left of frame is quiet cream tile. ${LOOK}` },
  { n: 4, p: `A wooden shelf of unlabelled amber and clear glass bottles along a cream wall, the shelf running through the right of frame, a trailing plant, soft focus background. The left of frame is empty wall. ${LOOK}` },
]

const api = (p, init) =>
  fetch(`https://api.replicate.com/v1${p}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

async function generate(shot) {
  const res = await api('/models/google/nano-banana-2/predictions', {
    method: 'POST',
    body: JSON.stringify({
      input: {
        prompt: shot.p,
        aspect_ratio: '16:9',
        resolution: '2K',
        output_format: 'jpg',
      },
    }),
  })

  if (!res.ok) throw new Error(`start ${shot.n}: ${res.status} ${await res.text()}`)
  let pred = await res.json()

  // Poll until it is done. Nothing else is waiting on this, so a slow
  // generation is fine; a silent hang is not, hence the ceiling.
  const deadline = Date.now() + 5 * 60 * 1000
  while (['starting', 'processing'].includes(pred.status)) {
    if (Date.now() > deadline) throw new Error(`shot ${shot.n} never finished`)
    await new Promise((r) => setTimeout(r, 2000))
    pred = await (await api(`/predictions/${pred.id}`)).json()
  }
  if (pred.status !== 'succeeded') {
    throw new Error(`shot ${shot.n} ${pred.status}: ${pred.error ?? 'no reason given'}`)
  }

  const url = Array.isArray(pred.output) ? pred.output[0] : pred.output
  const bytes = Buffer.from(await (await fetch(url)).arrayBuffer())
  await writeFile(path.join(OUT, `${shot.n}.jpg`), bytes)
  return bytes.length
}

await mkdir(OUT, { recursive: true })
for (const shot of SHOTS) {
  try {
    const size = await generate(shot)
    console.log(`wrote ${shot.n}.jpg  ${(size / 1024).toFixed(0)} KB`)
  } catch (e) {
    console.error(String(e.message))
  }
}
