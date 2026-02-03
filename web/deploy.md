# 快速部署指南

## 🚀 一键部署

### Windows (PowerShell)
```powershell
# 设置 GitHub Token
$env:GITHUB_TOKEN = "your_github_token_here"

# 运行部署
.\secure-deploy.ps1
```

### Linux/macOS (Bash)
```bash
# 设置 GitHub Token
export GITHUB_TOKEN="your_github_token_here"

# 运行部署
./secure-deploy.sh
```

### Node.js (跨平台)
```bash
# 设置 GitHub Token
export GITHUB_TOKEN="your_github_token_here"

# 运行部署
node secure-deploy.js
```

## 📋 前置要求

1. **GitHub Token**: 在 [GitHub Settings](https://github.com/settings/tokens) 创建
2. **权限设置**: Contents (write), Metadata (read), Pages (write)
3. **环境**: Git, Node.js, npm 已安装

## 🔍 测试模式

在实际部署前，建议先运行测试：

```bash
# PowerShell
.\secure-deploy.ps1 -DryRun

# Bash
DRY_RUN=true ./secure-deploy.sh

# Node.js
DRY_RUN=true node secure-deploy.js
```

## 📖 详细说明

查看 [SECURE_DEPLOYMENT_GUIDE.md](./SECURE_DEPLOYMENT_GUIDE.md) 获取完整的安全部署指南。