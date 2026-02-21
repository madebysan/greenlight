export const PRODUCTION_MATRICES_PROMPT = `Generate a Production Matrices document from this screenplay data. This document contains 5 cross-referenced tables for production planning.

Format your output as clean markdown:

# Production Matrices: [Title]

## 1. Character Matrix

| Character | Description | Scenes | Screen Time (est. pages) | Special Requirements | Wardrobe Changes |
|-----------|-------------|--------|--------------------------|---------------------|-----------------|

Include EVERY character. Screen time = sum of page ranges for scenes they appear in.

## 2. Location Matrix

| Location | Type | Scenes | Time of Day Variations | Set Requirements | Scheduling Group |
|----------|------|--------|----------------------|------------------|-----------------|

Scheduling Group = suggest grouping locations that could be shot together (same set, same area, etc.)

## 3. Props Catalog

| Prop | Scenes | Hero Prop | Notes | Department |
|------|--------|-----------|-------|------------|

Department = suggest which department handles it (props, art, special effects, etc.)

## 4. Wardrobe Catalog

| Character | Scene | Wardrobe Description | Change From Previous | Notes |
|-----------|-------|---------------------|---------------------|-------|

Only include scenes where wardrobe is specifically noted or changes.

## 5. VFX/Stunts Register

| Scene | Type | Description | Complexity | Requirements |
|-------|------|-------------|------------|-------------|

If no VFX/stunts exist, note "No VFX or stunt requirements identified."

---

## Cross-Reference Notes
Add any observations about scheduling opportunities, potential conflicts, or production considerations.

Output ONLY the markdown document. No commentary outside the document.`;
