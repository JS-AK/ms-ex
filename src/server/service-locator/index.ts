import cron from "node-cron";

import * as Types from "../types/index.js";

import * as Services from "../services/index.js";
import * as System from "../system/index.js";

const store: { sl?: ServiceLocator; } = { sl: undefined };

export default class ServiceLocator {
	config;

	cron: {
		scheduleToken?: cron.ScheduledTask;
	};

	loggers;
	services;
	system;

	constructor(config: Types.Config.ConfigOptions) {
		this.config = config;

		const systemLogger = new System.Logger.default();

		this.cron = {
			scheduleToken: undefined,
		};

		this.loggers = {
			api: systemLogger.child({
				pSource: "API",
				pThread: this.getThread(),
			}),
			common: systemLogger.child({
				pSource: "COMMON",
				pThread: this.getThread(),
			}),
			cron: systemLogger.child({
				pSource: "CRON",
				pThread: this.getThread(),
			}),
			nats: systemLogger.child({
				pSource: "NATS",
				pThread: this.getThread(),
			}),
			prepare: systemLogger.child({
				pSource: "PREPARE",
				pThread: this.getThread(),
			}),
			redis: systemLogger.child({
				pSource: "REDIS",
				pThread: this.getThread(),
			}),
		};

		this.system = {
			JsonRpc: System.JsonRpc.default,
			crypto: new System.Crypto.default(),
			fetcher: new System.Fetcher.default(),
			fileSystem: new System.FileSystem.default(),
			jwt: new System.Jwt.default({ config: this.config }),
			nats: new System.Nats.default({
				config: this.config,
				logger: this.loggers.nats,
			}),
			redis: new System.Redis.default({
				config: this.config,
				logger: this.loggers.redis,
			}),
		};

		this.services = {
			auth: new Services.AuthService.Service.default({
				crypto: this.system.crypto,
				jwt: this.system.jwt,
			}),
			nats: new Services.NatsService.Service.default({
				nats: this.system.nats,
			}),
			user: new Services.UserService.Service.default({ logger: this.loggers.common }),
		};

		Object.values(this.services).forEach((e) => {
			if (e instanceof Services.BaseService.default) {
				e.injectServices(this.services);
			}
		});
	}

	#save() {
		store.sl = this;
	}

	async init() {
		process.env.TZ = "UTC";
		await this.system.redis.init();
		await this.system.nats.init();

		this.#save();
	}

	static getSL() {
		const sl = store.sl;

		if (!sl) throw new Error("Service Locator actually is not prepared");

		return sl;
	}

	getThread() {
		return this.config.IS_MAIN_THREAD ? "MAIN-THREAD" : "CHILD-THREAD";
	}

	static async removeSL() {
		const sl = store.sl;

		if (!sl) throw new Error("Service Locator actually is not prepared");

		sl.cron.scheduleToken?.stop();
		await sl.system.redis.client.flushAll(); // Only for testing
		await sl.system.redis.client.disconnect();

		store.sl = undefined;
	}
}
