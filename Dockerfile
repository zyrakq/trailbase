###############################################################################
# Stage 1 — Rust backend (frontend embedded via rust-embed)
###############################################################################
FROM rust:1-bookworm AS rust-builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    cmake clang libclang-dev protobuf-compiler libprotobuf-dev \
    pkg-config libssl-dev \
    git curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Pinned to pnpm@9: pnpm@10 mandates build-script approval (ERR_PNPM_IGNORED_BUILDS),
# which breaks the trailbase assets build script.
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/* \
    && corepack enable \
    && corepack prepare pnpm@9 --activate

RUN curl -fsSL https://bun.sh/install | bash \
    && ln -s /root/.bun/bin/bun /usr/local/bin/bun

WORKDIR /workspace

# Stub-binary cache layer: APP_SKIP_WASM=1 skips the frontend+WASM builds so
# this layer depends only on Cargo.lock, not on package.json/bun.lock/appsettings.
COPY Cargo.toml Cargo.lock ./
COPY app/Cargo.toml ./app/
RUN mkdir -p app/src && printf 'fn main() {}' > app/src/main.rs
RUN APP_SKIP_WASM=1 cargo build --release || true

COPY app/src/                        ./app/src/
COPY app/ui/                         ./app/ui/
COPY app/appsettings.toml            ./app/
COPY app/appsettings.production.toml ./app/

RUN touch app/src/main.rs && cargo build --release

###############################################################################
# Stage 2 — Runtime (slim)
###############################################################################
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# /workspace/app must match the CARGO_MANIFEST_DIR baked into the binary:
# Settings::load() and all manifest-relative paths resolve against it.
WORKDIR /workspace/app

COPY --from=rust-builder /workspace/target/release/server /usr/local/bin/server

COPY app/appsettings.toml            ./
COPY app/appsettings.production.toml ./

# Staged outside the volume mount; entrypoint copies into traildepot on every
# start so fresh image migrations win over stale volume contents.
COPY app/traildepot/migrations/        /usr/local/share/traildepot-seed/migrations/

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 4000

ENV APP_ENV=production

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["server"]
