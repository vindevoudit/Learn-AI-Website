/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        void: '#08080F',
        panel: '#10101F',
        panel2: '#161628',
        line: '#252540',
        ink: '#E9E9F6',
        mute: '#8B8BAA',
        signal: '#22D3EE',
        spark: '#F472B6',
        charge: '#A3E635',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        panel: '6px',
      },
      boxShadow: {
        glow: '0 0 24px -4px currentColor',
      },
    },
  },
  plugins: [],
}
