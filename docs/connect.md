# Connect your AI client

There are two ways to connect:

1. **Hosted connector (OAuth sign-in, no token).** Use this for Claude. Your
   BotDigit account signs you in; no personal access token is stored on your machine.
2. **npm package (token).** Use this for Cursor, Claude Desktop, Windsurf and other
   clients that start a local process. The package reads a personal access token
   from an environment variable. See [auth.md](auth.md).

Once connected, check the tool list in your client. You should see the tools in
[tools.md](tools.md).

## Claude (claude.ai and Claude Desktop)

1. Open the [Botdigit Freelancer connector](https://claude.ai/directory/botdigit-freelancer)
   in the Claude directory, or go to **Settings → Connectors** and add it.
2. Sign in with your BotDigit account when prompted.
3. Start a chat and ask: "What BotDigit tools do you have?"

A public guide for this connector is at https://botdigit.com/mcp/claude-connector.

## Claude Code

Add the hosted server, then sign in:

```bash
claude mcp add --transport http botdigit https://api.botdigit.com/api/mcp
```

Inside Claude Code, run `/mcp`, choose **botdigit**, and complete the sign-in.

## Cursor

Add the npm package to `~/.cursor/mcp.json`, with your token:

```json
{
  "mcpServers": {
    "botdigit": {
      "command": "npx",
      "args": ["-y", "@botdigit/mcp-server"],
      "env": {
        "BOTDIGIT_PAT": "your_personal_access_token"
      }
    }
  }
}
```

Restart Cursor after saving.

## Claude Desktop (token)

Edit the config file for your system and restart Claude Desktop:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "botdigit": {
      "command": "npx",
      "args": ["-y", "@botdigit/mcp-server"],
      "env": {
        "BOTDIGIT_PAT": "your_personal_access_token"
      }
    }
  }
}
```

If you use Claude Desktop only, the hosted connector above is simpler: no token to manage.

## Windsurf

Windsurf is listed as supported. The repository does not include a Windsurf
config example. Use the same `npx -y @botdigit/mcp-server` command and the same
`BOTDIGIT_PAT` environment variable in Windsurf's MCP settings. Check Windsurf's
own documentation for where its MCP file lives.

## Claude Code plugin

This repository contains a Claude Code plugin bundle (`.claude-plugin/plugin.json`)
with three slash commands: `/find-projects`, `/draft-proposal` and
`/check-contracts`. See [commands.md](commands.md). The repository does not
include an install command for the plugin; use your Claude Code version's plugin
installation steps.

## ChatGPT and other MCP clients

- **Clients that accept a remote MCP server URL:** use the hosted endpoint
  `https://api.botdigit.com/api/mcp`, if your client supports OAuth sign-in for
  remote servers.
- **Clients that start a local command:** use the npm package as shown for Cursor.
- **ChatGPT:** this repository does not document a ChatGPT setup. The README
  mentions "ChatGPT Custom Actions", which is a different mechanism from MCP. Check
  BotDigit's current docs before relying on it.

## Test the connection

Run this from any terminal with your token set:

```bash
BOTDIGIT_PAT=your_personal_access_token npx -y @botdigit/mcp-server --test-connection
```

It contacts the gateway and lists the tools it returns. A failure usually means a
wrong token or URL; see [troubleshooting.md](troubleshooting.md).

## Which URL to use

| Use | URL |
|---|---|
| Hosted connector (Claude Code command above) | `https://api.botdigit.com/api/mcp` |
| npm package `BOTDIGIT_API_URL` (README examples) | `https://api.botdigit.com/api/mcp` |
| npm package default in code | `https://api.botdigit.com/api/v1/mcp` |

The README examples set `BOTDIGIT_API_URL` explicitly, so use the README value.
If you omit the variable, the package uses its default.
