#!/bin/bash
# ═══════════════════════════════════════════
#  壹号栈 - 一键部署脚本
#  使用方法: ./deploy.sh [提交信息]
# ═══════════════════════════════════════════

MSG="${1:-更新数据}"

echo "🚀 壹号栈 - 一键部署"
echo "─────────────────────────────"

# 检查 public/data.json
if [ ! -f "public/data.json" ]; then
  echo "⚠️  未找到 public/data.json"
  echo "   请先在后台点击「生成网站」更新数据"
  exit 1
fi

# 构建
echo "⏳ 正在构建..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ 构建失败"
  exit 1
fi

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
