#!/usr/bin/env node
/**
 * React 应用安全部署脚本 (Node.js)
 * 增强安全版本 - 包含输入验证和安全检查
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 配置
const config = {
    githubToken: process.env.GITHUB_TOKEN || '',
    repository: process.env.REPOSITORY || 'standora/Connector',
    branch: process.env.BRANCH || 'gh-pages',
    dryRun: process.env.DRY_RUN === 'true'
};

// 颜色定义
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

/**
 * 安全日志函数 - 移除敏感信息
 */
function logSecure(level, message) {
    // 移除可能的敏感信息
    const safeMessage = message
        .replace(/ghp_[a-zA-Z0-9]{36}/g, '***TOKEN***')
        .replace(/github_pat_[a-zA-Z0-9_]{82}/g, '***TOKEN***');
    
    const color = colors[level] || colors.reset;
    console.log(`${color}${safeMessage}${colors.reset}`);
}

/**
 * 验证GitHub Token格式
 */
function validateGitHubToken(token) {
    if (!token) return false;
    return /^(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{82})$/.test(token);
}

/**
 * 验证仓库名称格式
 */
function validateRepository(repo) {
    return /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/.test(repo);
}

/**
 * 验证分支名称格式
 */
function validateBranch(branch) {
    return /^[a-zA-Z0-9_.-]+$/.test(branch);
}

/**
 * 运行命令的安全包装器
 */
function runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
        const safeCommand = `${command} ${args.join(' ')}`;
        logSecure('cyan', `执行: ${safeCommand}`);
        
        const child = spawn(command, args, {
            stdio: options.silent ? 'pipe' : 'inherit',
            cwd: options.cwd || process.cwd(),
            ...options
        });

        let stdout = '';
        let stderr = '';

        if (options.silent) {
            child.stdout?.on('data', (data) => {
                stdout += data.toString();
            });
            child.stderr?.on('data', (data) => {
                stderr += data.toString();
            });
        }

        child.on('close', (code) => {
            if (code === 0) {
                resolve({ stdout, stderr });
            } else {
                reject(new Error(`命令失败 (退出码 ${code}): ${safeCommand}\n${stderr}`));
            }
        });

        child.on('error', (error) => {
            reject(new Error(`命令执行错误: ${error.message}`));
        });
    });
}

/**
 * 检查命令是否存在
 */
async function checkCommand(command, installHint) {
    try {
        await runCommand(command, ['--version'], { silent: true });
        return true;
    } catch (error) {
        logSecure('red', `❌ 错误: ${command} 未安装`);
        logSecure('yellow', `💡 ${installHint}`);
        return false;
    }
}

/**
 * 生成安全的随机字符串
 */
