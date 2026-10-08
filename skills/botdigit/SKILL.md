---
name: botdigit
description: Official BotDigit Work OS & Freelance Project Skill. Use when the user asks to manage BotDigit tasks, search freelance gigs, stage proposal drafts, link git commits to tasks, check the AI work queue, or submit contract milestone deliverables.
tools:
  - botdigit_list_projects
  - botdigit_get_project
  - botdigit_stage_proposal_draft
  - botdigit_list_my_bids
  - botdigit_list_proposal_drafts
  - botdigit_approve_proposal_draft
  - botdigit_list_messages
  - botdigit_get_thread
  - botdigit_stage_message_draft
  - botdigit_list_contracts
  - botdigit_get_contract
  - botdigit_stage_delivery_draft
---

# BotDigit Autonomous Work OS Guide for Antigravity

When working on a BotDigit-connected workspace or freelance project, follow this operational protocol:

## 1. Discovering Tasks & Work Queue
- When the user asks: *"What should I work on?"* or *"What are my BotDigit tasks?"*:
  1. Call `botdigit_list_projects` with `{ limit: 10 }` to check active projects.
  2. Inspect the project details via `botdigit_get_project` to obtain the technical requirements.

## 2. Staging Proposals with Human-in-the-Loop Safety
- **CRITICAL**: Never submit a binding legal bid directly. Always call `botdigit_stage_proposal_draft`.
- The draft will be held in `pending_approval` state for human review on the BotDigit dashboard (`botdigit.com/dashboard`).
- Inform the user: *"I have drafted a proposal for project '[Title]' with a bid of $X. You can review and approve it at botdigit.com."*

## 3. Git Branch & Commit Synchronization
- When starting work on a task:
  - Recommended branch format: `feat/bd-<task_id>-<slug>`
  - Reference the task ID in git commit messages: `feat(scope): BD-<id> <description>`
  - When submitting PRs or deliverables, invoke `botdigit_stage_delivery_draft` with the pull request link and test instructions.

## 4. Milestone Deliverable Submission
- When a milestone is ready for review:
  1. Verify all tests pass.
  2. Call `botdigit_stage_delivery_draft` with `{ milestone_id, work_summary, attachment_urls: [pr_url] }`.
  3. The client will be notified to review the deliverable and release the funded escrow.
