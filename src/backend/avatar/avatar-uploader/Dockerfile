FROM rust:latest as build

ENV APP=avatar-uploader APP_FILE=avatar_uploader

WORKDIR /source/${APP}

COPY Cargo.toml Cargo.toml

RUN mkdir src/ && echo "fn main() {println!(\"if you see this, the build broke\")}" > src/main.rs

RUN cargo build --release

RUN rm ./src/*.rs && rm ./target/release/deps/${APP_FILE}*

COPY ./src/ ./src/

RUN cargo build --release


FROM debian:bullseye-slim

RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV APP=avatar-uploader

COPY --from=build /source/${APP}/target/release/${APP} .

COPY cert-manager.crt /usr/local/share/ca-certificates/cert-manager.crt

RUN update-ca-certificates

ENTRYPOINT ["./avatar-uploader"]

# ENTRYPOINT ["tail", "-f", "/dev/null"]