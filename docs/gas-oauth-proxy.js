/**
 * Google Apps Script - GitHub OAuth Proxy for Asset Insights
 * 
 * 用途：處理 Asset Insights 的 GitHub OAuth 授權跳轉與 Token 交換。
 * 部署設定：
 *  - 部署類型：網頁應用程式 (Web app)
 *  - 執行身分：我 (Me / 您的 Google 帳號)
 *  - 存取權限：任何人 (Anyone)
 */

// GitHub OAuth App 的 Client ID (已對應 Asset Insights 專案)
const GITHUB_CLIENT_ID = 'Ov23liaxNNxcPIxmCKlD';

// GitHub OAuth App 的 Client Secret (請至 GitHub Developer Settings 取得)
// 建議設定在 Apps Script 的「專案設定 -> 指令碼屬性 (Script Properties)」中，KEY 為 GITHUB_CLIENT_SECRET
// 若圖方便亦可直接替換下方的字串
const GITHUB_CLIENT_SECRET = 
  PropertiesService.getScriptProperties().getProperty('GITHUB_CLIENT_SECRET') || 
  'YOUR_GITHUB_CLIENT_SECRET_HERE';

// 預設轉回的前端網址
const DEFAULT_REDIRECT_URL = 'https://winnielineer.github.io/asset-insights/';

function doGet(e) {
  const code = e.parameter.code;
  const state = e.parameter.state; // 若前端有帶 state，可動態轉回當前網址 (包含 localhost)
  const targetUrl = state ? decodeURIComponent(state) : DEFAULT_REDIRECT_URL;

  if (!code) {
    return HtmlService.createHtmlOutput(
      '<h3>[Asset Insights OAuth Proxy] 授權失敗：未接收到授權碼 (code)。</h3>'
    );
  }

  try {
    // 呼叫 GitHub API 交換 access_token
    const tokenResponse = UrlFetchApp.fetch('https://github.com/login/oauth/access_token', {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Accept': 'application/json'
      },
      payload: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code: code
      }),
      muteHttpExceptions: true
    });

    const tokenData = JSON.parse(tokenResponse.getContentText());
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return HtmlService.createHtmlOutput(`
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; text-align: center;">
          <h3 style="color: #dc2626;">❌ GitHub 授權交換失敗</h3>
          <pre style="text-align: left; background: #f1f5f9; padding: 16px; border-radius: 8px; overflow: auto;">${JSON.stringify(tokenData, null, 2)}</pre>
        </div>
      `).setTitle('GitHub 授權失敗');
    }

    // 拼裝回跳前端的網址，帶上 gh_token 參數
    const separator = targetUrl.includes('?') ? '&' : '?';
    const finalRedirectUrl = `${targetUrl}${separator}gh_token=${encodeURIComponent(accessToken)}`;

    return HtmlService.createHtmlOutput(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>GitHub 授權成功</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex; align-items: center; justify-content: center; min-height: 90vh;
              margin: 0; background-color: #f8fafc; color: #0f172a; padding: 20px;
            }
            .card {
              background: #ffffff; padding: 36px 28px; border-radius: 20px;
              box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); text-align: center;
              max-width: 440px; width: 100%; border: 1px solid #e2e8f0;
            }
            .icon { width: 56px; height: 56px; background: #ecfdf5; color: #059669; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 28px; margin-bottom: 20px; font-weight: bold; }
            h2 { margin: 0 0 10px; font-size: 20px; font-weight: 800; color: #0f172a; }
            p { margin: 0 0 24px; color: #64748b; font-size: 14px; line-height: 1.6; }
            .btn { display: block; width: 100%; background: #0f172a; color: #ffffff !important; text-decoration: none; padding: 14px 24px; border-radius: 12px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 12px rgba(15,23,42,0.15); }
          </style>
          <script>
            try {
              if (window.top && window.top !== window) {
                window.top.location.href = "${finalRedirectUrl}";
              }
            } catch (e) {}
          </script>
        </head>
        <body>
          <div class="card">
            <div class="icon">✓</div>
            <h2>GitHub 授權成功</h2>
            <p>已成功取得授權金鑰！請點擊下方按鈕返回 Asset Insights：</p>
            <a href="${finalRedirectUrl}" target="_top" class="btn">返回 ASSET INSIGHTS</a>
          </div>
        </body>
      </html>
    `).setTitle('Asset Insights - GitHub 授權成功');

  } catch (err) {
    return HtmlService.createHtmlOutput(
      `<h3>Proxy 執行錯誤：</h3><p>${err.toString()}</p>`
    );
  }
}
