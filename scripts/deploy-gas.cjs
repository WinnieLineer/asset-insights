const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const claspJsonPath = path.resolve(__dirname, '../.clasp.json');

if (!fs.existsSync(claspJsonPath)) {
  console.error('\n❌ 找不到 .clasp.json 設定檔！');
  console.error('👉 請先執行以下指令之一來綁定或建立 Apps Script 專案：');
  console.error('   1. 綁定現有專案：npx @google/clasp clone <SCRIPT_ID> --rootDir ./gas');
  console.error('   2. 建立全新專案：npx @google/clasp create --title "Asset Insights Proxy" --type webapp --rootDir ./gas\n');
  process.exit(1);
}

const npxCmd = process.platform === 'win32' ? 'npx.cmd -y' : 'npx -y';

try {
  const claspConfig = JSON.parse(fs.readFileSync(claspJsonPath, 'utf8'));

  console.log('🚀 正在推送程式碼至 Google Apps Script...');
  execSync(`${npxCmd} @google/clasp push --force`, { stdio: 'inherit' });

  let deploymentId = claspConfig.deploymentId;

  if (!deploymentId) {
    try {
      const output = execSync(`${npxCmd} @google/clasp deployments`, { encoding: 'utf8' });
      const lines = output.split('\n').filter(l => l.includes('- AKfyc') && !l.includes('@HEAD'));
      if (lines.length > 0) {
        const match = lines[lines.length - 1].match(/AKfyc[a-zA-Z0-9_-]+/);
        if (match) {
          deploymentId = match[0];
          claspConfig.deploymentId = deploymentId;
          fs.writeFileSync(claspJsonPath, JSON.stringify(claspConfig, null, 2));
          console.log(`✨ 自動抓取到 Deployment ID 並寫入 .clasp.json: ${deploymentId}`);
        }
      }
    } catch (e) {}
  }

  if (deploymentId) {
    console.log(`📦 更新現有部署作業: ${deploymentId}`);
    execSync(`${npxCmd} @google/clasp deploy -i ${deploymentId} -d "Auto deploy on ${new Date().toLocaleString('zh-TW')}"`, { stdio: 'inherit' });
    console.log(`\n🎉 部署完成！您的 Web App 網址為：\n👉 https://script.google.com/macros/s/${deploymentId}/exec\n`);
  } else {
    console.log('📦 尚未建立部署作業，正在建立全新部署...');
    const deployOut = execSync(`${npxCmd} @google/clasp deploy -d "Initial Web App Deployment"`, { encoding: 'utf8' });
    console.log(deployOut);
    const match = deployOut.match(/- (AKfyc[a-zA-Z0-9_-]+)/);
    if (match) {
      claspConfig.deploymentId = match[1];
      fs.writeFileSync(claspJsonPath, JSON.stringify(claspConfig, null, 2));
      console.log(`\n🎉 全新部署完成！Web App 網址為：\n👉 https://script.google.com/macros/s/${match[1]}/exec\n`);
    }
  }
} catch (err) {
  console.error('❌ 部署過程發生錯誤：', err.message);
  process.exit(1);
}
