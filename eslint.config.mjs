import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored assets (Tesseract worker, pdfjs worker, copiados via postinstall):
    "public/tesseract/**",
    "public/pdf.worker.min.mjs",
    // Reportes de coverage generados por vitest:
    "coverage/**",
  ]),
]);

export default eslintConfig;
