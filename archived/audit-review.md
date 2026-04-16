# Production Executive Audit — Greenlight

**Auditor:** Veteran physical production executive perspective (20+ years, $5M–$200M budgets)
**Subject:** Greenlight — "Turn a script into something tangible, fast"
**Date:** 2026-04-12
**Audit type:** Full 10-point domain evaluation

---

## TL;DR

**What it is:** A mood board and visual concept generator that takes structured screenplay data and produces atmosphere prose, storyboard sketches, poster concepts, and a scene-by-scene breakdown — all in a dark, cinematic UI that looks like it belongs at A24.

**Who it's actually for:** A director or producer in the earliest "what is this movie?" phase, before a single crew member is hired. Not for anyone who needs to actually prep, budget, schedule, or manage a shoot.

**Would I buy it for a real show:** No. But I'd send the link to a director who's trying to articulate a visual language to their DP or production designer before prep begins. It's a conversation starter, not a production tool.

---

## Green Flags

- **Knows what it's not.** README explicitly says "not a production management tool, not a replacement for StudioBinder." That's more self-awareness than 90% of film-tech pitches.
- **Visual taste is genuine.** The dark editorial UI, consistent B&W sketch style across all generated images, and the poster concept structure (character-driven, symbolic, scene-based, minimalist, atmospheric categories) reflect someone who's actually looked at how poster campaigns are structured.
- **Mood & Tone tab is the real product.** Atmosphere prose, tonal descriptors, color palette, music direction with real soundtrack references (via TMDB), and similar moods with actual film posters. This is the tab a director would screenshot and send to their DP. It's genuinely useful.
- **Production Insights over generic crew list.** Replaced a boilerplate "you need a director, DP, producer" list with heuristic-fired insights: "your script has 11 scenes with VFX/stunts — budget for a stunt coordinator and safety supervisor." That's closer to how a UPM actually reads a script.
- **Honest about the extraction step.** Doesn't pretend to parse screenplays directly. Tells you to upload to Gemini and paste the prompt. Crude, but at least it's not claiming AI-powered screenplay parsing that doesn't work.
- **Image generation is coherent.** Every generated image — storyboards, portraits, props, posters — uses the same Gesture Draw LoRA, creating a consistent "one storyboard artist's hand" look across the whole bible. That's a real production sensibility (you wouldn't mix illustration styles in an actual lookbook).
- **Scene breakdown model includes the right fields.** `key_visual_moment`, `emotional_beat`, `wardrobe_notes`, `vfx_stunts`, `props` per scene — these are the things a 1st AD and department heads actually pull from a script breakdown.

---

## Red Flags (ranked by severity)

### Critical

1. **No screenplay parsing.** The tool requires you to manually extract structured JSON from your screenplay using a separate AI chat (Gemini). That's like selling a car that requires you to bring your own engine. The extraction prompt is well-designed, but the friction of copying JSON between tools kills the "fast" promise.

2. **No concept of revisions.** No colored pages, no locked pages, no A/B scene numbering, no omitted scenes, no revision tracking. In production, the script changes daily. A tool that can't handle revisions is a tool that's obsolete by day one of prep.

3. **No export path.** Can't export to Movie Magic Budgeting, Movie Magic Scheduling, Final Draft, CSV, or any industry-standard format. The only "export" is browser print-to-PDF from a share page. Your data lives and dies in browser localStorage.

4. **Single-project architecture.** Can't compare two scripts side by side. Can't maintain a development slate. For a tool pitched at "indie filmmakers juggling multiple scripts," this is a direct contradiction.

5. **No budget, no schedule, no cost tracking.** Zero financial awareness. No fringes, no globals, no chart of accounts, no day-out-of-days, no one-liner. The "scope at a glance" section counts scenes and locations but doesn't translate that into shoot days, equipment needs, or dollar estimates.

### Serious

6. **"Complexity read" is vibes, not metrics.** The complexity assessment is a prose paragraph ("Contained, single-location siege film with heavy reliance on practical effects"). No shooting day estimate, no department breakdown, no flag for union implications (11 VFX/stunt scenes = SAG stunt coordinator required, IATSE SFX, etc.).

