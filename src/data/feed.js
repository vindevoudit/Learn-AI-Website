// An invented feed. No real brands, no real people, no real accounts — the
// point is the mechanism, and borrowing a real platform's name would only make
// the lesson look like an advert or an attack.

export const topics = [
  { id: 'skate', name: 'Skating', hex: '#22D3EE' },
  { id: 'cook', name: 'Cooking', hex: '#F472B6' },
  { id: 'space', name: 'Space', hex: '#A3E635' },
  { id: 'games', name: 'Gaming', hex: '#818CF8' },
  { id: 'music', name: 'Music', hex: '#FBBF24' },
  { id: 'animals', name: 'Animals', hex: '#34D399' },
]

const post = (id, topic, title, blurb) => ({ id, topic, title, blurb })

export const posts = [
  post('s1', 'skate', 'Landed it on the 47th try', 'Two months of falling over, compressed into nine seconds.'),
  post('s2', 'skate', 'Every board setup explained', 'Why the wheels on your first board were wrong.'),
  post('s3', 'skate', 'This handrail has beaten everyone', 'Local legend attempts it again after four years.'),
  post('s4', 'skate', 'Ollie in slow motion', 'Frame by frame, where the pop actually comes from.'),
  post('s5', 'skate', 'Learning to fall properly', 'The first thing anyone should be taught, and never is.'),
  post('s6', 'skate', 'Ten years at the same skatepark', 'What changed, and who is still there.'),

  post('c1', 'cook', 'The three-ingredient dinner', 'Nothing fancy, ready before the kettle boils.'),
  post('c2', 'cook', 'I tested nine cookie recipes', 'One of them is genuinely worth the effort.'),
  post('c3', 'cook', 'Why your pasta water matters', 'The bit everybody skips, and what it changes.'),
  post('c4', 'cook', 'Breakfast in a lunchbox', 'Assembled the night before, eaten on the bus.'),
  post('c5', 'cook', 'One pan, no washing up', 'Dinner that respects your evening.'),
  post('c6', 'cook', 'Reading a recipe like a pro', 'The steps that are lying to you about timing.'),

  post('p1', 'space', 'What a black hole would look like', 'Not the film version — the version with maths behind it.'),
  post('p2', 'space', 'The rover that would not die', 'Built for 90 days. Lasted fifteen years.'),
  post('p3', 'space', 'How far is far, really', 'Scaling the solar system down to a football pitch.'),
  post('p4', 'space', 'Reading light from dead stars', 'Everything we know about them arrived very late.'),
  post('p5', 'space', 'The sound of a comet', 'Recorded, converted, and genuinely eerie.'),
  post('p6', 'space', 'Why the sky is dark at night', 'A question that took three hundred years to answer.'),

  post('g1', 'games', 'The level nobody finished', 'Twenty years on, someone finally did.'),
  post('g2', 'games', 'Why this boss feels unfair', 'Taking apart the timing that makes it frustrating.'),
  post('g3', 'games', 'Speedrun, explained slowly', 'Every shortcut, and why it works.'),
  post('g4', 'games', 'The physics bug that became a feature', 'A mistake nobody wanted fixed.'),
  post('g5', 'games', 'The map everyone gets lost in', 'Tracing why the layout confuses people.'),
  post('g6', 'games', 'Designing a tutorial nobody notices', 'The best ones never say a word.'),

  post('m1', 'music', 'One song, six instruments', 'Recorded in a bedroom over a weekend.'),
  post('m2', 'music', 'The four chords behind everything', 'Once you hear it you cannot unhear it.'),
  post('m3', 'music', 'Making a beat from kitchen sounds', 'A tap, a kettle, and a chopping board.'),
  post('m4', 'music', 'Why that drop hits so hard', 'It is mostly what happens in the silence before it.'),
  post('m5', 'music', 'A bassline you have heard 500 times', 'Same eight notes, forty different songs.'),
  post('m6', 'music', 'Tuning a guitar by ear', 'What you are actually listening for.'),

  post('a1', 'animals', 'The crow that solves puzzles', 'Eight steps, in the right order, first try.'),
  post('a2', 'animals', 'Octopus opens a jar', 'From the inside, which is worse.'),
  post('a3', 'animals', 'Why cats land the way they do', 'A physics problem they solve in half a second.'),
  post('a4', 'animals', 'Migration, mapped', 'Twelve thousand kilometres, no map, no wrong turns.'),
  post('a5', 'animals', 'The bird that mimics chainsaws', 'And car alarms, and camera shutters.'),
  post('a6', 'animals', 'How ants pick the shortest route', 'No leader, no map, no argument.'),
]

export const topicById = Object.fromEntries(topics.map((t) => [t.id, t]))
