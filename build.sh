#!/bin/bash
# ═══════════════════════════════════════════
#  壹号栈 - 一键构建脚本
#  使用方法: ./build.sh
# ═══════════════════════════════════════════

set -e
echo "🚀 壹号栈 - 一键构建"
echo "─────────────────────────────"

# 如果根目录有 data.json，复制到 public/
if [ -f "data.json" ]; then
  cp data.json public/data.json
  echo "✅ 已复制 data.json → public/"
elif [ -f "public/data.json" ]; then
  echo "✅ 检测到 public/data.json"
else
  echo "⚠️  未找到 data.json 文件"
  echo "   请先在后台点击「生成网站」下载 data.json，放到项目根目录或 public/ 目录"
  exit 1
fi

# 构建
echo "⏳ 正在构建..."
npm run build

# 确认构建成功
if [ -d "docs" ]; then
  # 确保 data.json 在 docs 中
  [ -f "public/data.json" ] && cp public/data.json docs/data.json 2>/dev/null
  echo ""
  echo "✅ 构建完成！"
  echo "📁 docs 文件夹已更新，可以直接提交到 GitHub"
  echo ""
  echo "   docs/"
  echo "   ├── index.html"
  echo "   ├── assets/"
  echo "   ├── data.json  ← 最新数据"
  echo "   └── ..."
else
  echo "❌ 构建失败，请检查错误信息"
  exit 1
fi
