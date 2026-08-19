/**
 * An instrument panel: hairline bezel, a labelled top rail, and a live readout
 * on the right. Every widget on the site sits in one of these, which is what
 * makes the lessons read as parts of the same machine.
 */
export default function Panel({ label, readout, children, className = '', bodyClass = 'p-4' }) {
  return (
    <section className={`panel overflow-hidden ${className}`}>
      {(label || readout) && (
        <div className="rail">
          <span className="rail-label">{label}</span>
          {readout != null && <span className="readout">{readout}</span>}
        </div>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  )
}
