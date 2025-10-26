import dedent from "dedent";
import { Server } from "../server.js";

const main = async () => {
  const server = Server.create();

  await server.start();

  console.log("cimd-service is running");
  console.log(dedent`
    cimd-service is listening on: ${server.serverUrl}
    cimd-service is available at: ${server.publicUrl}
  `);

  process.on("SIGTERM", async () => {
    console.log("cimd-service is stopping");
    await server.stop();
    console.log("cimd-service is stopped");
  });
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
