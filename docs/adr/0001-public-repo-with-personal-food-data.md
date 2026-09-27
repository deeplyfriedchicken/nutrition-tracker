# Personal food data lives in a public repo

The site is a static Vercel deploy fed by a scheduled GitHub Action that copies Amy data into JSON files committed to the repo. We chose a public repo and a public, unauthenticated site, accepting that every logged Item — including detailed descriptions, AI comments, and weigh-ins — is readable by anyone and permanently in git history. Anything served from a static site is fetchable by URL anyway, so a private repo alone would only have hidden the history, and a login gate would have added cost and friction for a read-only look back.

## Consequences

- Making the data private later requires rewriting git history *and* rotating the deploy; assume anything committed is public forever.
- The Amy API key lives only in GitHub Actions secrets; the browser never talks to Amy.
