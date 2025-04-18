#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import config from "./config.json";
// import { z } from "zod";
import { fetchTweets } from "./scripts";

if (!config.logging?.enableConsoleLog) {
  // 禁用所有控制台输出
  console.log = () => {};
  console.error = () => {};
  console.warn = () => {};
  console.info = () => {};
  console.debug = () => {};
}

const promptTemplate = `请根据以下电竞相关推文数据生成分析报告，重点关注战队人员变动、赛事进展与结果、选手动态等方面：
梳理战队人员变动情况，包括选手加入、离开、转会等，说明对战队实力的潜在影响，如 m0NESY 离开 G2 加入 Falcons，degster 被 Falcons 板凳等事件。
总结近期赛事的关键进展，如欧洲 MRQ 各轮次的比赛结果、重要对决，以及 PGL Bucharest 的比赛进程和最终排名。
分析选手动态，例如 degster 获得 MVP，m0NESY 在比赛中的表现，以及选手之间的互动和相关言论。
指出数据中体现的电竞行业趋势或值得关注的现象，如战队的战术调整、选手的市场价值变化等。
以清晰的结构呈现分析内容，分点阐述，突出重点信息。`;

// Create an MCP server
const server = new McpServer({
	name: "x-kit-mcp",
	version: "1.0.0",
});

server.prompt(
	"summary-tweets",
	{
		// account: z.string()
	},
	() => ({
		messages: [
			{
				role: "user",
				content: {
					type: "text",
					text: `${promptTemplate}\n\n`,
				},
			},
		],
	})
);

// Add an addition tool
server.tool(
	"get-tweets",
	{
		// a: z.number(), b: z.number()
	},
	async () => {

    const text = await fetchTweets()

    return {
      content: [{ type: "text", text: JSON.stringify(text) }],
    }
  
  }
    
);


async function main() {
  try {
    console.log("Starting server...");
    // Start receiving messages on stdin and sending messages on stdout
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log("Server started");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
