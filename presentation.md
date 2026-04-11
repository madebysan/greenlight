# Greenlight — The Real Goal

> **Read this first.** The README describes what Greenlight *is* publicly. This file describes what it's actually *for*.

## The real goal

Greenlight is a **portfolio / demo project built to impress A24's creative team in a job interview.**

It is not a product. It is not going to market. It is not being sold. There is no roadmap beyond the interview. Every design decision should be evaluated against one question:

> *"Will this make A24's creative team lean forward?"*

If the answer is yes, ship it. If it's a backend polish, error-handling improvement, test coverage increase, or multi-user consideration — it's probably wasted effort for this project.

## Who the audience actually is

**A24's creative team** (design + tech + creative operations). People who:
- Live and breathe A24's visual language
- Have extremely high taste
- Care about craft, not ceremony
- Will notice the margin on a card before the architecture diagram
- Have seen a million AI demos and are bored of them

This is a design-sensibility interview more than a coding interview. The code needs to work, but the *taste* is the thing being evaluated.

## The public framing vs. the real framing

| Public framing (README) | Real framing (this file) |
|---|---|
| A 0→1 tool for indie filmmakers and freelancers | A portfolio demo built specifically for A24 |
| Solves a real problem for the filmmaking community | Proves san has taste, design chops, and can build a thing |
| Showcases AI-assisted pre-production workflows | Shows A24 what a designer-who-codes can actually ship |
| Generic samples to respect IP | **Night of the Living Dead as the primary sample** — PD, philosophically aligned, safe. A24 scripts pre-cached and held in reserve as a "bonus round" only if the interviewer invites it. |

The indie-filmmaker story is *true* — the tool does solve that problem — but it's also the **narrative device** used in the interview to frame a portfolio piece. Both things can be true at once.

## What to prioritize

Rank-ordered by impact on the interview demo:

1. **Visual polish.** Spacing, typography, motion, dark mode, the feel of clicking through tabs. This is the first thing A24's team will judge and the last thing they'll remember.
2. **Night of the Living Dead as the primary demo sample.** Pre-cached, instant, visually strong, philosophically aligned. This is what the interviewer sees first. A24 scripts are prepared as a bonus round only.
3. **The Mood & Tone tab.** This is the tab that most clearly shows "this person has a designer's eye." Nailing it is worth more than any other tab.
4. **The Overview tab.** The first thing they'll see when the demo opens. Needs to be gorgeous at a glance.
5. **The interview demo narrative.** A clear, confident click-through sequence that takes ~5 minutes and lands every beat.
6. **The Visuals tab (posters + storyboards).** The wow moment. AI image generation that looks genuinely good, not generic.
7. **Everything else.** Scenes, Locations, Cast & Crew — all matter, but in service of the above.

## What NOT to prioritize

Things that would matter for a real product but are actively *wasted effort* for this project:

- **Production-grade error handling.** Best-case path only. If something weird happens, it's fine.
- **Multi-user / auth / accounts.** Single-user, local-first, maybe one Vercel deploy for sharing the link. No login.
- **Payment / monetization.** N/A.
- **Test coverage.** Tests exist for nothing in this project and that's fine.
- **Backend scalability.** It's going to get ~5 users ever, 4 of whom are at A24.
- **Feature completeness.** A few tabs done beautifully beat all tabs done mediocrely. Every time.
- **Cross-browser QA beyond the demo browser.** If it works in Chrome on san's Mac during the interview, it's done.
- **SEO / marketing site / landing page.** The demo *is* the landing page.
- **Accessibility audit.** Should be basically fine because we use shadcn, but not a priority.
- **Analytics, telemetry, logs.** No.
- **Documentation beyond README, presentation.md, plan.md, backlog.md.** No.

## The interview demo narrative

This is the actual story san tells when he opens the laptop. It's not a pitch — it's a personal origin story that happens to also be true.

> *"I built this for my wife. She was doing a lot of manual work with scripts, trying to get from a PDF to something tangible — mood, look, a sense of scope, something she could show collaborators. I wanted to see if I could automate the boring parts and leave her with the taste decisions.*
>
> *I can show you how it works with a script I already converted into JSON, which is what the project uses as input. It's Night of the Living Dead. After processing, this is what you get — you can edit, change, add. Then you export or share, done.*
>
> *...btw, we could try it with an A24 script if you want. I didn't want to upload any of your scripts to Gemini for extraction unless you were OK with it, but I happened to prepare a couple ahead of time in case you were curious."*

