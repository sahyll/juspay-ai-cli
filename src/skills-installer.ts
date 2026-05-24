/**
 * Skills installation via the `skills` npm CLI (vercel-labs/skills).
 * We run the INTERACTIVE picker (`skills add <pkg>`) and let the user choose
 * which agents (and scope) to install to — nothing is auto-selected.
 */

import { spawn } from "node:child_process"

import { SKILLS_PACKAGE } from "./servers.js"

// Skill directory name as deployed by `skills`.
export const OUR_SKILL = "integrate"

// Interactive: the user picks agents + scope in the prompt. We deliberately do
// NOT pass -a/-y, so nothing is pre-checked.
export function addSkills(): Promise<void> {
  return runSkills(["add", SKILLS_PACKAGE])
}

// Best-effort removal (uninstall). Returns false rather than throwing if the
// CLI doesn't support `remove`.
export async function removeSkills(): Promise<boolean> {
  try {
    await runSkills(["remove", SKILLS_PACKAGE, "-y"])
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
