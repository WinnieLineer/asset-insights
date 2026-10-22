import { GitHubUser } from './types';

const REPO_NAME = 'asset-insights-backup';
const BACKUP_PATH = 'data/backup.json';

function cleanToken(token: string): string {
  if (!token) return '';
  return token.replace(/^Bearer\s+/i, '').replace(/^token\s+/i, '').trim();
}

function getAuthHeaders(token: string, contentType = false): Record<string, string> {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${cleanToken(token)}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (contentType) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

export class GitHubApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'GitHubApiError';
    this.status = status;
  }
}

function toBase64Utf8(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64Utf8(b64: string): string {
  // GitHub API may wrap base64 with newlines/whitespace
  const cleanB64 = b64.replace(/\s+/g, '');
  const binary = atob(cleanB64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

async function parseApiError(res: Response, defaultMsg: string): Promise<GitHubApiError> {
  let detail = '';
  try {
    const data = await res.json();
    detail = data.message || '';
  } catch (e) {
    // ignore
  }

  if (res.status === 401) {
    return new GitHubApiError(
      detail === 'Bad credentials'
        ? 'GitHub 授權無效或 Token 已過期 (Bad credentials)。請重新授權登入或貼上有效 Token。'
        : `GitHub 身份驗證失敗 (401 Unauthorized)${detail ? `: ${detail}` : ''}`,
      401
    );
  }
  if (res.status === 403) {
    return new GitHubApiError(`GitHub 存取被拒 (403 Forbidden)${detail ? `: ${detail}` : ''}。請確認 Token 具備 repo 讀寫權限。`, 403);
  }
  return new GitHubApiError(`${defaultMsg} (${res.status}${detail ? `: ${detail}` : ''})`, res.status);
}

export async function fetchGitHubUser(token: string): Promise<GitHubUser> {
  const res = await fetch('https://api.github.com/user', {
    headers: getAuthHeaders(token),
  });
  if (!res.ok) {
    throw await parseApiError(res, '無法取得 GitHub 使用者資訊');
  }
  return res.json();
}

export async function ensureRepoExists(token: string, owner: string) {
  // Check if repo exists
  const res = await fetch(`https://api.github.com/repos/${owner}/${REPO_NAME}`, {
    headers: getAuthHeaders(token),
  });

  if (res.status === 404) {
    // Create private repo
    const createRes = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: getAuthHeaders(token, true),
      body: JSON.stringify({
        name: REPO_NAME,
        private: true,
        description: 'Auto-backup for Asset Insights',
      }),
    });
    if (!createRes.ok) {
      throw await parseApiError(createRes, '無法建立備份儲存庫 (asset-insights-backup)');
    }
    return createRes.json();
  }

  if (!res.ok) {
    throw await parseApiError(res, '無法存取備份儲存庫');
  }

  return res.json();
}

export async function getFileSha(token: string, owner: string): Promise<string | null> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${REPO_NAME}/contents/${BACKUP_PATH}`, {
    headers: getAuthHeaders(token),
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw await parseApiError(res, '無法讀取備份檔案 SHA');
  }
  const data = await res.json();
  return data.sha;
}

export async function uploadToGitHub(token: string, owner: string, content: any) {
  const sha = await getFileSha(token, owner);
  const body: any = {
    message: `Sync assets backup at ${new Date().toISOString()}`,
    content: toBase64Utf8(JSON.stringify(content, null, 2)),
  };
  if (sha) body.sha = sha;

  const res = await fetch(`https://api.github.com/repos/${owner}/${REPO_NAME}/contents/${BACKUP_PATH}`, {
    method: 'PUT',
    headers: getAuthHeaders(token, true),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw await parseApiError(res, '無法上傳備份至 GitHub');
  }
  return res.json();
}

export async function downloadFromGitHub(token: string, owner: string) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${REPO_NAME}/contents/${BACKUP_PATH}`, {
    headers: getAuthHeaders(token),
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw await parseApiError(res, '無法自 GitHub 下載備份');
  }
  const data = await res.json();
  if (!data || !data.content) return null;
  try {
    const decoded = fromBase64Utf8(data.content);
    return JSON.parse(decoded);
  } catch (err: any) {
    throw new Error(`備份檔案解析失敗: ${err.message || '內容非有效 JSON 格式'}`);
  }
}
