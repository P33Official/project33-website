# Project 33 Website v8 — Five-Seal Concept Alignment

This static website presents the current Project 33 concept consistently across the homepage and Trust Center.

## Current public concept

- P33 is an experimental community mystery token.
- Five public market-cap milestones open five Seals.
- Each milestone must remain at or above its threshold for 33 consecutive seconds.
- A valid drop below the threshold resets the timer.
- A market-data interruption pauses verification.
- An opened Seal remains open permanently.
- Milestones are entertainment triggers, not instructions to coordinate trading.

## Included

- Responsive homepage and Five-Seal explainer
- Live Discord Founding Member counter
- Pre-launch token and milestone-engine status
- Project Principles, Risk Disclosure, Terms, Privacy, Safety, and Transparency Log
- Archived utility-first concept at `utility.html` with `noindex`
- Updated social metadata and social-sharing image

## Configure before publishing

Open `config.js` and set the permanent Discord invite when ready. Do not add a contract address until the official token has launched and the address has been independently verified.

## Preview

```bash
python -m http.server 8080
```

Open `http://localhost:8080`.

## Important

The website does not yet connect to the live Milestone Engine or a market-data provider. The current engine is simulation-validated only. Legal language is a practical pre-launch draft and should be reviewed by qualified counsel before token launch or distribution.
