import { TwitterOpenApi } from "twitter-openapi-typescript";
import axios from "axios";
import { TwitterApi } from 'twitter-api-v2';
import fs from 'fs';
import config from '../config.json';

// 代理服务器URL
const PROXY_URL = config.PROXY_URL;

// 构建代理URL的辅助函数
const getProxiedUrl = (url: string) => {
  if (url.startsWith(PROXY_URL)) {
    return url;
  }
  
  return PROXY_URL ? `${PROXY_URL}${url}` : url;
};

// 修改TwitterOpenApi的静态fetchApi方法来使用代理
const originalFetchApi = TwitterOpenApi.fetchApi;
TwitterOpenApi.fetchApi = async (url: string, init?: RequestInit) => {
  // 为所有API请求添加代理URL前缀
  const proxiedUrl = getProxiedUrl(url);
  console.log(`代理请求: ${url} -> ${proxiedUrl}`);
  return originalFetchApi(proxiedUrl, init);
};

export const _xClient = async (TOKEN: string) => {
  console.log("🚀 ~ const_xClient= ~ TOKEN:", TOKEN.slice(0, 3) + "***")
  try {
    // 使用代理服务器URL
    const response = await axios.get(getProxiedUrl("https://x.com/manifest.json"), {
      headers: {
        cookie: `auth_token=${TOKEN}`,
      },
      timeout: 10000
    });

    if (response.status !== 200) {
      throw new Error(`HTTP错误! 状态: ${response.status}`);
    }

    console.log("请求成功，解析cookie");
    const cookies = response.headers['set-cookie'] || [];
    console.log("cookies", cookies);
    const cookieObj = cookies.reduce((acc: Record<string, string>, cookie: string) => {
      const [name, value] = cookie.split(";")[0].split("=");
      acc[name] = value;
      return acc;
    }, {});

    console.log("初始化TwitterOpenApi");
    const api = new TwitterOpenApi();
    
    // 创建客户端
    const client = await api.getClientFromCookies({...cookieObj, auth_token: TOKEN});
    
    console.log("已创建客户端，但X API请求需要手动添加代理前缀");
    console.log("Twitter URL: https://api.twitter.com -> 代理URL: " + getProxiedUrl("https://api.twitter.com"));
    
    return client;
  } catch (error: any) {
    console.error("请求x.com失败:", error.message);
    // 详细记录错误信息
    fs.writeFileSync('error.log', JSON.stringify({
      message: error.message,
      stack: error.stack
    }, null, 2));
    throw error;
  }
};

export const xGuestClient = () => _xClient(config.GET_ID_X_TOKEN);
export const XAuthClient = () => _xClient(config.AUTH_TOKEN);

export const login = async (AUTH_TOKEN: string) => {
  try {
    console.log("开始请求 x.com/manifest.json");
    
    const response = await axios.get(getProxiedUrl("https://x.com/manifest.json"), {
      headers: {
        cookie: `auth_token=${AUTH_TOKEN}`,
      },
      timeout: 10000
    });

    if (response.status !== 200) {
      throw new Error(`HTTP错误! 状态: ${response.status}`);
    }
    
    const cookies = response.headers['set-cookie'] || [];
    const cookie = cookies.reduce((acc: Record<string, string>, cookie: string) => {
      const [name, value] = cookie.split(";")[0].split("=");
      acc[name] = value;
      return acc;
    }, {});
    cookie.auth_token = AUTH_TOKEN;

    console.log("初始化TwitterOpenApi");
    const api = new TwitterOpenApi();
    const client = await api.getClientFromCookies(cookie);

    console.log("已创建客户端，但X API请求需要手动添加代理前缀");
    console.log("Twitter URL: https://api.twitter.com -> 代理URL: " + getProxiedUrl("https://api.twitter.com"));

    const plugin = {
      onBeforeRequest: async (params: any) => {
        params.computedParams.headers = {
          ...params.computedParams.headers,
          ...client.config.apiKey,
          'x-csrf-token': cookie.ct0,
          'x-twitter-auth-type': 'OAuth2Session',
          authorization: `Bearer ${TwitterOpenApi.bearer}`,
          cookie: api.cookieEncode(cookie),
        };
        params.requestOptions.headers = {
          ...params.requestOptions.headers,
          ...client.config.apiKey,
          'x-csrf-token': cookie.ct0,
          'x-twitter-auth-type': 'OAuth2Session',
          authorization: `Bearer ${TwitterOpenApi.bearer}`,
          cookie: api.cookieEncode(cookie),
        };
      },
    };

    const legacy = new TwitterApi('_', { plugins: [plugin] });

    return { client, legacy };
  } catch (error: any) {
    console.error("请求x.com失败:", error.message);
    throw error;
  }
}
