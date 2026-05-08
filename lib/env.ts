import "server-only";

type ServerEnvKey = "ANTHROPIC_API_KEY" | "VIRUSTOTAL_API_KEY";

export function getOptionalServerEnv(key: ServerEnvKey) {
  const value = process.env[key]?.trim();

  if (!value || value === "your_key_here") {
    return null;
  }

  return value;
}

export function getProductionEnvReadiness() {
  return {
    anthropicConfigured: Boolean(getOptionalServerEnv("ANTHROPIC_API_KEY")),
    virusTotalConfigured: Boolean(getOptionalServerEnv("VIRUSTOTAL_API_KEY")),
  };
}
