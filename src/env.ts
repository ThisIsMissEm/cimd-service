import { Env, EnvProcessor, errors } from "@adonisjs/env";
import dedent from "dedent";

// @ts-ignore
process.env.NODE_ENV = process.env.NODE_ENV ?? "development";

const validator = Env.rules({
  NODE_ENV: Env.schema.enum(["development", "production", "test"] as const),
  LOG_LEVEL: Env.schema.enum.optional([
    "fatal",
    "error",
    "warn",
    "info",
    "debug",
    "trace",
  ] as const),

  PORT: Env.schema.number.optional(),
  HOST: Env.schema.string.optional({ format: "host" }),

  PUBLIC_URL: Env.schema.string.optional({
    format: "url",
    protocol: true,
    tld: false,
  }),

  DB_PATH: Env.schema.string(),

  CLIENT_TOUCH_INTERVAL: Env.schema.number.optional(),
  CLIENT_EXPIRY_MS: Env.schema.number.optional(),
});

// This file contains a bit of a messy hack for @adonisjs/env to load & layer
// the dotenv files, validate the contents, and on error print nice error
// messages, but also still have the typescript types correct.

const processor = new EnvProcessor(new URL("../../", import.meta.url));
const environment = await processor.process();

let validEnv: ReturnType<typeof validator.validate>;
try {
  validEnv = validator.validate(environment);
} catch (err) {
  validEnv = {} as ReturnType<typeof validator.validate>;

  if (err instanceof errors.E_INVALID_ENV_VARIABLES) {
    console.log("");
    console.log(dedent`
      Environment validation failed:

      ${err.help}

      Make sure you have the correct environment variables present,
      or defined in a file named .env, .env.local, or .env.*.local\n
    `);
    process.exit(1);
  } else {
    throw err;
  }
}

const env = new Env(validEnv);

export type Environment = typeof env;

export default env;
