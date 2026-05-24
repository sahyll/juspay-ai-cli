/**
 * Setup flow: detect agents → user PICKS which to set up → for each picked agent
 * write the Juspay MCP URL, install its skill, and authenticate.
 *
 * Idempotent: we only auto-authenticate agents whose MCP we FRESHLY added this
 * run. Re-running setup on an already-configured agent won't re-pop the browser.
 *
 * Auth runs ONLY in an interactive TTY — never in CI, or it would hang forever
 * waiting on a browser. No OAuth/token on our side; each agent self-authenticates.
 */

import { spawn } from "node:child_process"
import fs from "node:fs/promises"
import { cancel, isCancel, multiselect } from "@clack/prompts"

import { configFileFor, detectAgents, type AgentDef } from "./agents.js"
import { writeMcp } from "./mcp-writer.js"
import { DASHBOARD_MCP_NAME } from "./servers.js"
import { addSkills } from "./skills-installer.js"
import { done, info, spin, step, warn } from "./ui.js"

const AUTH_TIMEOUT_MS = 5 * 60 * 1000

export type SetupResult = {
  configured: AgentDef[]
  authenticated: AgentDef[]
  pending: AgentDef[]
}

export async function runSetup(): Promise<SetupResult> {
  const detected = await detectAgents()
  if (detected.length === 0) {
    warn("No supported AI agents detected on this machine.")
    info("Install one (claude, codex, gemini, opencode, copilot, cursor, windsurf) and re-run.")
    return { configured: [], authenticated: [], pending: [] }
  }

  // One flag gates BOTH the picker and the auth loop. Never prompt or wait on a
  // browser in a non-interactive (CI) context.
  const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY)
  const selected = await pickAgents(detected, interactive)
  if (selected.length === 0) {
    cancel("No agents selected.")
    process.exit(0)
  }

  // 1. MCP config. Track which were FRESHLY added (vs already present) so we only
  //    auto-auth new ones — re-running setup shouldn't re-pop the browser.
  const configured: AgentDef[] = []
  const freshlyAdded: AgentDef[] = []
  const s = spin(`Adding Juspay MCP to ${selected.length} agent(s)...`)
  for (const a of selected) {
    // Note if it was already configured BEFORE writing — used only to decide
    // whether to auto-auth (we don't re-pop the browser on re-runs). The write
    // itself always runs and is idempotent (merges, overwriting our two keys).
    const already = await isConfigured(a)
    try {
      await writeMcp(a)
      configured.push(a)
      if (!already) freshlyAdded.push(a)
    } catch (err) {
      info(`${a.label}: ${(err as Error).message}`)
    }
  }
  s.done(`Configured ${configured.map((a) => a.label).join(", ")}`)

  // 2. Skills (for exactly the configured agents)
  step("Installing skills...")
  try {
    await addSkills(configured)
    done("Skills installed")
  } catch (err) {
    warn(`Skills install failed: ${(err as Error).message}`)
  }

  // 3. Auth — interactive only, sequential, ONLY for freshly-added agents.
  const authenticated: AgentDef[] = []
  if (interactive) {
    for (const a of freshlyAdded) {
      if (!a.authCmd) continue
      step(`Authenticating ${a.label} — finish in the browser...`)
      try {
        await runAuth(a.authCmd)
        authenticated.push(a)
        done(`${a.label} authenticated`)
      } catch (err) {
        warn(authMessage(a, err))
      }
    }
  }

  // Pending = freshly-added agents still needing manual auth (no authCmd, auth
  // failed, or non-interactive). Already-configured agents are left untouched.
  const pending = freshlyAdded.filter((a) => !authenticated.includes(a))

  return { configured, authenticated, pending }
}

// Does the agent's config already contain our dashboard server? Used to avoid
// re-running auth on re-runs (a stable proxy that doesn't couple us to each
// agent's auth-store format).
async function isConfigured(agent: AgentDef): Promise<boolean> {
  try {
    const raw = await fs.readFile(configFileFor(agent), "utf8")
    return raw.includes(DASHBOARD_MCP_NAME)
  } catch {
    return false
  }
}

async function pickAgents(detected: AgentDef[], interactive: boolean): Promise<AgentDef[]> {
  // Non-interactive (CI/headless): configure all detected; auth is skipped above.
  if (!interactive) return detected

  const ids = await multiselect({
    message: "Which agents should get Juspay MCP + skills?",
    options: detected.map((a) => ({ value: a.id, label: a.label })),
    initialValues: [], // nothing pre-ticked — opt in
    required: true, // can't confirm an empty selection
  })
  if (isCancel(ids)) {
    cancel("Cancelled.")
    process.exit(0)
  }
  const set = new Set(ids as string[])
  return detected.filter((a) => set.has(a.id))
}

// Run an agent's auth command, with a timeout so a wedged browser flow can't
// hang the installer. Surfaces ENOENT (missing binary) and ETIMEDOUT distinctly.
function runAuth(cmd: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const [bin, ...args] = cmd
    const child = spawn(bin, args, { stdio: "inherit" })
    const timer = setTimeout(() => {
      child.kill("SIGTERM")
      reject(Object.assign(new Error("auth timed out"), { code: "ETIMEDOUT" }))
    }, AUTH_TIMEOUT_MS)
    child.on("error", (err) => {
      clearTimeout(timer)
      reject(err)
    })
    child.on("exit", (code) => {
      clearTimeout(timer)
      if (code === 0) resolve()
      else reject(new Error(`exit ${code}`))
    })
  })
}

function authMessage(a: AgentDef, err: unknown): string {
  const code = (err as NodeJS.ErrnoException).code
  const cmd = a.authCmd?.join(" ") ?? ""
  if (code === "ENOENT") return `${a.label} CLI not found in PATH — install it, then run: ${cmd}`
  if (code === "ETIMEDOUT") return `${a.label} auth timed out — run later: ${cmd}`
  return `${a.label} auth didn't complete — run later: ${cmd}`
}
