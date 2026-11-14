import { MobileSettings } from '../types';
import { Storage } from '../storage';

export class MobileSyncService {
  static async syncWithGitHub(settings: MobileSettings): Promise<{
    success: boolean;
    message: string;
    newReadCount: number;
  }> {
    const token = (settings.githubToken || '').trim();
    const repo = (settings.githubRepo || '').trim();

    if (!token || !repo) {
      return { success: false, message: '请先配置 GitHub Token 与仓库名', newReadCount: 0 };
    }

    try {
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer ${token}`,
      };

      const apiUrl = `https://api.github.com/repos/${repo}/contents/data/state.json`;

      let fileSha: string | null = null;
      let remoteState = { version: 1, lastUpdated: '', readIds: [] as string[], starredIds: [] as string[] };

      const getResp = await fetch(apiUrl, { headers });
      if (getResp.status === 200) {
        const fileData = await getResp.json();
        fileSha = fileData.sha;
        // Decode base64 UTF-8
        const decoded = decodeURIComponent(escape(atob(fileData.content.replace(/\s/g, ''))));
        remoteState = JSON.parse(decoded);
      }

      const localReadSet = await Storage.getReadIds();
      const localStarredSet = await Storage.getStarredIds();

      const remoteReadSet = new Set(remoteState.readIds || []);
      const remoteStarredSet = new Set(remoteState.starredIds || []);

      const mergedRead = new Set([...localReadSet, ...remoteReadSet]);
      const mergedStarred = new Set([...localStarredSet, ...remoteStarredSet]);

      let newReadCount = 0;
      const newItems: string[] = [];
      for (const id of remoteReadSet) {
        if (!localReadSet.has(id)) {
          newItems.push(id);
          newReadCount++;
        }
      }
      if (newItems.length > 0) {
        await Storage.markMultipleRead(newItems);
      }

      for (const id of remoteStarredSet) {
        if (!localStarredSet.has(id)) {
          await Storage.toggleStar(id, true);
        }
      }

      const hasLocalNew =
        mergedRead.size > remoteReadSet.size ||
        mergedStarred.size > remoteStarredSet.size ||
        !fileSha;

      if (hasLocalNew) {
        let retries = 3;
        while (retries > 0) {
          const payload = {
            version: 1,
            lastUpdated: new Date().toISOString(),
            readIds: Array.from(mergedRead),
            starredIds: Array.from(mergedStarred),
          };

          const jsonString = JSON.stringify(payload, null, 2);
          const encoded = btoa(unescape(encodeURIComponent(jsonString)));

          const putResp = await fetch(apiUrl, {
            method: 'PUT',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: `chore: mobile sync reading state [skip ci] (${mergedRead.size} read)`,
              content: encoded,
              sha: fileSha || undefined,
            }),
          });

          if (putResp.ok) {
            break;
          }

          // Handle 409 Conflict: concurrent write on Web or another client
          if (putResp.status === 409 && retries > 1) {
            retries--;
            const reGet = await fetch(apiUrl, { headers });
            if (reGet.status === 200) {
              const fileData = await reGet.json();
              fileSha = fileData.sha;
              const decoded = decodeURIComponent(escape(atob(fileData.content.replace(/\s/g, ''))));
              const latestRemote = JSON.parse(decoded);
              (latestRemote.readIds || []).forEach((id: string) => mergedRead.add(id));
              (latestRemote.starredIds || []).forEach((id: string) => mergedStarred.add(id));
              continue;
            }
          }

          throw new Error(`Sync put failed: ${putResp.status}`);
        }
      }

      return { success: true, message: '同步完成', newReadCount };
    } catch (e: any) {
      return { success: false, message: e.message || '网络连接失败', newReadCount: 0 };
    }
  }
}
