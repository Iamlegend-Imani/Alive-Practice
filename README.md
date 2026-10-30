# Alive Practice

A space to practice being human in the age of AI, by **Alive Systems Lab**.

## The first release

- Eight complete guided practices across thinking, attention, connection, embodiment, and creativity.
- “Before you ask the machine”: record your own thoughts, choose the help you want, optionally copy a request into a tool of your choice, reflect, and choose an action.
- Browser-local drafts and a searchable journal, with editing, individual deletion, JSON/Markdown export, and JSON restoration.
- Concept previews of eight chapters from *Before You Ask the Machine: A Short Guide to Being Human in the Age of AI*. These are introductory ideas, not a finished manuscript or published book.
- System, light, and dark appearance; Grounded, Dawn, and Dusk atmospheres; optional motion and generated ambient sound.
- Responsive layouts, keyboard navigation, semantic forms, modal focus management, and respect for reduced-motion preferences.

## Run locally

Requires Node.js 22 or later. No third-party runtime dependencies or API keys are required.

```sh
npm run dev
```

The local server listens on port 3000, or the `PORT` environment variable. Open the URL printed by the server.

```sh
npm run check
npm test
npm run build
```

`npm run build` copies `public/` to `dist/`. All navigation uses URL fragments, so static hosting needs no application rewrite rules.

## Deploy to Vercel

Import `Iamlegend-Imani/Alive-Practice` into the **Alive Systems Lab** Vercel team. `vercel.json` configures the build command (`npm run build`) and output (`dist`). The production branch is `main`. The app does not require environment variables, a database, authentication, or an AI provider.

## Data and privacy

Journal entries, drafts, and appearance choices are stored in `localStorage` for this origin and browser profile. Journal text is never sent to a server or AI service by the application. The optional copied request is only shared if the person chooses to paste it elsewhere. Ambient audio is generated locally and starts only after an explicit action.

Local storage is not a secure vault. Other people using the same browser profile may be able to read it, and clearing site data removes it. The product explains this in **Your data, your space**. JSON exports can be restored into another browser or deployment; entries are deduplicated by ID and the newer edit is retained.

Unreadable journals are preserved for recovery. Failed writes are reported; a failed practice save offers an immediate JSON download of that reflection. Unit tests cover export round trips, import validation, duplicate handling, corruption, and storage failures.

## Project structure

`public/app.js` handles routes and interactions; `public/content.js` contains practice and chapter content; `public/storage.js` owns journal validation and persistence; `public/styles.css` defines themes, atmosphere, layout, and accessibility states. `scripts/` contains the dependency-free development server and static build.
