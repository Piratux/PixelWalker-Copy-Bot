# PixelWalker-Copy-Bot

PixelWalker bot allowing to build worlds quicker.

Hosted on GitHub pages at:\
http://piratux.github.io/PixelWalker-Copy-Bot/

## Feature overview

Features accessible via commands:

- Copy/paste selected region
- Repeated paste of selected region
    - Smart repeated paste - switches/portals/etc. get auto incremented based on placed pattern (useful for building
      switch worlds)
- Undo/redo blocks placed by bot
- Import PixelWalker worlds via link

Features accessible via bot page:

- Export PixelWalker world to .eelvl file
- Import .eelvl file to PixelWalker world

## Requirements to run project

Node.js >= 22.12.0

## Local development

At the root of project run:

```
npm run dev
```

Then open up this:\
http://localhost:3000/PixelWalker-Copy-Bot/

Vite supports HMR (Hot Module Replacement) out of box, which means you can make code changes, and changes will be
reflected live.

When `package.json` changes, you need to run dev command again.

### Linting errors

This project automatically shows linting and typescript errors in the browser.

If you want to list the errors in console, such that you can more easily navigate to source location you can run:

```
npm run lint
```

### Local env files

To have custom config only when running locally:

- Create `.env.local` file at the root of the project as a copy of `.env`
- Modify the values in `.env.local` to your needs

NOTE: All env file entries must start with `VITE_`, otherwise value will be undefined in code.

## Test production build

At the root of project run:

```
npm run build
npm run preview
```

Then open up this:\
http://localhost:4173/PixelWalker-Copy-Bot/

Vite's HMR won't work for production build, so you need to run build and preview commands when you make code changes.

## Runtime tests

This repository contains runtime tests.

To use them, run `.test` while in game.

## Disable ESLint/Vue-tsc

ESLint and vue-tsc may be sometimes unwanted during development.

You can disable them by adding the following lines as the top of the file:

```ts
/* eslint-disable */
// @ts-nocheck
```

## When block names change in `/listblocks`

Actions to be done:

- Block names in `EelvlBlocks.ts` need to be updated
- The following needs to be run

```
npm run gen-files
```

- `*.pwlvl` files need to be updated in `tests/resources`
- Run `.test` in game