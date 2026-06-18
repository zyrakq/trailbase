###############################################################################
# Stage 1 — Rust backend (frontend embedded via rust-embed)
###############################################################################
FROM rust:1-bookworm AS rust-builder

# ── System build deps ─────────────────────────────────────────────────────
# cmake, clang, libclang-dev  — aws-lc-sys (TLS crypto layer)
# protobuf-compiler           — protoc binary for prost-build
# libprotobuf-dev             — google/protobuf/*.proto well-known types
#                               (separate from protobuf-compiler on Debian)
# pkg-config, libssl-dev      — OpenSSL linkage
# git, curl, ca-certificates  — Cargo git deps + trail CLI installer
RUN apt-get update && apt-get install -y --no-install-recommends \
    cmake clang libclang-dev protobuf-compiler libprotobuf-dev \
    pkg-config libssl-dev \
    git curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# ── Node.js + pnpm ───────────────────────────────────────────────────────
# The trailbase crate's build script compiles its admin UI with pnpm.
# pnpm must be in PATH during `cargo build` or the crate fails to compile.
#
# Pinned to pnpm@9: pnpm@10 introduced mandatory build-script approval
# (ERR_PNPM_IGNORED_BUILDS) with no global override, which breaks the
# trailbase assets build script that installs esbuild, sharp, protobufjs.
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/* \
    && corepack enable \
    && corepack prepare pnpm@9 --activate

# ── Bun ──────────────────────────────────────────────────────────────────
# app/build.rs runs `bun install` + `bun run build` to populate ui/dist/
# before rust-embed inlines it into the binary. Bun must be in PATH during
# `cargo build`.
RUN curl -fsSL https://bun.sh/install | bash \
    && ln -s /root/.bun/bin/bun /usr/local/bin/bun

# ── Dependency cache layer ────────────────────────────────────────────────
# Compile all dependencies using a stub binary.
# APP_SKIP_WASM=1 skips both the frontend build (bun install + bun run build)
# and the WASM build, so this layer depends only on Cargo.lock — not on
# package.json / bun.lock / appsettings.toml.
WORKDIR /workspace

COPY Cargo.toml Cargo.lock ./
COPY app/Cargo.toml ./app/
RUN mkdir -p app/src && printf 'fn main() {}' > app/src/main.rs
RUN APP_SKIP_WASM=1 cargo build --release || true

# ── Real build ────────────────────────────────────────────────────────────
# build.rs runs the full pipeline: bun install (if stale) -> bun run build
# -> build WASM components. rust-embed then inlines ui/dist/ into the binary
# at compile time, so the runtime image needs no ui/ tree.
COPY app/src/                        ./app/src/
COPY app/ui/                         ./app/ui/
COPY app/appsettings.toml            ./app/
COPY app/appsettings.production.toml ./app/
COPY app/traildepot/config.textproto ./app/traildepot/
COPY app/traildepot/migrations/      ./app/traildepot/migrations/

RUN touch app/src/main.rs && cargo build --release

# ── Pre-install auth_ui WASM component ───────────────────────────────────
# The trail CLI downloads auth_ui_component.wasm into traildepot/wasm/.
# Baking it into the image means the server starts without network access
# and without trail being present in the runtime container.
RUN curl -sSL https://trailbase.io/install.sh | bash

# The installer places `trail` in ~/.local/bin on Linux
ENV PATH="/root/.local/bin:${PATH}"

WORKDIR /workspace/app
RUN mkdir -p traildepot/wasm traildepot/data \
    && trail components add trailbase/auth_ui

###############################################################################
# Stage 2 — Runtime (slim)
###############################################################################
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# CARGO_MANIFEST_DIR = /workspace/app is compiled into the binary at build time.
# Settings::load() and all manifest-relative path lookups depend on this path.
WORKDIR /workspace/app

# ── Binary ────────────────────────────────────────────────────────────────
# Frontend assets are embedded via rust-embed — no ui/dist/ at runtime.
COPY --from=rust-builder /workspace/target/release/server /usr/local/bin/server

# ── Layered config ────────────────────────────────────────────────────────
# Settings::load() reads appsettings.toml then appsettings.production.toml
# from CARGO_MANIFEST_DIR = /workspace/app
COPY app/appsettings.toml            ./
COPY app/appsettings.production.toml ./

# ── TrailBase read-only skeleton ──────────────────────────────────────────
COPY app/traildepot/config.textproto      traildepot/
COPY app/traildepot/migrations/           traildepot/migrations/
COPY --from=rust-builder \
     /workspace/app/traildepot/wasm/auth_ui_component.wasm \
                                           traildepot/wasm/

# ── Mutable data directories ──────────────────────────────────────────────
# Created here so they exist even without volume mounts.
# Mount volumes here for persistence across container restarts.
RUN mkdir -p traildepot/data traildepot/backups traildepot/secrets traildepot/uploads

VOLUME ["/workspace/app/traildepot/data",    \
        "/workspace/app/traildepot/backups", \
        "/workspace/app/traildepot/secrets", \
        "/workspace/app/traildepot/uploads"]

EXPOSE 4000

ENV APP_ENV=production

CMD ["server"]