7. **No offline mode.** Requires internet for generation (Claude API) and image creation (fal.ai). Sets are not co-working spaces. A tool that dies without WiFi is a tool that dies on set.

8. **Image generation tied to a single LoRA model on a single vendor.** If fal.ai deprecates the endpoint, changes pricing, or the Gesture Draw LoRA becomes incompatible with future FLUX versions, every image route breaks with no fallback.

9. **No permissioning or collaboration.** No concept of roles (UPM, coordinator, department head, PA). No sharing beyond a read-only print view. No audit log. No approval workflow.

### Minor

10. **"Pre-production bible" is a generous framing.** A real pre-production bible includes department-specific breakdowns, vendor contacts, location photos, union deal memos, insurance requirements, and a production calendar. This is closer to a "director's vision deck" or "lookbook" — which is fine, but call it what it is.

11. **Sample data is a horror movie.** Night of the Living Dead is a great public-domain choice, but it's a 13-scene, 5-location, 8-character film from 1968. Show me this tool handling a 60-scene, 25-location contemporary drama with 40 speaking roles and I'll take the data model more seriously.

12. **Wardrobe section uses character name token matching.** Matches wardrobe notes to characters by splitting names into individual words and checking if any appear in the note text. "55 year old Chinese woman" won't match "EVELYN WANG." Works for some scripts, fails for others. A real wardrobe breakdown maps by scene + character, not by text search.

---

## Section-by-Section Audit

### 1. Positioning & Target User

**Claimed:** "Indie filmmakers and freelancers" at the "you have a script, now what?" phase.

**Actual:** This is a lookbook/vision deck generator for the earliest creative development phase. The real user is a director or producer who wants to articulate "what does this movie feel like?" to potential collaborators. It sits upstream of even the most basic prep work.

**Assessment:** The positioning is honest but overreaches. "Turn a script into something tangible" is true if "tangible" means "mood board with storyboard sketches." It's not true if "tangible" means "something a line producer can use to build a budget."

**Who would actually use this:** A director preparing for a pitch meeting. A producer assembling a sizzle package. A film student building a thesis project presentation. Not a UPM, not a 1st AD (despite the tagline), not a production accountant.

### 2. Domain Literacy

**Terminology:** Mostly correct. Slug lines, INT/EXT, time of day, hero props, VFX/stunts — all used properly. "Emotional beat" and "key visual moment" are director vocabulary, not standard screenplay breakdown categories, but they're applied consistently and usefully.

**Where it fakes it:** "Production Design" tab is really just a prop list and wardrobe notes cross-referenced from scene data. A real production design breakdown would include set dressing, color palettes per location, construction requirements, and department-specific call sheets. The "Insights" section in Cast & Crew is clever but would confuse anyone expecting a traditional crew breakdown.

**What's missing from the vocabulary:** No mention of colored revisions, locked pages, A/B scenes, omitted scenes, day-out-of-days, banked hours, turnaround, company moves, French hours, kit fees, box rentals, or any accounting terminology. These absences are appropriate given the tool's actual scope (creative development, not prep/production).

### 3. Workflow Coverage

| Phase | Coverage | Notes |
|-------|----------|-------|
| Development | Partial | Script analysis, mood, comparables, scope read. No coverage tracking, no option tracking, no attachment tracking. |
| Prep | Minimal | Scene breakdown exists but lacks element categories (extras, vehicles, animals, SFX, set dressing are absent as distinct categories). No scheduling, no location scouting tools, no crew start paperwork. |
| Production | None | No call sheets, no DOODs, no daily production reports, no hot costs, no progress tracking. |
| Wrap | None | No wrap protocols, no equipment return tracking, no final cost reconciliation. |
| Post | None | No editorial workflow, no VFX tracking, no deliverables matrix, no QC checklist. |
| Delivery | None | No IMF, no KDM, no M&E, no deliverables matrix. |

