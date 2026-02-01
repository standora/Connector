import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// 解决__dirname问题
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GitHub配置
// 使用正确的GitHub PAT令牌
const GITHUB_TOKEN = 'YOUR_GITHUB_TOKEN_HERE';
const OWNER = 'standora';
const REPO = 'Connector';
const BRANCH = 'main';

// 构建输出目录
const DIST_DIR = path.join(__dirname, 'dist');

async function uploadFileToGithub(filePath, relativePath) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${relativePath}`;
  
  const content = fs.readFileSync(filePath, 'utf8');
  const encodedContent = Buffer.from(content).toString('base64');
  
  const data = {
    message: `Deploy file: ${relativePath}`,
    content: encodedContent,
    branch: BRANCH
  };
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    console.error(`Failed to upload ${relativePath}:`, errorData);
    return false;
  }
  
  console.log(`Successfully uploaded: ${relativePath}`);
  return true;
}

async function uploadDirectory(dirPath, baseRemotePath = '') {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const localPath = path.join(dirPath, item);
    const remotePath = path.join(baseRemotePath, item).replace(/\\/g, '/');
    
    const stat = fs.statSync(localPath);
    
    if (stat.isDirectory()) {
      await uploadDirectory(localPath, remotePath);
    } else {
      // 对于图片等二进制文件，我们需要特别处理
      const ext = path.extname(item).toLowerCase();
      const binaryExts = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot'];
      
      if (binaryExts.includes(ext)) {
        // 二进制文件处理
        const fileBuffer = fs.readFileSync(localPath);
        const encodedContent = fileBuffer.toString('base64');
        
        const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${remotePath}`;
        
        const data = {
          message: `Deploy asset: ${remotePath}`,
          content: encodedContent,
          branch: BRANCH
        };
        
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error(`Failed to upload ${remotePath}:`, errorData);
        } else {
          console.log(`Successfully uploaded: ${remotePath}`);
        }
      } else {
        // 文本文件处理
        await uploadFileToGithub(localPath, remotePath);
      }
    }
  }
}

async function deployToGithubPages() {
  console.log('开始部署到GitHub...');
  
  // 检查dist目录是否存在
  if (!fs.existsSync(DIST_DIR)) {
    console.error('错误: dist目录不存在，请先运行npm run build');
    return;
  }
  
  console.log('上传构建文件到GitHub...');
  await uploadDirectory(DIST_DIR, 'dist/');
  
  console.log('文件上传完成！');
  console.log(`项目已上传到: https://github.com/${OWNER}/${REPO}`);
}

// 运行部署
deployToGithubPages().catch(console.error);