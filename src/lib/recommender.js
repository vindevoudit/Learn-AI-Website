// A recommender, in about as few lines as the idea can honestly be written.
//
// It keeps one score per topic. Watching something raises that topic's score,
// skipping lowers it, and the next batch is whatever now scores highest. That
// is genuinely most of how a feed works — the industrial versions differ in
// scale and in what they count, not in shape.

import { posts, topics } from '../data/feed'
import { makeRandom } from './random'

export const WATCH = 1
export const SKIP = -1

export function createProfile(seed = 11) {
  return {
    scores: Object.fromEntries(topics.map((t) => [t.id, 0])),
    seen: new Set(),
    history: [], // { topic, action } per tap, for the bubble chart
    random: makeRandom(seed),
  }
}

/**
 * How hard one tap moves the profile.
 *
 * Tuned by measurement: high enough that the feed visibly narrows over three or
 * four rounds, low enough that it does not collapse inside the first batch —
 * a bubble that forms instantly reads as a scripted trick rather than something
 * the student did.
 */
const RATE = 0.28

export function record(profile, post, action) {
  const current = profile.scores[post.topic] ?? 0
  // Move towards +1 for a watch, -1 for a skip. Early taps move it a long way,
  // which is exactly why a feed feels like it "gets you" so fast.
  profile.scores[post.topic] = current + RATE * (action - current)
  profile.seen.add(post.id)
  profile.history.push({ topic: post.topic, action })
}

/**
 * The next batch.
 *
 * `exploration` is the share of slots handed to something the profile does NOT
 * favour. At zero the feed can only ever narrow.
 */
export function recommend(profile, count = 3, exploration = 0, exclude = []) {
  const blocked = new Set(exclude)
  const pool = posts.filter((p) => !blocked.has(p.id))

  // Fresh items are preferred, but only mildly: a topic you clearly like still
  // beats an unseen item from one you do not. Without that, running out of
  // (say) space posts would hand the feed back to a topic you keep skipping,
  // and the bubble would appear to fix itself.
  const rank = (post) =>
    (profile.scores[post.topic] ?? 0) + (profile.seen.has(post.id) ? -0.15 : 0)

  const ranked = [...pool].sort((a, b) => rank(b) - rank(a))

  const picked = []
  const exploreSlots = Math.round(count * exploration)

  for (let slot = 0; slot < count; slot++) {
    const remaining = ranked.filter((p) => !picked.includes(p))
    if (remaining.length === 0) break

    if (slot < exploreSlots) {
      // A genuinely random pick — the only thing that can widen the feed.
      picked.push(remaining[Math.floor(profile.random() * remaining.length)])
    } else {
      picked.push(remaining[0])
    }
  }

  return picked
}

/** Share of the last `window` items that came from a single topic. */
export function bubbleTightness(profile, window = 6) {
  const recent = profile.history.slice(-window)
  // Don't call it a bubble until there is a full window to judge: three taps
  // landing on one topic by chance is not a filter bubble.
  if (recent.length < window) return 0
  const counts = {}
  for (const entry of recent) counts[entry.topic] = (counts[entry.topic] ?? 0) + 1
  return Math.max(...Object.values(counts)) / recent.length
}

export const topicsSeenRecently = (profile, window = 6) =>
  new Set(profile.history.slice(-window).map((h) => h.topic)).size

export const sortedScores = (profile) =>
  topics
    .map((t) => ({ ...t, score: profile.scores[t.id] ?? 0 }))
    .sort((a, b) => b.score - a.score)
