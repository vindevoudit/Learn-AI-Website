import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import LessonShell from '../../components/lesson/LessonShell'
import Panel from '../../components/ui/Panel'
import Button from '../../components/ui/Button'
import Callout from '../../components/ui/Callout'
import NetworkGraph from '../../widgets/neural-net/NetworkGraph'
import WeightPanel from '../../widgets/neural-net/WeightPanel'
import { getLesson } from '../../data/lessons'
import { colors, spring } from '../../theme'
import {
  INPUT_CASES,
  LAYER_SIZES,
  TARGET_AND,
  forward,
  makeNetwork,
  randomize,
  scoreChallenge,
  setBias,
  setWeight,
} from '../../lib/nn'

const lesson = getLesson('neural-network')

/** A starting network that does something visible but isn't the answer. */
function startingNetwork() {
  const net = makeNetwork(LAYER_SIZES)
  net.layers[0].weights = [
    [1.2, 1.2],
    [-0.8, 1.5],
    [1.6, -0.9],
  ]
  net.layers[0].biases = [-0.5, 0.2, 0.1]
  net.layers[1].weights = [[1.4, 0.6, 0.6]]
  net.layers[1].biases = [-0.8]
  return net
}

function InputSwitch({ index, value, onToggle }) {
  const on = value === 1
  return (
    <button
      type="button"
      onClick={() => onToggle(index, on ? 0 : 1)}
      aria-pressed={on}
      className={`flex items-center gap-3 rounded-panel border px-3 py-2 text-left transition-colors ${
        on ? 'border-signal/60 bg-signal/10' : 'border-line bg-panel hover:border-mute/40'
      }`}
    >
      <span className="relative block h-5 w-9 rounded-full bg-line">
        <motion.span
          layout
          transition={spring.snappy}
          className="absolute top-0.5 h-4 w-4 rounded-full"
          style={{
            left: on ? 18 : 2,
            background: on ? colors.signal : colors.mute,
            boxShadow: on ? `0 0 12px ${colors.signal}` : 'none',
          }}
        />
      </span>
      <span className="text-sm">
        Switch {index + 1}
        <span className="ml-2 font-mono text-[11px] text-mute">{on ? 'ON' : 'OFF'}</span>
      </span>
    </button>
  )
}

/** The four-row truth table, checked live against the target behaviour. */
function TruthTable({ network }) {
  const { results, solved } = useMemo(() => scoreChallenge(network, TARGET_AND), [network])

  return (
    <Panel
      label="Challenge · fire only when both switches are on"
      readout={solved ? 'solved' : `${results.filter((r) => r.correct).length} of 4 correct`}
    >
      <ul className="space-y-2">
        {results.map((row, i) => (
          <li
            key={i}
            className="flex items-center gap-3 rounded-panel border border-line bg-panel2/50 px-3 py-2"
          >
            <span className="font-mono text-[12px] text-mute">
              {row.inputs[0]} · {row.inputs[1]}
            </span>
            <span className="readout w-24">
              should be {row.target === 1 ? 'ON' : 'OFF'}
            </span>

            {/* The output bar is the fastest read: long and cyan = firing. */}
            <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-line">
              <motion.span
                className="absolute inset-y-0 left-0 rounded-full"
                animate={{ width: `${row.output * 100}%` }}
                transition={spring.soft}
                style={{ background: row.correct ? colors.charge : colors.spark }}
              />
            </span>

            <span
              className="w-12 text-right font-mono text-[12px] tabular-nums"
              style={{ color: row.correct ? colors.charge : colors.spark }}
            >
              {row.output.toFixed(2)}
            </span>
          </li>
        ))}
      </ul>

      <motion.p
        className="mt-4 text-[15px] leading-relaxed"
        animate={{ color: solved ? colors.charge : colors.mute }}
      >
        {solved
          ? 'Solved. You just programmed a network without writing a line of code — you only changed numbers.'
          : 'Aim for under 0.30 on the OFF rows and over 0.70 on the ON row. Try raising the output neuron’s bias downward and leaning hard on one hidden neuron.'}
      </motion.p>
    </Panel>
  )
}