**Verdict:** This tool lives entirely in development/early creative prep. That's fine — it says so. But the "pre-production bible" framing implies prep coverage that doesn't exist.

### 4. Interop

| Format | Import | Export |
|--------|--------|--------|
| Final Draft (.fdx) | No | No |
| Movie Magic Budgeting (.mbb) | No | No |
| Movie Magic Scheduling (.mms) | No | No |
| CSV | No | No |
| JSON | Yes (manual paste) | No (stored in localStorage) |
| PDF | No (extraction via Gemini) | Print-to-PDF only |
| Markdown | No | Yes (Download All Documents) |

**Verdict:** Near-zero interop. You can't get your data into or out of this tool in any industry-standard format. The JSON input requires manual extraction via a separate tool. The only output is Markdown files and browser print-to-PDF.

### 5. Data Model Fidelity

The data model is **screenplay-centric, not production-centric.** It understands scenes, characters, locations, and props as narrative elements, not as production elements with associated costs, scheduling implications, or department assignments.

**What's modeled well:**
- Scene structure (number, slug, location, characters, props, wardrobe, VFX/stunts)
- Character data (name, description, arc, scenes present, special requirements, wardrobe changes)
- Location data (name, description, scenes, INT/EXT, time variations, set requirements)
- Props (item, scenes, hero prop flag, notes)

**What's missing for a real production:**
- Element categories (extras, vehicles, animals, special equipment, greenery, set dressing)
- Scene length (eighth-of-a-page, not just page range)
- Cast status (principal, day player, weekly, stunt double, stand-in, photo double)
- Location status (confirmed, scouting, permit required, stage vs practical)
- Department assignments per element
- Any concept of scheduling order vs script order

### 6. Money & Compliance

**Budgeting:** None. Zero financial awareness. No cost estimates, no fringes, no chart of accounts.

**Payroll:** None. No integration with Cast & Crew, Entertainment Partners, or Wrapbook.

**Tax incentives:** None. No jurisdiction tracking.

**Union compliance:** None. No awareness of DGA/SAG-AFTRA/IATSE/Teamsters/WGA signatory requirements.

**Audit trail:** None. No user accounts, no action logging, no approval workflow.

**Security:** Password gate on Vercel deployment. API keys stored as server env vars. User data in browser localStorage (no encryption, no backup, no disaster recovery).

**Verdict:** Not applicable. This tool doesn't operate in the money/compliance space and doesn't claim to.

### 7. Operational Realism

**Offline:** Non-functional. All generation requires internet (Claude API, fal.ai, TMDB).

**Scale:** Untested beyond 13-scene, 8-character demo. A real feature (60+ scenes, 40+ speaking roles, 20+ locations) would stress the single-page React architecture and localStorage limits.

**Performance:** Image generation takes 30-45 seconds per image. Full bible generation (all images) takes 15-20 minutes. Acceptable for a one-time creative exercise, painful for iterative use.

**On-set usability:** None. This is a desktop browser tool for a quiet office, not a set tool.

### 8. Team Credibility

**Builder:** Santiago Alonso — product designer. Portfolio at santiagoalonso.com. No stated production credits.

**Advisors:** None mentioned.

**Assessment:** This is a designer's passion project, built with genuine taste and technical competence, but without production credits backing the domain claims. The presentation.md reveals the actual context: it's a portfolio piece for an A24 job interview. That's honest, and the execution is impressive for a solo designer building a full-stack AI application.

### 9. Pricing & Lifecycle Fit

**Current model:** Free (no pricing). API costs absorbed by the builder on Vercel deployment (~$0.15 for document generation, ~$0.70 for images per screenplay).

**Lifecycle fit:** Not applicable. Single-user, single-project, no concept of production ramp-up/wrap-down.

**If this were a product:** Per-project pricing would be the only model that makes sense. Per-seat pricing would be absurd for a tool used by one person (the director/producer) during one phase (development). ~$20-50/project would be fair given the AI costs and value delivered.

### 10. Verdict

**Rating: PASS — as a production tool. APPROVE — as a creative development lookbook.**

