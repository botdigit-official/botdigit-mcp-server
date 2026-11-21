# Commands, CLI and settings

## Slash commands (Claude Code plugin)

These three commands are defined in `commands/` in this repository.

| Command | What it does | Tools it uses |
|---|---|---|
| `/find-projects` | Searches open projects and RFPs by keyword, skills and budget. Returns a table (title, budget, skills, deadline, scope) with each project's ID. | `search_projects`, then `get_project` if you ask for detail |
| `/draft-proposal <project_id>` | Reads the project, writes a proposal and stages it for approval. Never submits it. | `get_project`, `stage_proposal_draft` |
| `/check-contracts` | Lists active contracts, funded escrow, next milestone and pending deliverables. | `list_contracts` (status `active`), `get_contract` |

Example:

```text
/find-projects web-development, budget 30000-90000
/draft-proposal 3f2a9c…
/check-contracts
```

The command files use the names `botdigit_search_projects`, `botdigit_get_project`
and so on. The server's live tool names have no prefix (`search_projects`). If a
command fails to find a tool, use the live name; the behaviour is the same.

## Skill

`skills/botdigit/SKILL.md` is a skill file for agents. It describes how an agent
should work with BotDigit:

- Find work with `search_projects` and read it with `get_project`.
- Stage every proposal; never submit a binding bid directly.
- Use branch names `feat/bd-<task_id>-<slug>` and commit messages
  `feat(scope): BD-<id> <description>`.
- Submit a finished milestone with `submit_deliverable`, after tests pass.

Its frontmatter lists tool names with the `botdigit_` prefix. Read them the same
way as the slash commands above.

## npm package CLI

Install nothing: `npx` runs the package on demand.

```bash
npx -y @botdigit/mcp-server [options]
```

| Option | Purpose |
|---|---|
| `--test-connection` | Contact the gateway, list the tools it returns, and report success or failure. |
| `--version`, `-v` | Print the package version (`1.0.0` at the time of writing). |
| `--help`, `-h` | Print usage and configuration examples. |

Without an option, the package runs as an MCP server over stdin and stdout. Your
client starts it; you do not run it by hand.

## Environment variables

| Variable | Required | Meaning |
|---|---|---|
| `BOTDIGIT_PAT` | Yes, unless you use another name below | Personal access token. Sent as `Authorization: Bearer …`. |
| `BOTDIGIT_API_TOKEN` | Alternative to `BOTDIGIT_PAT` | Same token, read when `BOTDIGIT_PAT` is not set. The `.mcp.json` file uses this name. |
| `BOTDIGIT_TOKEN` | Alternative | Also read by the package. |
| `BOTDIGIT_API_URL` | No | Gateway URL. Defaults to `https://api.botdigit.com/api/v1/mcp` in code; the README examples set `https://api.botdigit.com/api/mcp`. |
| `BOTDIGIT_WORKSPACE_ID` | No | Default workspace UUID, sent on each request as the `x-workspace-id` header. |

Keep tokens out of git. Put them in your client's environment settings or in a
shell profile, not in a file you commit. See [auth.md](auth.md) for token types.
