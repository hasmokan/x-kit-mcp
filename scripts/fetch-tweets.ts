import { XAuthClient } from "./utils";
import { get } from "lodash";
import dayjs from "dayjs";
import isBetween from 'dayjs/plugin/isBetween';
import fs from "fs-extra";
import type { TweetApiUtilsData } from "twitter-openapi-typescript";

// 启用 dayjs 插件
dayjs.extend(isBetween);

export const fetchTweets = async () => {
	const client = await XAuthClient();

	const resp = await client.getTweetApi().getHomeLatestTimeline({
		count: 100,
	});

	// 过滤出原创推文
	const originalTweets = resp.data.data.filter((tweet: any) => {
		return !tweet.referenced_tweets || tweet.referenced_tweets.length === 0;
	});

	const rows: TweetApiUtilsData[] = [];
	// 输出所有原创推文的访问地址
	originalTweets.forEach((tweet) => {
		const isQuoteStatus = get(tweet, "raw.result.legacy.isQuoteStatus");
		if (isQuoteStatus) {
			return;
		}
		const fullText = get(tweet, "raw.result.legacy.fullText", "RT @");
		if (fullText?.includes("RT @")) {
			return;
		}
		const createdAt = get(tweet, "raw.result.legacy.createdAt");
		// 只获取24小时以内的推文
		const tweetDate = dayjs(createdAt);
		const now = dayjs();
		const twentyFourHoursAgo = now.subtract(24, 'hour');
		if (!tweetDate.isBetween(twentyFourHoursAgo, now)) {
			return;
		}
		const screenName = get(tweet, "user.legacy.screenName");
		const tweetUrl = `https://x.com/${screenName}/status/${get(
			tweet,
			"raw.result.legacy.idStr"
		)}`;
		// 提取用户信息
		const user = {
			screenName: get(tweet, "user.legacy.screenName"),
			name: get(tweet, "user.legacy.name"),
			profileImageUrl: get(tweet, "user.legacy.profileImageUrlHttps"),
			description: get(tweet, "user.legacy.description"),
			followersCount: get(tweet, "user.legacy.followersCount"),
			friendsCount: get(tweet, "user.legacy.friendsCount"),
			location: get(tweet, "user.legacy.location"),
		};

		// 提取图片
		const mediaItems = get(
			tweet,
			"raw.result.legacy.extendedEntities.media",
			[]
		);
		const images = mediaItems
			.filter((media: any) => media.type === "photo")
			.map((media: any) => media.mediaUrlHttps);

		// 提取视频
		const videos = mediaItems
			.filter(
				(media: any) => media.type === "video" || media.type === "animated_gif"
			)
			.map((media: any) => {
				const variants = get(media, "videoInfo.variants", []);
				const bestQuality = variants
					.filter((v: any) => v.contentType === "video/mp4")
					.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))[0];
				return bestQuality?.url;
			})
			.filter(Boolean);

		rows.push({
			// @ts-ignore
			user,
			images,
			videos,
			tweetUrl,
			fullText,
		});
	});

	const outputPath = `./tweets/${dayjs().format("YYYY-MM-DD")}.json`;
	let existingRows: TweetApiUtilsData[] = [];

	// 如果文件存在，读取现有内容
	if (fs.existsSync(outputPath)) {
		existingRows = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
	}

	// 合并现有数据和新数据
	const allRows = [...existingRows, ...rows];

	// 通过 tweetUrl 去重
	const uniqueRows = Array.from(
		new Map(allRows.map((row: any) => [row.tweetUrl, row])).values()
	);

	// 按照 createdAt 倒序排序
	const sortedRows = uniqueRows.sort((a, b) => {
		const urlA = new URL(a.tweetUrl);
		const urlB = new URL(b.tweetUrl);
		const idA = urlA.pathname.split("/").pop() || "";
		const idB = urlB.pathname.split("/").pop() || "";
		return idB.localeCompare(idA); // Twitter ID 本身就包含时间信息，可以直接比较
	});

	// fs.writeFileSync(
	//   outputPath,
	//   JSON.stringify(sortedRows, null, 2)
	// );

	console.log(sortedRows);

	return sortedRows;
};

// 检查是否在 Node.js 环境中运行
if (typeof process !== 'undefined' && process.versions && process.versions.node) {
	// 在 Node.js 环境中运行
	if (require.main === module) {
		fetchTweets().catch(console.error);
	}
} else {
	// 在其他环境中运行
	fetchTweets().catch(console.error);
}