import { defineConfig } from "vite";
import { browserBuildTargets } from "../../build/browserTargets.ts";

export default defineConfig({
    base: "./",
    build: {
        target: [...browserBuildTargets],
        outDir: "dist",
        emptyOutDir: true
    }
});
