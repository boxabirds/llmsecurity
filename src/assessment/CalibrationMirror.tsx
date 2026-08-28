/**
 * The metacognitive mirror.
 *
 * Shows predicted confidence against actual performance so learners notice
 * their own overconfidence — Module 5's lesson about overclaiming, applied to
 * the learner themselves.
 */
import { calibrationGap, calibrationVerdict, calibrationView, type Calibration } from './engine'
import './CalibrationMirror.css'

export function CalibrationMirror({ calibration }: { calibration: Calibration | null }) {
  const view = calibrationView(calibration)

  if (view === 'no-data' || !calibration) {
    return (
      <section className="calibration" aria-label="Confidence calibration">
        <h3 className="calibration__title">Confidence calibration</h3>
        <p className="calibration__nodata" data-testid="calibration-no-data">
          No data yet — make a prediction before a module to see how your confidence compares with
          your result.
        </p>
      </section>
    )
  }

  const gap = calibrationGap(calibration)

  return (
    <section className="calibration" aria-label="Confidence calibration" data-testid="calibration-readout">
      <h3 className="calibration__title">Confidence calibration</h3>
      <dl className="calibration__figures">
        <div>
          <dt>You predicted</dt>
          <dd>{calibration.predicted}%</dd>
        </div>
        <div>
          <dt>You scored</dt>
          <dd>{calibration.actual}%</dd>
        </div>
        <div>
          <dt>Gap</dt>
          <dd data-testid="calibration-gap">
            {gap > 0 ? '+' : ''}
            {gap}
          </dd>
        </div>
      </dl>
      <p className="calibration__verdict">{calibrationVerdict(calibration)}</p>
    </section>
  )
}
