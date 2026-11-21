# Troubleshooting

Start with the check that matches your problem. Each entry lists the likely cause and the fix.

## Connector and MCP client

### The client shows no BotDigit tools

- Restart the client after you change its config.
- For the npm package, run `npx -y @botdigit/mcp-server --test-connection` with your token set.
  If it fails, fix the error it shows; if it lists tools, the problem is in your client config.
- Check the config file path and that the JSON is valid (a trailing comma breaks it).

### Hosted connector: "not signed in" or a repeated sign-in prompt

- In Claude Code, run `/mcp`, choose **botdigit**, and sign in again.
- In Claude, remove the connector and add it again from the directory, then sign in.
- Make sure you sign in with the BotDigit account that owns the workspace or projects.

### `--test-connection` returns 401 or "unauthorized"

- The token is missing, mistyped or revoked. Copy the token again from your BotDigit account.
- Check which variable holds it: the package reads `BOTDIGIT_PAT`, then `BOTDIGIT_API_TOKEN`, then `BOTDIGIT_TOKEN`.
- Do not add quotes or spaces around the value in your config.

### `--test-connection` cannot reach the gateway

- Check your network and proxy settings.
- Check `BOTDIGIT_API_URL`. Use the value from [connect.md](connect.md#which-url-to-use).
- Confirm Node.js is version 18 or newer (`node --version`).

### A tool returns a permission error

- Your role in the workspace does not allow that action. Check it in the web app.
- Some actions are reserved for people: funding escrow, approving milestones, releasing
  payments, completing projects. Do those in the BotDigit web app.

### A tool name in a command or skill is not found

Some files use names with a `botdigit_` prefix (for example `botdigit_search_projects`).
The server's live names have no prefix (`search_projects`). Use the live name.
See [tools.md](tools.md).

## Visual review site

### "Invalid review code" or the review does not open

- Check the share code. It uses letters, digits, `_` and `-`, and is 4 to 32 characters.
- Make sure you copied the whole code from the link.
- If the review was archived, ask the team to reopen it.

### The reviewed site is blank or does not load in the canvas

- Some sites cannot run inside the canvas. Use the [browser extension](extension.md) on the real site instead.
- Pages that need a login in another tab may not load in the canvas. Sign in to the
  site in your browser, then use the extension.
- Reload the page. If the same page fails again, note the URL and report it.

### The pin popover is cut off or the "Post pin" button is hidden

- Scroll inside the popover. It has its own scrollbar.
- If it still does not fit, place the pin higher or lower on the page, or use a larger window.

### The close-up or nearby preview says "Capturing…" for a long time

- Large pages take a few seconds. Wait for both previews to finish.
- If a preview says "No preview", the page blocked the capture. Post the pin without the
  screenshot, and say what the problem is in the note.

### Pins show "needs relink"

The page changed, so the pin's element may have moved. Check the pin on the page and
re-anchor it in the review. See [review-site.md](review-site.md#anchoring-and-relinking).

### My pins are missing from the list

- Check the status filter: a filter set to `Open` hides resolved and `wont_fix` pins.
- Check the round: pins belong to the round that was current when you posted them.

## Browser extension

### The popup cannot find a review

- Paste the share code into the popup by hand.
- Check that the code is valid (see above).

### The popup says you are not signed in, but I am signed in on botdigit.com

- Open botdigit.com in the same browser profile where the extension is installed.
- Sign in again, then reopen the popup.
- Private or incognito windows keep separate cookies, so your sign-in does not carry over to them.

### Pins do not appear on the page

- Confirm the popup shows an active review for this site.
- Reload the page after you join the review.
- If the page uses a different host (for example `www.` and the bare domain), the extension only runs on the host you joined.

### Posting a pin fails

- Check your network connection.
- Try again. If it keeps failing, copy the note and report the page URL to BotDigit support.

## Visual verification

### `request_visual_verification` returns no comparison

- Check that `target_url` is the preview or staging URL and that it loads in a browser.
- Check the `device_type`.
- Run the request again after the preview finishes deploying.

## Still stuck?

Gather these before you ask for help:

1. The client and the version (for example Claude Code, Cursor, the extension 1.1.1).
2. The exact error text. Remove tokens and share codes first.
3. The output of `npx -y @botdigit/mcp-server --test-connection` (without the token).
4. The URL of the page involved, if it is a review issue.
