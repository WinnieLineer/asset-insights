/**
 * Google Apps Script - Unified Proxy (Stock Market & GitHub OAuth) for Asset Insights
 * 
 * ✨ 推薦：此腳本同時整合了「Yahoo Finance 股價代理」與「GitHub OAuth 登入轉址」，
 * 只需要在 Apps Script 部署一次，就能同時解決股價抓取與 GitHub 登入問題！
 * 
 * 部署設定：
 *  - 部署類型：網頁應用程式 (Web app)
 *  - 執行身分：我 (Me / 您的 Google 帳號)
 *  - 存取權限：任何人 (Anyone)
 */

const GITHUB_CLIENT_ID = 'Ov23liaxNNxcPIxmCKlD';
const GITHUB_CLIENT_SECRET = 
  PropertiesService.getScriptProperties().getProperty('GITHUB_CLIENT_SECRET') || 
  'YOUR_GITHUB_CLIENT_SECRET_HERE';
const DEFAULT_REDIRECT_URL = 'https://winnielineer.github.io/asset-insights/';

function doGet(e) {
  const params = (e && e.parameter) || {};

  // ==========================================
  // 功能 1：處理 GitHub OAuth 授權回跳
  // ==========================================
  if (params.code) {
    return handleGitHubOAuth(params);
  }

  // ==========================================
  // 功能 2：處理股票/加密貨幣即時與歷史價格批次代理
  // ==========================================
  if (params.symbols) {
    return handleStockFetch(params);
  }

  // ==========================================
  // 功能 3：通用 URL 轉發 (可選)
  // ==========================================
  if (params.url) {
    try {
      const resp = UrlFetchApp.fetch(decodeURIComponent(params.url), {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        muteHttpExceptions: true
      });
      return ContentService.createTextOutput(resp.getContentText())
        .setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: 'online',
    message: 'Asset Insights Unified Proxy is running!',
    endpoints: {
      stock: '?symbols=2330.TW,AAPL&period1=...&period2=...&interval=1d',
      oauth: '?code=...'
    }
  })).setMimeType(ContentService.MimeType.JSON);
}

// 處理 GitHub OAuth Token 交換
function handleGitHubOAuth(params) {
  const code = params.code;
  const state = params.state;
  const targetUrl = state ? decodeURIComponent(state) : DEFAULT_REDIRECT_URL;

  try {
    const tokenResponse = UrlFetchApp.fetch('https://github.com/login/oauth/access_token', {
      method: 'post',
      contentType: 'application/json',
      headers: { 'Accept': 'application/json' },
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
      return HtmlService.createHtmlOutput(`<h3>GitHub 授權交換失敗：</h3><pre>${JSON.stringify(tokenData, null, 2)}</pre>`);
    }

    const separator = targetUrl.includes('?') ? '&' : '?';
    const finalRedirectUrl = `${targetUrl}${separator}gh_token=${encodeURIComponent(accessToken)}`;

    return HtmlService.createHtmlOutput(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>轉跳中...</title>
          <script>window.location.replace("${finalRedirectUrl}");</script>
        </head>
        <body style="font-family: sans-serif; padding: 40px; text-align: center;">
          <h2>GitHub 授權成功</h2>
          <p>正在返回 Asset Insights...</p>
          <a href="${finalRedirectUrl}">點此返回</a>
        </body>
      </html>
    `);
  } catch (err) {
    return HtmlService.createHtmlOutput(`<h3>OAuth 錯誤：</h3><p>${err.toString()}</p>`);
  }
}

// 處理 Yahoo Finance 批次平行請求
function handleStockFetch(params) {
  try {
    const symbols = params.symbols.split(',').map(s => s.trim()).filter(Boolean);
    const period1 = params.period1;
    const period2 = params.period2;
    const interval = params.interval || '1d';

    const requests = symbols.map(symbol => {
      let targetUrl = '';
      if (period1 && period2) {
        targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${period1}&period2=${period2}&interval=${interval}`;
      } else {
        targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
      }

      return {
        url: targetUrl,
        method: 'get',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        muteHttpExceptions: true
      };
    });

    const responses = UrlFetchApp.fetchAll(requests);
    const results = responses.map(res => {
      try {
        return JSON.parse(res.getContentText());
      } catch (e) {
        return { error: 'Failed to parse', content: res.getContentText() };
      }
    });

    return ContentService.createTextOutput(JSON.stringify(results))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
