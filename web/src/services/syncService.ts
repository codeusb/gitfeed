import { UserSettings } from '../types';
import { getLocalReadIds, getLocalStarredIds, markMultipleArticlesRead, toggleArticleStarred } from '../db';

export interface RemoteState {
  version: number;
  lastUpdated: string;
  readIds: string[];
  starredIds: string[];
}

export class SyncService {
  static async syncWithGitHub(settings: UserSettings): Promise<{
    success: boolean;
    message: string;
    newReadCount: number;
  }> {
    const token = (settings.githubToken || '').trim();
    const repo = (settings.githubRepo || '').trim();

    if (!token || !repo) {
      return {
        success: false,
        message: 'GitHub Token or Repository not configured',
        newReadCount: 0,
      };
    }

    try {
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer ${token}`,
      };

      const apiUrl = `https://api.github.com/repos/${repo}/contents/data/state.json`;

      // 1. Get current remote state
      let fileSha: string | null = null;
      let remoteState: RemoteState = {
        version: 1,
        lastUpdated: new Date().toISOString(),
        readIds: [],
        starredIds: [],
      };

      const getResp = await fetch(apiUrl, { headers });
      if (getResp.status === 200) {
        const fileData = await getResp.json();
        fileSha = fileData.sha;
        const decodedContent = decodeURIComponent(escape(atob(fileData.content.replace(/\s/g, ''))));
        remoteState = JSON.parse(decodedContent);
      } else if (getResp.status === 404) {
        // File doesn't exist yet on remote, we will create it
        fileSha = null;
      } else {
        const errJson = await getResp.json().catch(() => ({}));
        throw new Error(errJson.message || `GitHub API error: ${getResp.status}`);
      }

      // 2. Fetch local states
      const localReadSet = await getLocalReadIds();
      const localStarredSet = await getLocalStarredIds();

      // 3. Union read IDs
      const remoteReadSet = new Set(remoteState.readIds || []);
      const mergedReadSet = new Set([...localReadSet, ...remoteReadSet]);

      // 4. Union starred IDs
      const remoteStarredSet = new Set(remoteState.starredIds || []);
      const mergedStarredSet = new Set([...localStarredSet, ...remoteStarredSet]);

      // Count new read items discovered from remote
      let newReadCount = 0;
      const idsToMarkLocal: string[] = [];
      for (const id of remoteReadSet) {
        if (!localReadSet.has(id)) {
          idsToMarkLocal.push(id);
          newReadCount++;
        }
      }
      if (idsToMarkLocal.length > 0) {
        await markMultipleArticlesRead(idsToMarkLocal);
      }

      for (const id of remoteStarredSet) {
        if (!localStarredSet.has(id)) {
          await toggleArticleStarred(id, true);
        }
      }

      // 5. If local has additions that remote lacked, push back to GitHub
      const hasNewLocalData =
        mergedReadSet.size > remoteReadSet.size ||
        mergedStarredSet.size > remoteStarredSet.size ||
        fileSha === null;

      if (hasNewLocalData) {
        let retries = 3;
        while (retries > 0) {
          const updatedPayload: RemoteState = {
            version: 1,
            lastUpdated: new Date().toISOString(),
            readIds: Array.from(mergedReadSet),
            starredIds: Array.from(mergedStarredSet),
          };

          const jsonString = JSON.stringify(updatedPayload, null, 2);
          const encodedContent = btoa(unescape(encodeURIComponent(jsonString)));

          const putBody: any = {
            message: `chore: sync reading state [skip ci] (${mergedReadSet.size} read)`,
            content: encodedContent,
          };
          if (fileSha) {
            putBody.sha = fileSha;
          }

          const putResp = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
              ...headers,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(putBody),
          });

          if (putResp.ok) {
            break;
          }

          // Handle 409 Conflict: another device pushed in the meantime
          if (putResp.status === 409 && retries > 1) {
            retries--;
            const reGet = await fetch(apiUrl, { headers });
            if (reGet.status === 200) {
              const fileData = await reGet.json();
              fileSha = fileData.sha;
              const decodedContent = decodeURIComponent(escape(atob(fileData.content.replace(/\s/g, ''))));
              const latestRemote = JSON.parse(decodedContent);
              (latestRemote.readIds || []).forEach((id: string) => mergedReadSet.add(id));
              (latestRemote.starredIds || []).forEach((id: string) => mergedStarredSet.add(id));
              continue;
            }
          }

          const putErr = await putResp.json().catch(() => ({}));
          throw new Error(putErr.message || `Failed to update remote state: ${putResp.status}`);
        }
      }

      return {
        success: true,
        message: 'Sync completed successfully',
        newReadCount,
      };
    } catch (e: any) {
      console.error('GitHub Sync failed:', e);
      return {
        success: false,
        message: e.message || 'Unknown sync error',
        newReadCount: 0,
      };
    }
  }
}
