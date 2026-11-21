# BotDigit Review browser extension

The BotDigit Review extension lets you pin feedback directly on a real website in
your browser, including pages behind a login. Pins go to the same review as the
[visual review site](review-site.md), so they show up in the same list.

## Install

- **Chrome:** install **BotDigit Review: Visual Website Feedback** from the Chrome Web Store.
- **Firefox:** install it from Firefox Add-ons (search for "BotDigit Review").

If a listing is not found, check with BotDigit support for the current link.

The current version is **1.1.1**.

## What it does

1. **Join a review.** Open the popup and paste a review link or share code, or open
   a review page and let the popup detect the code. Enter your name. The popup
   remembers your name and the active review.
2. **Pin feedback.** On any page, switch to pin mode and click an element. Write the
   note, choose a type, and post. The pin is saved to the review.
3. **See existing pins.** The extension loads the review's pins so you can see
   feedback that is already on the page.

Pin types, statuses and relinking are the same as on the review site. See
[review-site.md](review-site.md).

## What is captured when you pin

When you post a pin, the extension sends:

- the page path and page title;
- the element's CSS selector (up to four levels deep), its tag, its text, its position
  and its bounding box;
- the viewport size and the scroll position;
- a screenshot of the visible tab, cropped to the element (close-up) and to the area
  around it (nearby);
- your note, the pin type, and your guest session token, which identifies you as the
  guest who posted it.

The screenshot shows everything visible on the page at that moment. Do not pin a page
while personal or confidential information is on screen, or crop it before posting.

## Permissions

The manifest asks for:

| Permission | Why |
|---|---|
| `storage` | Remember your name, the active review and your session |
| `cookies` | Read the BotDigit `access_token` cookie so that signed-in members are recognised |
| Access to all sites (`<all_urls>`) | Place pins on any website you review |

The extension reads the cookie only to check your sign-in with the BotDigit API.

## How it talks to BotDigit

The background service worker calls the public BotDigit API:

| Action | Endpoint (public API) |
|---|---|
| Check sign-in | `GET /auth/me` |
| Load a review | `GET /public/review/<code>` |
| Join as guest | `POST /public/review/<code>/guest` |
| Load pins | `GET /public/review/<code>/feedback` |
| Post a pin | `POST /public/review/<code>/feedback` |

Share codes are checked against the format `A–Z a–z 0–9 _ -`, 4 to 32 characters,
before any request is sent.

## Signing in

You do not need an account to pin as a guest. To be recognised as a member, sign in
at botdigit.com in the same browser profile. The extension then reads the sign-in
from the cookie. If you sign out, the extension goes back to guest mode.

## Stop a session

Open the popup and choose to stop the session. This clears the active review from the
extension. Your pins stay in the review.

## Developer builds

This repository does not contain the extension's source code. For extension bugs,
contact BotDigit support.
