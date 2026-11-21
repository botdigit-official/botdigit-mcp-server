# BotDigit documentation

Documentation for the BotDigit MCP connector, the visual review site and the
BotDigit Review browser extension.

| Guide | What it covers |
|---|---|
| [Connect your AI client](connect.md) | Claude, Claude Code, Cursor, Claude Desktop, Windsurf and other MCP clients |
| [Tool reference](tools.md) | All 36 MCP tools: arguments, allowed values, example prompts |
| [Commands, CLI and settings](commands.md) | Slash commands, CLI flags, environment variables |
| [Authentication](auth.md) | How each surface signs you in, and what each role can do |
| [Workflows](workflows.md) | Multi-step recipes: review to fix to verification, milestone delivery, proposals |
| [Visual review site](review-site.md) | Share codes, guests, pins, statuses, rounds, the page proxy |
| [Browser extension](extension.md) | Install, pin capture, how the extension talks to BotDigit |
| [Troubleshooting](troubleshooting.md) | Common errors and fixes |
| [FAQ](faq.md) | Short answers to common questions |

## Core rules

- **Prepare, confirm, execute.** Tools that create or change work on BotDigit
  stage a draft first. A person reviews and approves it.
- **Money stays with people.** Agents cannot fund escrow, approve milestones,
  release payments or complete a project. Those happen in the BotDigit web app.
- **Use live names.** Tool names have no prefix (for example `search_projects`).
  Some older files use a `botdigit_` prefix; use the live names instead. Check the
  live list with `--test-connection` (see [commands.md](commands.md)).

## Versions

These docs describe the server tool list as returned on 2026-11-21 (36 tools).
If your client shows a different count, the server has changed; check the
[tool reference](tools.md) against your client's tool list.
