# Tool reference

The BotDigit MCP server exposes **36 tools**, in six groups. This list matches
the tool list returned by the server on 2026-11-21.

Conventions used below:

- **Required** arguments must be supplied. Everything else is optional.
- UUID arguments (`project_id`, `milestone_id`, `review_id`, `feedback_id`,
  `draft_id`, `thread_id`, `contract_id`, `workspace_id`, `task_id`) are the IDs
  shown in the BotDigit web app.
- Money is in INR unless a tool says otherwise.
- Example prompts are things you can say to your AI assistant; it chooses and
  calls the tool.

Summary:

| Group | Tools | Count |
|---|---|---|
| Discover | `search_projects`, `get_project`, `get_workspace`, `search_freelancers`, `get_freelancer` | 5 |
| Manage work | `create_project`, `create_task`, `update_task`, `get_milestones`, `get_project_status`, `update_milestone`, `update_project_status` | 7 |
| Deliver | `get_git_activity`, `link_commit_to_milestone`, `submit_deliverable`, `get_deliverables`, `verify_milestone_completion` | 5 |
| Visual review | `list_review_projects`, `get_review_context`, `list_feedback_items`, `get_feedback_item`, `get_version_diff`, `create_fix_plan`, `update_review_task`, `attach_implementation_evidence`, `request_visual_verification`, `update_review_status` | 10 |
| Proposals | `stage_proposal_draft`, `list_proposal_drafts`, `approve_proposal_draft`, `list_my_bids` | 4 |
| Messages and contracts | `list_messages`, `get_thread`, `stage_message_draft`, `list_contracts`, `get_contract` | 5 |

---

## Discover

### `search_projects`
Search open projects, client RFPs and freelance gigs.

- **Optional:** `query` (keyword in title or description), `category` (for example
  `web-development`, `mobile`, `ui-ux`, `ai-ml`), `budget_min`, `budget_max` (INR),
  `limit` (1–50, default 10).
- **Example prompt:** "Find open web-development projects between ₹20,000 and ₹80,000."

### `get_project`
Full specification of a project: requirements, milestones, budget and client metadata.

- **Required:** `project_id`.
- **Example prompt:** "Show me the requirements for project 3f2a…"

### `get_workspace`
Team members, roles, document vault and project links for a workspace.

- **Required:** `workspace_id`.
- **Example prompt:** "Who is on the workspace for this client?"

### `search_freelancers`
Rank verified freelancers and agencies by skills and rate.

- **Optional:** `query`, `skills` (array), `max_hourly_rate` (INR), `limit` (1–30, default 10).
- **Example prompt:** "Find React freelancers under ₹1,500 an hour."

### `get_freelancer`
Public profile, skills, portfolio and review scores for one freelancer.

- **Required:** `username`.
- **Example prompt:** "Show the profile for username `example-dev`."

---

## Manage work

### `create_project`
Create a project draft or RFP.

- **Required:** `title`, `description`, `category`.
- **Optional:** `budget` (INR, fixed), `skills_required` (array), `milestones` (array of titles).
- **Example prompt:** "Create a draft project 'Booking widget for a clinic website', web-development, budget ₹40,000, with milestones Design, Build, Launch."

### `create_task`
Add a Kanban task to a project board.

- **Required:** `workspace_id`, `project_id`, `title`.
- **Optional:** `description`, `priority` (`low`, `medium`, `high`, `urgent`), `task_type` (`task`, `bug`, `story`).
- **Example prompt:** "Add a high-priority bug task 'Mobile menu does not close' to project X."

### `update_task`
Change a task's status, priority or notes.

- **Required:** `task_id`.
- **Optional:** `status` (`todo`, `in_progress`, `review`, `done`), `priority`, `notes`.
- **Example prompt:** "Mark task 9a1c… as in review and note that the PR is open."

### `get_milestones`
All milestones for a project with amounts, deadlines and verification state.

- **Required:** `project_id`.
- **Example prompt:** "What milestones are left on project X and when are they due?"

