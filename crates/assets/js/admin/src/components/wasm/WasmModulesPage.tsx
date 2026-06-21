import { createMemo } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { TbOutlineRefresh, TbOutlinePuzzle } from "solid-icons/tb";
import type { ColumnDef } from "@tanstack/solid-table";

import { Header } from "@/components/Header";
import { Table, buildTable } from "@/components/Table";
import { IconButton } from "@/components/IconButton";

import { fetchWasmModules } from "@/lib/api/wasm-modules";

import type { WasmModuleEntry } from "@bindings/WasmModuleEntry";

function IconCell(props: { icon?: string }) {
  const src = (): string | undefined => {
    const icon = props.icon;
    if (icon === undefined) {
      return undefined;
    }
    if (icon.trimStart().startsWith("<svg")) {
      return `data:image/svg+xml;utf8,${encodeURIComponent(icon)}`;
    }
    if (icon.startsWith("data:")) {
      return icon;
    }
    return undefined;
  };

  return (
    <div class="flex items-center justify-center px-2">
      {src() === undefined ? (
        <TbOutlinePuzzle size={20} />
      ) : (
        <img src={src()} alt="" class="size-5" />
      )}
    </div>
  );
}

function buildColumns(): ColumnDef<WasmModuleEntry>[] {
  return [
    {
      id: "icon",
      header: "",
      enableSorting: false,
      size: 56,
      cell: (ctx) => <IconCell icon={ctx.row.original.icon ?? undefined} />,
    },
    {
      accessorKey: "display_name",
      header: "name",
      size: 240,
    },
    {
      id: "config",
      header: "config",
      enableSorting: false,
      cell: (ctx) => {
        const row = ctx.row.original;
        if (!row.has_config || row.config_path === null) {
          return <span class="text-muted-foreground">—</span>;
        }
        return (
          <a
            class="text-accent-600 underline"
            href={row.config_path}
          >
            {row.config_path}
          </a>
        );
      },
    },
    {
      accessorKey: "name",
      header: "file",
      size: 200,
    },
  ];
}

export function WasmModulesPage() {
  const wasmModules = useQuery(() => ({
    queryKey: ["wasm-modules"],
    queryFn: fetchWasmModules,
  }));

  const refetch = () => wasmModules.refetch();

  const table = createMemo(() => {
    return buildTable({
      columns: buildColumns(),
      data: wasmModules.data?.modules ?? [],
      rowCount: wasmModules.data?.modules.length ?? 0,
    });
  });

  return (
    <div class="h-full">
      <Header
        title="WASM Modules"
        left={
          <IconButton onClick={() => refetch()}>
            <TbOutlineRefresh />
          </IconButton>
        }
      />

      <div class="flex flex-col gap-4 p-4">
        <Table table={table()} loading={wasmModules.isLoading} />
      </div>
    </div>
  );
}
