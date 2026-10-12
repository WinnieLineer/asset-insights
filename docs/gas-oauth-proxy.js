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
      return HtmlService.createHtmlOutput(
        `<h3>GitHub 授權交換失敗：</h3><pre>${JSON.stringify(tokenData, null, 2)}</pre>`
      );
    }

    // 拼裝回跳前端的網址，帶上 gh_token 參數
    const separator = targetUrl.includes('?') ? '&' : '?';
    const finalRedirectUrl = `${targetUrl}${separator}gh_token=${encodeURIComponent(accessToken)}`;

    // 透過 HTML 自動轉跳回前端
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>正在轉跳回 Asset Insights...</title>
          <script>
            window.location.replace("${finalRedirectUrl}");
          </script>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; text-align: center;">
          <h2 style="color: #1e293b;">GitHub 授權成功</h2>
          <p style="color: #64748b;">正在返回 Asset Insights，請稍候...</p>
          <p style="margin-top: 20px;">
            <a href="${finalRedirectUrl}" style="color: #2563eb; text-decoration: underline;">如果沒有自動跳轉，請點擊此處</a>
          </p>
        </body>
      </html>
    `;

    return HtmlService.createHtmlOutput(html);

  } catch (err) {
    return HtmlService.createHtmlOutput(
      `<h3>Proxy 執行錯誤：</h3><p>${err.toString()}</p>`
    );
  }
}
