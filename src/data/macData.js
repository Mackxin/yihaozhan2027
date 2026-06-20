export const defaultMacSections = [
  {
    id: 'software',
    icon: '📦',
    title: 'Mac 软件下载',
    subtitle: '精选日常使用必备工具',
    items: [
      { name: 'MacWK', desc: '免费、高质量的 Mac 软件下载平台，涵盖系统工具、设计软件、编程环境等。', url: 'https://macwk.com', emoji: '📦', tags: ['系统工具', '设计软件', '编程环境'] },
      { name: 'Scroll Reverser', desc: '分别设置鼠标和触控板的滚动方向，解决 Mac 上鼠标滚动方向不适的问题。', url: 'https://pilotmoon.com/scrollreverser/', emoji: '🖱️', tags: ['免费', '触控板', '鼠标'] },
      { name: 'MacZip', desc: '专为 macOS 设计的压缩软件，支持 20+ 格式，永久免费。', url: 'https://maczip.cn', emoji: '📁', tags: ['压缩', '加密', '20+ 格式'] },
      { name: 'Mac Mouse Fix', desc: '模拟触控板手势，在 Mac 上提供好用的鼠标增强功能。', url: 'https://macmousefix.com', emoji: '🖥️', tags: ['手势', '滚动', '鼠标增强'] },
      { name: 'DockMinimize', desc: '在 macOS 上实现类似 Windows 系统的单击隐藏和显示窗口功能。', url: 'https://ivean.com/dockminimize/', emoji: '🪟', tags: ['窗口预览', '显示隐藏'] },
      { name: 'AltTab', desc: '切换到任意窗口，支持后台切换和应用预览。', url: 'https://alt-tab.app/', emoji: '🌅', tags: ['后台切换', '应用预览'] },
      { name: 'Keka', desc: 'macOS 系统压缩文件管理器，官网上下载免费。', url: 'https://www.keka.io/zh-cn/', emoji: '🛣️', tags: ['压缩', '应用预览'] },
      { name: 'Melodic Stamp', desc: '一款为 macOS 设计的美丽、简单且优雅的本地音乐播放器，具有元数据编辑功能。', url: 'https://github.com/Cement-Labs/MelodicStampPrototype', emoji: '✨', tags: ['音乐播放器', 'mac系统'] },
      { name: 'Pearcleaner', desc: '一款开源的 Mac 应用清理工具，灵感来源于 AppCleaner 和隐私指南。', url: 'https://github.com/alienator88/Pearcleaner', emoji: '🛣️', tags: ['应用卸载', '系统清理'] },
      { name: 'FineTune', desc: '独立控制每个应用的音量，将较轻的应用音量提升至 4 倍，免费且开源。', url: 'https://github.com/ronitsingh10/FineTune', emoji: '🛣️', tags: ['音量控制', '单独调节'] },
      { name: 'LaunchNext', desc: 'macOS 26+ 最强的免费开源 Launchpad 替代方案，享受丝滑的 120FPS 动画体验。', url: 'https://closex.org/cn/launchnext/', emoji: '🛣️', tags: ['启动台', '快速查看'] },
    ]
  },
  {
    id: 'setup',
    icon: '💻',
    title: '装机记录',
    subtitle: '新 Mac 装机实用工具与配置',
    items: [
      { name: '新 Macbook Pro 装机记录', desc: '日常 Mac 软件推荐，记录装机过程中的实用工具和配置经验。涵盖开发工具、实用系统设置、插件以及新手常见问题解答。', url: 'https://www.rustc.cloud/mac-install', emoji: '💻', tags: ['装机', '配置', '开发工具'] },
    ]
  },
  {
    id: 'more',
    icon: '🎥',
    title: '更多推荐',
    subtitle: '录屏、格式转换、自救指南',
    items: [
      { name: 'QuickRecorder', desc: '开源轻量高性能 macOS 录屏工具，支持全屏/区域/窗口/App 录制，双屏支持，文件小于 10MB。', url: 'https://lihaoyun6.github.io/quickrecorder/', emoji: '🎥', tags: ['录屏', '开源'] },
      { name: '图片转换 PDF 专家', desc: '完全免费无广告，支持 60+ 图片格式转 PDF，内置 OCR 可编辑 PDF，纯离线运行。', url: 'https://apps.apple.com/cn/app/solid-image-converter/id6737818163', emoji: '📸', tags: ['图片转 PDF', 'OCR', '60+ 格式'] },
      { name: '苹果生态玄学自救指北', desc: '苹果生态实用故障排查与技巧指南，慢慢看，总有能用上的一条。', url: 'https://xream.notion.site/6fed380cf1d147c6a047bce452a8f2af', emoji: '🍎', tags: ['故障排查', '技巧'] },
      { name: '小张的分享中心', desc: '让大家用上好用的工具，创作出优秀的作品。目前面向全体 Mac 用户。', url: 'https://qnswkjn28n.feishu.cn/wiki/T8uJwQH4YiIy7BkHyQpczpyDnug', emoji: '🎁', tags: ['分享', 'Mac 用户'] },
    ]
  },
  {
    id: 'terminal',
    icon: '⌨️',
    title: '终端命令',
    subtitle: 'macOS 系统常用终端指令',
    items: [
      { name: '允许未知来源', desc: 'macOS 10.13 开启后可安装任意来源的应用。\n启用: sudo spctl --master-disable\n恢复: sudo spctl --master-enable', url: '', emoji: '🔓', tags: ['安全设置'] },
      { name: '移除隔离属性', desc: 'macOS 10.15 移除已下载应用的隔离标志。将应用拖入终端替换路径。\n命令: sudo xattr -r -d com.apple.quarantine /Applications/[应用名].app', url: '', emoji: '🔓', tags: ['隔离', '安装'] },
      { name: 'Homebrew 安装', desc: 'macOS 必备包管理器，一键脚本快速安装。', url: 'https://gitee.com/cunkai/HomebrewCN/raw/master/Homebrew.sh', emoji: '🍺', tags: ['包管理器', '安装脚本'] },
      { name: 'Homebrew 卸载', desc: '需要时一键移除 Homebrew。', url: 'https://gitee.com/cunkai/HomebrewCN/raw/master/HomebrewUninstall.sh', emoji: '🗑️', tags: ['卸载脚本'] },
    ]
  },
  {
    id: 'system',
    icon: '💿',
    title: '系统工具',
    subtitle: '磁盘恢复等实用软件',
    items: [
      { name: 'Disk Drill', desc: '磁盘数据恢复软件，帮助找回误删文件。', url: 'https://www.cleverfiles.com/cn/data-recovery-software.html', emoji: '💿', tags: ['数据恢复'] },
    ]
  },
  {
    id: 'paid',
    icon: '💎',
    title: '收费软件',
    subtitle: '随意整理哦',
    items: [
      { name: 'Wins 3', desc: '告别传统窗口切换，带来更多效率提升。1 天免费试用，一次购买永久授权。', url: 'https://wins.cool/zh', emoji: '✨', tags: ['Dock 窗口预览', 'Cmd-Tab Plus', '调度中心 Pro'] },
    ]
  },
]
