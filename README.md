# Securing LLMs in the Enterprise — an interactive tutorial

A hands-on course on enterprise LLM security. Learners **become the attacker**
in safe sandboxes, succeed, and only then are handed the defenses that actually
hold — before confronting what remains genuinely unsolved.

Everything runs **on-device**: no backend, no live model calls, no data egress.
That is deliberate, and enforced at runtime — a course about the lethal trifecta
should not itself ship an exfiltration vector.

## The course

| Module | Stage | What the learner does |
|---|---|---|
| M0 Orientation | Understand | Watches an assistant email their own balance to a stranger, then sees why: one undifferentiated token stream |
| M1 OWASP map | Understand | Gets the map before the territory; it fills in as later labs are completed |
| M2 Prompt injection | Experience | Writes the payload, makes the assistant leak, transfers the attack to a new surface, then cuts a leg |
| M3 Three labs | Experience | Contrasts jailbreak, RAG poisoning and tool poisoning — three attacks, one root cause, three layers |
| M4 Defenses | Learn | Re-runs *their own* exploit against defenses they choose, and watches it fail |
| M5 Indefensible frontier | Confront | Predicts, then defeats a 95%-accurate guardrail, and learns to spot overclaiming |
| M6 Capstone | Apply | Makes a real go/no-go call and exports a risk memo that must state a residual risk |

## Running it

```bash
bun install
bun run dev            # Vite dev server
bun run build          # typecheck + production build
bun run dev:miniflare  # serve the built app under the Cloudflare runtime
bun run verify         # typecheck, tests, both CI gates, build
bunx playwright test   # 37 end-to-end tests, desktop + mobile
```

Deploys to **Cloudflare Pages** as a static bundle (`dist/`).

## Guarantees the build enforces

Two CI gates fail the build rather than trusting review:

- **`bun run lint:foundations`** — every interactive must name the
  learning-science principle it serves, no decorative animation, every attack lab
  bookended by the defensive lens, and every load-bearing check must require
  *generation* rather than recognition.
- **`bun run lint:references`** — every citation must resolve to the typed
  registry, and every entry must carry a summary, the claim as used here, and a
  confidence-and-caveat line.

Plus, at runtime: `installOutboundGuard()` wraps `fetch` and refuses any
cross-origin request, so the no-egress property is enforced rather than asserted.

## Accuracy

Every figure in the tutorial was verified against its primary source and is
stated with its conditions — PoisonedRAG's ~90% with five texts against a corpus
of millions, CorruptRAG's comparable result with one, MCPTox's 72.8% peak on
o1-mini across 45 servers and 353 tools, CaMeL's 77%-vs-84% utility cost. Where
no primary source could be verified, the content describes the *class* of
incident rather than naming a case. Simulations are labelled as illustrative
mechanics, never as real model output.

## Documentation

- [`docs/llm-enterprise-security-research.md`](docs/llm-enterprise-security-research.md) — the verified research this teaches, including what is currently indefensible
- [`docs/interactive-tutorial-plan.md`](docs/interactive-tutorial-plan.md) — content and build architecture
- [`docs/interactive-tutorial-tech-design.md`](docs/interactive-tutorial-tech-design.md) — the pedagogy behind every interaction
- [`docs/ux-review.md`](docs/ux-review.md) — heuristic review and the mobile-first design decisions
- [`docs/implementation-plan.md`](docs/implementation-plan.md) — build sequencing
- [`docs/defensive-tooling-matrix.md`](docs/defensive-tooling-matrix.md) and [`docs/novel-tool-proposals.md`](docs/novel-tool-proposals.md) — the tooling landscape and where it is empty
