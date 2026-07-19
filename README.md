# Project 33 Website v1

A complete, responsive one-page static website for the simplified Project 33 launch concept.

## Included

- Responsive desktop and mobile design
- Project 33 logo and X social-header assets
- Mission 001 launch overview
- Configurable 33-day countdown
- Configurable Founding 333 progress bar
- Token status panel
- Security warning and FAQ
- Discord and X calls to action
- Open Graph and X social metadata
- No frameworks, build tools, databases, or external font dependencies

## Before publishing

Open `config.js` and update:

```js
discordUrl: "https://discord.gg/YOUR-INVITE",
launchDate: "2026-08-01T12:00:00-07:00",
currentMembers: 0,
memberGoal: 333,
network: "TO BE ANNOUNCED",
totalSupply: "TO BE ANNOUNCED",
contractAddress: "NOT DEPLOYED"
```

Leave `launchDate` blank until the official 33-day campaign actually begins.

## Preview locally

Double-click `index.html`, or run a small local server from this folder:

```bash
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## Publish

This is a static site. Upload every file and folder in this package to the web root for `project33.tech`.

It can be hosted on any service that supports static HTML, CSS, and JavaScript. Keep the directory structure unchanged.

## Important launch checks

1. Add the permanent official Discord invite.
2. Confirm the X account is `@P33Official`.
3. Do not enter a contract address until the final contract is deployed and verified.
4. Confirm token details and risk language with qualified legal counsel before launch.
5. Test the website on a phone and desktop.
6. Publish the same official contract address on the website, X, and Discord.