### `get_project_status`
One-shot health summary: milestone progress percentage, active task counts,
funded escrow balance and pending approvals.

- **Required:** `project_id`.
- **Example prompt:** "Give me a status summary for project X."

### `update_milestone`
Set a milestone's progress state. It never changes escrow, payment or approval.

- **Required:** `project_id`, `milestone_id`, `review_status` (`not_started`, `in_progress`, `review_requested`).
- **Example prompt:** "Mark milestone 'Build' as in progress."

### `update_project_status`
Set a project to `open`, `active`, `in_review` or `paused`.

- **Required:** `project_id`, `status` (`open`, `active`, `in_review`, `paused`).
- **Not available here:** completing, closing or cancelling a project. Those stay in the web app.
- **Example prompt:** "Pause project X until the client sends assets."

---

## Deliver

### `get_git_activity`
Recent commits, pull requests and issues linked to a project's GitHub repositories.

- **Required:** `project_id`.
- **Optional:** `limit` (1–50, default 10 per category).
- **Example prompt:** "List the last 5 pull requests on project X."

### `link_commit_to_milestone`
Attach a commit or pull request to a milestone as delivery evidence.

- **Required:** `project_id`, `milestone_id`, and one of `commit_sha` or `pr_number`.
- **Optional:** `notes`.
- **Example prompt:** "Link PR 42 to milestone 'Build' with the note 'booking form and tests'."

### `submit_deliverable`
Stage a milestone deliverable for client review. It is not sent to the client
until it is confirmed in the web app.

- **Required:** `milestone_id`, `work_summary`.
- **Optional:** `attachment_urls` (array; screenshots, preview links, PR links), `ai_agent_notes` (internal notes for the reviewer).
- **Example prompt:** "Stage a deliverable for milestone 'Build': summary of the booking form, PR link and preview URL."

### `get_deliverables`
Every staged deliverable for a milestone, with approval status.

- **Required:** `milestone_id`.
- **Example prompt:** "What deliverables have we staged for milestone 'Build'?"

### `verify_milestone_completion`
Readiness report: deliverables submitted, linked commits or PRs, task completion
and review status.

- **Required:** `project_id`, `milestone_id`.
- **Example prompt:** "Is milestone 'Build' ready to hand over?"

---

## Visual review

These tools work on visual review projects: a website under review, its pages,
and the feedback pins that reviewers drop on it. See
[review-site.md](review-site.md) for the review model.

### `list_review_projects`
Visual reviews with status, target URL and open-feedback counts.

- **Optional:** `limit` (default 20), `workspace_id`.
- **Example prompt:** "Which reviews have open feedback?"

### `get_review_context`
A review's target URL, environment, active version, pages, latest capture and feedback metrics.

- **Required:** `review_id`.
- **Example prompt:** "Give me the context for review R-1."

### `list_feedback_items`
Feedback pins for a review, filtered by status or by whether each pin still anchors to its element.

- **Required:** `review_id`.
- **Optional:** `status` (`open`, `in_progress`, `resolved`, `wont_fix`), `relink_status` (`anchored`, `needs_relink`, `relinked`).
- **Example prompt:** "List the open pins on review R-1 that need relinking."

### `get_feedback_item`
One pin's full evidence: screenshot, element selector, DOM fingerprint, coordinates and audit events.

- **Required:** `feedback_id`.
- **Example prompt:** "Show me the evidence for pin 7c0e…"

### `get_version_diff`
Visual and structural comparison between a baseline capture and a current capture.

- **Required:** `review_id`.
- **Optional:** `baseline_capture_id`, `current_capture_id`.
- **Example prompt:** "What changed on review R-1 since the last capture?"

### `create_fix_plan`
Record an implementation plan or verification checklist for one pin.

- **Required:** `feedback_id`, `plan_title`, `proposed_changes` (array of strings).
- **Optional:** `estimated_minutes`.
- **Example prompt:** "Create a fix plan for pin 7c0e…: change the button colour, update the alt text, estimate 20 minutes."

