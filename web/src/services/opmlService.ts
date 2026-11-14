import { Category, Feed } from '../types';

export class OpmlService {
  static exportToOpml(categories: Category[], feeds: Feed[]): string {
    const catMap = new Map<string, string>();
    categories.forEach(c => catMap.set(c.id, c.name));

    // Group feeds by category
    const groups = new Map<string, Feed[]>();
    feeds.forEach(f => {
      const catId = f.category || 'default';
      const list = groups.get(catId) || [];
      list.push(f);
      groups.set(catId, list);
    });

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<opml version="2.0">\n`;
    xml += `  <head>\n`;
    xml += `    <title>GitFeed Subscriptions</title>\n`;
    xml += `    <dateCreated>${new Date().toUTCString()}</dateCreated>\n`;
    xml += `  </head>\n`;
    xml += `  <body>\n`;

    for (const [catId, catFeeds] of groups.entries()) {
      const catTitle = catMap.get(catId) || catId;
      xml += `    <outline text="${escapeXml(catTitle)}" title="${escapeXml(catTitle)}">\n`;
      for (const feed of catFeeds) {
        xml += `      <outline type="rss" text="${escapeXml(feed.title)}" title="${escapeXml(feed.title)}" xmlUrl="${escapeXml(feed.url)}" htmlUrl="${escapeXml(feed.siteUrl || '')}" />\n`;
      }
      xml += `    </outline>\n`;
    }

    xml += `  </body>\n`;
    xml += `</opml>`;
    return xml;
  }

  static downloadOpmlFile(categories: Category[], feeds: Feed[]) {
    const xml = this.exportToOpml(categories, feeds);
    const blob = new Blob([xml], { type: 'text/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gitfeed-subscriptions-${new Date().toISOString().slice(0, 10)}.opml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

function escapeXml(unsafe: string): string {
  return (unsafe || '').replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
