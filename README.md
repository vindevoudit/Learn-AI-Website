# Learn AI

An interactive site that teaches the fundamentals of artificial intelligence to
12–16 year olds. Every model runs in the browser — there is no backend, no
account system, and nothing about the visitor is stored or transmitted.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/
npm run preview  # serve the built site
```

`dist/` is a plain folder of static files, so it deploys to any static host.

## Hosting on Render

`render.yaml` in the repo root configures this as a Render **Static Site**, on
the free tier. Render deploys from a Git repository, so the project needs to be
on GitHub, GitLab or Bitbucket first:

```bash
git init
git add .
git commit -m "Interactive AI lessons"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

Then in Render: **New → Blueprint**, point it at the repo, and it reads
`render.yaml`. Alternatively, **New → Static Site** and fill in the same values
by hand:

| Setting | Value |
| --- | --- |
| Build command | `npm ci && npm run build` |
| Publish directory | `dist` |
| Rewrite rule | Source `/*`, Destination `/index.html`, Action **Rewrite** |

**Do not skip the rewrite rule.** The site does its own routing, so a static
host that has never heard of `/lessons/next-word` will 404 on a refresh or a
shared link. Measured against a plain static host with no rewrite:

```
/                            -> 200
/lessons                     -> 404
/lessons/next-word           -> 404
/lessons/learn-the-hard-way  -> 404
```

With the rewrite in place all of those return 200 and the router takes over.
Note it must be a *rewrite*, not a redirect: a redirect would change the URL in
the address bar and break deep links.

Two details the blueprint already handles: `NODE_VERSION` is pinned so Render
builds on the same Node as local, and `/assets/*` gets a one-year immutable
cache header, which is safe because Vite puts a content hash in every asset
filename. `index.html` is deliberately left uncached so a deploy is picked up
immediately.

The site needs no environment variables, no secrets and no backend — every model
runs in the visitor's browser.

## How it's put together

```
src/
  lib/            every model, in plain JS — no ML library anywhere
    nn.js           feed-forward network: forward pass, activations, challenge scoring
    classifier.js   logistic regression over a 16x16 grid, trained by gradient descent
    ngram.js        trigram language model with backoff and temperature
    shapes.js       preset drawings, so the drawing lesson works without a mouse
    decisionTree.js the twenty-questions tree: walk, teach, tidy layout
    grid.js         the maze world shared by lessons 05 and 06, plus preset mazes
    pathfinding.js  breadth-first, greedy and A*, steppable one square at a time
    qlearning.js    the Q-table, episodes, and the plan it would follow
    recommender.js  per-topic scores, ranking, and the filter-bubble measure
    random.js       seeded PRNG, so "same choices, same result" is actually true
  data/
    lessons.js      the curriculum: which lessons exist and which are built
    corpus.js       the language model's entire training set (60 sentences)
    feed.js         the invented posts for lesson 07
  widgets/        the interactive parts, one folder per subject (grid/ is shared)
  components/     layout, UI primitives, lesson shell, motion helpers
  pages/          routes; lesson pages are lazy-loaded from App.jsx
  theme.js        colours, springs, easing — the single place to change the look
```

Lessons 05 and 06 deliberately share `lib/grid.js` and `widgets/grid/`: the same
maze is first solved by a search that can see every wall, then by a robot that
cannot see any of them. Editing one of those files affects both lessons.

Every model is deliberately small and deterministic. That is a teaching
decision, not a shortcut: it means the training animation shows real
optimisation, the learned weights are small enough to draw on screen, and the
same input always produces the same result.

It also means the lesson content has to be checked against the models, not just
written. Several mazes and constants here were tuned by measurement rather than
picked by eye — the greedy-search maze exists because the first three attempts
did not actually make greedy lose, and the drawing lesson's shape variation is
set where one training example genuinely fails and a dozen genuinely works. If
you change a preset maze, a reward, or a learning rate, re-check that the
challenge built on it is still winnable and still teaches the thing it claims.

## Adding a lesson

1. Add an entry to `src/data/lessons.js` with `status: 'ready'`.
2. Create a page under `src/pages/lessons/` that renders `<LessonShell>` with
   four steps: the idea, something to play with, a challenge, a recap.
3. Add its route in `src/App.jsx` (as a `lazy()` import, like the others).

Lessons still marked `status: 'soon'` render a placeholder page automatically —
no route needed.

## Accessibility

Sliders and every control are keyboard-operable, the neural network has a
button-based neuron picker so it isn't mouse-only, drawing lessons include
preset stamps, canvas widgets carry text equivalents, and ambient animation is
switched off when the visitor asks their OS to reduce motion. Instructional
animation slows down rather than disappearing, because in these lessons the
movement is the content.
