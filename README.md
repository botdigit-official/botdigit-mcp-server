# BotDigit MCP Server — AI Agents for Freelance & Project Delivery

> Official Model Context Protocol (MCP) server for connecting AI agents and AI coding assistants to the BotDigit freelance marketplace and project delivery platform.

[Website](https://botdigit.com/mcp) · [Documentation](https://botdigit.com/docs/mcp) · [Glama Listing](https://glama.ai/mcp/servers/@botdigit/mcp-server) · [Issues](https://github.com/botdigit-official/botdigit-mcp-server/issues)

---

## What is BotDigit MCP?

BotDigit MCP is the official Model Context Protocol server for [BotDigit](https://botdigit.com), an AI-native freelance marketplace and project delivery platform.

It allows compatible AI assistants and AI agents to securely interact with BotDigit capabilities through the Model Context Protocol (MCP).

AI agents can use BotDigit MCP to:

- Discover freelancers and agencies
- Search talent by skills and project requirements
- Understand project briefs
- Create and manage project tasks
- Track contracts and milestones
- Coordinate project workflows
- Connect development workflows
- Prepare proposals and deliverables
- Assist with project delivery
- Work with human approval for sensitive actions

> **"BotDigit MCP connects AI agents with the people, projects, tasks, and workflows needed to deliver real-world digital work."**

---

## Compatible AI Clients

BotDigit MCP is designed for MCP-compatible AI clients and development environments, including:

- **Claude Desktop**
- **Claude Code**
- **Cursor**
- **Antigravity**
- **VS Code / MCP-compatible extensions**
- Other MCP-compatible AI agents and assistants

Compatibility depends on the client's MCP implementation and supported transport/authentication methods.

---

## ⚡ Quick Start

### 1. Generate a BotDigit Personal Access Token
Go to your **[BotDigit Settings → Developer Platform](https://botdigit.com/dashboard/settings/developer)** and generate a Personal Access Token (`bdt_pat_...`).

### 2. Configure Your AI Client

#### Antigravity IDE & Cursor (`mcp_config.json` or `.mcp.json`)
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

#### Direct Execution / CLI
```bash
BOTDIGIT_API_TOKEN="bdt_pat_your_token_here" npx -y @botdigit/mcp-server
```

---

## Use Cases

### AI-Powered Freelancer Discovery
Use AI agents to discover freelancers and agencies based on skills, experience, project requirements and other marketplace criteria.

### AI Project Management
Connect AI assistants to project workflows and help organize tasks, milestones, contracts and deliverables.

### AI-Assisted Development
Use BotDigit MCP with compatible coding assistants to connect development workflows with project and marketplace context.

### Autonomous Project Workflows
BotDigit MCP provides the foundation for AI-assisted workflows where agents can understand project context, coordinate tasks and assist with delivery while keeping sensitive actions under appropriate human control.

---

## BotDigit AI Agent Architecture

```text
AI Agent / AI Assistant
       │
       │ Model Context Protocol
       ▼
 BotDigit MCP
       │
       ├── Talent Discovery
       ├── Projects
       ├── Tasks
       ├── Contracts
       ├── Milestones
       ├── Workspaces
       ├── Git / Development Workflows
       └── Delivery Coordination
       │
       ▼
 BotDigit Platform
```

BotDigit MCP is designed to make the BotDigit marketplace and project workspace accessible to AI-native workflows.

---

## 🛠 Available Tools

| Tool | Category | Description | Staging Protection |
|---|---|---|:---:|
| `botdigit_list_projects` | Projects | Search and filter live projects (`limit`, `page`, `category`, `search`) | Read-Only |
| `botdigit_get_project` | Projects | Get complete project specifications and requirements | Read-Only |
| `botdigit_stage_proposal_draft` | Proposals | Stage a proposal draft for review before submitting to client | Staged Draft |
| `botdigit_list_my_bids` | Proposals | List your submitted proposals and bid statuses | Read-Only |
| `botdigit_list_proposal_drafts` | Proposals | List staged drafts awaiting your approval | Read-Only |
| `botdigit_approve_proposal_draft` | Proposals | Approve and send staged proposal to client | Human Action |
| `botdigit_list_messages` | Messages | List active client and team conversation threads | Read-Only |
| `botdigit_get_thread` | Messages | Read complete conversation history and context for a thread | Read-Only |
| `botdigit_stage_message_draft` | Messages | Stage an intelligent reply to a client thread for human review | Staged Draft |
| `botdigit_list_contracts` | Contracts | View active contracts, funded escrow milestones, deadlines | Read-Only |
| `botdigit_get_contract` | Contracts | Fetch detailed contract terms and milestone escrow records | Read-Only |
| `botdigit_list_contract_milestones` | Contracts | Inspect milestone statuses, deliverables, and release state | Read-Only |
| `botdigit_stage_delivery_draft` | Contracts | Stage milestone deliverable submission for client review | Staged Draft |

---

## Security & Human-in-the-Loop

BotDigit MCP is designed around controlled agent access. Sensitive operations require appropriate authentication, authorization and human approval rather than allowing unrestricted autonomous execution.

- **Staged Actions**: All proposals, messages, and deliverable submissions are staged as reviewable drafts before dispatch.
- **Credential Safety**: Never commit API keys, personal access tokens or other credentials to source control.
- **Reporting**: For security issues, please follow the repository's security reporting process.

---

## Links

- **BotDigit MCP:** https://botdigit.com/mcp
- **BotDigit Platform:** https://botdigit.com
- **Developer Settings:** https://botdigit.com/dashboard/settings/developer
- **GitHub Organization:** https://github.com/botdigit-official
- **Issues:** https://github.com/botdigit-official/botdigit-mcp-server/issues
- **Security:** https://github.com/botdigit-official/botdigit-mcp-server/security
- **License:** [MIT](LICENSE) © BotDigit & Tarun Sharma
