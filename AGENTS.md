# Agents instruction

## Do's

- Use `bun run lint` after finishing making code changes.
- Use `bun run ts-check` after finishing making code changes.
- Do `git add ...` on all newly created files.
- When making changes to copy bot, make adjustments to following places if change is related to copy bot commands:
  - documentation in `docs/`.
  - `.help [command]` section.
  - Note: Documentation is mainly intended for end users, so do not include implementation details that are not visible by end users.
- Add in changelog (public/ChangelogView.md) entry for every change.

## Don'ts

- Do not write or run tests (this includes not running `bun run test`).
- Do not turn existing functions from void to async or vice versa.
- Do not remove the comments.
- Do not add new dependencies to the project.
- Do not modify existing dependencies in the project.
- Do not run `bun run build`
- Do not commit or push code.
