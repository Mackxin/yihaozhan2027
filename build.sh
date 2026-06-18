#!/bin/bash
# ═══════════════════════════════════════════
#  壹号栈 - 一键更新 dist 脚本
#  使用方法: 把 data.json 放到项目根目录，然后运行 ./build.sh
# ═══════════════════════════════════════════

echo "🚀 壹号栈 - 一键更新 dist"
echo "─────────────────────────────"

# 检查 data.json 是否存在
if [ ! -f "data.json" ]; then
  echo "⚠️  未找到 data.json 文件"
  echo "   请先在后台点击「更新网站」下载 data.json，然后放到项目根目录"
  exit 1
fi

# 复制 data.json 到 public/
cp data.json public/data.json
echo "✅ 已复制 data.json → public/"

# 构建
echo "⏳ 正在构建..."
npm run build

# 确认构建成功
if [ -d "dist" ]; then
  # 确保 data.json 在 dist 中
  cp data.json dist/data.json 2>/dev/null
  echo ""
  echo "✅ 构建完成！"
  echo "📁 dist 文件夹已更新，可以直接上传到服务器"
  echo ""
  echo "   dist/"
  echo "   ├── index.html"
  echo "   ├── assets/"
  echo "   ├── data.json  ← 最新数据"
  echo "   └── ..."
else
  echo "❌ 构建失败，请检查错误信息"
  exit 1
fi
