#!/usr/bin/env bun

import * as core from "@actions/core";
import { preparePrompt } from "./prepare-prompt";
import { runClaude } from "./run-claude";
import { setupClaudeCodeSettings } from "./setup-claude-code-settings";
import { validateEnvironmentVariables } from "./validate-env";
import { setupOAuthCredentials } from "./setup-oauth";

async function run() {
  try {
    validateEnvironmentVariables();

    // OAuth 認証が有効な場合に認証情報のセットアップを行う
    if (process.env.CLAUDE_CODE_USE_OAUTH === "1") {
      await setupOAuthCredentials({
        claude: {
          accessToken: process.env.CLAUDE_ACCESS_TOKEN!,
          refreshToken: process.env.CLAUDE_REFRESH_TOKEN!,
          expiresAt: process.env.CLAUDE_EXPIRES_AT!,
        },
        github: {
          parsonalAccessToken: process.env.PAT_WITH_SECRETS_WRITE!
        }
      });
    }

    await setupClaudeCodeSettings();

    const promptConfig = await preparePrompt({
      prompt: process.env.INPUT_PROMPT || "",
      promptFile: process.env.INPUT_PROMPT_FILE || "",
    });

    await runClaude(promptConfig.path, {
      allowedTools: process.env.INPUT_ALLOWED_TOOLS,
      disallowedTools: process.env.INPUT_DISALLOWED_TOOLS,
      maxTurns: process.env.INPUT_MAX_TURNS,
      mcpConfig: process.env.INPUT_MCP_CONFIG,
      systemPrompt: process.env.INPUT_SYSTEM_PROMPT,
      appendSystemPrompt: process.env.INPUT_APPEND_SYSTEM_PROMPT,
      claudeEnv: process.env.INPUT_CLAUDE_ENV,
      fallbackModel: process.env.INPUT_FALLBACK_MODEL,
    });
  } catch (error) {
    core.setFailed(`Action failed with error: ${error}`);
    core.setOutput("conclusion", "failure");
    process.exit(1);
  }
}

if (import.meta.main) {
  run();
}