function generateRandomString(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * 清理临时目录
 */
async function cleanup(tempDir) {
    if (tempDir) {
        try {
            await fs.rm(tempDir, { recursive: true, force: true });
            logSecure('green', '🧹 清理完成');
        } catch (error) {
            logSecure('yellow', `清理警告: ${error.message}`);
        }
    }
}

/**
 * 主部署函数
 */
async function deploy() {
    let tempDir = null;
    
    try {
        logSecure('green', '🚀 开始安全部署 React 应用到 GitHub Pages...');

        // 安全检查：验证Token
        if (!validateGitHubToken(config.githubToken)) {
            logSecure('red', '❌ 错误: GitHub Token 无效或未设置');
            logSecure('yellow', '💡 安全设置方法:');
            logSecure('cyan', '   1. 访问 https://github.com/settings/tokens');
            logSecure('cyan', '   2. 创建新的 Personal Access Token (推荐使用 Fine-grained tokens)');
            logSecure('cyan', '   3. 选择最小必要权限: Contents (write), Metadata (read), Pages (write)');
            logSecure('cyan', '   4. 设置环境变量: export GITHUB_TOKEN=\'your_token_here\'');
            logSecure('cyan', '   5. 验证Token格式: ghp_xxxx 或 github_pat_xxxx');
            process.exit(1);
        }

        // 安全检查：验证仓库名称
        if (!validateRepository(config.repository)) {
            logSecure('red', `❌ 错误: 仓库名称格式无效: ${config.repository}`);
            process.exit(1);
        }

        // 安全检查：验证分支名称
        if (!validateBranch(config.branch)) {
            logSecure('red', `❌ 错误: 分支名称格式无效: ${config.branch}`);
            process.exit(1);
        }

        // 检查必要的命令
        const commandChecks = [
            ['git', '请安装 Git: https://git-scm.com/'],
            ['node', '请安装 Node.js: https://nodejs.org/'],
            ['npm', '请安装 npm (通常与 Node.js 一起安装)']
        ];

        for (const [command, hint] of commandChecks) {
            if (!(await checkCommand(command, hint))) {
                process.exit(1);
            }
        }

        // 获取版本信息
        const gitVersion = await runCommand('git', ['--version'], { silent: true });
        const nodeVersion = await runCommand('node', ['--version'], { silent: true });
        const npmVersion = await runCommand('npm', ['--version'], { silent: true });
        
        logSecure('green', `✅ Git: ${gitVersion.stdout.trim()}`);
        logSecure('green', `✅ Node.js: ${nodeVersion.stdout.trim()}, npm: ${npmVersion.stdout.trim()}`);

        // 安全检查：验证package.json存在
        try {
            await fs.access('package.json');
        } catch (error) {
            logSecure('red', '❌ 错误: package.json 不存在');
            process.exit(1);
        }

        // 构建项目
        logSecure('yellow', '🔨 构建项目...');
        await runCommand('npm', ['run', 'build']);
        logSecure('green', '✅ 构建成功');

        // 检查构建输出
        try {
            const distStats = await fs.stat('dist');
            if (!distStats.isDirectory()) {
                throw new Error('dist 不是目录');
            }
        } catch (error) {
            logSecure('red', '❌ 错误: dist 目录不存在');
            process.exit(1);
        }

        // 验证构建输出内容
        const distFiles = await fs.readdir('dist', { recursive: true });
        const fileCount = distFiles.length;
        
        if (fileCount === 0) {
            logSecure('red', '❌ 错误: dist 目录为空');
            process.exit(1);
        }

        logSecure('green', `✅ 构建输出验证通过，包含 ${fileCount} 个文件`);

        // 干运行模式检查
        if (config.dryRun) {
            logSecure('yellow', '🔍 干运行模式：跳过实际部署');
            logSecure('green', '✅ 所有检查通过，可以进行实际部署');
            return;
        }

        // 创建安全的临时目录
        const timestamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15);
        const randomSuffix = generateRandomString();
        tempDir = `temp_deploy_${timestamp}_${randomSuffix}`;

        await fs.mkdir(tempDir);
        
        // 复制构建文件
        const distPath = resolve('dist');
        const tempPath = resolve(tempDir);
        
        const copyRecursive = async (src, dest) => {
            const entries = await fs.readdir(src, { withFileTypes: true });
            
            for (const entry of entries) {
                const srcPath = join(src, entry.name);
                const destPath = join(dest, entry.name);
                
                if (entry.isDirectory()) {
                    await fs.mkdir(destPath, { recursive: true });
                    await copyRecursive(srcPath, destPath);
                } else {
                    await fs.copyFile(srcPath, destPath);
                }
            }
        };
        
        await copyRecursive(distPath, tempPath);

        // 进入临时目录并配置Git
        process.chdir(tempDir);

        await runCommand('git', ['init', '--initial-branch=main']);
        await runCommand('git', ['config', 'user.name', 'Automated Deployment']);
        await runCommand('git', ['config', 'user.email', 'noreply@github.com']);
        await runCommand('git', ['config', 'core.autocrlf', 'false']);
        await runCommand('git', ['config', 'core.safecrlf', 'false']);

        // 添加文件并提交
        await runCommand('git', ['add', '.']);
        const commitMessage = `Deploy React app - ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC`;
        await runCommand('git', ['commit', '-m', commitMessage]);

        // 推送到远程分支
        logSecure('yellow', '📤 推送到 GitHub...');
        const remoteUrl = `https://x-access-token:${config.githubToken}@github.com/${config.repository}.git`;
        await runCommand('git', ['push', '--force', remoteUrl, `main:${config.branch}`]);

        logSecure('green', '🎉 部署成功！');
        const [repoOwner, repoName] = config.repository.split('/');
        logSecure('cyan', `🔗 访问地址: https://${repoOwner}.github.io/${repoName}/`);
        logSecure('yellow', '⏰ 注意: GitHub Pages 可能需要几分钟时间更新');

    } catch (error) {
        logSecure('red', `❌ 部署失败: ${error.message}`);
        process.exit(1);
    } finally {
        // 返回原目录并清理
        process.chdir(__dirname);
        await cleanup(tempDir);
    }
}

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
    logSecure('red', `未捕获的异常: ${error.message}`);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logSecure('red', `未处理的Promise拒绝: ${reason}`);
    process.exit(1);
});

// 运行部署
deploy();