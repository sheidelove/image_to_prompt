# 🚀 环境变量配置指南

## 🔑 必需的环境变量

在 Vercel Dashboard → Settings → Environment Variables 中配置以下变量：

### 🤖 AI 服务配置 (必需)

```bash
# Coze AI API Token - 用于图像转提示词功能
# 获取地址: https://www.coze.cn/open/docs/authentication
COZE_API_TOKEN=pat_d8wXcrPBCj1D9vkF2VXKUQEcCOtNnbNhF0QwM3hVujMjrHewww0oUekOjfLrZkjO

# Coze Workflow ID - 图像处理工作流程ID
COZE_WORKFLOW_ID=7547581941349449764
```

### 🔑 应用核心配置

```bash
# 应用 URL (替换为您的实际域名)
NEXT_PUBLIC_APP_URL=https://image-to-prompt-nextjs.vercel.app

# NextAuth 配置
NEXTAUTH_URL=https://image-to-prompt-nextjs.vercel.app
NEXTAUTH_SECRET=your-secure-random-secret-key-at-least-32-characters-long
```

## 📝 配置步骤

1. **登录 Vercel Dashboard**
2. **选择您的项目** `image-to-prompt-nextjs`
3. **进入 Settings** → **Environment Variables**
4. **对于已存在的变量**:
   - 点击 "Edit" 按钮
   - 更新为正确的值
   - 保存更改
5. **添加缺失的变量**:
   - 点击 "Add New"
   - 输入变量名和值
   - 选择应用环境 (Production, Preview, Development)

## 🔧 配置完成后

1. **重新部署项目** (Vercel 会自动检测到环境变量更改)
2. **测试功能** - 尝试上传图片并生成提示词
3. **检查日志** - 如有问题，查看 Vercel Functions 日志

## ⚠️ 常见问题

- **仍然出现 500 错误**: 确保 `COZE_API_TOKEN` 不是占位符值
- **API Token 无效**: 检查 Token 是否有效且有正确权限
- **Workflow ID 错误**: 确认 Workflow 在 Coze 平台中存在且可访问

## 🔗 相关链接

- [Coze API 文档](https://www.coze.cn/open/docs)
- [Vercel 环境变量文档](https://vercel.com/docs/concepts/projects/environment-variables)
