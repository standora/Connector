import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import archiver from 'archiver';

// 解决__dirname问题
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 构建输出目录
const DIST_DIR = path.join(__dirname, 'dist');
const OUTPUT_ZIP = path.join(__dirname, 'github-pages-files.zip');

async function createZipFromDist() {
  console.log('正在创建GitHub Pages部署文件...');

  // 检查dist目录是否存在
  if (!fs.existsSync(DIST_DIR)) {
    console.error('错误: dist目录不存在，请先运行npm run build');
    return;
  }

  // 创建输出zip文件
  const output = createWriteStream(OUTPUT_ZIP);
  const archive = archiver('zip', {
    zlib: { level: 9 } // 设置最高压缩级别
  });

  // 将输出流连接到归档
  archive.pipe(output);

  // 添加dist目录下的所有文件到归档
  archive.directory(DIST_DIR, false);  // false表示不包含目录本身，只包含其内容

  // 完成归档
  await archive.finalize();

  console.log(`ZIP文件已创建: ${OUTPUT_ZIP}`);
  console.log('文件大小:', (fs.statSync(OUTPUT_ZIP).size / (1024 * 1024)).toFixed(2), 'MB');
  
  console.log('\n部署步骤:');
  console.log('1. 登录GitHub并访问 https://github.com/standora/Connector');
  console.log('2. 点击 "Settings" 标签');
  console.log('3. 向下滚动到 "Pages" 部分');
  console.log('4. 在 "Source" 下拉菜单中选择 "Deploy from a branch"');
  console.log('5. 选择 "gh-pages" 分支');
  console.log('6. 如果没有gh-pages分支，需要先创建它');
  console.log('');
  console.log('或者，您可以直接将ZIP文件内容上传到仓库根目录或gh-pages分支');
}

// 检查是否安装了archiver，如果没有则提示安装
try {
  createZipFromDist();
} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND') {
    console.error('错误: 缺少必要的模块 "archiver"');
    console.log('请运行以下命令安装: npm install archiver');
    console.log('或者使用手动部署方法');
  } else {
    console.error('创建ZIP文件时出错:', error.message);
  }
}