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
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; text-align: center;">
          <h2 style="color: #1e293b;">GitHub 授權成功</h2>
          <p style="color: #64748b;">正在返回 Asset Insights，請稍候...</p>
          <p style="margin-top: 20px;">
            <a href="${finalRedirectUrl}" style="color: #2563eb; text-decoration: underline;">如果沒有自動跳轉，請點擊此處</a>
          </p>
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

