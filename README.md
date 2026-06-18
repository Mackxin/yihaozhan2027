# 壹号栈

一个基于 Vue 3 + Vite 的个人导航网站，集成导航链接、资讯时间线、灵感随记和后台管理。

## 功能

- **首页** — 个人介绍、快捷入口、全局搜索
- **导航** — 分类展示精选网站和工具，支持搜索和分类跳转
- **讯息** — 时间线形式展示资讯，左侧按月份分组，右侧展示详情
- **随记** — Markdown 笔记，支持标签、置顶、搜索、筛选和导出
- **后台管理** — 可视化管理导航链接和资讯数据，支持批量导入、拖拽排序、撤销操作、数据导入导出
- **暗黑模式** — 三态切换（自动跟随系统 / 浅色 / 深色），持久化记忆
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

# 构建生产版本
npm run build
```

## 更新网站数据

在网站后台编辑完数据后，执行以下 3 步即可发布：

```bash
# 1. 在后台点击「生成网站」按钮，下载 data.json 到项目根目录

# 2. 一键构建（自动复制 data.json、构建到 docs/）
./build.sh

# 3. 推送到 GitHub
git add -A && git commit -m "更新数据" && git push
```

## 部署（GitHub Pages）

1. 将项目推送到 GitHub 仓库
2. 进入仓库 **Settings → Pages → Source**
3. 选择 `main` 分支的 `/docs` 文件夹
4. 推送代码后 GitHub 自动部署

## 头像设置

将头像图片命名为 `avatar.png`，放到 `public/` 文件夹中，重新构建即可。

## 许可证

MIT
