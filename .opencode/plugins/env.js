import { resolve } from "node:path";

const NATIVE_TARGET = "X86_64_UNKNOWN_LINUX_GNU";

export const InjectEnvPlugin = async ({ directory }) => {
  const vendorRoot = resolve(directory, "vendor");
  // Remembers callIDs whose command was an rtk invocation.
  const rtkCalls = new Set();

  return {
    // Sees the command before it runs. If it's rtk, remember its callID.
    "tool.execute.before": async (input, output) => {
      const serialized = JSON.stringify({
        tool: input.tool,
        args: output.args,
      });
      if (serialized.includes("rtk") && input.callID) {
        rtkCalls.add(input.callID);
      }
    },

    // Sets env. Only acts when the matching callID was an rtk command.
    "shell.env": async (input, output) => {
      output.env[`CARGO_BUILD_JOBS`] = "4";
      output.env[`RUSTC_WRAPPER`] = "sccache";

      if (!input.callID || !rtkCalls.has(input.callID)) return;

      // vendor/ hosts separate workspaces (trailbase, mailcrab, react); skip them.
      const cwd = resolve(input.cwd);
      if (cwd === vendorRoot || cwd.startsWith(vendorRoot + "/")) return;

      // Per-target env var mirrors [target.x86_64-unknown-linux-gnu].rustflags from
      // .cargo/config.toml: applies only to the native target (skips wasm) and keeps
      // cargo's fingerprint stable so rtk runs don't trigger full rebuilds.
      // output.env[`CARGO_TARGET_${NATIVE_TARGET}_RUSTFLAGS`] =
      //   "-C link-arg=-fuse-ld=mold -C link-arg=-Wl,--icf=all";
    },

    // Cleanup so the Set doesn't grow unbounded.
    "tool.execute.after": async (input) => {
      if (input.callID) rtkCalls.delete(input.callID);
    },
  };
};
