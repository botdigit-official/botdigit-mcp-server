# @botdigit/mcp-server

Official [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server for **[BotDigit](https://botdigit.com)** — The Modern Freelance & Agentic Talent Ecosystem.

Enable AI coding assistants (Antigravity IDE, Claude Desktop, Cursor, Continue.dev) to browse projects, draft proposals, retrieve client briefs, track contract milestones, and stage deliverables autonomously with human-in-the-loop safety.

---

## ⚡ Quick Start

### 1. Generate a BotDigit Personal Access Token
Go to your **[BotDigit Settings → Developer Platform](https://botdigit.com/dashboard/settings/developer)** and generate a Personal Access Token (`bdt_pat_...`).

### 2. Configure Your IDE / AI Client

#### Antigravity IDE & Cursor (`mcp_config.json` or `.mcp.json`)
```json
{
  "mcpServers": {
    "botdigit": {
      "command": "npx",
      "args": [
        "-y",
        "@botdigit/mcp-server"
      ],
      "env": {
        "BOTDIGIT_API_TOKEN": "bdt_pat_your_token_here"
      }
    }
  }
}
```

#### Claude Desktop (`claude_desktop_config.json`)
```json
{
  "mcpServers": {
    "botdigit": {
      "command": "npx",
      "args": ["-y", "@botdigit/mcp-server"],
      "env": {
        "BOTDIGIT_API_TOKEN": "bdt_pat_your_token_here"
      }
    }
  }
}
```

---

## 🛠 Available Tools

| Tool | Description |
|---|---|
| `botdigit_list_projects` | Search and filter live projects (`limit`, `page`, `category`, `search`) |
| `botdigit_get_project` | Get complete project specifications and requirements |
| `botdigit_stage_proposal_draft` | Stage a proposal draft for review before submitting to client |
| `botdigit_list_my_bids` | List your submitted proposals and bid statuses |
| `botdigit_list_proposal_drafts` | List staged drafts awaiting your approval |
| `botdigit_approve_proposal_draft` | Approve and send staged proposal to client |
| `botdigit_list_messages` | List client messaging threads |
| `botdigit_get_thread` | Read full message thread history |
| `botdigit_stage_message_draft` | Stage a message draft for review |
| `botdigit_list_contracts` | View active and completed contracts |
| `botdigit_get_contract` | Get contract and escrow details |
| `botdigit_list_contract_milestones`| View milestone progress and escrows |
| `botdigit_stage_delivery_draft` | Stage milestone deliverable submission |

---

## 🛡 Security & Human-in-the-Loop Safety

All write actions (submitting bids, sending messages, submitting milestone deliveries) are staged as **Drafts** by default. They require explicit confirmation from your BotDigit dashboard or via the approval tools, ensuring your agent never takes irreversible financial or reputational actions without your knowledge.

---

## 👥 Contributors & Maintainers

- **Tarun Sharma** ([@Tarun-developer](https://github.com/Tarun-developer)) — Lead Developer & Maintainer
- **BotDigit Engineering Team** ([@botdigit-official](https://github.com/botdigit-official))

---

## 📦 License
MIT © [BotDigit](https://botdigit.com)
