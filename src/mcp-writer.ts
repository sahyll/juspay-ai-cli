/**
 * Generic MCP config writer/remover. Driven by the agent registry — one code
 * path for every agent, JSON and TOML.
 *
 * We write two URL-only server entries (docs + dashboard) into the agent's
 * user-scope config under its container key, preserving everything else. No
 * token is written: each agent self-authenticates the dashboard server.
 *
 * Safety: if a config file exists but doesn't parse, we ABORT rather than
 * overwrite — these are real user files (e.g. ~/.claude.json) we must not clobber.
 */

import fs from "node:fs/promises"
import path from "node:path"
import { parse as parseToml, stringify as stringifyToml } from "smol-toml"

import { configFileFor, type AgentDef } from "./agents.js"
import {
  DASHBOARD_MCP_NAME,
  DOCS_MCP_ENDPOINT,
  DOCS_MCP_NAME,
  JUSPAY_MCP_ENDPOINT,
  OUR_MCP_NAMES,
} from "./servers.js"

// Write our two MCP servers into the agent's config. Returns the file path written.
export async function writeMcp(agent: AgentDef): Promise<string> {
  const file = configFileFor(agent)
  const entries: Record<string, unknown> = {
    [DOCS_MCP_NAME]: agent.entry(DOCS_MCP_ENDPOINT),
    [DASHBOARD_MCP_NAME]: agent.entry(JUSPAY_MCP_ENDPOINT),
  }

  await fs.mkdir(path.dirname(file), { recursive: true })
  if (agent.format === "json") {
    await mergeJson(file, agent.containerKey, entries)
  } else {
    await mergeToml(file, agent.containerKey, entries)
  }
  return file
}

// Remove our two MCP servers from the agent's config; leave everything else.
// Returns true if anything was removed.
export async function removeMcp(agent: AgentDef): Promise<boolean> {
  const file = configFileFor(agent)
  let raw: string
  try {
    raw = await fs.readFile(file, "utf8")
  } catch {
    return false
  }

  const config = (agent.format === "json" ? JSON.parse(raw) : parseToml(raw)) as Record<string, unknown>
  const container = config[agent.containerKey] as Record<string, unknown> | undefined
  if (!container) return false

  let changed = false
  for (const name of OUR_MCP_NAMES) {
    if (container[name]) {
      delete container[name]
      changed = true
    }
  }
  if (!changed) return false

  const out = agent.format === "json" ? JSON.stringify(config, null, 2) + "\n" : stringifyToml(config)
  await fs.writeFile(file, out)
  return true
}

// Read an existing config, or null if absent. Throws (refusing to overwrite) if
// the file exists but can't be parsed.
async function readExisting(file: string, format: AgentDef["format"]): Promise<Record<string, unknown> | null> {
  let raw: string
  try {
    raw = await fs.readFile(file, "utf8")
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null
    throw err
  }
  if (raw.trim() === "") return null
  try {
    return (format === "json" ? JSON.parse(raw) : parseToml(raw)) as Record<string, unknown>
  } catch {
    throw new Error(`${file} isn't valid ${format.toUpperCase()}; refusing to overwrite it. Fix or remove it, then re-run.`)
  }
}

async function mergeJson(file: string, containerKey: string, entries: Record<string, unknown>): Promise<void> {
  const config = (await readExisting(file, "json")) ?? {}
  const container =
    config[containerKey] && typeof config[containerKey] === "object"
      ? (config[containerKey] as Record<string, unknown>)
      : {}
  Object.assign(container, entries)
  config[containerKey] = container
  await fs.writeFile(file, JSON.stringify(config, null, 2) + "\n")
}

async function mergeToml(file: string, containerKey: string, entries: Record<string, unknown>): Promise<void> {
  const config = (await readExisting(file, "toml")) ?? {}
  const container =
    config[containerKey] && typeof config[containerKey] === "object"
      ? (config[containerKey] as Record<string, unknown>)
      : {}
  Object.assign(container, entries)
  config[containerKey] = container
  await fs.writeFile(file, stringifyToml(config))
}
