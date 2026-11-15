import { Linking, Alert } from 'react-native';

export interface ReleaseInfo {
  version: string;
  releaseNotes: string;
  apkDownloadUrl: string | null;
  publishedAt: string;
  hasUpdate: boolean;
}

const packageJson = require('../../package.json');
export const CURRENT_VERSION = 'v' + (packageJson.version || '1.0.12');

export class UpdateService {
  static async checkForUpdates(repo: string = 'codeusb/gitfeed', silent: boolean = false): Promise<ReleaseInfo | null> {
    try {
      const cleanRepo = repo.trim().replace(/^https?:\/\/github\.com\//, '');
      const resp = await fetch(`https://api.github.com/repos/${cleanRepo}/releases/latest`, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'GitFeed-Mobile-App',
        },
      });

      if (!resp.ok) {
        if (!silent) {
          Alert.alert('检查更新', '未找到线上发布版本或网络超时');
        }
        return null;
      }

      const release = await resp.json();
      const latestTag = release.tag_name || '';

      // Find .apk asset
      let apkUrl: string | null = null;
      if (Array.isArray(release.assets)) {
        const apkAsset = release.assets.find((a: any) =>
          a.name && a.name.toLowerCase().endsWith('.apk')
        );
        if (apkAsset) {
          apkUrl = apkAsset.browser_download_url;
        }
      }

      const hasUpdate = latestTag !== CURRENT_VERSION && latestTag !== '';

      const info: ReleaseInfo = {
        version: latestTag,
        releaseNotes: release.body || '',
        apkDownloadUrl: apkUrl,
        publishedAt: release.published_at || '',
        hasUpdate,
      };

      if (!silent) {
        if (hasUpdate) {
          Alert.alert(
            `发现新版本 ${latestTag}`,
            `${release.body || '有新的功能优化与体验更新'}\n\n是否立即下载更新包？`,
            [
              { text: '稍后', style: 'cancel' },
              {
                text: '立即下载 APK',
                onPress: () => {
                  if (apkUrl) {
                    // Prepend mirror if desired or open direct
                    Linking.openURL(apkUrl);
                  } else {
                    Linking.openURL(release.html_url);
                  }
                },
              },
            ]
          );
        } else {
          Alert.alert('检查更新', `当前已是最新版本 (${CURRENT_VERSION})`);
        }
      }

      return info;
    } catch (e: any) {
      if (!silent) {
        Alert.alert('检查更新失败', e.message || '网络连接超时');
      }
      return null;
    }
  }
}
