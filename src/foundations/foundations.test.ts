/**
 * Story 8 — foundations: design-register linter (TC-01..TC-05) and runtime
 * guards (TC-06..TC-08).
 */
import { describe, expect, it, beforeEach } from 'vitest'
import { lint } from './lint'
import { DESIGN_REGISTER, type RegisterEntry } from './designRegister'
import {
  awardProgress,
  guardOutbound,
  installOutboundGuard,
  outboundGuardInstalled,
  KNOWN_LLM_HOSTS,
} from './guards'

const compliant: RegisterEntry = {
  id: 'ExampleInteractive',
  owner: 'story-test',
  principle: 'kapur-productive-failure',
}

describe('TC-01 an interactive with no linked principle fails the build', () => {
  it('reports the offending id', () => {
    const result = lint([{ id: 'Orphan', owner: 'story-test' }])
    expect(result.ok).toBe(false)
    expect(result.violations).toContain('Orphan: no linked learning-science principle')
  })
})

describe('TC-02 a decorative animation fails the build', () => {
  it('flags elements that carry no information', () => {
    const result = lint([{ ...compliant, id: 'Sparkles', decorative: true }])
    expect(result.ok).toBe(false)
    expect(result.violations).toContain('Sparkles: decorative element carries no information')
  })
})

describe('TC-03 an attack lab without a defensive bookend fails the build', () => {
  it('flags the missing bookend', () => {
    const result = lint([{ ...compliant, id: 'RawExploitDemo', isAttackLab: true }])
    expect(result.ok).toBe(false)
    expect(result.violations).toContain('RawExploitDemo: attack lab has no defensive bookend')
  })

  it('passes when the lab is bookended', () => {
    const result = lint([
      { ...compliant, id: 'InjectionPlayground', isAttackLab: true, hasBookend: true },
    ])
    expect(result.ok).toBe(true)
  })
})

describe('TC-04 a load-bearing check offering only recognition fails the build', () => {
  it('flags recognition-only mastery', () => {
    const result = lint([{ ...compliant, id: 'QuizGate', loadBearing: true }])
    expect(result.ok).toBe(false)
    expect(result.violations).toContain('QuizGate: load-bearing check offers recognition only')
  })

  it('passes when the check requires generation', () => {
    const result = lint([
      { ...compliant, id: 'MemoGate', loadBearing: true, generation: true },
    ])
    expect(result.ok).toBe(true)
  })
})

describe('TC-05 a fully compliant register passes', () => {
  it('accepts a clean entry set', () => {
    expect(lint([compliant]).ok).toBe(true)
  })

  it('holds the shipped register itself to the same rules', () => {
    const result = lint(DESIGN_REGISTER)
    expect(result.violations).toEqual([])
    expect(result.ok).toBe(true)
  })
})

describe('TC-06 a bare click earns no progress', () => {
  it('denies the award when no reasoning was supplied', () => {
    expect(awardProgress(false)).toBe(false)
  })
})

describe('TC-07 progress is granted after correct reasoning', () => {
  it('grants the award when reasoning is present', () => {
    expect(awardProgress(true)).toBe(true)
  })
})

describe('TC-08 outbound calls to external hosts are blocked', () => {
  it('blocks every known live-LLM host', () => {
    for (const host of KNOWN_LLM_HOSTS) {
      expect(guardOutbound(`https://${host}/v1/messages`)).toBe('block')
    }
  })

  it('blocks any cross-origin target, not just known model hosts', () => {
    expect(guardOutbound('https://analytics.example.com/beacon', 'http://localhost')).toBe('block')
    expect(guardOutbound('https://attacker.example/exfil?d=secret', 'http://localhost')).toBe(
      'block',
    )
  })

  it('allows same-origin and relative requests for the app own assets', () => {
    expect(guardOutbound('/assets/index.js', 'http://localhost')).toBe('allow')
    expect(guardOutbound('http://localhost/data/corpus.json', 'http://localhost')).toBe('allow')
  })

  it('refuses targets it cannot parse rather than defaulting to allow', () => {
    expect(guardOutbound('http://', 'http://localhost')).toBe('block')
  })

  describe('when installed over fetch', () => {
    beforeEach(() => {
      installOutboundGuard()
    })

    it('installs once and rejects a blocked request at run time', async () => {
      installOutboundGuard()
      expect(outboundGuardInstalled()).toBe(true)

      await expect(fetch('https://api.openai.com/v1/messages')).rejects.toThrow(
        /Blocked outbound request/,
      )
    })
  })
})
