import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { homedir } from "os";

interface ClaudeCredentials {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

interface UpdateTokenResponse {
  access_token: string;     // sk-ant-oat01-****
  refresh_token: string;    // sk-ant-ort01-****
  expires_in: number;       // 28800
  scopes?: string;          // user:inference user:profile
}

/**
 * OAuth 認証情報を .credentials.json に書き込む
 * 
 * @param credentials 認証情報
 */
export async function setupOAuthCredentials(credentials: ClaudeCredentials) {
  const claudeDir = join(homedir(), ".claude");
  const credentialsPath = join(claudeDir, ".credentials.json");

  await mkdir(claudeDir, { recursive: true });

  let accessToken = credentials.accessToken;
  let refreshToken = credentials.refreshToken;
  let expiresAt = parseInt(credentials.expiresAt);

  if(tokenExpired(expiresAt)) {
    const newToken = await updateToken(refreshToken);

    if(newToken) {
      accessToken = newToken.accessToken;
      refreshToken = newToken.refreshToken;
      expiresAt = newToken.expiresAt;
    }
  }

  const credentialsData = {
    claudeAiOauth: {
      accessToken: accessToken,
      refreshToken: refreshToken,
      expiresAt: expiresAt,
      scopes: ["user:inference", "user:profile"],
    }
  };

  await writeFile(credentialsPath, JSON.stringify(credentialsData, null, 2));

  console.info("OAuth 認証のトークンを更新しました");
}

/**
 * OAuth 認証を行い、トークンを更新する
 * 
 * @param refreshToken リフレッシュトークン
 * @returns
 */
async function updateToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string; expiresAt: number } | null> {
  try {
    const response = await fetch("https://console.anthropic.com/v1/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: "9d1c250a-e61b-44d9-88ed-5944d1962f5e",
      })
    });

    if(response.ok) {
      const data = await response.json() as UpdateTokenResponse;

      return {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresAt: new Date().getTime() + data.expires_in
      }
    } else {
      const body = await response.text();
      console.error(`トークンの更新に失敗しました: ${body}`);
      return null;
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * トークンの有効期限をチェックする(Unix Time)
 * 
 * @param expiresAt 有効期限
 * @returns
 */
function tokenExpired(expiresAt: number): boolean {
  return expiresAt < new Date().getTime();
}