### Why this narrative works

- **"For my wife"** is specific, human, memorable. Much stronger than "I built this for indie filmmakers."
- **Night of the Living Dead** is philosophically perfect: the original indie horror film, public domain, zero-budget feature, all things A24's creative team will respect.
- **"We could try it with an A24 script if you want"** puts the ball in their court. You don't ambush anyone with their own IP — you offer. Both outcomes (they say yes, they say no) land well.
- **"I didn't want to upload them to Gemini without asking"** is the stealth flex. It shows you think about where data goes, you respect their workflow, and you understand that script data is sensitive. Probably lands harder than any individual feature in the tool.

### The A24 "bonus round" logistics

If they say "sure, let's try [A24 film X]" live, the full cold-start flow is: upload PDF → Gemini extracts JSON → paste JSON → Claude generates docs → FLUX generates images. That's ~10 minutes of dead air in a short meeting. Don't do that.

Instead: **pre-convert and pre-cache A24 scripts** in `.cache/`. That way if they give the green light, the demo is instant — you just load from cache. The "I happened to prepare a couple ahead of time" line makes this feel thoughtful, not rehearsed.

**⚠️ Sequencing:** This is the *last* step of the project. Do not start it until the app is fully working end-to-end with Night of the Living Dead at the quality bar we want. We can't validate A24 output quality until we know what "good" looks like with NotLD.

**The process:** test 6 A24 scripts through the full Gemini → JSON → Greenlight pipeline. Time each one. Review every tab manually. End up with 2–3 confirmed-good options to offer live. ≤ 2 minutes end-to-end is acceptable. Output must match the NotLD quality bar — nothing generic, nothing embarrassing. See `backlog.md` → Sample Data → Bonus-round samples for the full validation checklist.

Candidates to test (all 6): Ex Machina, The Witch, Hereditary, Midsommar, Moonlight, The Lighthouse. Swap in Aftersun or another A24 film if any fail validation or are hard to source.

### Tab walkthrough order during the demo

With Night of the Living Dead loaded, walk tab by tab (refine as the tool evolves):

1. **Overview** — lands the polish and taste immediately
2. **Mood & Tone** — the design sensibility beat
3. **Visuals** (posters + storyboards) — the AI wow moment
4. **Scenes** / **Locations** — the systems thinking beat
5. **Cast & Crew** — the thoughtfulness beat
6. **Then the A24 offer** — "btw, we could try it with one of your scripts if you want"

Total runtime target: **5 minutes** for the Night of the Living Dead walkthrough, plus a quick flip through an A24 sample if they accept the offer. Shorter is better. If a tab isn't pulling its weight, cut it or deprioritize it.

## Non-negotiables

- **Night of the Living Dead as the primary pre-loaded sample.** Pre-cached output so the demo is instant.
- **2–3 A24 scripts pre-converted to JSON and pre-cached**, held in reserve for the "bonus round" offer. Not baked into the public sample picker — only loaded on demand if the interviewer consents.
- **Dark mode by default** (matches A24's aesthetic instinct). Light mode can exist, but the demo opens in dark.
- **The Mood & Tone tab ships.** It's the single most important tab for this audience.
- **Nothing in the UI looks like a generic SaaS dashboard.** Runway, Linear, Arc — that tier of polish or better.
- **The demo runs locally or on a Vercel URL without requiring the user to type an API key first.** The demo must work on first click.
- **The "for my wife" origin story is the opening line.** Not "I built a tool for indie filmmakers." Not "I vibe-coded something." The human story comes first.

## Open strategic questions

- Which 2 A24 scripts does san already know work well in the tool? (Probably Ex Machina + one other — need to confirm, so they can be pre-cached as the bonus round)
- How much lead time until the interview? That sets the scope ceiling.
- Is there a specific role within A24's creative team? (Design eng, creative technologist, product designer, etc.) — sharpens which tabs to polish first.
- Does san want to send a public Vercel URL before the interview as a teaser, or save the demo for the meeting itself?
- How is the A24 "bonus round" surfaced in the UI? Hidden behind a keyboard shortcut / debug flag? A secondary menu only san knows about? Or just pre-cached JSON files on disk that san pastes manually during the demo?

## Review this file often

This document is the source of truth for why decisions get made on this project. Whenever there's a choice between "the indie filmmaker product would want X" and "the interview demo needs Y," **Y wins.**

When in doubt: *will this make A24 lean forward?*
