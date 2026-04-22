# Data Flow

## Flow 1: JSON → Documents (Generation)

The core pipeline from screenplay JSON to five department-ready documents.

```mermaid
sequenceDiagram
    participant User
    participant WizardShell
    participant JsonTrimmer
    participant Cache
    participant Claude
    participant localStorage

    User->>WizardShell: Paste JSON + click Generate
    WizardShell->>WizardShell: validateScreenplayJson()
    
    par 5 documents in parallel
        WizardShell->>JsonTrimmer: trimForOverview(json)
        JsonTrimmer-->>WizardShell: reduced JSON (~40-60% smaller)
        WizardShell->>Cache: getCached("overview", hash)
        alt hit
            Cache-->>WizardShell: cached markdown
        else miss
            WizardShell->>Claude: generateDocument(prompt, trimmedJSON)
            Claude-->>WizardShell: markdown
            WizardShell->>Cache: setCache("overview", hash, markdown)
        end
    end
    
    WizardShell->>localStorage: saveProject(updatedProject)
    WizardShell->>User: Show tabbed results
```

### Token Trimming

Each document gets a different subset of the screenplay JSON. This keeps Claude under its 16384 token limit:

| Document | Fields kept | Fields dropped | Typical reduction |
|----------|-----------|---------------|-------------------|
| Overview | All top-level, themes, characters (names only), locations (names only), scene count | Full scene details, props, wardrobe | ~60% |
| Mood & Tone | Tone, themes, key_visual_moment per scene, emotional_beat, music_cue | Props, wardrobe, page numbers | ~50% |
| Scene Breakdown | Full scenes, characters, locations | Props (kept inline per scene) | ~20% |
| Storyboard Prompts | Scenes (visual + emotional fields only), characters (descriptions) | Locations, props_master, themes | ~55% |
| Poster Concepts | Title, genre, tone, themes, characters (names + descriptions), key visual moments | Full scene data, locations, props | ~65% |

## Flow 2: Prompt → Image (Storyboard Generation)

How a single storyboard frame gets generated.

```mermaid
sequenceDiagram
    participant Viewer
    participant API Route
    participant fal.ai
    participant FileSystem

    Viewer->>Viewer: getStylePrefix("storyboard") from localStorage
    Viewer->>API Route: POST /api/generate-image { prompt, stylePrefix? }
    
    API Route->>API Route: Build full prompt:<br/>STYLE_PREFIX + ". " + subject
    API Route->>fal.ai: fal.subscribe("fal-ai/flux-lora", {<br/>  prompt, negative_prompt,<br/>  loras: [GestureDraw @ 1.0],<br/>  1280x720, 28 steps<br/>})
    fal.ai-->>API Route: { images: [{ url }] }
    
    API Route->>API Route: fetch(url) → Buffer
    API Route->>FileSystem: writeFileSync(.cache/images/uuid.jpg)
    API Route-->>Viewer: { url: "/api/serve-image/uuid.jpg" }
    
    Viewer->>Viewer: Update state + persist to localStorage
```

## Flow 3: Section Regeneration (Hotswap)

How a user shuffles taglines without regenerating the full Overview document.

```mermaid
sequenceDiagram
    participant User
    participant OverviewViewer
    participant API
    participant Claude

    User->>OverviewViewer: Click "Shuffle" on taglines
    OverviewViewer->>API: POST /api/regenerate-section<br/>{ sectionKey: "overview/taglines", jsonData }
    API->>Claude: Focused prompt (50 tokens vs 16k)
    Claude-->>API: "## Taglines\n- tagline 1\n- tagline 2\n- tagline 3"
    API-->>OverviewViewer: { content: "## Taglines\n..." }
    OverviewViewer->>OverviewViewer: replaceMarkdownSection(fullDoc, "Taglines", newSection)
    OverviewViewer->>OverviewViewer: onContentUpdate(updatedDoc)
```

## State Shape

All state lives in `WizardShell` and flows down via props:

```
WizardShell state
├── step: 1 | 2 | 3 | 4
├── jsonData: string (raw screenplay JSON)
├── documents: DocumentResult[] (5 generated markdown docs)
├── images: Record<sceneNumber, SavedImage> (storyboard frames)
├── promptOverrides: Record<sceneNumber, string> (edited storyboard prompts)
├── posterImages: Record<conceptIndex, SavedImage>
├── portraits: Record<characterName, SavedImage>
├── propImages: Record<propName, SavedImage>
├── disabledItems: Record<string, boolean> (hidden cast/insight cards)
└── imagePrompts: Record<ImagePromptKind, string> (user style overrides)
```

On every state change, `saveProject()` writes the full blob to `localStorage["greenlight-project"]`.
