#!/bin/bash
# ═══════════════════════════════════════════
#  壹号栈 - 一键更新 docs 脚本
#  使用方法: 把 data.json 放到 public/ 目录，然后运行 ./build.sh
# ═══════════════════════════════════════════

echo "🚀 壹号栈 - 一键更新 docs"
echo "─────────────────────────────"

# 检查 public/data.json 是否存在
if [ ! -f "public/data.json" ]; then
  echo "⚠️  未找到 public/data.json 文件"
  echo "   请先在后台点击「更新网站」下载 data.json，然后放到 public/ 目录"
  exit 1
fi

echo "✅ 检测到 public/data.json（最新数据）"

# 构建（Vite 会自动将 public/ 中的文件复制到输出目录）
echo "⏳ 正在构建..."
npm run build

# 确认构建成功
if [ -d "docs" ]; then
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
#!/bin/bash
# ═══════════════════════════════════════════
#  壹号栈 - 一键更新 docs 脚本
#  使用方法: 把 data.json 放到项目根目录，然后运行 ./build.sh
# ═══════════════════════════════════════════

echo "🚀 壹号栈 - 一键更新 docs"
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
if [ -d "docs" ]; then
  # 确保 data.json 在 docs 中
  cp data.json docs/data.json 2>/dev/null
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
