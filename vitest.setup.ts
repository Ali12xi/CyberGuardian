import { vi } from "vitest";

// Neutralize Next.js server-only barrier for tests
// Applies to: lib/claude.ts, lib/env.ts, lib/scanner.ts, lib/reputation.ts
vi.mock("server-only", () => ({}));
