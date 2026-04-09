"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const server_1 = require("./server");
async function main() {
    const app = (0, server_1.buildServer)();
    await app.listen({
        port: config_1.config.PORT,
        host: "0.0.0.0"
    });
}
main().catch((error) => {
    console.error(error);
    process.exit(1);
});
