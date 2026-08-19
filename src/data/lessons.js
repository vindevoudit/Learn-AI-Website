// The curriculum. Order matters — these are taught as a sequence, which is why
// the lesson map numbers them.
//
// Lessons 05 and 06 are deliberately adjacent: the same maze, first solved by a
// program that can see the whole map, then by a robot that cannot see any of it.

export const lessons = [
  {
    id: 'neural-network',
    number: '01',
    title: 'Build a Brain',
    tagline: 'Neural networks',
    blurb:
      'Wire up neurons, turn the dials, and watch a signal travel through the network to make a decision.',
    accent: 'signal',
    minutes: 10,
    status: 'ready',
    path: '/lessons/neural-network',
    question: 'How does a machine decide anything at all?',
  },
  {
    id: 'teachable-machine',
    number: '02',
    title: 'Teach a Machine',
    tagline: 'Training data',
    blurb:
      'Draw your own examples, label them, and train a real classifier. Then find out what happens when you feed it too little.',
    accent: 'spark',
    minutes: 12,
    status: 'ready',
    path: '/lessons/teachable-machine',
    question: 'How does a machine learn from examples?',
  },
  {
    id: 'next-word',
    number: '03',
    title: 'Guess the Next Word',
    tagline: 'Language models',
    blurb:
      'Chatbots write one word at a time. Steer a real language model and see the odds it gives every word it considers.',
    accent: 'charge',
    minutes: 10,
    status: 'ready',
    path: '/lessons/next-word',
    question: 'How does a chatbot know what to say next?',
  },
  {
    id: 'twenty-questions',
    number: '04',
    title: 'Twenty Questions',
    tagline: 'Decision trees',
    blurb:
      'Play against a machine that guesses your animal — and teach it a new one every time it gets you wrong. Watch its brain grow a branch.',
    accent: 'signal',
    minutes: 10,
    status: 'ready',
    path: '/lessons/twenty-questions',
    question: 'Can you read a machine’s mind if it is written down?',
  },
  {
    id: 'find-the-way-out',
    number: '05',
    title: 'Find the Way Out',
    tagline: 'Search',
    blurb:
      'Build a maze and watch three different search strategies crawl through it. One is thorough, one is hasty, one is clever.',
    accent: 'charge',
    minutes: 10,
    status: 'ready',
    path: '/lessons/find-the-way-out',
    question: 'How does a computer find a route through anything?',
  },
  {
    id: 'learn-the-hard-way',
    number: '06',
    title: 'Learn the Hard Way',
    tagline: 'Reinforcement learning',
    blurb:
      'Same maze, but now the robot cannot see it. Drop it in, let it die a few hundred times, and watch a plan appear out of nothing.',
    accent: 'spark',
    minutes: 12,
    status: 'ready',
    path: '/lessons/learn-the-hard-way',
    question: 'How does anything learn without being told the answer?',
  },
  {
    id: 'your-feed',
    number: '07',
    title: 'Why You See What You See',
    tagline: 'Recommenders',
    blurb:
      'Tap through a made-up feed and watch it work you out in about a minute. Then try to escape the bubble you just built.',
    accent: 'signal',
    minutes: 10,
    status: 'ready',
    path: '/lessons/your-feed',
    question: 'Who decides what turns up on your screen?',
  },
  {
    id: 'bias',
    number: '08',
    title: 'Fair or Biased?',
    tagline: 'AI ethics',
    blurb:
      'Feed a model a lopsided set of examples and watch it learn the wrong lesson — then fix the data and try again.',
    accent: 'spark',
    minutes: 12,
    status: 'soon',
    path: '/lessons/bias',
    question: 'Why does AI sometimes get things unfairly wrong?',
  },
  {
    id: 'vision',
    number: '09',
    title: 'How Computers See',
    tagline: 'Computer vision',
    blurb:
      'An image is just numbers in a grid. Run filters over one and watch edges, shapes and faces fall out.',
    accent: 'charge',
    minutes: 10,
    status: 'soon',
    path: '/lessons/vision',
    question: 'What does a computer actually see in a photo?',
  },
]

export const getLesson = (id) => lessons.find((l) => l.id === id)

export const readyLessons = lessons.filter((l) => l.status === 'ready')
