/**
 * Agent registry — the single data table that drives MCP config writing and
 * detection. Adding a new agent is a new row here, not new code anywhere else.
 *
 * Each row declares WHERE the agent reads its USER-SCOPE (global) MCP config
 * (path/format/container key) and HOW one server entry is shaped (`entry`).
 *
 * No auth/token handling: we write the server URL only. Each agent runs its own
 * OAuth (MCP authorization spec) the first time the dashboard server is used.
 */

import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import which from "which"

const HOME = os.homedir()

export type ConfigFormat = "json" | "toml"

export type AgentDef = {
  id: string
  label: string
  // --- MCP config target (absolute, user scope) ---
  configPath: string
  format: ConfigFormat
  containerKey: string // "mcpServers" | "mcp" | "servers" | "mcp_servers"
  // --- how one server entry is shaped (URL only) ---
  entry: (url: string) => Record<string, unknown>
  // --- detection ---
  bin?: string // detected if this binary is on PATH
  homeMarkers?: string[] // home-relative paths that signal the agent is installed
  vscodeExt?: boolean // special: scan VS Code extensions dir for Copilot
}

// VS Code stores its user MCP config under the per-platform user data dir.
function vscodeUserMcp(): string {
  if (process.platform === "darwin") {
    return path.join(HOME, "Library", "Application Support", "Code", "User", "mcp.json")
  }
  if (process.platform === "win32") {
    return path.join(process.env.APPDATA ?? path.join(HOME, "AppData", "Roaming"), "Code", "User", "mcp.json")
  }
  return path.join(HOME, ".config", "Code", "User", "mcp.json")
}

// --- per-agent entry shapes (URL only; the agent self-authenticates) ---
const httpType = (url: string) => ({ type: "http", url }) // Claude, Copilot, VS Code
const urlOnly = (url: string) => ({ url }) // Codex (TOML), Cursor
const httpUrlField = (url: string) => ({ httpUrl: url }) // Gemini
const opencodeRemote = (url: string) => ({ type: "remote", url, enabled: true }) // OpenCode
const windsurfUrl = (url: string) => ({ serverUrl: url }) // Windsurf

export const AGENTS: AgentDef[] = [
  {
    id: "claude",
    label: "Claude Code",
    configPath: path.join(HOME, ".claude.json"),
    format: "json",
    containerKey: "mcpServers",
    entry: httpType,
    bin: "claude",
    homeMarkers: [".claude", ".claude.json"],
  },
  {
    id: "codex",
    label: "Codex",
    configPath: path.join(HOME, ".codex", "config.toml"),
    format: "toml",
    containerKey: "mcp_servers",
    entry: urlOnly,
    bin: "codex",
    homeMarkers: [".codex"],
  },
  {
    id: "gemini",
    label: "Gemini CLI",
    configPath: path.join(HOME, ".gemini", "settings.json"),
    format: "json",
    containerKey: "mcpServers",
    entry: httpUrlField,
    bin: "gemini",
    homeMarkers: [".gemini"],
  },
  {
    id: "opencode",
    label: "OpenCode",
    configPath: path.join(HOME, ".config", "opencode", "opencode.json"),
    format: "json",
    containerKey: "mcp",
    entry: opencodeRemote,
    bin: "opencode",
    homeMarkers: [path.join(".config", "opencode")],
  },
  {
    id: "copilot",
    label: "Copilot CLI",
    configPath: path.join(HOME, ".copilot", "mcp-config.json"),
    format: "json",
    containerKey: "mcpServers",
    entry: httpType,
    bin: "copilot",
    homeMarkers: [".copilot"],
  },
  {
    id: "cursor",
    label: "Cursor",
    configPath: path.join(HOME, ".cursor", "mcp.json"),
    format: "json",
    containerKey: "mcpServers",
    entry: urlOnly,
    homeMarkers: [".cursor"],
  },
  {
    id: "windsurf",
    label: "Windsurf",
    configPath: path.join(HOME, ".codeium", "windsurf", "mcp_config.json"),
    format: "json",
    containerKey: "mcpServers",
    entry: windsurfUrl,
    homeMarkers: [".codeium", ".windsurf"],
  },
  {
    id: "vscode",
    label: "VS Code / Copilot",
    configPath: vscodeUserMcp(),
    format: "json",
    containerKey: "servers",
    entry: httpType,
    vscodeExt: true,
  },
]

export function findAgent(id: string): AgentDef | undefined {
  return AGENTS.find((a) => a.id === id)
}

// Absolute path to the agent's user-scope config file.
export function configFileFor(agent: AgentDef): string {
  return agent.configPath
}

// Which agents to configure: any detected as installed/used on this machine.
export async function detectAgents(): Promise<AgentDef[]> {
  const out: AgentDef[] = []
  for (const a of AGENTS) {
    if (await isDetected(a)) out.push(a)
  }
  return out
}

async function isDetected(a: AgentDef): Promise<boolean> {
  if (a.bin && (await onPath(a.bin))) return true
  for (const m of a.homeMarkers ?? []) {
    if (await exists(path.join(HOME, m))) return true
  }
  if (a.vscodeExt && (await hasVscodeCopilot())) return true
  return false
}

async function onPath(bin: string): Promise<boolean> {
  try {
    await which(bin)
    return true
  } catch {
    return false
  }
}

async function hasVscodeCopilot(): Promise<boolean> {
  const roots = [path.join(HOME, ".vscode", "extensions"), path.join(HOME, ".vscode-insiders", "extensions")]
  for (const root of roots) {
    try {
      const entries = await fs.readdir(root)
      if (entries.some((e) => e.toLowerCase().startsWith("github.copilot"))) return true
    } catch {
      // dir not present
    }
  }
  return false
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}
