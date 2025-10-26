import { execa, ExecaError, type Options } from "execa";
import process from "node:process";
import path from "node:path";
import env from "../env.js";

const migrationsDir = path.join(process.cwd(), "migrations");

const baseExeca = execa({
  preferLocal: true,
  timeout: 5000,
});

function dbmate(...args: string[]): ReturnType<typeof execa> {
  const options = typeof args[0] === "object" ? (args[0] as Options) : {};
  const rest = typeof args[0] === "object" ? args.slice(1) : args;
  const exec = baseExeca({
    ...options,
  });

  const environment = env.get("NODE_ENV", "development");

  const execArgs = [
    `--migrations-dir=${migrationsDir}`,
    environment !== "development" && "--no-dump-schema",
    ...rest,
  ].filter<string>((s) => typeof s === "string");

  // @ts-expect-error TS2375
  return exec("dbmate", execArgs);
}

export type MigrationOptions = {
  url: string;
};

class DatabaseMigrationError extends Error {}

export async function migrate({ url }: MigrationOptions) {
  try {
    let printStep = true;
    for await (const line of dbmate(`--url=${url}`, "up", "--strict")) {
      if (printStep) {
        console.log("\nRunning migrations...");
        printStep = false;
      }
      console.log(`  ${line}`);
    }
    console.log("");
  } catch (err) {
    if (err instanceof ExecaError) {
      throw new DatabaseMigrationError(err.message);
    }
    throw err;
  }
}

export async function newMigration(argv: string[]) {
  let name = argv[0];
  if (!name) {
    const prompts = await import("prompts");
    const inputs = await prompts.default(
      {
        type: "text",
        name: "name",
        message: "Name for your migration",
      },
      {
        onCancel() {
          console.log("Aborted!");
          process.exit(0);
        },
      }
    );

    if (!inputs.name) {
      console.log(`Please enter a name`);
      process.exit(1);
      return;
    }

    name = inputs.name as string;
  }

  const result = await dbmate(`new`, name);
  const message = result.failed ? `Failed!` : `Done!`;
  console.log(`${message} (took: ${result.durationMs}ms)`);
  process.exit(result.exitCode ?? 0);
}

if (import.meta.main) {
  newMigration(process.argv.slice(2))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => {
      process.exit(0);
    });
}
