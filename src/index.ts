#!/usr/bin/env node
import fs from "node:fs/promises"
import pc from "picocolors"

import { AGENTS, configFileFor } from "./agents.js"
import { removeMcp } from "./mcp-writer.js"
import { DASHBOARD_MCP_NAME, PACKAGE_NAME } from "./servers.js"
import { runSetup, type SetupResult } from "./setup.js"
import { removeSkills } from "./skills-installer.js"
import { banner, done, info, summaryBox, warn } from "./ui.js"

function showHelp(): void {
  banner()
  process.stdout.write(`  Usage: npx ${PACKAGE_NAME} [command]\n\n`)
  process.stdout.write(pc.dim("  Adds the Juspay MCP server + skills to every AI agent installed on this\n"))
  process.stdout.write(pc.dim("  machine (user scope). Each agent authenticates the MCP itself on first use.\n\n"))
  process.stdout.write("  Commands:\n")
  process.stdout.write("    (no command)   Detect agents, add the Juspay MCP + skills to each\n")
  process.stdout.write("    uninstall      Remove the Juspay MCP + skills from all agents\n")
  process.stdout.write("    list           Show which agents have the Juspay MCP configured\n")
  process.stdout.write("    help           Show this help\n\n")
}

// After setup: agents are configured but each must authenticate the dashboard
// MCP itself (one-time, in-agent). Tell the user exactly how.
function nextSteps(result: SetupResult): void {
  process.stdout.write("\n  " + pc.bold("Next steps") + "\n")
  process.stdout.write("  " + pc.dim("Open any configured agent and authenticate the Juspay MCP (one-time):") + "\n")
  process.stdout.write("    " + pc.dim("• Claude Code: run ") + pc.cyan("/mcp") + pc.dim(" → select ") + pc.cyan(DASHBOARD_MCP_NAME) + pc.dim(" → Authenticate") + "\n")
  process.stdout.write("    " + pc.dim("• Codex:       ") + pc.cyan("codex mcp login " + DASHBOARD_MCP_NAME) + "\n")
  process.stdout.write("    " + pc.dim("• Others:      they prompt to sign in the first time the MCP is used") + "\n")
  process.stdout.write("\n  " + pc.dim("docs-mcp-server needs no auth. Remove everything: ") + pc.cyan(`npx ${PACKAGE_NAME} uninstall`) + "\n\n")
}

async function printSetupSummary(result: SetupResult): Promise<void> {
  const rows = [
    { label: "Agents ", value: result.agents.join(", ") },
    { label: "MCPs   ", value: "docs-mcp-server, juspay-mcp (agent-authenticated)" },
    { label: "Skills ", value: "integrate (global)" },
  ]
  summaryBox("Setup complete", rows)
  nextSteps(result)
}

async function runUninstall(): Promise<void> {
  const removed: string[] = []
  for (const a of AGENTS) {
    if (await removeMcp(a).catch(() => false)) removed.push(a.label)
  }
  if (removed.length > 0) done(`Removed Juspay MCP from: ${removed.join(", ")}`)
  else info("• No Juspay MCP entries found")

  if (await removeSkills()) done("Removed Juspay skills")
  else info("• Skills not auto-removed — remove the `integrate` skill from your agents if needed")

  process.stdout.write("\n  " + pc.cyan("Juspay removed.") + "\n\n")
}

async function runList(): Promise<void> {
  const configured: string[] = []
  for (const a of AGENTS) {
    try {
      const raw = await fs.readFile(configFileFor(a), "utf8")
      if (raw.includes(DASHBOARD_MCP_NAME)) configured.push(a.label)
    } catch {
      // no config for this agent
    }
  }
  if (configured.length === 0) {
    process.stdout.write("  " + pc.yellow("⚠ ") + `No agents configured. Run \`npx ${PACKAGE_NAME}\`.\n`)
    return
  }
  process.stdout.write("  " + pc.cyan("Juspay MCP is configured in:") + "\n")
  for (const label of configured) process.stdout.write(`    • ${label}\n`)
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const command = args[0]

  if (command === "help" || command === "--help" || command === "-h") {
    showHelp()
    return
  }

  banner()

  if (command === "uninstall") {
    await runUninstall()
    return
  }
  if (command === "list") {
    await runList()
    return
  }
  if (!command) {
    const result = await runSetup()
    if (result.agents.length > 0) await printSetupSummary(result)
    return
  }

  throw new Error(`Unknown command '${command}'. Run \`npx ${PACKAGE_NAME} help\`.`)
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err)
  process.stderr.write(pc.red("✗ ") + message + "\n")
  process.exit(1)
})
