FROM rust:latest as build

ENV APP=comment-worker APP_FILE=comment_worker

WORKDIR /source/${APP}

COPY Cargo.toml Cargo.toml

RUN mkdir src/ && echo "fn main() {println!(\"if you see this, the build broke\")}" > src/main.rs

RUN cargo build --release

RUN rm ./src/*.rs && rm ./target/release/deps/${APP_FILE}*

COPY ./src/ ./src/

RUN cargo build --release


FROM debian:bullseye-slim

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV APP=comment-worker

COPY --from=build /source/${APP}/target/release/${APP} .

ENTRYPOINT ["./comment-worker"]

# ENTRYPOINT ["tail", "-f", "/dev/null"]