/**
 * Validates the environment variables required for running Claude Code
 * based on the selected provider (Anthropic API, AWS Bedrock, or Google Vertex AI)
 */
export function validateEnvironmentVariables() {
  const useBedrock = process.env.CLAUDE_CODE_USE_BEDROCK === "1";
  const useVertex = process.env.CLAUDE_CODE_USE_VERTEX === "1";
  const useOAuth = process.env.CLAUDE_CODE_USE_OAUTH === "1";
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  const errors: string[] = [];

  if (useBedrock && useVertex && useOAuth) {
    errors.push(
      "Cannot use both Bedrock and Vertex AI simultaneously. Please set only one provider.",
    );
  }

  if (!useBedrock && !useVertex && !useOAuth) {
    if (!anthropicApiKey) {
      errors.push(
        "ANTHROPIC_API_KEY is required when using direct Anthropic API.",
      );
    }
  } else if (useBedrock) {
    const requiredBedrockVars = {
      AWS_REGION: process.env.AWS_REGION,
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    };

    Object.entries(requiredBedrockVars).forEach(([key, value]) => {
      if (!value) {
        errors.push(`${key} is required when using AWS Bedrock.`);
      }
    });
  } else if (useVertex) {
    const requiredVertexVars = {
      ANTHROPIC_VERTEX_PROJECT_ID: process.env.ANTHROPIC_VERTEX_PROJECT_ID,
      CLOUD_ML_REGION: process.env.CLOUD_ML_REGION,
    };

    Object.entries(requiredVertexVars).forEach(([key, value]) => {
      if (!value) {
        errors.push(`${key} is required when using Google Vertex AI.`);
      }
    });
  } else if (useOAuth) {
    const requiredOAuthVars = {
      CLAUDE_ACCESS_TOKEN: process.env.CLAUDE_ACCESS_TOKEN,
      CLAUDE_REFRESH_TOKEN: process.env.CLAUDE_REFRESH_TOKEN,
      CLAUDE_EXPIRES_AT: process.env.CLAUDE_EXPIRES_AT,
    };

    Object.entries(requiredOAuthVars).forEach(([key, value]) => {
      if (!value) {
        errors.push(`${key} is required when using OAuth authentication.`);
      }
    });
  }

  if (errors.length > 0) {
    const errorMessage = `Environment variable validation failed:\n${errors.map((e) => `  - ${e}`).join("\n")}`;
    throw new Error(errorMessage);
  }
}
