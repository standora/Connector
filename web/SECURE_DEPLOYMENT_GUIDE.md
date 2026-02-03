# 安全部署指南

本指南提供了安全部署 React 应用到 GitHub Pages 的方法和最佳实践。

## 🔒 安全特性

### 新的安全部署脚本包含以下增强功能：

- **输入验证**: 验证 GitHub Token、仓库名称和分支名称格式
- **敏感信息保护**: 自动清理日志中的 Token 信息
- **最小权限原则**: 推荐使用 Fine-grained Personal Access Tokens
- **错误处理**: 完善的错误处理和回滚机制
- **干运行模式**: 支持测试模式，不执行实际部署
- **安全清理**: 自动清理临时文件和敏感数据

## 📁 文件说明

### 安全脚本
- `secure-deploy.ps1` - PowerShell 安全部署脚本
- `secure-deploy.sh` - Bash 安全部署脚本  
- `secure-deploy.js` - Node.js 安全部署脚本

### 已删除的文件
- `auto-deploy.ps1` - 旧版本，已被安全版本替代
- `auto-deploy.sh` - 旧版本，已被安全版本替代
- `deploy-to-gh-pages.js` - 功能不完整，已被完整版本替代

## 🚀 使用方法

### 1. 设置 GitHub Token

#### 创建 Fine-grained Personal Access Token (推荐)
1. 访问 [GitHub Settings > Personal Access Tokens](https://github.com/settings/tokens?type=beta)
2. 点击 "Generate new token" > "Fine-grained personal access token"
3. 设置以下权限：
   - **Repository access**: 选择目标仓库
   - **Permissions**:
     - Contents: Write
     - Metadata: Read  
     - Pages: Write

#### 创建 Classic Personal Access Token (备选)
1. 访问 [GitHub Settings > Personal Access Tokens (Classic)](https://github.com/settings/tokens)
2. 点击 "Generate new token (classic)"
3. 选择权限：
   - `repo` (完整仓库访问权限)

### 2. 设置环境变量

#### Windows (PowerShell)
```powershell
# 临时设置
$env:GITHUB_TOKEN = "your_token_here"

# 永久设置
[Environment]::SetEnvironmentVariable('GITHUB_TOKEN', 'your_token_here', 'User')
```

#### Linux/macOS (Bash)
```bash
# 临时设置
export GITHUB_TOKEN="your_token_here"

# 永久设置
echo 'export GITHUB_TOKEN="your_token_here"' >> ~/.bashrc
source ~/.bashrc
```

#### Node.js
```bash
# 使用 .env 文件 (不要提交到版本控制)
echo "GITHUB_TOKEN=your_token_here" > .env

# 或直接设置环境变量
export GITHUB_TOKEN="your_token_here"
```

### 3. 运行部署脚本

#### PowerShell
```powershell
# 基本部署
.\secure-deploy.ps1

# 自定义参数
.\secure-deploy.ps1 -Repository "owner/repo" -Branch "gh-pages"

# 干运行模式（测试）
.\secure-deploy.ps1 -DryRun
```

#### Bash
```bash
# 基本部署
./secure-deploy.sh

# 自定义参数
REPOSITORY="owner/repo" BRANCH="gh-pages" ./secure-deploy.sh

# 干运行模式（测试）
DRY_RUN=true ./secure-deploy.sh
```

#### Node.js
```bash
# 基本部署
node secure-deploy.js

# 自定义参数
REPOSITORY="owner/repo" BRANCH="gh-pages" node secure-deploy.js

# 干运行模式（测试）
DRY_RUN=true node secure-deploy.js
```

## ⚙️ 配置选项

### 环境变量
- `GITHUB_TOKEN` - GitHub Personal Access Token (必需)
- `REPOSITORY` - 目标仓库 (默认: standora/Connector)
- `BRANCH` - 目标分支 (默认: gh-pages)
- `DRY_RUN` - 干运行模式 (默认: false)

### PowerShell 参数
- `-GitHubToken` - GitHub Token
- `-Repository` - 目标仓库
- `-Branch` - 目标分支
- `-DryRun` - 干运行模式开关

## 🔍 安全检查清单

### 部署前检查
- [ ] GitHub Token 格式正确 (ghp_xxx 或 github_pat_xxx)
- [ ] Token 权限最小化 (仅必要权限)
- [ ] 仓库名称格式正确 (owner/repo)
- [ ] 分支名称安全 (无特殊字符)
- [ ] 构建输出存在且非空

### 部署后检查
- [ ] 临时文件已清理
- [ ] 敏感信息未泄露到日志
- [ ] GitHub Pages 部署成功
- [ ] 网站可正常访问

## 🛡️ 安全最佳实践

### Token 管理
1. **使用 Fine-grained tokens**: 提供更精细的权限控制
2. **定期轮换**: 定期更新 Token
3. **环境隔离**: 不同环境使用不同 Token
4. **权限最小化**: 仅授予必要权限

### 脚本安全
1. **输入验证**: 所有输入都经过格式验证
2. **敏感信息保护**: 日志中自动清理 Token
3. **错误处理**: 完善的错误处理和回滚
4. **临时文件清理**: 自动清理临时文件

### 部署安全
1. **干运行测试**: 使用 `-DryRun` 参数测试
2. **监控部署**: 检查部署日志和结果
3. **访问控制**: 限制部署脚本的执行权限
4. **审计日志**: 保留部署记录用于审计

## 🚨 故障排除

### 常见错误

#### Token 相关
```
❌ 错误: GitHub Token 无效或未设置
```
**解决方案**: 检查 Token 格式和权限设置

#### 权限错误
```
❌ 部署失败: Permission denied
```
**解决方案**: 确认 Token 具有目标仓库的写权限

#### 构建失败
```
❌ 构建失败
```
**解决方案**: 检查项目依赖和构建配置

### 调试技巧
1. 使用 `-DryRun` 模式测试
2. 检查环境变量设置
3. 验证 Token 权限
4. 查看详细错误信息

## 📞 支持

如果遇到问题，请：
1. 检查本指南的故障排除部分
2. 验证所有安全检查清单项目
3. 使用干运行模式测试配置
4. 查看 GitHub Pages 设置和日志

---

**注意**: 请妥善保管您的 GitHub Token，不要将其提交到版本控制系统中。