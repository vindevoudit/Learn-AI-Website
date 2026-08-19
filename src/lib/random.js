// A seeded pseudo-random generator (mulberry32).
//
// The lessons that involve chance — an exploring robot, a feed that sometimes
// shows you something new — claim that the same choices produce the same
// result. With Math.random that claim would be false, and a student who
// retraced their steps would get a different answer and reasonably conclude the
// site was lying to them.

export function makeRandom(seed = 1) {
  let state = seed >>> 0
  return function random() {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Weighted pick from [{ weight }] entries. */
export function pickWeighted(entries, random) {
  const total = entries.reduce((sum, e) => sum + e.weight, 0)
  if (total <= 0) return entries[Math.floor(random() * entries.length)]
  let roll = random() * total
  for (const entry of entries) {
    roll -= entry.weight
    if (roll <= 0) return entry
  }
  return entries[entries.length - 1]
}
