# ── BomBot CLI ────────────────────────────────────────────────────────────────
# Runs the BomBot command-line bot via vite-node.
# Credentials are supplied at runtime through environment variables —
# never bake them into the image.
# ──────────────────────────────────────────────────────────────────────────────

FROM node:24-alpine

WORKDIR /app

# Install dependencies (devDependencies are required for vite-node)
COPY package*.json ./
RUN npm ci

# Copy the rest of the source
COPY . .

CMD ["npm", "run", "bombot"]

