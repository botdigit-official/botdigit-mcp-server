# FAQ

**How many tools does the MCP server have?**
36, in six groups: discover (5), manage work (7), deliver (5), visual review (10),
proposals (4), messages and contracts (5). The list is in [tools.md](tools.md).

**Can the AI spend money or release payments?**
No. Escrow funding, milestone approval, payment release and project completion are
done by people in the BotDigit web app.

**Does an AI tool send a proposal or message straight away?**
No. Proposals and messages are staged for review. Submitting a proposal with
`approve_proposal_draft` is the one final step, and it should run only after a
person has approved the draft.

**Which should I use: the hosted connector or the npm package?**
Use the hosted connector with Claude if you want OAuth sign-in and no token. Use the
npm package for Cursor, Claude Desktop, Windsurf and other local clients, or if you
want to set the token yourself. See [connect.md](connect.md).

**Where do I put my token?**
In your client's environment settings or config, as `BOTDIGIT_PAT`. Do not commit
it to git or paste it into a chat. See [auth.md](auth.md).

**What do I need installed for the npm package?**
Node.js 18 or newer. Run it with `npx -y @botdigit/mcp-server`.

**Does the extension need an account?**
No. You can pin as a guest with a share code. Sign in to botdigit.com in the same
browser to be recognised as a member.

**What does the extension see on a page?**
It sees the page you are reviewing, so it can place pins and capture screenshots of
what is visible. Read [extension.md](extension.md#what-is-captured-when-you-pin)
before you pin a page with personal information on it.

**Can a guest approve a review?**
No. Approving a review is a reviewer decision, and the MCP tools cannot set it.

**What happens to pins when a review is approved?**
Guest feedback is frozen. Reopening the review with `update_review_status` unfreezes it.

**What is a review round?**
A review cycle. Pages seen in a round are frozen as they looked then. New pins go to
the new round.

**Why are some tool names prefixed with `botdigit_`?**
Some older files (the command files, the skill and the registry listing) use the
prefix. The server's live names have no prefix. Use the live names; see
[tools.md](tools.md).

**Are the docs and the server always in sync?**
These docs describe the tool list as returned on 2026-11-21. If your client shows a
different list, check [tools.md](tools.md) against it and report the difference.

**Where do I report a bug?**
In the review, use the feedback item for the issue. For the MCP server or the
extension, contact BotDigit support.