export default function NeuralNetwork() {
  const [network, setNetwork] = useState(startingNetwork)
  const [inputs, setInputs] = useState([1, 0])
  const [selected, setSelected] = useState({ layer: 0, neuron: 0 })
  const [pulseKey, setPulseKey] = useState(0)

  const { activations, output } = useMemo(() => forward(network, inputs), [network, inputs])

  const handleInput = (index, value) => {
    setInputs((prev) => prev.map((v, i) => (i === index ? value : v)))
    setPulseKey((k) => k + 1)
  }

  const playground = (
    <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
      <div className="space-y-4">
        <Panel label="The network" readout={`output ${output.toFixed(3)}`} bodyClass="p-3">
          <NetworkGraph
            network={network}
            activations={activations}
            selected={selected}
            onSelect={setSelected}
            pulseKey={pulseKey}
            pickable
          />
        </Panel>

        <Panel label="Inputs" readout="click to flip">
          <div className="flex flex-wrap items-center gap-3">
            {inputs.map((value, i) => (
              <InputSwitch key={i} index={i} value={value} onToggle={handleInput} />
            ))}
            <Button variant="ghost" size="sm" onClick={() => setPulseKey((k) => k + 1)}>
              Send a signal
            </Button>
            <Button
              variant="quiet"
              size="sm"
              onClick={() => {
                setNetwork(randomize(LAYER_SIZES))
                setPulseKey((k) => k + 1)
              }}
            >
              Randomise weights
            </Button>
            <Button variant="quiet" size="sm" onClick={() => setNetwork(startingNetwork())}>
              Reset
            </Button>
          </div>
        </Panel>
      </div>

      <WeightPanel
        network={network}
        activations={activations}
        selected={selected}
        onWeight={(layer, neuron, from, value) =>
          setNetwork((net) => setWeight(net, layer, neuron, from, value))
        }
        onBias={(layer, neuron, value) => setNetwork((net) => setBias(net, layer, neuron, value))}
      />
    </div>
  )

  const steps = [
    {
      id: 'hook',
      label: 'The idea',
      title: 'A neuron is a very opinionated adder',
      intro:
        'That is genuinely most of it. A neuron takes the numbers coming in, multiplies each by how much it cares about that input, adds them up, and squashes the total into a value between 0 and 1.',
      content: (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel label="What one neuron does" readout="3 steps">
            <ol className="space-y-4">
              {[
                {
                  n: 'Multiply',
                  d: 'Each incoming number is multiplied by a weight — how much this neuron cares about that input. A big weight means "this matters a lot".',
                },
                {
                  n: 'Add',
                  d: 'All those results are added together, along with a bias — the neuron\'s general eagerness to fire at all.',
                },
                {
                  n: 'Squash',
                  d: 'The total gets squeezed into a number between 0 and 1. Near 1 means firing hard, near 0 means staying quiet.',
                },
              ].map((item, i) => (
                <li key={item.n} className="flex gap-4">
                  <span className="mt-0.5 font-mono text-[11px] text-signal">0{i + 1}</span>
                  <div>
                    <p className="font-medium">{item.n}</p>
                    <p className="mt-1 text-[15px] leading-relaxed text-mute">{item.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>

          <div className="space-y-4">
            <Panel label="Live network" bodyClass="p-3">
              <NetworkGraph
                network={network}
                activations={activations}
                selected={null}
                onSelect={() => {}}
                pulseKey={pulseKey}
              />
            </Panel>
            <Callout title="Why bother stacking them" tone="signal">
              One neuron can only draw a straight line between two answers. Stack a layer of them and
              the network can carve up much stranger shapes — which is why the middle column exists.
            </Callout>
          </div>
        </div>
      ),
    },
    {
      id: 'play',
      label: 'Play',
      title: 'Turn the dials',
      intro:
        'Click a neuron to open its weights. Watch the edges thicken as you turn a weight up, and watch the glow change as the signal reaches the end. Nothing here can break.',
      content: playground,
    },
    {
      id: 'challenge',
      label: 'Challenge',
      title: 'Make it fire only when both switches are on',
      intro:
        'Right now the network fires for all sorts of inputs. Your job is to tune the weights until the output is high for ON + ON and low for everything else. The table checks all four cases at once.',
      content: (
        <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          <div className="space-y-4">
            <Panel label="The network" readout={`output ${output.toFixed(3)}`} bodyClass="p-3">
              <NetworkGraph
                network={network}
                activations={activations}
                selected={selected}
                onSelect={setSelected}
                pulseKey={pulseKey}
                pickable
              />
            </Panel>
            <TruthTable network={network} />
          </div>
          <WeightPanel
            network={network}
            activations={activations}
            selected={selected}
            onWeight={(layer, neuron, from, value) =>
              setNetwork((net) => setWeight(net, layer, neuron, from, value))
            }
            onBias={(layer, neuron, value) =>
              setNetwork((net) => setBias(net, layer, neuron, value))
            }
          />
        </div>
      ),
    },
    {
      id: 'recap',
      label: 'Recap',
      title: 'What you just did',
      content: (
        <div className="grid gap-4 sm:grid-cols-3">
          <Callout title="Weights are the knowledge" tone="signal">
            A network doesn't store facts. It stores numbers on connections. Change the numbers and
            you change what it believes.
          </Callout>
          <Callout title="Layers build up ideas" tone="signal">
            Hidden neurons each spot something small. The output neuron listens to all of them and
            makes the final call.
          </Callout>
          <Callout title="You did it the slow way" tone="charge">
            You turned {INPUT_CASES.length * 3} dials by hand. Real networks have billions, so they
            are tuned automatically instead — which is exactly what lesson 02 is about.
          </Callout>
        </div>
      ),
    },
  ]

  return <LessonShell lesson={lesson} steps={steps} />
}
