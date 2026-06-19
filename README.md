# 壹号栈

一个基于 Vue 3 + Vite 的个人导航网站，集成导航链接、资讯时间线、灵感随记和后台管理。

## 功能

- **首页** — 个人介绍、快捷入口、全局搜索
- **导航** — 分类展示精选网站和工具，支持搜索和分类跳转
- **讯息** — 时间线形式展示资讯，左侧按月份分组，右侧展示详情
- **随记** — Markdown 笔记，支持标签、置顶、搜索、筛选、导出，可一键发布到讯息页
- **后台管理** — 可视化管理导航链接和资讯数据，支持批量导入、拖拽排序、撤销操作、数据导入导出、自定义导航栏图标
- **暗黑模式** — 点击首页标题「壹号栈」切换浅色/深色，持久化记忆
- **响应式** — 适配桌面和移动端，支持左右滑动切换页面

## 技术栈

| 技术 | 版本 |
|------|------|
| Vue | 3.5 |
| Vite | 8 |
| marked | 18 (Markdown 渲染) |

## 项目结构

```
2027网站/
├── index.html          # 入口 HTML
├── vite.config.js      # Vite 配置
├── build.sh            # 一键构建脚本
├── public/             # 静态资源（头像等）
├── src/
│   ├── main.js         # 应用入口
│   ├── App.vue         # 根组件（Tab 导航 + 暗黑模式）
│   ├── App.css         # 全局样式
│   ├── index.css       # CSS 变量（浅色/深色主题）
│   ├── store.js        # 响应式数据管理
│   ├── data/           # 默认数据
│   └── pages/
│       ├── HomePage.*  # 首页
│       ├── NavPage.*   # 导航页
│       ├── NewsPage.*  # 讯息页
│       ├── NotesPage.* # 随记页
│       └── AdminPanel.*# 后台管理
└── docs/               # 构建输出（GitHub Pages 部署目录）
```

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
# → 浏览器打开 http://localhost:5173

# 构建生产版本
npm run build
```

## 进入管理后台

管理后台默认隐藏，需要在浏览器控制台 (F12) 执行以下命令激活：

```javascript
localStorage.setItem('yihao_admin', 'true')
```

刷新页面后，底部导航栏会显示「管理」标签，点击即可进入后台。

如需退出管理，执行：

```javascript
localStorage.setItem('yihao_admin', 'false')
```

## 暗黑模式

点击首页标题「壹号栈」即可切换浅色/深色模式，设置自动保存到本地。

## 更新网站数据

### 开发模式（推荐）

```bash
# 1. 启动开发服务器
npm run dev

# 2. 在后台点击「生成网站」按钮 → 数据自动写入 public/data.json

# 3. 一键部署（自动构建 + 提交 + 推送）
./deploy.sh
```

### 生产模式

```bash
# 1. 在后台点击「生成网站」按钮，下载 data.json
# 2. 将 data.json 覆盖到 public/data.json
# 3. 一键部署
./deploy.sh
```

> `deploy.sh` 支持自定义提交信息：`./deploy.sh "添加了新链接"`
> 只需构建不提交：`./build.sh`

## 部署（GitHub Pages）

1. 将项目推送到 GitHub 仓库
2. 进入仓库 **Settings → Pages → Source**
3. 选择 `main` 分支的 `/docs` 文件夹
4. 推送代码后 GitHub 自动部署

## 头像设置

将头像图片命名为 `avatar.png`，放到 `public/` 文件夹中，重新构建即可。

## 许可证

MIT
