import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log("检测到认证失败，这通常意味着GitHub Personal Access Token存在问题。);
console.log("以下是解决问题的步骤：");

console.log("\n1. 检查令牌类型：");
console.log("   您的令牌可能是 Fine-grained PAT，需要确保权限设置正确");

console.log("\n2. 权限要求：");
console.log("   - 必须有 'Contents' 权限 - Read & Write");
console.log("   - 必须有 'Metadata' 权限 - Read-only（默认）");
console.log("   - 必须关联到 standora/Connector 仓库");

console.log("\n3. 建议操作：");
console.log("   a) 访问 https://github.com/settings/tokens?type=beta");
console.log("   b) 检查您的令牌");
console.log("   c) 确认它具有正确的仓库权限");
console.log("   d) 如需重新创建，请确保勾选 'Contents' 的 Read & Write 权限");

console.log("\n4. 或者，您可以创建 classic PAT (ghp_... 格式)：");
console.log("   a) 访问 https://github.com/settings/tokens");
console.log("   b) 点击 'Generate new token' -> 'Generate new token (classic)'");
console.log("   c) 选择 repo, workflow, public_repo 等权限");
console.log("   d) 替换 GITHUB_TOKEN");

console.log("\n5. 一旦令牌问题解决，您就可以使用以下命令部署：");
console.log("   npm run deploy");

console.log("\n6. 您的项目当前构建文件位于：");
console.log("   d:/Demo/连接器/web/dist");

console.log("\n请注意：");
console.log("- 令牌是新式的 Fine-grained PAT");
console.log("- 这种令牌需要精确的仓库权限分配");
console.log("- 您需要确保令牌被授权给 standora/Connector 仓库");