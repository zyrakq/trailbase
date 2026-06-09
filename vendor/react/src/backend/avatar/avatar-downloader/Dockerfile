FROM rust:latest as build

ENV APP=avatar-downloader APP_FILE=avatar_downloader

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

ENV APP=avatar-downloader

COPY --from=build /source/${APP}/target/release/${APP} .

ENTRYPOINT ["./avatar-downloader"]

# ENTRYPOINT ["tail", "-f", "/dev/null"]