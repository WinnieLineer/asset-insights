# **App Name**: Asset Insights

## Core Features:

- Asset Definition: Define and categorize different asset types: stocks (e.g., QQQ, VTI, SCHG), cryptocurrencies (e.g., BTC, ETH), bank cash (TWD/USD), and fixed deposits with interest rates.
- API Data Fetching: Automatically update asset prices and exchange rates by fetching data from external APIs such as ExchangeRate-API (USD/TWD), CoinGecko (crypto prices), and potentially Polygon.io (US stocks) or manual price input.
- Asset Allocation Display: Calculate and display the allocation ratio between stocks, crypto, and bank assets using a pie chart, converting foreign currencies to TWD based on real-time exchange rates.
- Data Persistence with LocalStorage: Persist all asset holdings and bank balances in the browser's local storage to prevent data loss on refresh.
- Historical Snapshots: Provide a button to save a snapshot of the current total assets and date to local storage for historical tracking.
- Historical Asset Trend: Visualize the historical trend of total assets using a line chart, displaying data from stored snapshots.
- AI-Powered Financial Tooltip: Generate contextually relevant tips for users, powered by an LLM. This tool may include advice on diversification, potential risks, or alternative investment strategies based on the user's current portfolio and market conditions.

## Style Guidelines:

- Primary color: Deep blue (#3F51B5) to convey stability and trust.
- Background color: Light gray (#F0F2F5), subtly desaturated from the primary hue to keep it unobtrusive.
- Accent color: Orange-red (#FF4500), analogous to the primary and offset in brightness and saturation to stand out for key interactive elements.
- Body font: 'Inter', a grotesque sans-serif, for a modern, neutral, machined feel, suited to body text.
- Headline font: 'Space Grotesk', a proportional sans-serif, giving the interface a techy look.
- Lucide React icons to maintain a consistent and clean interface.
- Dashboard layout with clear sections for asset overview, allocation, and historical data.
- Subtle transitions and animations on data updates to enhance user experience.