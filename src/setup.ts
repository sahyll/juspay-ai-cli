/**
 * Setup flow: detect installed agents → write the Juspay MCP URL into each
 * agent's user-scope config → install the skill globally. No OAuth, no token —
 * each agent authenticates the dashboard server itself on first use.
 */

import { detectAgents } from "./agents.js"
import { writeMcp } from "./mcp-writer.js"
import { addSkills } from "./skills-installer.js"
import { done, info, spin, step, warn } from "./ui.js"

export type SetupResult = {
  agents: string[]
  configs: string[]
}

export async function runSetup(): Promise<SetupResult> {
  const agents = await detectAgents()
  if (agents.length === 0) {
    warn("No supported AI agents detected on this machine.")
    info("Install one (claude, codex, gemini, opencode, copilot, cursor, windsurf) and re-run.")
    return { agents: [], configs: [] }
  }

  const labels: string[] = []
  const configs: string[] = []
  const s = spin(`Adding Juspay MCP to ${agents.length} agent(s)...`)
  for (const a of agents) {
    try {
      const file = await writeMcp(a)
      configs.push(file)
      labels.push(a.label)
    } catch (err) {
      info(`${a.label}: ${(err as Error).message}`)
    }
  }
  s.done(`Configured ${labels.join(", ")}`)

  step("Installing skills — choose your agents in the prompt below:")
  try {
    await addSkills()
    done("Skills installed")
  } catch (err) {
    warn(`Skills install failed: ${(err as Error).message}`)
  }

  return { agents: labels, configs }
}
