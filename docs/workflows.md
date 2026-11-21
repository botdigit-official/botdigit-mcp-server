# Workflows

Multi-step recipes. Each step names the tool and the arguments. Ask your AI client
to run them in order, and check each result before the next step.

Ground rules that apply to every workflow:

- Tools that create work stage it. A person reviews and confirms it in BotDigit.
- Agents never fund escrow, approve milestones, release payments or complete projects.
- Use the tool names in [tools.md](tools.md).

## 1. Review to fix to verification

Use this when a client has pinned feedback on a website and you need to fix it and
prove the fix.

| Step | Tool | Arguments | Result |
|---|---|---|---|
| 1. Find the review | `list_review_projects` | `workspace_id` (optional) | Review IDs with open-feedback counts |
| 2. Understand the site | `get_review_context` | `review_id` | Target URL, pages, latest capture |
| 3. List open pins | `list_feedback_items` | `review_id`, `status: "open"` | Pins to work on |
| 4. Read one pin | `get_feedback_item` | `feedback_id` | Screenshot, selector, DOM fingerprint |
| 5. Plan the fix | `create_fix_plan` | `feedback_id`, `plan_title`, `proposed_changes`, `estimated_minutes` | A recorded plan |
| 6. Start | `update_review_task` | `feedback_id`, `status: "in_progress"`, `developer_notes` | Pin shows in progress |
| 7. Make the change | (your code and PR) | — | A commit hash and a preview URL |
| 8. Attach evidence | `attach_implementation_evidence` | `feedback_id`, `commit_hash`, `preview_url`, `evidence_notes` | Evidence on the pin |
| 9. Verify | `request_visual_verification` | `review_id`, `target_url` (preview), `device_type` | A new capture compared with the reviewed page |
| 10. Compare | `get_version_diff` | `review_id` | Visual and structural changes |
| 11. Close | `update_review_task` | `feedback_id`, `status: "resolved"` (or `wont_fix` with a reason) | Pin resolved |

**Example prompt:** "Work through the open pins on review R-1. For each pin, make a
fix plan, then ask me before you change code."

**Relinking:** if `list_feedback_items` shows `relink_status: "needs_relink"` for a
pin, the element has moved. Check the page, then relink the pin in the review before
you attach evidence.

## 2. Milestone delivery

Use this to take a project milestone from work in progress to a staged deliverable.

| Step | Tool | Arguments |
|---|---|---|
| 1. Check the project | `get_project_status` | `project_id` |
| 2. Pick the milestone | `get_milestones` | `project_id` |
| 3. Mark in progress | `update_milestone` | `project_id`, `milestone_id`, `review_status: "in_progress"` |
| 4. Track the work | `create_task`, `update_task` | `workspace_id`, `project_id`, `title`; later `task_id`, `status` |
| 5. Find the PR | `get_git_activity` | `project_id`, `limit` |
| 6. Link the PR | `link_commit_to_milestone` | `project_id`, `milestone_id`, `pr_number`, `notes` |
| 7. Check readiness | `verify_milestone_completion` | `project_id`, `milestone_id` |
| 8. Stage delivery | `submit_deliverable` | `milestone_id`, `work_summary`, `attachment_urls` (PR and preview links) |
| 9. Check status | `get_deliverables` | `milestone_id` |
| 10. Request review | `update_milestone` | `project_id`, `milestone_id`, `review_status: "review_requested"` |

Step 8 stages the deliverable. Its status shows in `get_deliverables`. The client
reviews it, approves the milestone and releases payment in the BotDigit web app.

**Before step 8:** run the tests, and check that `verify_milestone_completion` shows no
missing items.

## 3. Find and propose on a project

| Step | Tool | Arguments |
|---|---|---|
| 1. Search | `search_projects` | `query`, `category`, `budget_min`, `budget_max` |
| 2. Read the brief | `get_project` | `project_id` |
| 3. Draft | `stage_proposal_draft` | `project_id`, `bid_amount`, `delivery_days`, `proposal_text`, `proposed_milestones` |
| 4. Review your drafts | `list_proposal_drafts` | `status: "pending_approval"` |
| 5. Submit (after a person approves) | `approve_proposal_draft` | `draft_id`, optional `final_*` values |

Step 5 submits the bid to the client. Run it only after the person you work for has
read the draft and asked you to submit it.

**Example prompt:** "Find web-development projects under ₹60,000, read the best two,
and stage a draft for each. Don't submit anything."

## 4. Messages

| Step | Tool | Arguments |
|---|---|---|
| 1. Unread threads | `list_messages` | `limit` |
| 2. Read a thread | `get_thread` | `thread_id`, `limit` |
| 3. Stage a reply | `stage_message_draft` | `thread_id`, `content` |

The reply is staged for review. It is not sent until a person confirms it.

## 5. Contracts

| Step | Tool | Arguments |
|---|---|---|
| 1. Active contracts | `list_contracts` | `status: "active"` |
| 2. One contract | `get_contract` | `contract_id` |
| 3. Its milestones | `get_milestones` | `project_id` |

Use this to plan the next deliverable and see the escrow balance. Reading a contract
does not change escrow.

## 6. Set up a new project

| Step | Tool | Arguments |
|---|---|---|
| 1. Check the workspace | `get_workspace` | `workspace_id` |
| 2. Create the project | `create_project` | `title`, `description`, `category`, `budget`, `skills_required`, `milestones` |
| 3. Add tasks | `create_task` | `workspace_id`, `project_id`, `title`, `priority`, `task_type` |
| 4. Open for proposals | `update_project_status` | `project_id`, `status: "open"` |

Creating a project makes a draft. A person publishes it and funds escrow in the web app.

## Choosing a workflow

- A client sent visual feedback → workflow 1.
- You are delivering a funded milestone → workflow 2.
- You want new work → workflow 3.
- A thread needs an answer → workflow 4.
- You want the status of current work → workflow 5.
- You are starting a new engagement → workflow 6.
