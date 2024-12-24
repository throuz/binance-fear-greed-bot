import * as envConfigMock from "./env-config-mock.js";
import * as envConfigReal from "./env-config-real.js";

const envConfig =
  process.env.NODE_ENV === "real" ? envConfigReal : envConfigMock;

const { API_KEY, SECRET_KEY, REST_BASEURL, LINE_NOTIFY_TOKEN } = envConfig;

export { API_KEY, SECRET_KEY, REST_BASEURL, LINE_NOTIFY_TOKEN };
