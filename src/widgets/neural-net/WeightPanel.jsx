import Slider from '../../components/ui/Slider'
import Panel from '../../components/ui/Panel'
import { colors } from '../../theme'
import { preActivation, sigmoid } from '../../lib/nn'

const layerName = (l) => (l === 0 ? 'Hidden' : 'Output')
const sourceName = (layerIndex, i) =>
  layerIndex === 0 ? `Input ${i + 1}` : `Hidden ${i + 1}`

/**
 * The dials for one selected neuron, plus the arithmetic it's doing spelled out
 * underneath. The sum is shown because "multiply, add, squash" is the whole
 * secret — hiding it would make the network look like magic.
 */
export default function WeightPanel({ network, activations, selected, onWeight, onBias }) {
  if (!selected) {
    return (
      <Panel label="Neuron controls" readout="none selected">
        <p className="text-[15px] leading-relaxed text-mute">
          Click any neuron in the middle or right column to open its dials.
        </p>
      </Panel>
    )
  }

  const { layer, neuron } = selected
  const weights = network.layers[layer].weights[neuron]
  const bias = network.layers[layer].biases[neuron]
  const sum = preActivation(network, activations, layer, neuron)
  const output = sigmoid(sum)

  return (
    <Panel
      label={`${layerName(layer)} neuron ${neuron + 1}`}
      readout={`fires at ${output.toFixed(2)}`}
    >
      <div className="space-y-4">
        {weights.map((weight, i) => (
          <Slider
            key={i}
            id={`w-${layer}-${neuron}-${i}`}
            label={`Listens to ${sourceName(layer, i)}`}
            value={weight}
            onChange={(v) => onWeight(layer, neuron, i, v)}
            min={-4}
            max={4}
            step={0.05}
            accent={weight >= 0 ? colors.signal : colors.spark}
          />
        ))}

        <Slider
          id={`b-${layer}-${neuron}`}
          label="Bias — how easily it fires"
          value={bias}
          onChange={(v) => onBias(layer, neuron, v)}
          min={-4}
          max={4}
          step={0.05}
          accent={colors.charge}
        />
      </div>

      {/* The arithmetic, live. */}
      <div className="mt-5 border-t border-line pt-4">
        <p className="readout leading-relaxed">
          {weights
            .map(
              (w, i) =>
                `(${w.toFixed(2)} × ${activations[layer][i].toFixed(2)})`,
            )
            .join(' + ')}{' '}
          + {bias.toFixed(2)} = <span className="text-ink">{sum.toFixed(2)}</span>
        </p>
        <p className="readout mt-1">
          squash({sum.toFixed(2)}) ={' '}
          <span style={{ color: colors.charge }}>{output.toFixed(2)}</span>
        </p>
      </div>
    </Panel>
  )
}
