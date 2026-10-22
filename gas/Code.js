/**
 * Google Apps Script - Unified Proxy (Stock Market & GitHub OAuth) for Asset Insights
 * 
 * 功能：
 * 1. 股票與加密貨幣價格批次平行抓取 (Yahoo Finance)
 * 2. GitHub OAuth 登入授權代理與 Token 交換
 */

const GITHUB_CLIENT_ID = 'Ov23liaxNNxcPIxmCKlD';
const GITHUB_CLIENT_SECRET = 
  PropertiesService.getScriptProperties().getProperty('GITHUB_CLIENT_SECRET') || 
  'YOUR_GITHUB_CLIENT_SECRET_HERE';
const DEFAULT_REDIRECT_URL = 'https://winnielineer.github.io/asset-insights/';

function doGet(e) {
  const params = (e && e.parameter) || {};

  // 1. 處理 GitHub OAuth 授權回跳
  if (params.code) {
    return handleGitHubOAuth(params);
  }

  // 2. 處理股票/加密貨幣即時與歷史價格批次代理
  if (params.symbols) {
    return handleStockFetch(params);
  }

  // 3. 處理資產搜尋與自動完成 (Autocomplete)
  if (params.q) {
    return handleSearch(params.q);
  }

  // 3. 通用 URL 轉發 (若有需要)
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
      return HtmlService.createHtmlOutput(`
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; text-align: center;">
          <h3 style="color: #dc2626;">❌ GitHub 授權交換失敗</h3>
          <pre style="text-align: left; background: #f1f5f9; padding: 16px; border-radius: 8px; overflow: auto;">${JSON.stringify(tokenData, null, 2)}</pre>
        </div>
      `).setTitle('GitHub 授權失敗');
    }

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
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 90vh;
              margin: 0;
              background-color: #f8fafc;
              color: #0f172a;
              padding: 20px;
            }
            .card {
              background: #ffffff;
              padding: 36px 28px;
              border-radius: 20px;
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03);
              text-align: center;
              max-width: 440px;
              width: 100%;
              border: 1px solid #e2e8f0;
            }
            .icon {
              width: 56px;
              height: 56px;
              background: #ecfdf5;
              color: #059669;
              border-radius: 50%;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-size: 28px;
              margin-bottom: 20px;
              font-weight: bold;
            }
            h2 { margin: 0 0 10px; font-size: 20px; font-weight: 800; color: #0f172a; }
            p { margin: 0 0 24px; color: #64748b; font-size: 14px; line-height: 1.6; }
            .btn {
              display: block;
              width: 100%;
              background: #0f172a;
              color: #ffffff !important;
              text-decoration: none;
              padding: 14px 24px;
              border-radius: 12px;
              font-weight: 700;
              font-size: 14px;
              letter-spacing: 0.05em;
              box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
              transition: all 0.2s ease;
            }
            .btn:hover { background: #1e293b; transform: translateY(-1px); }
          </style>
          <script>
            // 嘗試跳出 Google Apps Script iframe 轉跳頂層視窗
            try {
              if (window.top && window.top !== window) {
                window.top.location.href = "${finalRedirectUrl}";
              }
            } catch (e) {
              console.log('Top navigation blocked by sandbox:', e);
            }
          </script>
        </head>
        <body>
          <div class="card">
            <div class="icon">✓</div>
            <h2>GitHub 授權成功</h2>
            <p>已成功取得授權金鑰！請點擊下方按鈕返回 Asset Insights 繼續使用：</p>
            <a href="${finalRedirectUrl}" target="_top" class="btn">返回 ASSET INSIGHTS</a>
          </div>
        </body>
      </html>
    `).setTitle('Asset Insights - GitHub 授權成功');
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

// 處理 Yahoo Finance 搜尋與自動完成
function handleSearch(query) {
  try {
    const targetUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}`;
    const resp = UrlFetchApp.fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      muteHttpExceptions: true
    });
    const data = JSON.parse(resp.getContentText());
    const quotes = data.quotes || [];

    const result = {
      ResultSet: {
        Query: query,
        Result: quotes.map(q => ({
          symbol: q.symbol,
          name: q.longname || q.shortname || q.symbol,
          exch: q.exchange,
          type: q.quoteType,
          exchDisp: q.exchDisp || q.exchange,
          typeDisp: q.typeDisp || q.quoteType
        }))
      }
    };

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      ResultSet: { Result: [] },
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

