import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // next 包未声明 exports 字段，Node ESM 需显式 .js 后缀；
      // 这里把 next/server 与 next-auth 等裸模块映射到带后缀的文件
      "next/server": "next/server.js",
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/lib/**/*.ts", "src/lib/**/*.tsx"],
    },
  },
});
