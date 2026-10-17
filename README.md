# @botdigit/mcp-server

Official **Model Context Protocol (MCP)** server for **BotDigit Work OS**.

Safely connect your local AI development environment (Cursor, Claude Desktop, Windsurf, ChatGPT Custom Actions) to BotDigit projects, milestones, tasks, Git delivery workflows, and escrow safety controls.

---

## Quickstart

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
        "BOTDIGIT_API_URL": "https://api.botdigit.com/api/v1/mcp"
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

## The 17 Native MCP Tools

| Phase | Tool Name | Description |
|---|---|---|
| **Phase 1: Discovery** | `search_projects` | Search open marketplace projects, RFPs, and freelance gigs |
| | `get_project` | Complete project specifications, milestones, and funding status |
| | `get_workspace` | Workspace collaboration state, members, roles, active tasks |
| | `get_milestones` | Milestones, acceptance criteria, deadlines, escrow status |
| | `get_project_status` | One-shot executive rollup (% complete, tasks, escrow) |
| **Phase 2: Management** | `search_freelancers` | Search verified talent with skills, rating, completed projects |
| | `get_freelancer` | Verified profile, hourly rates, portfolio, GitHub verification |
| | `create_project` | Create new client project draft with milestone structure |
| | `create_task` | Create Kanban tasks on project board with priority & assignees |
| | `update_task` | Update task status (`todo`, `in_progress`, `done`) and notes |
| **Phase 3: Delivery** | `get_git_activity` | Query linked Git commits, pull requests, issues, repo status |
| | `link_commit_to_milestone` | Associate a commit SHA or PR to milestone evidence |
| | `submit_deliverable` | Stage deliverable with work summary, URLs, and AI notes |
| | `get_deliverables` | List staged deliverables, review status, and freelancer info |
| | `verify_milestone_completion` | 4-point verification readiness check (tasks, Git, artifacts) |
| **Phase 4: Financial Safety** | `prepare_milestone_payment` | Stage payment with cryptographic token & 1-click client approval |
| | `get_payment_approval_status` | Check if client authorized or executed milestone payment |

---

## Architectural Principle: Financial Safety

> **"AI prepares, BotDigit verifies, Humans authorize."**

Autonomous AI agents cannot execute payment transfers or escrow releases autonomously. The `prepare_milestone_payment` tool generates a cryptographic approval token and a **1-click web approval link** (`https://botdigit.com/approvals/payment/:token`) for the verified client to review and authorize.

---

## Testing Your Connection

```bash
npx @botdigit/mcp-server --test-connection
```

## License

MIT © BotDigit Inc.
