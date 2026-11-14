<div align="center">

# ⚡ GitFeed

**以单个 Git 仓库作为完整后端与数据库的开源无服务器 RSS 阅读系统**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-Automated-orange.svg)](.github/workflows/update-feeds.yml)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-success.svg)](web/)
[![Zero Server Cost](https://img.shields.io/badge/Server%20Cost-%240%2Fmonth-brightgreen.svg)](#)

[English](#-overview-en) | **简体中文**

</div>

---

## 🌟 为什么选择 GitFeed？

传统自建 RSS 服务（如 FreshRSS、Miniflux、Tiny Tiny RSS）通常需要自费购买云服务器、配置 Docker 容器、维护 PostgreSQL 数据库，不仅有持续的服务器成本，而且服务器一旦部署在国内就抓不到海外 RSS，部署在海外国内手机又连不上。

**GitFeed 采用全套优雅的 “Git-as-Backend” 无服务器架构：**

* 🚀 **0 元全套成本**：无需购买任何云服务器、无需额外付费数据库，单个 GitHub 仓库承载全套抓取、数据存储与前端部署。
* 🌐 **海外源云端极速抓取**：由 GitHub Actions 海外 Runner（微软 Azure 优质机房）定时抓取 Substack、Changelog、Medium、GitHub Blog 等，彻底解决国内网络超时甚至被阻断的痛点。
* 📱 **全平台原生级 PWA 客户端**：一次部署，PC（Mac/Windows）与移动端（iOS/Android）直接在浏览器中点击“添加到主屏幕”，秒变独立全屏原生 App。
* ⚡ **国内秒开加速**：前端和文章 JSON 数据通过 **Cloudflare Pages / GitHub Pages** 全球 CDN 分发，国内直连毫秒级响应。
* 🔄 **多端已读同步 (Git-as-Backend)**：客户端本地优先（IndexedDB），配合 GitHub Contents REST API 自动合并增量已读与星标状态，多端无缝协同且永不丢数据。
* 🛠️ **极简维护**：作为使用者，**你只需要维护一个 `feeds.json` 订阅列表**，剩下的所有事情全部由云端自动化完成！

---

## 🏗️ 整体架构流程

```mermaid
flowchart TD
    subgraph GitHub 云端自动化 (定时触发)
        Cron["GitHub Actions 定时触发\n(每天 09:00, 18:00 / 自定义)"] --> Fetcher["Python 抓取排重引擎\n(清洗 HTML / 提取封面 / 估算阅读时长)"]
        FeedsConfig["feeds.json\n(你的订阅源配置)"] --> Fetcher
        Fetcher --> GitCommit["自动 Commit 数据至 main 分支\n(data/index.json, data/articles/*.json)"]
    end

    subgraph 免费分发网络 (国内极速)
        GitCommit --> CDN["Cloudflare Pages / GitHub Pages\n(全球边缘 CDN 零成本托管)"]
    end

    subgraph 终端体验 (PC + 手机)
        CDN --> WebPWA["自研 Web & PWA 阅读器\n(现代化界面 / 离线缓存 IndexedDB)"]
        WebPWA -- "阅读记录本地持久化" --> LocalDB["本地 IndexedDB"]
        WebPWA -- "跨设备同步已读/星标" --> RemoteSync["GitHub Contents API\n(自动更新 data/state.json)"]
    end
```

---

## 🚀 3 分钟快速上手指南

作为普通用户，只需三步即可拥有属于你自己的专属私有 RSS 阅读平台：

### 第一步：Fork 本仓库
1. 点击本页面右上角的 **`Fork`** 按钮，将项目复制到你自己的 GitHub 账号下。

### 第二步：开启 GitHub Actions 读写权限
因为 GitHub Actions 需要把定时拉取的文章提交回你的仓库，请开启写入权限：
1. 进入你 Fork 后的仓库，点击 **Settings** -> **Actions** -> **General**。
2. 滚动到底部 **Workflow permissions**，选择 **Read and write permissions**。
3. 点击 **Save** 保存。

### 第三步：开启 GitHub Pages 免费部署
1. 点击仓库的 **Settings** -> **Pages**。
2. 在 **Build and deployment** 下方的 **Source** 选择 **`GitHub Actions`**。
3. 进入 **Actions** 标签页，在左侧选择 **`Update Feeds & Deploy`**，点击右侧 **`Run workflow`** 手动触发第一次拉取与构建。
4. 等待 1~2 分钟执行完毕，刷新 Pages 页面即可看到你专属的阅读器网址（例如 `https://yourusername.github.io/gitfeed/`）！

---

## 📲 在手机和电脑上安装使用 (PWA)

GitFeed 是标准的高性能渐进式 Web 应用（PWA），无需去应用商店下载繁琐的客户端：

### 📱 移动端 (iPhone / Android)
* **iOS (Safari)**：用 Safari 打开你的 GitFeed 网址，点击底部中间的 **“分享”** 按钮 -> 滚动选择 **“添加到主屏幕”**。桌面上会出现专属 GitFeed 图标，全屏沉浸、无地址栏、支持离线阅读。
* **Android (Chrome / 微信内置/ Edge)**：在浏览器中打开网址，点击右上角菜单 -> 选择 **“安装应用”** 或 **“添加到主屏幕”** 即可。

### 💻 桌面端 (Mac / Windows / Linux)
* 在 Chrome / Edge 浏览器中访问 GitFeed，在地址栏右侧会显示一个 **“安装 GitFeed”** 图标，点击即可生成独立窗口桌面程序，支持与原生软件完全相同的键盘快捷键体验。

---

## 📝 如何维护你的订阅源

你只需要维护仓库根目录的 `feeds.json` 文件即可：

### 1. 直接在 GitHub 网页编辑 `feeds.json`
可以在 GitHub 页面上直接编辑 `feeds.json` 并提交：

```json
{
  "categories": [
    {
      "id": "frontend",
      "name": "前端与工程",
      "icon": "code"
    }
  ],
  "feeds": [
    {
      "id": "github-blog",
      "title": "GitHub Blog",
      "url": "https://github.blog/feed/",
      "siteUrl": "https://github.blog",
      "category": "frontend",
      "enabled": true
    }
  ]
}
```

### 2. 从 Feedly / Inoreader / NetNewsWire 导入 OPML
如果你之前使用其他 RSS 阅读器，可以直接导出 `.opml` 文件，使用内置工具一键导入：

```bash
# 导入你的 OPML 订阅文件（自动去重并合并分类）
python scripts/opml_tool.py import subscriptions.opml

# 导出当前订阅源为标准 OPML 2.0 文件
python scripts/opml_tool.py export my_feeds.opml
```
*(网页版阅读器内的“订阅源管理”弹窗中也支持一键导出 OPML 文件)*。

---

## ⚡ 国内访问极致加速（推荐接入 Cloudflare Pages）

虽然 GitHub Pages 已经能正常访问，但在国内部分省份 DNS 偶尔会有波动。为了实现**免梯子、毫秒级秒开**的最佳体验，强烈推荐将仓库免费绑定到 **Cloudflare Pages**：

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)，进入 **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**。
2. 授权并选中你的 `gitfeed` 仓库。
3. 构建配置填写：
   * **Framework preset**: `None` (或者 Vite)
   * **Build command**: `npm run build`
   * **Build output directory**: `web/dist`
4. 点击 **Save and Deploy**。
5. 几秒钟后，Cloudflare 会分配一个全球极速加速的免费域名（如 `https://gitfeed-xxx.pages.dev`）。国内无论是手机 5G 还是宽带，打开均是毫秒级瞬间呈现！

---

## 🔄 跨设备已读状态同步配置 (可选)

如果你仅在一台设备阅读，无需任何额外配置，数据直接持久化保存在本地 IndexedDB 中。

如果你需要在 **Mac 电脑 + iPhone 手机** 之间同步已读和星标状态：
1. 打开 GitHub -> **Settings** -> **Developer settings** -> **Personal access tokens** -> **Fine-grained tokens**。
2. 点击 **Generate new token**：
   * **Repository access**: 选择 **Only select repositories** -> 选择你的 `gitfeed` 仓库。
   * **Permissions**: 在 **Repository permissions** 中找到 **Contents**，设为 **Read and write**。
3. 生成 Token 后复制，打开你的 GitFeed 网页版或手机 App，点击左下角 **设置**：
   * 填写仓库名称（如 `yourname/gitfeed`）
   * 粘贴你的 Token
   * 点击 **“立即同步远程已读状态”** 即可。

同步机制采用追加合并集合算法（Set Union），无论你在电脑上读了哪几篇、在手机上读了哪几篇，合并时都会并存，绝不覆盖丢数据！

---

## ⌨️ 键盘快捷键指南

GitFeed 针对桌面端深度优化，支持快捷键高频浏览：

| 快捷键 | 功能描述 |
| :--- | :--- |
| <kbd>J</kbd> | 阅读下一篇文章 |
| <kbd>K</kbd> | 阅读上一篇文章 |
| <kbd>M</kbd> | 切换当前文章 已读 / 未读 状态 |
| <kbd>S</kbd> | 收藏 / 取消星标 |
| <kbd>O</kbd> 或 <kbd>V</kbd> | 在新标签页中打开原网站文章 |
| <kbd>/</kbd> | 聚焦文章快速搜索栏 |
| <kbd>R</kbd> | 刷新文章与远程同步 |
| <kbd>?</kbd> | 查看所有快捷键弹窗 |
| <kbd>Esc</kbd> | 关闭弹窗或取消当前文章选择 |

---

## 💻 本地调试与开发

如果你想在本地扩展功能或自定义样式：

```bash
# 克隆仓库
git clone https://github.com/yourusername/gitfeed.git
cd gitfeed

# 安装前端依赖
npm install

# 安装 Python 抓取引擎依赖
pip install -r scripts/requirements.txt

# 手动抓取最新文章数据
npm run fetch

# 启动本地开发服务 (支持 HMR 热更新)
npm run dev
```

本地开发服务将启动在 `http://localhost:3000`，修改 `web/src/` 中的代码即可即时看到效果。

---

## 📂 仓库目录结构

```text
gitfeed/
├── .github/workflows/
│   └── update-feeds.yml     # 定时拉取 RSS、更新数据并部署 GitHub Pages
├── scripts/
│   ├── fetch.py             # 核心抓取排重清洗引擎 (Python + BeautifulSoup + Feedparser)
│   ├── opml_tool.py         # OPML 导入与导出转换工具
│   └── requirements.txt     # Python 依赖清单
├── feeds.json               # 核心订阅配置文件 (用户只需维护此文件)
├── data/                    # 静态文章数据库 (Git-as-Backend)
│   ├── feeds.json           # 运行缓存配置
│   ├── index.json           # 轻量化文章索引 (用于高速渲染列表)
│   ├── stats.json           # 抓取统计与各源健康状态
│   └── articles/            # 各文章完整正文与媒体附件 JSON
├── web/                     # 现代化前端 & PWA 客户端源码
│   ├── public/              # PWA Manifest、ServiceWorker 离线缓存、应用图标
│   └── src/
│       ├── components/      # Sidebar, ArticleList, ReaderView, Settings 等组件
│       ├── db/              # IndexedDB 本地优先离线存储库
│       └── services/        # 数据获取与 GitHub REST API 同步服务
├── wrangler.toml            # Cloudflare Pages 零配置适配文件
├── vercel.json              # Vercel 零配置适配文件
├── package.json             # 根目录便捷执行脚本
└── LICENSE                  # MIT 开源协议
```

---

## 📄 开源许可证

本项目采用 [MIT License](LICENSE) 开源，欢迎自由 Fork、修改、定制与二次分发。
