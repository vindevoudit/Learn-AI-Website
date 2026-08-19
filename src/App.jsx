import { Suspense, lazy } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Route, Routes, useLocation } from 'react-router-dom'
import NavBar from './components/layout/NavBar'
import Footer from './components/layout/Footer'
import ScrollToTop from './components/layout/ScrollToTop'
import Home from './pages/Home'
import LessonMap from './pages/LessonMap'
import NotFound from './pages/NotFound'

// Lessons load on demand. Between them they carry a maze simulator, a
// reinforcement learner and a language model, and someone landing on the home
// page should not have to download any of that.
const NeuralNetwork = lazy(() => import('./pages/lessons/NeuralNetwork'))
const TeachableMachine = lazy(() => import('./pages/lessons/TeachableMachine'))
const NextWord = lazy(() => import('./pages/lessons/NextWord'))
const TwentyQuestions = lazy(() => import('./pages/lessons/TwentyQuestions'))
const FindTheWayOut = lazy(() => import('./pages/lessons/FindTheWayOut'))
const LearnTheHardWay = lazy(() => import('./pages/lessons/LearnTheHardWay'))
const YourFeed = lazy(() => import('./pages/lessons/YourFeed'))
const ComingSoon = lazy(() => import('./pages/lessons/ComingSoon'))

/** Deliberately quiet: a spinner that flashes for 80ms is worse than nothing. */
function LessonLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <p className="readout">Loading the lesson…</p>
    </div>
  )
}

export default function App() {
  const location = useLocation()

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-panel focus:bg-signal focus:px-4 focus:py-2 focus:font-medium focus:text-void"
      >
        Skip to content
      </a>

      <NavBar />
      <ScrollToTop />

      <main id="main" className="flex-1">
        {/* mode="wait" keeps the outgoing page from overlapping the incoming
            one, which would double the grid background during the cross-fade. */}
        <AnimatePresence mode="wait" initial={false}>
          <Suspense fallback={<LessonLoading />}>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Home />} />
              <Route path="/lessons" element={<LessonMap />} />
              <Route path="/lessons/neural-network" element={<NeuralNetwork />} />
              <Route path="/lessons/teachable-machine" element={<TeachableMachine />} />
              <Route path="/lessons/next-word" element={<NextWord />} />
              <Route path="/lessons/twenty-questions" element={<TwentyQuestions />} />
              <Route path="/lessons/find-the-way-out" element={<FindTheWayOut />} />
              <Route path="/lessons/learn-the-hard-way" element={<LearnTheHardWay />} />
              <Route path="/lessons/your-feed" element={<YourFeed />} />
              <Route path="/lessons/:id" element={<ComingSoon />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  )
}
