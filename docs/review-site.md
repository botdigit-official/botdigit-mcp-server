# Visual review site

The visual review site (review.botdigit.com) lets a client or a team review a live
website. Reviewers drop **pins** on the page, each with a note, a type and a
screenshot. Developers and AI agents then work through the pins with the MCP tools.

## Concepts

| Term | Meaning |
|---|---|
| **Review** | One website under review, with its pages, versions and feedback. Each review has a status (`active` or `archived`) and an approval decision made by a reviewer. |
| **Share code** | The code in a review link (`/r/<code>`). Anyone with it can join as a guest. |
| **Page** | A URL on the reviewed site. Pins belong to the page they were dropped on. |
| **Pin (feedback item)** | A note anchored to an element on a page, with a screenshot, a type and a status. |
| **Round** | A review cycle. Each round freezes the pages as they looked when the round was current. Pins from a new round go to the new round. |
| **Capture** | A screenshot and structure snapshot of a page, used for comparisons and visual verification. |

## Opening a review

Open the review link, or go to `review.botdigit.com/r/<share code>`. The first time,
you join as a guest: enter a name and, optionally, an email. The page then loads the
reviewed site in the canvas.

Signed-in members open the same link and are recognised automatically. See
[auth.md](auth.md).

## The canvas

The top bar has three groups:

- **Left:** the review name, the website, and the status of the current round.
- **Middle:** **Canvas / List** (view), **Pin / Browse** (mode), a screen-size menu
  (Full, tablet, mobile), and a reload button.
- **Right:** share and delivery actions, and menus for collaboration and settings.

Keyboard shortcuts:

| Key | Action |
|---|---|
| `P` | Pin mode: click or drag on the page to drop a pin |
| `B` | Browse mode: use the page normally (links, scrolling, forms) |

## Dropping a pin

1. In Pin mode, click an element. To mark an area, drag a box around it.
2. The pin popover opens. It shows two previews: a **close-up** of the element and a
   **nearby area** shot with the spot outlined.
3. Write what should change. Press **Enter** to post; **Shift+Enter** adds a new line.
4. Optional: add a "Should be…" hint (for example "16px bold, orange"), attach your
   own image, or paste one.
5. Check the **type**. The type is guessed from your note (see the table below). Change
   it under **Options**, where you can also set the section and visibility.

The popover opens above the pin when there is more room there, and it stays inside
the canvas. If it is cut off, scroll inside the popover.

### Pin types

| Type | Label on the pin | Use for |
|---|---|---|
| `bug` | Bug | Something broken |
| `change` | Change | A change to content or layout |
| `copy` | Copy | Wording or text |
| `design` | Design | Visual style, spacing, colours |
| `mobile` | Mobile | Behaviour on small screens |
| `performance` | Perf | Speed, loading, heavy assets |
| `suggestion` | Idea | An optional improvement |

## Pin statuses

| Status | Meaning |
|---|---|
| `open` | Not yet worked on |
| `in_progress` | A developer has started (set with `update_review_task` or in the web app) |
| `resolved` | Done. Clicking a resolved pin again reopens it |
| `wont_fix` | Declined, with a reason |

Filter pins with the status filter in the list, or with `list_feedback_items`.

## Anchoring and relinking

A pin stores the element's CSS selector, its position on the page and a DOM
fingerprint. When the page changes, the pin may no longer match its element. Its
**relink status** shows this:

| Relink status | Meaning |
|---|---|
| `anchored` | The pin still matches its element |
| `needs_relink` | The element moved or changed; the pin needs a new anchor |
| `relinked` | The pin was re-anchored to its element |

Use `list_feedback_items` with `relink_status: "needs_relink"` to find them.

## Review rounds and frozen pages

When you start a new round, pages seen in the current round are frozen: they show
how they looked then. New pins go to the new round. This gives a stable record of
what was reviewed. Use `get_version_diff` to compare two captures in a structured way.

## The page proxy

The reviewed site is shown through BotDigit's page proxy, so reviewers can see
pages that would block a frame on their own. The proxy:

- removes frame-blocking headers and applies a relaxed content policy for the page;
- removes some analytics beacons;
- keeps the reviewed site's own URLs working inside the canvas;
- refuses addresses on private networks.

Some sites still do not render inside the canvas, for example pages that require a
login in another tab, or sites with very strict scripts. In that case, use the
[browser extension](extension.md) on the real site instead.

## Screenshots

Close-up and nearby screenshots are stored as WebP images. The image is captured
from the rendered page at the time you post the pin. Very large pages can take a few
seconds to capture; wait for both previews to finish before posting.

## Review tools

Everything in the canvas can be read and updated from an AI client with the
visual review tools. See the [Visual review section of tools.md](tools.md#visual-review).
The main ones are `list_review_projects`, `list_feedback_items`, `get_feedback_item`,
`create_fix_plan`, `update_review_task`, `attach_implementation_evidence`,
`request_visual_verification` and `update_review_status`. The workflow is in
[workflows.md](workflows.md#1-review-to-fix-to-verification).
