/**
 * Lab 3 — tool-metadata poisoning.
 *
 * The learner edits the tool's DESCRIPTION. The implementation is displayed
 * beside it, unchanged and uneditable, because the whole point is that nothing
 * executable was touched: the description is documentation to a human and
 * trusted operating context to the agent, and that difference is the attack.
 */
import { TouchTarget, ActionBar } from '../../responsive/TouchTarget'
import { RiskSignal } from '../../a11y/RiskSignal'
import { Citation } from '../../references/Citation'
import { announce } from '../../a11y/announce'
import {
  runMcpLab,
  CLEAN_TOOL_DESCRIPTION,
  POISONED_TOOL_DESCRIPTION,
  MCP_TOOL_CODE,
  MCP_TOOL_NAME,
  type McpLabResult,
} from './labs'
import './m3.css'

export interface McpPoisonLabProps {
  description: string
  onDescriptionChange: (description: string) => void
  result: McpLabResult | null
  onRun: (result: McpLabResult) => void
}

export function McpPoisonLab({
  description,
  onDescriptionChange,
  result,
  onRun,
}: McpPoisonLabProps) {
  function run() {
    const outcome = runMcpLab({ description })
    announce(outcome.announcement)
    onRun(outcome)
  }

  return (
    <section className="m3-lab" data-testid="mcp-lab" aria-label="Tool metadata poisoning lab">
      <h3 className="m3-lab__title">Tool-metadata poisoning</h3>
      <p className="m3-lab__note">
        <Citation id="mcptox">MCPTox</Citation> measured a peak 72.8% attack success rate on
        o1-mini across 45 real MCP servers and 353 authentic tools, and found that more capable
        models were often <em>more</em> susceptible — the attack rides on good instruction
        following, so a model upgrade can worsen the posture.
      </p>

      <div className="m3-mcp">
        <div className="m3-mcp__pane">
          <h4 className="m3-mcp__title">Implementation — unchanged, not editable</h4>
          <pre className="m3-mcp__code" data-testid="mcp-tool-code">
            <code>{MCP_TOOL_CODE}</code>
          </pre>
          <p className="m3-lab__note" data-testid="mcp-metadata-only">
            You are about to change no code at all. Only the metadata below changes — and the agent
            reads that metadata as instructions it should follow.
          </p>
        </div>

        <div className="m3-mcp__pane">
          <label className="m3-field">
            <span className="m3-field__label">
              Description published for <code>{MCP_TOOL_NAME}</code>
            </span>
            <textarea
              className="m3-field__input"
              data-testid="mcp-description-input"
              rows={5}
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
            />
          </label>
        </div>
      </div>

      <ActionBar>
        <TouchTarget onClick={() => onDescriptionChange(CLEAN_TOOL_DESCRIPTION)}>
          Restore the clean description
        </TouchTarget>
        <TouchTarget onClick={() => onDescriptionChange(POISONED_TOOL_DESCRIPTION)}>
          Paste a poisoned description
        </TouchTarget>
        <TouchTarget primary onClick={run}>
          Call the tool
        </TouchTarget>
      </ActionBar>

      {result ? (
        <div
          className={`m3-result${result.compromised ? ' m3-result--breached' : ' m3-result--safe'}`}
          data-testid="lab-result"
          data-lab="mcp"
          data-compromised={result.compromised ? 'true' : 'false'}
          data-code-changed={result.codeChanged ? 'true' : 'false'}
        >
          <RiskSignal
            level={result.compromised ? 'exposed' : 'contained'}
            detail={
              result.compromised
                ? 'The agent obeyed the description. No code changed — only metadata.'
                : 'The agent used the tool normally. No code changed — only metadata.'
            }
          />

          <p className="m3-result__label">What the user sees:</p>
          <p className="m3-result__response" data-testid="mcp-response">
            {result.response}
          </p>

          {result.compromised && result.call.hijack ? (
            <p className="m3-result__label" data-testid="mcp-obeyed">
              Silently obeyed: <code>{result.call.hijack.matched}</code> — it{' '}
              {result.call.hijack.label}.
            </p>
          ) : null}

          <details className="m3-result__trace">
            <summary>Why the agent did that</summary>
            <p>{result.trace}</p>
          </details>
        </div>
      ) : null}
    </section>
  )
}
