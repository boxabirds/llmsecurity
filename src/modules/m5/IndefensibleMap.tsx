/**
 * The indefensible map.
 *
 * Eight frightening problems collapse into one root cause plus two force
 * multipliers. On a phone the tree renders as an accordion.
 */
import { useState } from 'react'
import { Citation } from '../../references/Citation'
import { AREAS, MULTIPLIERS, ROOT_CAUSE } from './areas'
import './m5.css'

export function IndefensibleMap() {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <section className="m5-map" aria-label="The indefensible frontier" data-testid="indefensible-map">
      <h2>Eight problems, one cause</h2>
      <p className="m5-map__root" data-testid="root-cause">
        <strong>Root cause:</strong> {ROOT_CAUSE}
      </p>

      <ul className="m5-map__areas">
        {AREAS.map((area) => {
          const open = openId === area.id
          return (
            <li key={area.id} className="m5-map__area">
              <button
                type="button"
                className="m5-map__toggle"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : area.id)}
                data-testid={`area-${area.id}`}
              >
                {area.title}
              </button>

              {open ? (
                <div className="m5-map__detail" data-testid={`detail-${area.id}`}>
                  <p>{area.summary}</p>
                  <p className="m5-map__trace">
                    <strong>Traces to:</strong> {ROOT_CAUSE}
                  </p>
                  <p className="m5-map__trace" data-testid={`multiplier-${area.id}`}>
                    <strong>Amplified by:</strong> {MULTIPLIERS[area.multiplier]}
                  </p>
                  {area.referenceId ? <Citation id={area.referenceId} /> : null}
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
