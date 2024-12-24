# Binance Fear Greed Bot

A trading bot for Binance that uses fear and greed index data to make trading decisions. This bot analyzes fear and greed index history to determine optimal times to go long and automatically backtests a range of predefined parameters to find the best trading strategies.

## Features

- Monitors fear and greed index history for specified trading pairs.
- Executes long trades based on fear and greed index thresholds.
- Automatically backtests a range of parameters to determine optimal trading settings.
- Configurable trading strategies and risk management.
- Real-time logging of trading activities.

## Prerequisites

- Node.js (version 14 or higher)
- npm (Node Package Manager)
- Binance account with API keys

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/throuz/binance-fear-greed-bot.git
   ```

2. Navigate to the project directory:

   ```bash
   cd binance-fear-greed-bot
   ```

3. Install the required dependencies:

   ```bash
   npm install
   ```

4. Create a `env-config-real.js` file in the `configs` directory and add your Binance API keys:

   ```javascript
   export const API_KEY = "Your binance api key";
   export const SECRET_KEY = "Your binance secret key";
   export const REST_BASEURL = "Your binance api base url"; // https://fapi.binance.com
   export const LINE_NOTIFY_TOKEN = "Your line notify token";
   ```

## Configuration

1. Open `trade-config.js` in the `configs` directory and configure the settings:

   ```javascript
   export const SYMBOL = "BTCUSDT";
   export const QUOTE_ASSET = "USDT";
   export const ORDER_AMOUNT_PERCENT = 100; // 100%
   export const KLINE_INTERVAL = "1h";
   export const KLINE_LIMIT = 1500;
   export const FEAR_AND_GREED_LONG_LEVEL = 10;
   export const FEAR_AND_GREED_SHORT_LEVEL = 91;
   export const LEVERAGE = 1;

   // Backtest parameters
   export const INITIAL_FUNDING = 100;
   export const FEE = 0.0005; // 0.05%
   export const FUNDING_RATE = 0.0001; // 0.01%
   export const LEVERAGE_SETTING = { min: 1, max: 1, step: 1 };
   export const RANDOM_SAMPLE_NUMBER = null; // number or null
   export const KLINE_START_TIME = getTimestampYearsAgo(10); // timestamp or null
   export const IS_KLINE_START_TIME_TO_NOW = true;
   ```

## Usage

1. Start the bot:

   ```bash
   npm run app:real
   ```

2. The bot will first perform backtesting using the predefined parameter ranges to find the optimal settings.
3. After backtesting, it will use the best parameters to monitor RSI values and execute trades based on the configured thresholds.

## Backtesting

The bot performs automated backtesting of parameter combinations to optimize trading performance. It evaluates the historical profitability of each strategy based on the fear and greed index and market conditions.

## Contributing

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -am 'Add new feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Create a new Pull Request.

## License

This project is licensed under the MIT License. See the [LICENSE](https://opensource.org/licenses/MIT) file for details.

## Disclaimer

This bot is for educational purposes only. Use it at your own risk. Make sure to thoroughly test and validate strategies before using real funds. The author is not responsible for any financial losses incurred from using this bot.
