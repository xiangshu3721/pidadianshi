# 屁大点事

每天花 1–3 分钟把破事倒给 AI，AI 帮你分类、看透、调回来。

语气像损友，不看病、不开课、不灌鸡汤。

## 五类破事（仅此 taxonomy）

| Emoji | 名称 | 含义 |
|------|------|------|
| 🪶 | 鸡毛蒜皮 | 日常小事 |
| 🫘 | 芝麻绿豆 | 过去 / 后悔 |
| 🍉 | 西瓜 | 别人的事 |
| 🐢 | 龟毛兔角 | 未来担心 / 万一 |
| 🐸 | 癞蛤蟆 | 烦人 / 冲突 |

## 页面

- `/` 首页 — 入口、今日计数、每日彩蛋
- `/record` 随便说说 — 语音 / 打字倒破事，AI 拆分鉴定
- `/today` 今日屁事报告 — 黑洞、能量状态、微动作、倒桶仪式
- `/diary` 日记 — 简易日历，点日期看事件

数据全部存在浏览器 `localStorage`，无登录、无服务端用户库。

## 本地运行

```bash
cd /workspace/pidadianshi   # 或你的项目路径
npm install
npm run dev
```

浏览器打开：<http://localhost:3000>

### 手机访问（同一局域网）

`npm run dev` 已绑定 `0.0.0.0:3000`。查电脑局域网 IP，手机浏览器打开：

```text
http://<你的电脑IP>:3000
```

生产模式：

```bash
npm run build
npm start
```

## API Key（可选）

复制环境变量模板：

```bash
cp .env.example .env.local
```

优先级：

1. `DEEPSEEK_API_KEY`（推荐）
2. `OPENAI_API_KEY`
3. **都没有 → 确定性 mock**，UI 可完整离线演示

密钥只在服务端路由 `/api/analyze` 使用，不会进前端打包。

## 无 Key 演示（Mock 模式）

不配置任何 Key 也可：

1. 打开首页点「随便说说」
2. 打字倒几句破事（或语音，视浏览器支持）
3. 看分类揭晓与「AI 看了一眼」
4. 「今天就这些」→ 今日报告（计数、黑洞、微动作、倒掉动画）
5. 日记页点今天查看归档

Mock 会按关键词粗分五类，并生成固定风格的洞察 / 报告文案。

## 技术栈

- Next.js App Router + TypeScript
- 系统字体（无 Google Fonts / Analytics）
- Mobile-first，暖色东方感留白

## 范围外

登录社交、长期 AI 记忆、霍金斯能量科学宣称、复杂冥想课程。
