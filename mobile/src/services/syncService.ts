import { MobileSettings } from '../types';
import { Storage } from '../storage';

const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

export function base64EncodeUtf8(str: string): string {
  const utf8Bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let charcode = str.charCodeAt(i);
    if (charcode < 0x80) {
      utf8Bytes.push(charcode);
    } else if (charcode < 0x800) {
      utf8Bytes.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
    } else if (charcode < 0xd800 || charcode >= 0xe000) {
      utf8Bytes.push(
        0xe0 | (charcode >> 12),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f)
      );
    } else {
      i++;
      charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      utf8Bytes.push(
        0xf0 | (charcode >> 18),
        0x80 | ((charcode >> 12) & 0x3f),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f)
      );
    }
  }

  let output = '';
  let i = 0;
  while (i < utf8Bytes.length) {
    const b1 = utf8Bytes[i++];
    const b2 = i < utf8Bytes.length ? utf8Bytes[i++] : NaN;
    const b3 = i < utf8Bytes.length ? utf8Bytes[i++] : NaN;

    const enc1 = b1 >> 2;
    const enc2 = ((b1 & 3) << 4) | (isNaN(b2) ? 0 : b2 >> 4);
    let enc3 = isNaN(b2) ? 64 : ((b2 & 15) << 2) | (isNaN(b3) ? 0 : b3 >> 6);
    let enc4 = isNaN(b3) ? 64 : b3 & 63;

    output += B64_CHARS.charAt(enc1) + B64_CHARS.charAt(enc2) + B64_CHARS.charAt(enc3) + B64_CHARS.charAt(enc4);
  }
  return output;
}

export function base64DecodeUtf8(str: string): string {
  const clean = str.replace(/[^A-Za-z0-9+/=]/g, '');
  const bytes: number[] = [];
  let i = 0;
  while (i < clean.length) {
    const enc1 = B64_CHARS.indexOf(clean.charAt(i++));
    const enc2 = B64_CHARS.indexOf(clean.charAt(i++));
    const enc3 = B64_CHARS.indexOf(clean.charAt(i++));
    const enc4 = B64_CHARS.indexOf(clean.charAt(i++));

    const b1 = (enc1 << 2) | (enc2 >> 4);
    bytes.push(b1);
    if (enc3 !== 64 && enc3 !== -1) bytes.push(((enc2 & 15) << 4) | (enc3 >> 2));
    if (enc4 !== 64 && enc4 !== -1) bytes.push(((enc3 & 3) << 6) | enc4);
  }

  let result = '';
  let idx = 0;
  while (idx < bytes.length) {
    const c = bytes[idx++];
    if (c < 128) {
      result += String.fromCharCode(c);
    } else if (c > 191 && c < 224) {
      const c2 = bytes[idx++];
      result += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
    } else if (c > 223 && c < 240) {
      const c2 = bytes[idx++];
      const c3 = bytes[idx++];
      result += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
    } else {
      const c2 = bytes[idx++];
      const c3 = bytes[idx++];
      const c4 = bytes[idx++];
      let cp = (((c & 7) << 18) | ((c2 & 63) << 12) | ((c3 & 63) << 6) | (c4 & 63)) - 0x10000;
      result += String.fromCharCode((cp >> 10) + 0xd800, (cp & 0x3ff) + 0xdc00);
    }
  }
  return result;
}

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
        const decoded = base64DecodeUtf8(fileData.content || '');
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
          const encoded = base64EncodeUtf8(jsonString);

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
              const decoded = base64DecodeUtf8(fileData.content || '');
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
