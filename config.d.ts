declare module "*/config.json" {
  interface Config {
    AUTH_TOKEN: string;
    GET_ID_X_TOKEN: string;
    PROXY_URL: string;
  }
  const config: Config;
  export default config;
} 