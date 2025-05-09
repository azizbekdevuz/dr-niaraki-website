# Datasets (`src/datasets/`)

This folder contains all static and dynamic data used in the app (publications, patents, research, etc).

## Files
- **pblcDataset.ts** — Publications data and types
- **patents.ts** — Patents data and types
- **cvText.ts** — Full CV/resume text
- **dataAbout.ts** — About page data
- **research/** — Research-related datasets (see its README)

## How to Work Here
- **Add:** Add new data files as needed. Use TypeScript for types.
- **Edit:** Update the relevant file. Keep data structure consistent.
- **Remove:** Delete the file and remove all usages/imports.

## Best Practices
- Use TypeScript for all data and types.
- Keep data normalized and easy to update.
- Document data structure with comments or JSDoc. 