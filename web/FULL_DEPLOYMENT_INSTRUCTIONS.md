# 项目部署完整指南

## 步骤1：安装Git（必需）

由于当前系统没有安装Git，这是部署的第一步：

1. 访问 https://git-scm.com/download/win 并下载最新版的Git for Windows
2. 运行安装程序，使用默认设置安装
3. 安装完成后，重启命令提示符或PowerShell

## 步骤2：配置Git和GitHub

安装Git后，打开新的命令提示符窗口并执行：

```bash
# 配置Git用户信息
git config --global user.name "standora"
git config --global user.email "your-email@example.com"

# 配置凭证助手以缓存GitHub令牌
git config --global credential.helper store
```

## 步骤3：初始化本地仓库并连接到远程仓库

```bash
# 进入项目目录
cd "d:/Demo/连接器/web"

# 初始化Git仓库
git init

# 添加所有文件到暂存区
git add .

# 创建初始提交
git commit -m "Initial commit: React TypeScript Vite project"

# 添加远程仓库连接
git remote add origin https://github.com/standora/Connector.git

# 推送代码到main分支
git push -u origin main
```

## 步骤4：部署到GitHub Pages

一旦代码成功推送到GitHub仓库，您可以使用以下两种方法之一部署到GitHub Pages：

### 方法A：通过GitHub设置（推荐）
1. 访问 https://github.com/standora/Connector
2. 点击 "Settings" 标签
3. 向下滚动到 "Pages" 部分
4. 在 "Source" 下拉菜单中选择 "Deploy from a branch"
5. 选择 "main" 分支和 "/" 文件夹（或如果使用构建产物则选择 "gh-pages" 分支）
6. 点击 "Save"

### 方法B：使用npm脚本
如果您希望使用项目内置的部署脚本：

```bash
# 设置GitHub令牌环境变量
set GITHUB_TOKEN=YOUR_GITHUB_TOKEN_HERE

# 运行部署命令（这会将dist文件夹内容发布到gh-pages分支）
npm run deploy
```

## 步骤5：验证部署

部署完成后，您可以在以下URL访问您的应用：
- GitHub Pages URL: https://standora.github.io/Connector

## 故障排除

如果遇到问题：

1. **Git未找到错误**：确保已正确安装Git并重启终端
2. **权限错误**：确认您的GitHub令牌具有repo权限
3. **网络错误**：检查网络连接
4. **认证失败**：确认令牌正确无误

## 关于您的项目

- 项目类型：React + TypeScript + Vite
- 已构建：构建产物位于 `dist/` 目录
- 预期部署位置：GitHub Pages at https://standora.github.io/Connector
- 当前状态：本地项目已准备好部署

注意：您的项目已经配置了gh-pages部署脚本，只需安装Git即可使用。