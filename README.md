# PixelWalker-Copy-Bot

PixelWalker bot allowing to build worlds quicker.

Hosted on GitHub pages at:\
http://piratux.github.io/PixelWalker-Copy-Bot/

## Requirements to run project

Node.js 24

## Local development

If you want to setup project for local development, at the root of project run once:

```
npm install
npx simple-git-hooks
```

Then when you want to test changes, you can run:

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

### Run tests

Before running tests, you need to setup the following .env variables:

- VITE_TEST_RUN_PW_ACCOUNT_EMAIL
- VITE_TEST_RUN_PW_ACCOUNT_PASSWORD
- VITE_TEST_RUN_PW_WORLD_ID (world needs to be exactly of size 200x200)

```
npm run test
```

When running tests, do not modify the source code, because that will automatically restart the tests and may cause some
tests to fail. Only modify source code before tests run or after tests finished.

Currently, one of the tests expects that there is a second person in the world. Therefore when
running tests, make sure to be in that world.

When writing/modifying tests you might find `.printblocks` command useful.
It prints array of `WorldBlock[]` that you can paste directly to tests.

### Test production build

At the root of project run:

```
npm run build
npm run preview
```

Then open up this:\
http://localhost:4173/PixelWalker-Copy-Bot/

Vite's HMR won't work for production build, so you need to run build and preview commands when you make code changes.

### Coverage report

To run coverage report, run the following command at the root of project:

```
npm run coverage
```

Then you can open up coverage report in browser UI.
See more info here:

https://vitest.dev/guide/coverage.html#vitest-ui

### Disable ESLint/Vue-tsc

ESLint and vue-tsc may be sometimes unwanted during development.

You can disable them by adding the following lines as the top of the file:

```ts
/* eslint-disable */
// @ts-nocheck
```

### When block names change in `/listblocks`

After PixelWalker update, some blocks may change or new ones need to get added. In that case, the
following needs to be performed:

- Run:

```
npm run gen-files
```

- Update block names in `EelvlBlocks.ts` and `EerBlocks.ts` based on new names in generated files.
- Update `Every block` (id: ewki341n7ve153l) world with `.placeall` command.
- Update `Test EELVL export` (id: ra9285102d4a41a) world with `.placeelvlexport` command.
- Update `Test EELVL import` (id: r0ed3a956087328) world based on potentially failing tests.
- Run tests (see section above)

### When changing pre commit hooks

If you change pre commit hooks, you need to run the following command:

```
npx simple-git-hooks
```

See more info here: https://github.com/toplenboren/simple-git-hooks
