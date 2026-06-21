set dotenv-load

export APP_SKIP_WASM := "1"

run:
    cargo run

[no-exit-message]
kill:
    pkill -f "cargo test" 2>/dev/null;
    pkill -f "cargo check" 2>/dev/null;
    pkill -f "cargo run" 2>/dev/null;
    pkill -f "just run" 2>/dev/null;
    pkill -f "bun run build --watch" 2>/dev/null;
    sleep 2;
    echo "done"
