/**
 * Skills installation via the `skills` npm CLI (vercel-labs/skills).
 * Driven by OUR agent selection: `skills add <pkg> -g -y -a <slug>` — global,
 * non-interactive, targeting exactly the agents the user picked. No `skills`
 * picker (avoids missed agents + its redraw glitches).
 */

import { spawn } from "node:child_process"

import { type AgentDef } from "./agents.js"
import { SKILLS_PACKAGE } from "./servers.js"

// Skill directory name as deployed by `skills`.
export const OUR_SKILL = "integrate"

export function addSkills(agents: AgentDef[]): Promise<void> {
  const slugs = [...new Set(agents.map((a) => a.skillsSlug).filter((s): s is string => Boolean(s)))]
  if (slugs.length === 0) return Promise.resolve()
  const agentArgs = slugs.flatMap((s) => ["-a", s])
  return runSkills(["add", SKILLS_PACKAGE, "-g", "-y", ...agentArgs])
}

// Best-effort global removal (uninstall). Returns false rather than throwing.
export async function removeSkills(): Promise<boolean> {
  try {
    await runSkills(["remove", SKILLS_PACKAGE, "-g", "-y"])
    return true
  } catch {
    return false
  }
}

function runSkills(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("npx", ["-y", "skills", ...args], { stdio: "inherit" })
    child.on("error", reject)
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`skills ${args[0]} exited ${code}`))))
  })
}