### `update_review_task`
Change a pin's implementation status or priority, with notes.

- **Required:** `feedback_id`.
- **Optional:** `status` (`open`, `in_progress`, `resolved`, `wont_fix`), `priority` (`low`, `medium`, `high`, `urgent`), `developer_notes`.
- **Example prompt:** "Mark pin 7c0e… in progress with the note 'working on the header'."

### `attach_implementation_evidence`
Attach the commit, preview URL, screenshot and a verification note to a pin.

- **Required:** `feedback_id`.
- **Optional:** `commit_hash`, `preview_url`, `screenshot_url`, `evidence_notes`.
- **Example prompt:** "Attach commit 1a2b3c and the staging preview to pin 7c0e…"

### `request_visual_verification`
Capture the page again on a preview or staging URL and compare it with the reviewed version, to check the fix.

- **Required:** `review_id`.
- **Optional:** `target_url` (preview or staging URL), `device_type` (`desktop`, `tablet`, `mobile`; default `desktop`).
- **Example prompt:** "Verify the fixes on review R-1 against the preview URL, mobile view."

### `update_review_status`
Reopen or archive a review.

- **Required:** `review_id`, `status` (`active`, `archived`).
- **Note:** reopening (`active`) also unfreezes guest feedback that approval froze. Approving a review is a reviewer decision and cannot be set with this tool.
- **Example prompt:** "Reopen review R-1 for another round."

---

## Proposals

Proposals are staged, not sent. A person approves them before they go to the client.

### `stage_proposal_draft`
Create a proposal draft in `pending_approval` state.

- **Required:** `project_id`, `bid_amount`, `delivery_days` (integer), `proposal_text`.
- **Optional:** `proposed_milestones` (array of `{ title, amount, description?, duration_days? }`), `ai_agent_notes`.
- **Example prompt:** "Draft a proposal for project X: bid ₹45,000, 21 days, with a short approach section."

### `list_proposal_drafts`
Your staged drafts, optionally filtered.

- **Optional:** `status` (`pending_approval`, `approved`, `rejected`).
- **Example prompt:** "Show my drafts waiting for approval."

### `approve_proposal_draft`
Submit a staged draft to the client. This is the final step: call it only after
the person you work for has reviewed the draft and asked you to submit it.

- **Required:** `draft_id`.
- **Optional:** `final_bid_amount`, `final_delivery_days`, `final_proposal_text` (replace the staged values).
- **Example prompt:** "Submit draft D-9 at ₹42,000 after I've reviewed it."

### `list_my_bids`
Your submitted bids, active and past.

- **Optional:** `limit` (1–50, default 20).
- **Example prompt:** "List my last 10 bids."

---

## Messages and contracts

### `list_messages`
Active conversation threads and project chats.

- **Optional:** `limit` (default 20 threads).
- **Example prompt:** "Show my unread project threads."

### `get_thread`
Message history for one thread, with participant checks.

- **Required:** `thread_id`.
- **Optional:** `limit` (default 50 most recent messages).
- **Example prompt:** "Show the last messages in thread T-3."

### `stage_message_draft`
Stage a reply in a thread for human review. It is not sent until a person confirms.

- **Required:** `thread_id`, `content`.
- **Example prompt:** "Draft a reply in thread T-3 saying we'll deliver Friday; stage it for my review."

### `list_contracts`
Active and past contracts with escrow milestone statuses and deadlines.

- **Optional:** `status` (`active`, `completed`, `cancelled`, `disputed`).
- **Example prompt:** "List my active contracts with upcoming deadlines."

### `get_contract`
Terms, funded escrow breakdown, client and freelancer details and dispute status.

- **Required:** `contract_id`.
- **Example prompt:** "Show the terms and escrow for contract C-12."

---

## Tools that are not exposed to OAuth connector clients

The README for the npm package says payment-preparation tools are not available
to OAuth connector clients. None of the 36 tools above is a payment tool. If your
client lists fewer tools than this page, check how you signed in
([auth.md](auth.md)).
