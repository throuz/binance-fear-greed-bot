import { getBacktestResult, getBestResult } from "./src/backtest.js";
import { getStepSize } from "./src/helpers.js";
import { getCachedFundingRateHistory } from "./src/cached-data.js";

const bestResult = await getBestResult();
if (bestResult.fund > 0) {
  console.log("==============================================================");
  const {
    currentPositionType,
    fund,
    fundingRateLongLevel,
    fundingRateShortLevel,
    leverage
  } = bestResult;

  const [cachedFundingRateHistory, stepSize] = await Promise.all([
    getCachedFundingRateHistory(),
    getStepSize()
  ]);

  getBacktestResult({
    shouldLogResults: true,
    cachedFundingRateHistory,
    stepSize,
    fundingRateLongLevel,
    fundingRateShortLevel,
    leverage
  });

  console.log("==============================================================");
  console.log("currentPositionType", currentPositionType);
  console.log("fund", fund);
  console.log("fundingRateLongLevel", fundingRateLongLevel);
  console.log("fundingRateShortLevel", fundingRateShortLevel);
  console.log("leverage", leverage);
} else {
  console.log("==============================================================");
  console.log("No result");
  console.log("==============================================================");
}
