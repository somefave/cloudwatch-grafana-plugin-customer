#!/usr/bin/env node
// 打包脚本：生成正式或 beta 版本的发布 zip
// 用法：node scripts/pack.js [--beta]
// - 正式: ucloud-cloudwatch-monitor-{version}.zip
// - beta: ucloud-cloudwatch-monitor-{version}-beta-YYYYMMDD-{seq}.zip
//   seq 在同一天内自动从 1 递增，扫描根目录已有 beta 包后取最大值 + 1

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const isBeta = process.argv.includes('--beta');
const root = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const name = pkg.name;
const version = pkg.version;

const distDir = path.join(root, 'dist');
const docFile = '用户使用文档.md';
const docSrc = path.join(root, 'src', docFile);
const docDest = path.join(distDir, docFile);

if (!fs.existsSync(docSrc)) {
  console.error(`✗ 未找到 ${docFile}，请先创建该文件`);
  process.exit(1);
}
fs.copyFileSync(docSrc, docDest);

const manifestFile = path.join(distDir, 'go_plugin_build_manifest');
if (fs.existsSync(manifestFile)) {
  fs.rmSync(manifestFile);
}

function computeBetaName() {
  const now = new Date();
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const prefix = `${name}-${version}-beta-${ymd}-`;
  const re = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\d+)\\.zip$`);
  let maxSeq = 0;
  for (const f of fs.readdirSync(root)) {
    const m = f.match(re);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > maxSeq) maxSeq = n;
    }
  }
  return `${prefix}${maxSeq + 1}.zip`;
}

const zipName = isBeta ? computeBetaName() : `${name}-${version}.zip`;
const zipPath = path.join(root, zipName);

if (fs.existsSync(zipPath)) fs.rmSync(zipPath);

execSync(`zip -r "${zipPath}" . -x "*.map"`, { cwd: distDir, stdio: 'inherit' });

console.log(`\n✅ Done: ${zipName}`);
