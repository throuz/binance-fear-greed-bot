import { getBacktestResult, getBestResult } from "./src/backtest.js";
import { getStepSize } from "./src/helpers.js";
import { getCachedFearAndGreedHistory } from "./src/cached-data.js";

const bestResult = await getBestResult();
if (bestResult.fund > 0) {
  console.log("==============================================================");
  const {
    currentPositionType,
    fund,
    fearAndGreedLongLevel,
    fearAndGreedShortLevel,
    leverage
  } = bestResult;

  const [cachedFearAndGreedHistory, stepSize] = await Promise.all([
    getCachedFearAndGreedHistory(),
    getStepSize()
  ]);

  getBacktestResult({
    shouldLogResults: true,
    cachedFearAndGreedHistory,
    stepSize,
    fearAndGreedLongLevel,
    fearAndGreedShortLevel,
    leverage
  });

  console.log("==============================================================");
  console.log("currentPositionType", currentPositionType);
  console.log("fund", fund);
  console.log("fearAndGreedLongLevel", fearAndGreedLongLevel);
  console.log("fearAndGreedShortLevel", fearAndGreedShortLevel);
  console.log("leverage", leverage);
} else {
  console.log("==============================================================");
  console.log("No result");
  console.log("==============================================================");
}
