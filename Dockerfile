# ── BomBot CLI ────────────────────────────────────────────────────────────────
# Runs the BomBot command-line bot via vite-node.
# Credentials are supplied at runtime through environment variables —
# never bake them into the image.
# ──────────────────────────────────────────────────────────────────────────────

FROM oven/bun:1.4.3-alpine AS bun

FROM node:24-alpine

COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun

WORKDIR /app

# Install dependencies (devDependencies are required for vite-node)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy the rest of the source
COPY . .

CMD ["bun", "run", "bombot"]
