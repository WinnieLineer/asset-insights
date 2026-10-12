/**
 * Google Apps Script - Stock Price Proxy (Yahoo Finance) for Asset Insights
 * 
 * 用途：批次代理抓取 Yahoo Finance 的即時與歷史股價/加密貨幣數據，解決瀏覽器端 CORS 限制。
 * 部署設定：
 *  - 部署類型：網頁應用程式 (Web app)
 *  - 執行身分：我 (Me / 您的 Google 帳號)
 *  - 存取權限：任何人 (Anyone)
 */

function doGet(e) {
  try {
    const params = e.parameter || {};
    const symbolsParam = params.symbols || '';

    if (!symbolsParam) {
      return ContentService.createTextOutput(
        JSON.stringify({ error: 'Missing required parameter: symbols' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const symbols = symbolsParam.split(',').map(s => s.trim()).filter(Boolean);
    const period1 = params.period1;
    const period2 = params.period2;
    const interval = params.interval || '1d';

    // 構建批次請求
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

    // 利用 GAS 的 fetchAll 進行極速平行並發請求
    const responses = UrlFetchApp.fetchAll(requests);
    
    const results = responses.map(res => {
      try {
        return JSON.parse(res.getContentText());
      } catch (err) {
        return { error: 'Failed to parse JSON', raw: res.getContentText() };
      }
    });

    return ContentService.createTextOutput(JSON.stringify(results))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
