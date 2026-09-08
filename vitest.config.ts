import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "jsdom",
        environmentOptions: {
            jsdom: {
                url: "http://localhost/",
                pretendToBeVisual: true
            }
        },
        include: ["tests/**/*.test.ts"],
        setupFiles: ["./tests/setup.ts"],
        clearMocks: true,
        restoreMocks: true
    }
});
