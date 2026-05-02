import { GitHubUser } from './types';

const REPO_NAME = 'asset-insights-backup';
const BACKUP_PATH = 'data/backup.json';

export async function fetchGitHubUser(token: string): Promise<GitHubUser> {
  const res = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch GitHub user');
  return res.json();
}

export async function ensureRepoExists(token: string, owner: string) {
  // Check if repo exists
  const res = await fetch(`https://api.github.com/repos/${owner}/${REPO_NAME}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 404) {
    // Create private repo
    const createRes = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: { 
        Authorization: `token ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: REPO_NAME,
        private: true,
        description: 'Auto-backup for Asset Insights',
      }),
    });
    if (!createRes.ok) throw new Error('Failed to create backup repository');
    return createRes.json();
  }
  
  return res.json();
}

export async function getFileSha(token: string, owner: string): Promise<string | null> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${REPO_NAME}/contents/${BACKUP_PATH}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 404) return null;
  const data = await res.json();
  return data.sha;
}

export async function uploadToGitHub(token: string, owner: string, content: any) {
  const sha = await getFileSha(token, owner);
  const body: any = {
    message: `Sync assets backup at ${new Date().toISOString()}`,
    content: btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2)))),
  };
  if (sha) body.sha = sha;

  const res = await fetch(`https://api.github.com/repos/${owner}/${REPO_NAME}/contents/${BACKUP_PATH}`, {
    method: 'PUT',
    headers: { 
      Authorization: `token ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to upload to GitHub');
  }
  return res.json();
}

export async function downloadFromGitHub(token: string, owner: string) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${REPO_NAME}/contents/${BACKUP_PATH}`, {
    headers: { Authorization: `token ${token}` },
  });
  if (res.status === 404) return null;
  const data = await res.json();
  const decoded = decodeURIComponent(escape(atob(data.content)));
  return JSON.parse(decoded);
}
