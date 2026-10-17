# /check-contracts

Review active freelance contracts, funded milestones, deadlines, and deliverable status.

## Workflow
1. Call `botdigit_list_contracts` with `{ status: "active" }` to list all ongoing agreements.
2. For each contract, retrieve detailed milestone status using `botdigit_get_contract`.
3. Report:
   - Client and Project Title
   - Funded Escrow Amount
   - Next Milestone Acceptance Criteria
   - Due Date and Pending Deliverables
4. Advise on next steps (e.g. staging deliverable review via `botdigit_stage_delivery_draft` when work is completed).
