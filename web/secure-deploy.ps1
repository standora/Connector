# React 应用安全部署脚本 (PowerShell)
# 增强安全版本 - 包含输入验证和安全检查

param(
    [Parameter(Mandatory=$false)]
    [string]$GitHubToken = $env:GITHUB_TOKEN,
    
    [Parameter(Mandatory=$false)]
    [ValidatePattern("^[a-zA-Z0-9_-]+/[a-zA-Z0-9_.-]+$")]
    [string]$Repository = "standora/Connector",
    
    [Parameter(Mandatory=$false)]
    [ValidatePattern("^[a-zA-Z0-9_.-]+$")]
    [string]$Branch = "gh-pages",
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun = $false
)

# 设置错误处理
$ErrorActionPreference = "Stop"

# 安全函数：清理敏感信息
function Write-SecureLog {
    param([string]$Message, [string]$Color = "White")
    # 移除可能的敏感信息
    $SafeMessage = $Message -replace "ghp_[a-zA-Z0-9]{36}", "***TOKEN***"
    $SafeMessage = $SafeMessage -replace "github_pat_[a-zA-Z0-9_]{82}", "***TOKEN***"
    Write-Host $SafeMessage -ForegroundColor $Color
}

# 安全函数：验证Token格式
function Test-GitHubToken {
    param([string]$Token)
    if ([string]::IsNullOrEmpty($Token)) {
        return $false
    }
    # 验证GitHub Token格式
    return ($Token -match "^(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{82})$")
}

Write-SecureLog "🚀 开始安全部署 React 应用到 GitHub Pages..." "Green"

# 安全检查：验证Token
if (-not (Test-GitHubToken $GitHubToken)) {
    Write-SecureLog "❌ 错误: GitHub Token 无效或未设置" "Red"
    Write-SecureLog "💡 安全设置方法:" "Yellow"
    Write-SecureLog "   1. 访问 https://github.com/settings/tokens" "Cyan"
    Write-SecureLog "   2. 创建新的 Personal Access Token (推荐使用 Fine-grained tokens)" "Cyan"
    Write-SecureLog "   3. 选择最小必要权限: Contents (write), Metadata (read), Pages (write)" "Cyan"
    Write-SecureLog "   4. 设置环境变量: `$env:GITHUB_TOKEN = 'your_token_here'" "Cyan"
    Write-SecureLog "   5. 验证Token格式: ghp_xxxx 或 github_pat_xxxx" "Cyan"
    exit 1
}

# 安全检查：验证仓库名称
if ($Repository -notmatch "^[a-zA-Z0-9_-]+/[a-zA-Z0-9_.-]+$") {
    Write-SecureLog "❌ 错误: 仓库名称格式无效" "Red"
    exit 1
}

# 安全检查：验证分支名称
if ($Branch -notmatch "^[a-zA-Z0-9_.-]+$") {
    Write-SecureLog "❌ 错误: 分支名称格式无效" "Red"
    exit 1
}

# 检查Git是否安装
try {
    $gitVersion = & git --version 2>$null
    Write-SecureLog "✅ Git 已安装: $gitVersion" "Green"
} catch {
    Write-SecureLog "❌ 错误: Git 未安装或不在 PATH 中" "Red"
    Write-SecureLog "💡 请从 https://git-scm.com/download/win 下载并安装 Git" "Yellow"
    exit 1
}

# 检查Node.js和npm
try {
    $nodeVersion = & node --version 2>$null
    $npmVersion = & npm --version 2>$null
    Write-SecureLog "✅ Node.js: $nodeVersion, npm: $npmVersion" "Green"
} catch {
    Write-SecureLog "❌ 错误: Node.js 或 npm 未安装" "Red"
    exit 1
}

# 安全检查：验证package.json存在
if (-not (Test-Path "package.json")) {
    Write-SecureLog "❌ 错误: package.json 不存在" "Red"
    exit 1
}

# 构建项目
Write-SecureLog "🔨 构建项目..." "Yellow"
try {
    & npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "构建命令返回非零退出码"
    }
} catch {
    Write-SecureLog "❌ 构建失败: $($_.Exception.Message)" "Red"
    exit 1
}

Write-SecureLog "✅ 构建成功" "Green"

# 检查构建输出
if (-not (Test-Path "dist")) {
    Write-SecureLog "❌ 错误: dist 目录不存在" "Red"
    exit 1
}

# 验证构建输出内容
$distFiles = Get-ChildItem "dist" -Recurse
if ($distFiles.Count -eq 0) {
    Write-SecureLog "❌ 错误: dist 目录为空" "Red"
    exit 1
}

Write-SecureLog "✅ 构建输出验证通过，包含 $($distFiles.Count) 个文件" "Green"

if ($DryRun) {
    Write-SecureLog "🔍 干运行模式：跳过实际部署" "Yellow"
    Write-SecureLog "✅ 所有检查通过，可以进行实际部署" "Green"
    exit 0
}

# 创建安全的临时目录
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$randomSuffix = -join ((1..8) | ForEach {[char]((65..90) + (97..122) | Get-Random)})
$tempDir = "temp_deploy_${timestamp}_${randomSuffix}"

try {
    New-Item -ItemType Directory -Name $tempDir | Out-Null
    Copy-Item -Path "dist\*" -Destination $tempDir -Recurse
    
    # 进入临时目录
    $originalLocation = Get-Location
    Set-Location $tempDir
    
    # 配置Git（使用安全的配置）
    & git init --initial-branch=main
    & git config user.name "Automated Deployment"
    & git config user.email "noreply@github.com"
    & git config core.autocrlf false
    & git config core.safecrlf false
    
    # 添加文件
    & git add .
    $commitMessage = "Deploy React app - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss UTC' -AsUTC)"
    & git commit -m $commitMessage
    
    # 推送到远程分支（使用安全的URL构建）
    Write-SecureLog "📤 推送到 GitHub..." "Yellow"
    $remoteUrl = "https://x-access-token:$GitHubToken@github.com/$Repository.git"
    
    & git push --force $remoteUrl main:$Branch
    
    if ($LASTEXITCODE -eq 0) {
        Write-SecureLog "🎉 部署成功！" "Green"
        $repoOwner = $Repository.Split('/')[0]
        $repoName = $Repository.Split('/')[1]
        Write-SecureLog "🔗 访问地址: https://$repoOwner.github.io/$repoName/" "Cyan"
        Write-SecureLog "⏰ 注意: GitHub Pages 可能需要几分钟时间更新" "Yellow"
    } else {
        Write-SecureLog "❌ 部署失败" "Red"
        exit 1
    }
    
} catch {
    Write-SecureLog "❌ 部署过程中发生错误: $($_.Exception.Message)" "Red"
    exit 1
} finally {
    # 安全清理
    if ($originalLocation) {
        Set-Location $originalLocation
    }
    if (Test-Path $tempDir) {
        Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
    Write-SecureLog "🧹 清理完成" "Green"
}