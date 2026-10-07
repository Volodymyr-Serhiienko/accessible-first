import { defineConfig } from "vite";
import { browserBuildTargets } from "../../build/browserTargets.ts";

export default defineConfig({ build: { target: [...browserBuildTargets] } });
