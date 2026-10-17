# /draft-proposal

Inspect client project specifications and prepare a tailored proposal draft for human approval.

## Human-in-the-Loop Safety
- **STAGING ONLY**: This command NEVER publishes a binding proposal or bids funds automatically.
- All proposals are created in a `pending_approval` state.
- The user must explicitly review and approve the draft either via `botdigit_approve_proposal_draft` or on the BotDigit web dashboard.

## Workflow
1. Prompt for or parse the target `project_id` and proposed bid / timeline.
2. Call `botdigit_get_project` with `{ project_id }` to retrieve full client requirements and milestone expectations.
3. Formulate a technical pitch addressing the client's problem statement.
4. Call `botdigit_stage_proposal_draft` with:
   - `project_id`: Target project ID
   - `bid_amount`: Proposed amount
   - `estimated_days`: Estimated duration
   - `cover_letter`: Structured technical proposal
5. Present the staged draft ID and direct link to the user:
   *"Draft #<id> staged. Please review and approve at https://botdigit.com/dashboard/proposals"*
