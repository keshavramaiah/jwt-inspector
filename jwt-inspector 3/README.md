# JWT Inspector

A small, static JWT decoder built with plain HTML, CSS and JavaScript. No framework, build step, backend, database, API key or third-party dependency.

## Run locally

1. Unzip the project.
2. Open `index.html` in a modern browser.

For a local web server (optional):

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deploy free on Cloudflare Pages

1. Create a GitHub repository and push the three site files (`index.html`, `styles.css`, `app.js`) to its root.
2. In Cloudflare, open **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Select the repository.
4. Choose **None** / no framework preset. Leave the build command empty and set the output directory to `/`.
5. Deploy. Cloudflare will provide a `*.pages.dev` URL.
6. Add a custom domain later if you want one.

Cloudflare's dashboard labels may change; use its current Pages Git integration flow.

## Features

- Decode compact JWT header and payload.
- Base64URL and UTF-8 handling.
- Expiry (`exp`) and issued-at (`iat`) display.
- Standard registered-claim summary.
- Copy decoded JSON.
- Responsive layout and sample token.
- No network requests in the application code.

## Important security boundary

This is a **decoder**, not a verifier. It does not verify the signature, validate issuer/audience, check key rotation, or establish that a token is trustworthy. A decoded payload can be forged. Never use its output as an authorization decision.

Tokens are processed in the browser by this page and are not sent to a server by the app. Still, avoid pasting production credentials into tools unless your security policy permits it. Browser extensions, compromised devices, or copied screenshots can expose sensitive data.

## Before public launch

- Test malformed, Unicode, expired, future `nbf`, and missing-claim cases.
- Add a clear privacy page and contact/about information.
- Add a canonical URL, social metadata, favicon and structured data if appropriate.
- Check accessibility with keyboard-only navigation and a screen reader.
- Add analytics only after deciding what privacy-preserving measurement you need. Do not log token contents.
- Check current ad-network policies before adding ads. Do not place ads that imitate the decode/copy controls.
- Check your employer's outside-work, moonlighting and IP policies before monetizing.

## Suggested next iteration

1. Add a separate JWT signature-verification explainer (without pretending to verify unknown keys).
2. Add token size and segment diagnostics.
3. Add a safe shareable demo mode that never serializes user-entered tokens into URLs.
4. Publish concise documentation and examples that answer real developer questions.
