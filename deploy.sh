#!/bin/bash
# ═══════════════════════════════════════════
#  壹号栈 - 一键部署脚本
#  使用方法: ./deploy.sh [提交信息]
# ═══════════════════════════════════════════

set -e
MSG="${1:-更新数据}"

echo "🚀 壹号栈 - 一键部署"
echo "─────────────────────────────"

# 如果根目录有 data.json，复制到 public/
if [ -f "data.json" ]; then
  cp data.json public/data.json
  echo "✅ 已复制 data.json → public/"
elif [ -f "public/data.json" ]; then
  echo "✅ 检测到 public/data.json"
else
  echo "⚠️  未找到 data.json"
  echo "   请先在后台点击「生成网站」更新数据"
  exit 1
fi

# 构建
echo "⏳ 正在构建..."
npm run build

# 确保 data.json 在 docs 中
[ -f "public/data.json" ] && cp public/data.json docs/data.json 2>/dev/null

echo "✅ 构建完成"

# 检查是否有变更
if git diff --quiet && git diff --cached --quiet; then
  echo "📝 没有需要提交的变更"
  exit 0
fi

# 提交并推送
echo "📦 提交变更: $MSG"
git add -A
git commit -m "$MSG"
echo "🌐 推送到 GitHub..."
git push

echo ""
echo "✅ 部署完成！GitHub Pages 将在 1-2 分钟内更新"
