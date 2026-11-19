# @botdigit/mcp-server

Official **Model Context Protocol (MCP)** server for **BotDigit Work OS**.

Safely connect your local AI development environment (Cursor, Claude Desktop, Windsurf, ChatGPT Custom Actions) to BotDigit projects, milestones, tasks, Git delivery workflows, and escrow safety controls.

---

## Quickstart

### Hosted connector for Claude (no token needed)

If you only use Claude, you can skip the npm package and connect to the hosted
BotDigit MCP server with OAuth sign-in. No personal access token is stored on
your machine.

**Claude Code**

```bash
claude mcp add --transport http botdigit https://api.botdigit.com/api/mcp
```

Then run `/mcp` inside Claude Code and choose **botdigit** to sign in.

**Claude (claude.ai and Desktop)**: add the **Botdigit Freelancer** connector
from Settings → Connectors and sign in with your BotDigit account.

The hosted connector exposes 36 tools. Anything that changes data (proposals,
messages) is staged as a draft you approve first, and escrow, milestone
approval and payment release stay with people. Payment-preparation tools are
not available to OAuth connector clients. Full guide:
https://botdigit.com/mcp/claude-connector

The sections below cover the token-based npm package for Cursor, Claude
Desktop (stdio), Windsurf and the Claude Code plugin.

### 1. Cursor IDE Configuration

Add the following to your `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "botdigit": {
      "command": "npx",
      "args": ["-y", "@botdigit/mcp-server"],
      "env": {
        "BOTDIGIT_PAT": "bdt_pat_your_token_here",
        "BOTDIGIT_API_URL": "https://api.botdigit.com/api/mcp"
      }
    }
  }
}
```

### 2. Claude Desktop Configuration

Add the following to your Claude Desktop config:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "botdigit": {
      "command": "npx",
      "args": ["-y", "@botdigit/mcp-server"],
      "env": {
        "BOTDIGIT_PAT": "bdt_pat_your_token_here"
      }
    }
  }
}
```

### 3. Claude Code & Cowork Plugin

This repository includes a native Claude Code / Cowork plugin bundle.

#### Slash Commands
- `/find-projects` — Search open freelance projects, client RFPs, and development gigs.
- `/draft-proposal` — Analyze client requirements and stage proposal drafts for human review.
- `/check-contracts` — Monitor active milestones, deliverables, and funded escrow.

Set your token:
```bash
export BOTDIGIT_API_TOKEN="bdt_pat_your_token_here"
```


---

## The 36 MCP Tools

Read the live list any time with `npx @botdigit/mcp-server --test-connection`.

| Group | Tools |
|---|---|
| **Discover** | `search_projects`, `get_project`, `get_workspace`, `search_freelancers`, `get_freelancer` |
| **Manage work** | `create_project`, `create_task`, `update_task`, `get_milestones`, `get_project_status`, `update_milestone`, `update_project_status` |
| **Deliver** | `get_git_activity`, `link_commit_to_milestone`, `submit_deliverable`, `get_deliverables`, `verify_milestone_completion` |
| **Visual review** | `list_review_projects`, `get_review_context`, `list_feedback_items`, `get_feedback_item`, `get_version_diff`, `create_fix_plan`, `update_review_task`, `attach_implementation_evidence`, `request_visual_verification`, `update_review_status` |
| **Proposals** | `stage_proposal_draft`, `list_proposal_drafts`, `approve_proposal_draft`, `list_my_bids` |
| **Messages and contracts** | `list_messages`, `get_thread`, `stage_message_draft`, `list_contracts`, `get_contract` |

Tools that change data follow Prepare, Confirm, Execute: they stage a draft that
you review and approve.

---

## Architectural Principle: Financial Safety

> **"AI prepares, BotDigit verifies, Humans authorize."**

Agents cannot move money. Escrow funding, milestone approval, payment release and
project completion are done by people in the BotDigit dashboard, never by a tool call.

---

## Testing Your Connection

```bash
npx @botdigit/mcp-server --test-connection
```

## License

MIT © BotDigit Inc.
