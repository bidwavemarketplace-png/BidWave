import { config } from "./config";
import { buildServer } from "./server";

async function main() {
  const app = buildServer();

  await app.listen({
    port: config.PORT,
    host: "0.0.0.0"
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
