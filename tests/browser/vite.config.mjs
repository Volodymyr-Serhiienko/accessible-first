import { fileURLToPath } from "node:url";

export default {
    root: fileURLToPath(new URL(".", import.meta.url)),
    server: {
        host: "::1",
        port: 3260,
        strictPort: true,
        fs: { allow: [fileURLToPath(new URL("../..", import.meta.url))] }
    }
};
