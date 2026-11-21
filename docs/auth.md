# Authentication and roles

BotDigit uses different sign-in methods for each surface. This page explains
each one and what it lets you do.

## At a glance

| Surface | How you sign in | What is stored on your machine |
|---|---|---|
| Hosted MCP connector (Claude, Claude Code `/mcp`) | OAuth sign-in with your BotDigit account | Nothing you manage; the client keeps its own session |
| npm package (Cursor, Claude Desktop, Windsurf, other local clients) | Personal access token in an environment variable | The token, in your client's config or environment |
| Visual review (guests) | Share code, plus a name (email optional) | A guest session in the browser for that review |
| Visual review (signed-in members) | Your BotDigit account | Your BotDigit session in the browser |
| BotDigit Review extension | Optional: sign in to botdigit.com in the same browser | Extension settings and the active review session |

## 1. Hosted MCP connector (OAuth)

1. Add the connector in Claude, or run `claude mcp add --transport http botdigit https://api.botdigit.com/api/mcp` in Claude Code.
2. Choose **botdigit** in `/mcp` (Claude Code) or approve the connector (Claude).
3. Sign in with your BotDigit account in the window that opens.

The connector acts as you, with the permissions of your account and workspace
roles. To disconnect, remove the connector from your client.

The README says payment-preparation tools are not available to OAuth connector
clients. The 36 tools in [tools.md](tools.md) are the ones the server lists for
the connector session.

## 2. npm package and personal access tokens

The package reads a token from one of three environment variables, in this order:

1. `BOTDIGIT_PAT`
2. `BOTDIGIT_API_TOKEN`
3. `BOTDIGIT_TOKEN`

It sends the token as `Authorization: Bearer <token>` on every request. If no token
is set, requests go out without one and the gateway will refuse them.

The package's help text lists token prefixes `bd_pat_` (personal) and `bd_app_`
(app). The README examples use `bdt_pat_`. Use the exact token that your BotDigit
account shows you; do not edit its prefix.

Rules for tokens:

- Give each client its own token, so you can revoke one without affecting the others.
- Do not paste tokens into chat messages, issues or pull requests.
- Do not commit a token to git. `.env` files are ignored by this repository's
  `.gitignore`, but check before you commit.
- Rotate a token immediately if it appears in a log, screenshot or shared file.

## 3. Visual review: guests

A guest reviewer joins a review with a **share code** (the code in the review link,
for example `/r/<code>`). The guest enters a display name, and optionally an email.

- The guest gets a session for that review. The browser stores it, so the guest can
  come back without signing in again.
- Guests drop pins on the review. Approving a review freezes guest feedback, and
  reopening the review unfreezes it (see `update_review_status`).

Share codes use letters, digits, `_` and `-`, from 4 to 32 characters. Treat a share
code like a link: anyone with it can join the review as a guest.

## 4. Visual review: members

Members of a workspace sign in with their BotDigit account. They can see every
review in their workspace, and they can use the review tools listed under
[Visual review in tools.md](tools.md#visual-review) (for example `update_review_status`
and `attach_implementation_evidence`).

Approving a review is a reviewer decision. The MCP tools cannot approve a review.

## 5. BotDigit Review extension

The extension works in two modes:

- **As a guest:** paste a share code in the popup and enter a name. No BotDigit
  account is needed.
- **Signed in:** if you are signed in to botdigit.com in the same browser, the
  extension reads your `access_token` cookie and checks your account with
  `GET /auth/me` on the public API. This lets feedback be attributed to your account.

The extension asks for `cookies` and access to all sites, because it has to read
the botdigit.com session and place pins on any page you review. See
[extension.md](extension.md) for what it does and does not send.

## Roles at a glance

This is a summary of what the tools allow. Exact permissions depend on your
BotDigit workspace settings; if a tool returns a permission error, check your
role in the web app.

| Role | Typical use of the tools |
|---|---|
| Client or owner | Create projects, review feedback, set review status, read deliverables |
| Freelancer | Search projects, stage proposals and messages, link commits, stage deliverables |
| Workspace member | Work on the workspace's projects and reviews within their role |
| Guest reviewer | Joins one review with a share code and drops pins; no MCP tools |

## Money boundaries

Agents cannot move money. These steps are done by people in the BotDigit web app:

- funding escrow
- approving a milestone
- releasing a payment
- completing, closing or cancelling a project

Tools that prepare work (drafts, deliverables, messages) stage it for review first.
