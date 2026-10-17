# /find-projects

Search and discover open freelance projects, client RFPs, and development gigs on BotDigit.

## Workflow
1. When invoked, check user criteria (e.g. keywords, skills, budget range, or category).
2. Invoke the `botdigit_list_projects` tool with the appropriate filters (e.g., `{ limit: 10, category, query }`).
3. Summarize the returned projects in a clean markdown table including:
   - Project Title
   - Budget / Compensation (in INR / USD)
   - Required Skills
   - Deadline / Estimated Timeline
   - Summary of Scope
4. Provide the project ID so the user can easily invoke `/draft-proposal <project_id>`.
