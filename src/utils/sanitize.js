import DOMPurify from 'dompurify'

// 统一消毒 marked 渲染出的 HTML，防止存储型/反射型 XSS。
// DOMPurify 默认保留 id / class / data-* 等属性，所以文章 TOC 锚点、
// 流记 #标签 的 data-tag 都能正常工作，只剥离 <script>/on* 等危险内容。
export function sanitizeHtml(html) {
  if (!html) return ''
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })
}
