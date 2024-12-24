import { QUOTE_ASSET, SYMBOL } from "../configs/trade-config.js";
import {
  exchangeInformationAPI,
  futuresAccountBalanceAPI,
  positionInformationAPI,
  symbolPriceTickerAPI
} from "./api.js";
import { nodeCache } from "./cache.js";

export const getStepSize = async () => {
  const exchangeInformation = await exchangeInformationAPI();
  const symbolData = exchangeInformation.symbols.find(
    (item) => item.symbol === SYMBOL
  );
  const stepSize = symbolData.filters.find(
    (filter) => filter.filterType === "LOT_SIZE"
  ).stepSize;
  return stepSize;
};

export const getAvailableBalance = async () => {
  const params = { recvWindow: 60000, timestamp: Date.now() };
  const futuresAccountBalance = await futuresAccountBalanceAPI(params);
  const availableBalance = futuresAccountBalance.find(
    ({ asset }) => asset === QUOTE_ASSET
  ).availableBalance;
  return availableBalance;
};

const getLatestPrice = async () => {
  const params = { symbol: SYMBOL };
  const symbolPriceTicker = await symbolPriceTickerAPI(params);
  return symbolPriceTicker.price;
};

const getAvailableQuantity = async () => {
  const [availableBalance, latestPrice] = await Promise.all([
    getAvailableBalance(),
    getLatestPrice()
  ]);
  const leverage = nodeCache.get("leverage");
  const availableFunds = availableBalance * leverage;
  return availableFunds / latestPrice;
};

export const getPositionInformation = async () => {
  const params = {
    symbol: SYMBOL,
    recvWindow: 60000,
    timestamp: Date.now()
  };
  const positionInformation = await positionInformationAPI(params);
  return positionInformation[0];
};

export const getPositionType = async () => {
  const positionInformation = await getPositionInformation();
  if (positionInformation === undefined) {
    return "NONE";
  }
  const positionAmt = Number(positionInformation.positionAmt);
  if (positionAmt > 0) {
    return "LONG";
  }
  if (positionAmt < 0) {
    return "SHORT";
  }
  return "NONE";
};

export const getOrderQuantity = async (orderAmountPercent) => {
  const availableQuantity = await getAvailableQuantity();
  const orderQuantity = availableQuantity * (orderAmountPercent / 100);
  return orderQuantity;
};

const getPrecisionBySize = (size) => {
  if (size === "1") {
    return 0;
  } else {
    return size.indexOf("1") - 1;
  }
};

export const formatBySize = (number, size) => {
  const precision = getPrecisionBySize(size);
  return Number(number.toFixed(precision));
};