**Would I sign a PO for a real show?** No. This doesn't do anything a production needs during prep, production, or post. It doesn't replace or integrate with any tool a UPM or line producer uses.

**Would I recommend it to a director?** Yes, with caveats. If a director is trying to articulate "what does this movie look and feel like?" to potential collaborators before prep begins, this tool produces a genuinely useful visual reference document in under 30 minutes. The Mood & Tone tab alone is worth the time.

**What I'd require before taking it seriously as a product:**
1. PDF screenplay upload (eliminate the Gemini extraction step)
2. Multi-project support
3. Export to at least CSV and PDF (programmatic, not print)
4. Scene length in eighths (not just page range)
5. Element categories beyond the current flat model
6. Basic shoot day estimate based on scene count, locations, and complexity

**What's a hard no:**
- Don't call it a "pre-production bible" in marketing. Call it a "director's lookbook" or "vision deck generator." A pre-production bible implies prep-level rigor that this tool doesn't have and isn't trying to have.
- Don't pitch it to line producers or UPMs. They'll dismiss it in 30 seconds and tell everyone else to dismiss it too.

---

## Questions I'd Ask the Founders in a 30-Minute Call

1. **Have you ever sat in a production meeting where a 1st AD walks the director through a stripboard? What happened in that meeting that this tool addresses?**

2. **Your README says "indie filmmakers juggling multiple scripts." How does a single-project architecture serve that user? Walk me through the juggling.**

3. **The extraction step requires pasting JSON from Gemini. Have you timed how long a non-technical filmmaker takes to complete that step, including error recovery when the JSON is malformed?**

4. **What happens when the script gets revised? Pink pages come in on a Friday afternoon. How does a user update their bible?**

5. **You generate "Production Insights" — e.g., "11 scenes with VFX/stunts, budget for a stunt coordinator." Has a line producer or UPM reviewed these heuristics? Would they agree with the thresholds?**

6. **The Mood & Tone tab is your strongest feature. Have you tested it with a director or DP? Did they use the output in a real conversation with their team?**

7. **Your image generation costs ~$1.50 per screenplay. If this became a product with 1,000 users generating 3 screenplays each per month, that's $4,500/month in API costs alone. What's the business model?**

8. **You store all project data in browser localStorage. What happens when a user clears their browser data, switches laptops, or wants to share their project with a producer?**

9. **Who is your wife? What does she actually do in production? Walk me through her actual workflow on her last project and where Greenlight fits.**

10. **If A24 gave you the greenlight (pun intended) to build this into a real product, what's the first feature you'd add and why?**

11. **Have you looked at StudioBinder's free tier? It does script breakdown, shot lists, and call sheets for free. What does Greenlight offer that StudioBinder doesn't?**

12. **Your backlog mentions "Upload Script" as the #1 next feature. Have you tested Claude or Gemini's screenplay extraction accuracy on scripts with non-standard formatting (dual dialogue, montages, intercuts, flashbacks)? What's the error rate?**

---

## Final Recommendation

**As a production tool: PASS.**
It doesn't operate in the production space and shouldn't be evaluated as if it does.

**As a creative development tool: APPROVE WITH CONDITIONS.**
It's a genuinely useful lookbook/vision deck generator for the earliest phase of a project. The Mood & Tone output is strong. The consistent visual style across generated images is a real differentiator. The UI taste is exceptional.

**Conditions:**
- Rename from "pre-production bible" to "director's lookbook" or "vision deck" in all marketing
- Add PDF screenplay upload to eliminate the Gemini extraction friction
- Add multi-project support (even just a simple project switcher)
- Add programmatic PDF export

**As a portfolio piece for a design job at A24: STRONG APPROVE.**
The taste, the visual sensibility, the cinematic dark UI, the consistent generated art style, and the A24-specific demo narrative all demonstrate exactly the kind of design thinking a company like A24 would value. The builder clearly understands mood, atmosphere, and visual storytelling — which is what A24 sells.

---

*Audit conducted on codebase review only. No live production testing performed. Findings reflect code, documentation, and design as of 2026-04-12.*
