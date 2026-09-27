# 屁大点事

每天花 1–3 分钟把破事倒给 AI，AI 帮你分类、看透、调回来。

语气像损友，不看病、不开课、不灌鸡汤。

## 在线演示

打开：<https://xiangshu3721.github.io/pidadianshi/>

这是 GitHub Pages 上的静态站，没有 Node 服务。倒破事和报告走浏览器里现成的 mock（五类不变），不需要 API Key。记录仍只存在本机 `localStorage`。

第一次发布前，到仓库 **Settings → Pages → Build and deployment → Source**，选 **GitHub Actions**。之后推到 `main`，工作流 `.github/workflows/pages.yml` 会构建 `out/` 并部署。

## 五类破事（仅此 taxonomy）

| Emoji | 名称 | 含义 |
|------|------|------|
| 🪶 | 鸡毛蒜皮 | 日常小事 |
| 🫘 | 芝麻绿豆 | 过去 / 后悔 |
| 🍉 | 西瓜 | 别人的事 |
| 🐢 | 龟毛兔角 | 未来担心 / 万一 |
| 🐸 | 癞蛤蟆 | 烦人 / 冲突 |

鉴定揭晓会带 emoji + 中文名 + 一句归类理由（例如「发现一只🐢 龟毛兔角！——这是还没发生的『万一』。」）。

## 页面（底栏三 Tab）

- `/` **倒一倒** — 首页即聊天倒破事（语音 / 打字），立刻可用
- `/today` **报告** — 今日 | 本周 | 本月：分类计数、能量黑洞、AI洞见、微动作
- `/diary` **日记** — 默认周条日历，可「展开月历」；主区域是事件→分类→洞见
- `/record` → 重定向到 `/`（兼容旧链接）

数据全部存在浏览器 `localStorage`，无登录、无服务端用户库。

## 本地运行

在项目根目录：

```bash
npm install
npm run dev
```

浏览器打开：<http://localhost:3010>

`npm run dev` 仍走 `/api/analyze`（有 Key 用模型，没有就用服务端 mock）。

静态导出（给 GitHub Pages，挂在 `/pidadianshi/` 下）：

```bash
npm run build   # 生成 out/
```

本地按线上路径预览：

```bash
mkdir -p /tmp/pages-preview
ln -sfn "$(pwd)/out" /tmp/pages-preview/pidadianshi
npx --yes serve /tmp/pages-preview -p 3010
```

浏览器打开：<http://localhost:3010/pidadianshi/>

## API Key（可选）

复制环境变量模板：

```bash
cp .env.example .env.local
```

优先级：

1. `DEEPSEEK_API_KEY`（推荐）
2. `OPENAI_API_KEY`
3. **都没有 → 确定性 mock**，UI 可完整离线演示

密钥只在本地服务端路由 `/api/analyze` 使用，不会进前端打包，也不会写进 Git。静态站构建不读取这些变量。

`/api/analyze` modes：`analyze`（拆事鉴定）、`report`（今日报告）、`period`（周/月洞见）。

GitHub Pages 没有这个接口。静态包里聊天和报告直接调用 `lib/mock-ai.ts`；本地如果请求 `/api/analyze` 失败，也会落到同一套 mock。

## 无 Key 演示（Mock 模式）

1. 打开首页直接倒几句破事
2. 看分类揭晓（emoji + 名 + 理由）与「AI洞见」
3. 底栏进「报告」切换 今日 / 本周 / 本月
4. 「日记」里点日期看归档

## 技术栈

- Next.js App Router + TypeScript
- 系统字体（无 Google Fonts / Analytics）
- Mobile-first，暖色东方感留白，固定底栏

## 范围外

登录社交、长期 AI 记忆、霍金斯能量科学宣称、复杂冥想课程。
