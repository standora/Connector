#!/bin/bash
# React 应用安全部署脚本 (Bash)
# 增强安全版本 - 包含输入验证和安全检查

set -euo pipefail  # 严格错误处理

# 配置变量（带默认值和验证）
GITHUB_TOKEN="${GITHUB_TOKEN:-}"
REPOSITORY="${REPOSITORY:-standora/Connector}"
BRANCH="${BRANCH:-gh-pages}"
DRY_RUN="${DRY_RUN:-false}"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 安全日志函数
log_secure() {
    local level="$1"
    local message="$2"
    # 移除可能的敏感信息
    local safe_message=$(echo "$message" | sed -E 's/ghp_[a-zA-Z0-9]{36}/***TOKEN***/g' | sed -E 's/github_pat_[a-zA-Z0-9_]{82}/***TOKEN***/g')
    
    case "$level" in
        "INFO")  echo -e "${GREEN}$safe_message${NC}" ;;
        "WARN")  echo -e "${YELLOW}$safe_message${NC}" ;;
        "ERROR") echo -e "${RED}$safe_message${NC}" ;;
        "CYAN")  echo -e "${CYAN}$safe_message${NC}" ;;
        *)       echo "$safe_message" ;;
    esac
}

# 验证GitHub Token格式
validate_github_token() {
    local token="$1"
    if [[ -z "$token" ]]; then
        return 1
    fi
    # 验证GitHub Token格式
    if [[ "$token" =~ ^(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{82})$ ]]; then
        return 0
    else
        return 1
    fi
}

# 验证仓库名称格式
validate_repository() {
    local repo="$1"
    if [[ "$repo" =~ ^[a-zA-Z0-9_-]+/[a-zA-Z0-9_.-]+$ ]]; then
        return 0
    else
        return 1
    fi
}

# 验证分支名称格式
validate_branch() {
    local branch="$1"
    if [[ "$branch" =~ ^[a-zA-Z0-9_.-]+$ ]]; then
        return 0
    else
        return 1
    fi
}

# 清理函数
cleanup() {
    local exit_code=$?
    if [[ -n "${TEMP_DIR:-}" ]] && [[ -d "$TEMP_DIR" ]]; then
        cd "$ORIGINAL_DIR"
        rm -rf "$TEMP_DIR"
        log_secure "INFO" "🧹 清理完成"
    fi
    exit $exit_code
}

# 设置清理陷阱
trap cleanup EXIT INT TERM

log_secure "INFO" "🚀 开始安全部署 React 应用到 GitHub Pages..."

# 安全检查：验证Token
if ! validate_github_token "$GITHUB_TOKEN"; then
    log_secure "ERROR" "❌ 错误: GitHub Token 无效或未设置"
    log_secure "WARN" "💡 安全设置方法:"
    log_secure "CYAN" "   1. 访问 https://github.com/settings/tokens"
    log_secure "CYAN" "   2. 创建新的 Personal Access Token (推荐使用 Fine-grained tokens)"
    log_secure "CYAN" "   3. 选择最小必要权限: Contents (write), Metadata (read), Pages (write)"
    log_secure "CYAN" "   4. 设置环境变量: export GITHUB_TOKEN='your_token_here'"
    log_secure "CYAN" "   5. 验证Token格式: ghp_xxxx 或 github_pat_xxxx"
    exit 1
fi

# 安全检查：验证仓库名称
if ! validate_repository "$REPOSITORY"; then
    log_secure "ERROR" "❌ 错误: 仓库名称格式无效: $REPOSITORY"
    exit 1
fi

# 安全检查：验证分支名称
if ! validate_branch "$BRANCH"; then
    log_secure "ERROR" "❌ 错误: 分支名称格式无效: $BRANCH"
    exit 1
fi

# 检查必要的命令是否存在
check_command() {
    local cmd="$1"
    local install_hint="$2"
    if ! command -v "$cmd" &> /dev/null; then
        log_secure "ERROR" "❌ 错误: $cmd 未安装"
        log_secure "WARN" "💡 $install_hint"
        exit 1
    fi
}

check_command "git" "请安装 Git: sudo apt-get install git (Ubuntu/Debian) 或 brew install git (macOS)"
check_command "node" "请安装 Node.js: https://nodejs.org/"
check_command "npm" "请安装 npm (通常与 Node.js 一起安装)"

log_secure "INFO" "✅ Git: $(git --version)"
log_secure "INFO" "✅ Node.js: $(node --version), npm: $(npm --version)"

# 安全检查：验证package.json存在
if [[ ! -f "package.json" ]]; then
    log_secure "ERROR" "❌ 错误: package.json 不存在"
    exit 1
fi

# 构建项目
log_secure "WARN" "🔨 构建项目..."
if ! npm run build; then
    log_secure "ERROR" "❌ 构建失败"
    exit 1
fi

log_secure "INFO" "✅ 构建成功"

# 检查构建输出
if [[ ! -d "dist" ]]; then
    log_secure "ERROR" "❌ 错误: dist 目录不存在"
    exit 1
fi

# 验证构建输出内容
file_count=$(find dist -type f | wc -l)
if [[ $file_count -eq 0 ]]; then
    log_secure "ERROR" "❌ 错误: dist 目录为空"
    exit 1
fi

log_secure "INFO" "✅ 构建输出验证通过，包含 $file_count 个文件"

# 干运行模式检查
if [[ "$DRY_RUN" == "true" ]]; then
    log_secure "WARN" "🔍 干运行模式：跳过实际部署"
    log_secure "INFO" "✅ 所有检查通过，可以进行实际部署"
    exit 0
fi

# 创建安全的临时目录
ORIGINAL_DIR=$(pwd)
TIMESTAMP=$(date +%Y%m%d%H%M%S)
RANDOM_SUFFIX=$(openssl rand -hex 4 2>/dev/null || echo $(date +%N | cut -c1-8))
TEMP_DIR="temp_deploy_${TIMESTAMP}_${RANDOM_SUFFIX}"

mkdir "$TEMP_DIR"
cp -r dist/* "$TEMP_DIR/"

# 进入临时目录
cd "$TEMP_DIR"

# 配置Git（使用安全的配置）
git init --initial-branch=main
git config user.name "Automated Deployment"
git config user.email "noreply@github.com"
git config core.autocrlf false
git config core.safecrlf false

# 添加文件
git add .
COMMIT_MESSAGE="Deploy React app - $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
git commit -m "$COMMIT_MESSAGE"

# 推送到远程分支（使用安全的URL构建）
log_secure "WARN" "📤 推送到 GitHub..."
REMOTE_URL="https://x-access-token:$GITHUB_TOKEN@github.com/$REPOSITORY.git"

if git push --force "$REMOTE_URL" main:"$BRANCH"; then
    log_secure "INFO" "🎉 部署成功！"
    IFS='/' read -r REPO_OWNER REPO_NAME <<< "$REPOSITORY"
    log_secure "CYAN" "🔗 访问地址: https://$REPO_OWNER.github.io/$REPO_NAME/"
    log_secure "WARN" "⏰ 注意: GitHub Pages 可能需要几分钟时间更新"
else
    log_secure "ERROR" "❌ 部署失败"
    exit 1
fi