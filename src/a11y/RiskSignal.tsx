/**
 * Risk is never encoded by colour alone.
 *
 * Every risk readout pairs an icon, a text label, and an explanatory sentence.
 * This is both a WCAG requirement and the tutorial's own thesis applied to
 * itself: do not trust a single signal.
 */
import './RiskSignal.css'

export type RiskLevel = 'contained' | 'elevated' | 'exposed'

export interface RiskSignalData {
  icon: string
  label: string
  text: string
}

const SIGNALS: Record<RiskLevel, RiskSignalData> = {
  contained: { icon: '✔', label: 'Contained', text: 'No exploitable path in this configuration.' },
  elevated: { icon: '▲', label: 'Elevated', text: 'Exploitable under some conditions.' },
  exposed: { icon: '✕', label: 'Exposed', text: 'Directly exploitable as configured.' },
}

export function riskSignalFor(level: RiskLevel): RiskSignalData {
  return SIGNALS[level]
}

export function RiskSignal({ level, detail }: { level: RiskLevel; detail?: string }) {
  const signal = SIGNALS[level]
  return (
    <p className={`risk-signal risk-signal--${level}`} data-risk={level}>
      <span className="risk-signal__icon" aria-hidden="true">
        {signal.icon}
      </span>
      <span className="risk-signal__label">{signal.label}</span>
      <span className="risk-signal__text">{detail ?? signal.text}</span>
    </p>
  )
}
