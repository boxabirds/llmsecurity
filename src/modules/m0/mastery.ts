/**
 * Module 0 mastery gate.
 *
 * Recognition is not enough here: for every system the learner has to make a
 * judgement (are all three legs present?) and, for every system they call safe,
 * *generate* the answer — name the leg that is absent. Guessing "safe" without
 * being able to say which leg is missing does not pass.
 *
 * Each safe system below is missing exactly one leg, so the named answer is
 * unambiguous.
 */
import { trifectaComplete, LEG_LABELS, type LegConfig, type LegName } from '../../sim/kernel'

export interface M0System {
  id: string
  name: string
  /** A short, concrete description — enough to read the three legs off it. */
  description: string
  legs: LegConfig
}

/**
 * Five systems: two carry all three legs, three are missing exactly one.
 * Between them the three safe systems cover each leg once, so the learner
 * cannot pass by naming the same leg every time.
 */
export const M0_SYSTEMS: readonly M0System[] = [
  {
    id: 'inbox-triage',
    name: 'Inbox triage assistant',
    description:
      'Reads every message in your mailbox, including mail from people you have never met. It can look up your account details to answer questions about payments, and it can send mail on your behalf.',
    legs: { privateData: true, untrustedContent: true, externalComms: true },
  },
  {
    id: 'pr-reviewer',
    name: 'Pull-request reviewer',
    description:
      'Reviews pull requests opened by anonymous contributors and posts its review back into the public thread. It runs in a throwaway sandbox with no credentials, no customer data and no internal repositories.',
    legs: { privateData: false, untrustedContent: true, externalComms: true },
  },
  {
    id: 'payroll-drafter',
    name: 'Payroll letter drafter',
    description:
      'Drafts salary letters from the HR database and emails them to staff. Its only other input is a fixed template maintained by the HR team: it never reads inbound mail, attachments, tickets or the web.',
    legs: { privateData: true, untrustedContent: false, externalComms: true },
  },
  {
    id: 'invoice-reader',
    name: 'Invoice reconciler',
    description:
      'Reads supplier invoices that arrive as email attachments and reconciles them against the private ledger. Its answers are rendered on screen only — no send, no fetch, no webhook, no outbound network of any kind.',
    legs: { privateData: true, untrustedContent: true, externalComms: false },
  },
  {
    id: 'support-copilot',
    name: 'Customer support copilot',
    description:
      'Answers tickets written by members of the public, has read access to the customer record system, and can send replies and issue refunds through the payments API.',
    legs: { privateData: true, untrustedContent: true, externalComms: true },
  },
] as const

const LEG_NAMES: readonly LegName[] = ['privateData', 'untrustedContent', 'externalComms'] as const

/** The legs a system does NOT have. Safe systems here always return exactly one. */
export function missingLegs(system: M0System): LegName[] {
  return LEG_NAMES.filter((leg) => !system.legs[leg])
}

export function systemById(id: string): M0System | undefined {
  return M0_SYSTEMS.find((system) => system.id === id)
}

export interface M0Answer {
  /** The learner's judgement. `null` means not yet answered. */
  complete: boolean | null
  /** For a system judged safe: the leg the learner says is absent. */
  missingLeg: LegName | null
}

export type M0Answers = Readonly<Record<string, M0Answer | undefined>>

export interface M0MasteryOutcome {
  passed: boolean
  reason: string
  /** How many of the five judgements the learner has made. */
  answered: number
  /** How many of those judgements hold. */
  correctJudgements: number
  /** Safe systems whose absent leg is correctly named. */
  legsNamed: number
  /** Safe systems that require a named leg. */
  legsRequired: number
}

export function emptyAnswers(): Record<string, M0Answer> {
  const answers: Record<string, M0Answer> = {}
  for (const system of M0_SYSTEMS) answers[system.id] = { complete: null, missingLeg: null }
  return answers
}

/**
 * Passing requires both halves for every system: the right judgement, and — for
 * each system that is missing a leg — the right leg named.
 */
export function evaluateMastery(answers: M0Answers): M0MasteryOutcome {
  let answered = 0
  let correctJudgements = 0
  let legsRequired = 0
  let legsNamed = 0
  let legsUnnamed = 0

  for (const system of M0_SYSTEMS) {
    const answer = answers[system.id]
    const armed = trifectaComplete(system.legs)

    if (answer && answer.complete !== null) answered += 1
    if (answer && answer.complete === armed) correctJudgements += 1

    if (!armed) {
      legsRequired += 1
      const absent = missingLegs(system)
      if (!answer || answer.missingLeg === null) legsUnnamed += 1
      else if (absent.includes(answer.missingLeg)) legsNamed += 1
    }
  }

  const total = M0_SYSTEMS.length
  const base = { answered, correctJudgements, legsNamed, legsRequired }

  if (answered < total) {
    return {
      ...base,
      passed: false,
      reason: `Judge all ${total} systems first — ${total - answered} still to call.`,
    }
  }

  if (correctJudgements < total) {
    return {
      ...base,
      passed: false,
      reason: `${total - correctJudgements} of the ${total} calls do not hold. Re-read each system and count the legs: ${LEG_LABELS.privateData}, ${LEG_LABELS.untrustedContent}, ${LEG_LABELS.externalComms}.`,
    }
  }

  if (legsUnnamed > 0) {
    return {
      ...base,
      passed: false,
      reason: `Name the absent leg for every system you called safe — ${legsUnnamed} still unnamed.`,
    }
  }

  if (legsNamed < legsRequired) {
    return {
      ...base,
      passed: false,
      reason:
        'One of the legs you named is present in that system after all. A system is only safe on the leg it genuinely lacks.',
    }
  }

  return {
    ...base,
    passed: true,
    reason: `All ${total} calls hold, and you named the absent leg in each of the ${legsRequired} safe systems. You are reading systems by capability rather than by how dangerous they sound.`,
  }
}
