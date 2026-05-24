#!/usr/bin/env bash
# Juspay AI — clean up EVERYTHING Juspay AI has installed (any version: the
# @sahyll/ai 0.4.x–0.6.x line and the older @sahyll/juspay-claude), so you can
# run `npx @sahyll/ai` from a clean slate. Also signs out of agents that cache
# OAuth tokens, so the next setup re-authenticates fresh.
#
# SAFE: this only removes Juspay's OWN entries (docs-mcp-server, juspay-mcp,
# juspay-docs) and Juspay's own skills/credentials/tokens. Your other MCP
# servers and settings are left untouched. Re-running it is harmless.

echo "Cleaning up old Juspay AI artifacts…"

# --- helper: remove only our MCP server entries from a JSON config file ---
CLEAN_JS='
const fs=require("fs");
const names=["docs-mcp-server","juspay-mcp","juspay-docs"];
const keys=["mcpServers","mcp","servers","mcp_servers"];
const file=process.argv[1];
let cfg; try{cfg=JSON.parse(fs.readFileSync(file,"utf8"))}catch{process.exit(0)}
let changed=false;
for(const k of keys){const b=cfg[k];if(b&&typeof b==="object")for(const n of names)if(n in b){delete b[n];changed=true}}
if(changed){fs.writeFileSync(file,JSON.stringify(cfg,null,2)+"\n");console.log("  cleaned "+file)}
'
clean_json(){ [ -f "$1" ] && node -e "$CLEAN_JS" "$1" 2>/dev/null; }

# 1) Global npm packages + commands
echo "→ Removing global packages…"
npm rm -g @sahyll/ai @sahyll/ai-2 @sahyll/juspay-claude >/dev/null 2>&1
hash -r 2>/dev/null

# 2) Stored credentials / config
echo "→ Removing stored credentials…"
rm -rf "$HOME/.config/juspay" "$HOME/.config/genius"

# 3) Global skills
echo "→ Removing global skills…"
rm -rf "$HOME/.claude/skills/juspay-explainer" \
       "$HOME/.claude/skills/juspay-integrator" \
       "$HOME/.claude/skills/integrate" \
       "$HOME/.agents/skills/integrate"

# 4) Caches
rm -f  "$HOME/.claude/mcp-needs-auth-cache.json"
rm -rf "$HOME/.npm/_npx" >/dev/null 2>&1

# 4b) Sign out — clear each agent's cached OAuth token for our server. Run this
#     BEFORE removing the config below, so the agent can still resolve the name.
echo "→ Signing out of agents…"
command -v codex    >/dev/null 2>&1 && codex mcp logout juspay-mcp >/dev/null 2>&1
command -v opencode >/dev/null 2>&1 && opencode mcp logout juspay-mcp >/dev/null 2>&1

# 5) Remove our MCP entries from global agent configs (surgical — keeps others)
echo "→ Cleaning global agent configs…"
clean_json "$HOME/.claude.json"
clean_json "$HOME/.mcp.json"
clean_json "$HOME/.gemini/settings.json"
clean_json "$HOME/.cursor/mcp.json"
clean_json "$HOME/.codeium/windsurf/mcp_config.json"
clean_json "$HOME/.copilot/mcp-config.json"
clean_json "$HOME/.config/opencode/opencode.json"
clean_json "$HOME/opencode.json"
clean_json "$HOME/Library/Application Support/Code/User/mcp.json"

# 6) Agents' own removers (covers Claude user scope + Codex's TOML config)
command -v claude >/dev/null 2>&1 && for n in docs-mcp-server juspay-mcp juspay-docs; do claude mcp remove --scope user "$n" >/dev/null 2>&1; done
command -v codex  >/dev/null 2>&1 && for n in docs-mcp-server juspay-mcp; do codex mcp remove "$n" >/dev/null 2>&1; done

# 7) Project-scope leftovers in your repos (older versions wrote .mcp.json etc.)
echo "→ Scanning your projects for leftover MCP configs (may take a few seconds)…"
find "$HOME" -maxdepth 6 -not -path "*/node_modules/*" -not -path "*/.git/*" \
  \( -name ".mcp.json" -o -name "opencode.json" \
     -o -path "*/.gemini/settings.json" -o -path "*/.cursor/mcp.json" \
     -o -path "*/.vscode/mcp.json" -o -path "*/.windsurf/mcp_config.json" \) 2>/dev/null \
  | while IFS= read -r f; do clean_json "$f"; done

echo
echo "✅ Cleanup complete. Install the new version with:"
echo "     npx @sahyll/ai-2"
