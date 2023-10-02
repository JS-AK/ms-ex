import { RedisClientType, createClient } from "redis";

import * as Types from "../types/index.js";

export default class Redis {
	client: RedisClientType;
	#logger: Types.System.Logger.default;

	connectionStatus: boolean;

	constructor(data: {
		config: Types.Config.ConfigOptions;
		logger: Types.System.Logger.default;
	}) {
		this.client = createClient({
			password: data.config.REDIS_CACHE_PASSWORD,
			url: data.config.REDIS_CACHE_URL,
		});
		this.#logger = data.logger;

		this.connectionStatus = false;

		this.client.on("error", (error) => {
			this.connectionStatus = false;

			this.#logger.error(error.message);
		});
		this.client.on("connect", () => {
			this.connectionStatus = true;
		});
	}

	async init() {
		await this.client.connect();
	}

	async del(key: string | string[]) {
		return this.client.del(key);
	}

	async get(key: string) {
		return this.client.get(key);
	}

	async getDel(key: string) {
		return this.client.getDel(key);
	}

	async set({
		isNX = true, // SET if Not eXists (если true то не перезаписывает)
		key,
		time,
		value,
	}: {
		isNX?: boolean;
		key: string;
		time: number;
		value: string | number;
	}) {
		await this.client.set(key, value, {
			EX: time,
			NX: isNX ? true : undefined,
		});
	}

	async setWithoutTime({
		isNX = true, // SET if Not eXists (если true то не перезаписывает)
		key,
		value,
	}: {
		key: string;
		isNX?: boolean;
		value: string | number;
	}) {
		await this.client.set(key, value, {
			NX: isNX ? true : undefined,
		});
	}
}
