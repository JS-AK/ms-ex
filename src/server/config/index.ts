import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { isMainThread } from "node:worker_threads";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "..", "..", "..", ".env") });

// const convertEnvToBoolean = (defaultBoolean: boolean, env?: string) => {
// if (env) {
// if (env.toLowerCase() === "true") return true;
// else if (env.toLowerCase() === "false") return false;
// else throw new Error(`Wrong boolean env ${env} incoming`);
// }

// return defaultBoolean;
// };

export type ConfigOptions = {
	IS_MAIN_THREAD: boolean;

	JWT_ACCESS: string;
	JWT_ACCESS_TTL: number;
	JWT_AUDIENCE: string;
	JWT_ISSUER: string;
	JWT_SECRET: string;

	REFRESH_TOKEN_USER_TTL: number;

	REDIS_CACHE_PASSWORD: string;
	REDIS_CACHE_URL: string;

	SERVER_HOST: string;
	SERVER_MODE: string;
	SERVER_PORT: number;
	SERVER_URI: string;

	NATS_CLIENT_ID_PREFIX: string;
	NATS_SERVER_URL: string;
};

type ConfigOptionsRaw = {
	JWT_ACCESS?: string;
	JWT_ACCESS_TTL?: string;
	JWT_AUDIENCE?: string;
	JWT_ISSUER?: string;
	JWT_SECRET?: string;

	REDIS_CACHE_PASSWORD?: string;
	REDIS_CACHE_URL?: string;

	REFRESH_TOKEN_USER_TTL?: string;

	SERVER_HOST?: string;
	SERVER_MODE?: string;
	SERVER_PORT?: string;
	SERVER_URI?: string;

	NATS_CLIENT_ID_PREFIX?: string;
	NATS_SERVER_URL?: string;
};

const config: ConfigOptionsRaw = {
	JWT_ACCESS: process.env.JWT_ACCESS,
	JWT_ACCESS_TTL: process.env.JWT_ACCESS_TTL,
	JWT_AUDIENCE: process.env.JWT_AUDIENCE,
	JWT_ISSUER: process.env.JWT_ISSUER,
	JWT_SECRET: process.env.JWT_SECRET,

	REDIS_CACHE_PASSWORD: process.env.REDIS_CACHE_PASSWORD,
	REDIS_CACHE_URL: process.env.REDIS_CACHE_URL,

	REFRESH_TOKEN_USER_TTL: process.env.REFRESH_TOKEN_USER_TTL,

	SERVER_HOST: process.env.SERVER_HOST,
	SERVER_MODE: process.env.SERVER_MODE,
	SERVER_PORT: process.env.SERVER_PORT,
	SERVER_URI: process.env.SERVER_URI,

	NATS_CLIENT_ID_PREFIX: process.env.NATS_CLIENT_ID_PREFIX,
	NATS_SERVER_URL: process.env.NATS_SERVER_URL,
};

export const getConfig = (): {
	data?: ConfigOptions;
	error: number;
	message?: string;
} => {
	for (const [k, v] of Object.entries(config)) {
		if (!v) return { error: 1, message: `Empty env - ${k}` };
	}

	const preparedConfig = { ...config } as Required<ConfigOptionsRaw>;

	return {
		data: {
			IS_MAIN_THREAD: isMainThread,

			JWT_ACCESS: preparedConfig.JWT_ACCESS,
			JWT_ACCESS_TTL: parseInt(preparedConfig.JWT_ACCESS_TTL, 10), // (s)
			JWT_AUDIENCE: preparedConfig.JWT_AUDIENCE,
			JWT_ISSUER: preparedConfig.JWT_ISSUER,
			JWT_SECRET: preparedConfig.JWT_SECRET,

			REDIS_CACHE_PASSWORD: preparedConfig.REDIS_CACHE_PASSWORD,
			REDIS_CACHE_URL: preparedConfig.REDIS_CACHE_URL,

			REFRESH_TOKEN_USER_TTL: parseInt(preparedConfig.REFRESH_TOKEN_USER_TTL),

			SERVER_HOST: preparedConfig.SERVER_HOST,
			SERVER_MODE: preparedConfig.SERVER_MODE,
			SERVER_PORT: parseInt(preparedConfig.SERVER_PORT, 10),
			SERVER_URI: preparedConfig.SERVER_URI,

			NATS_CLIENT_ID_PREFIX: preparedConfig.NATS_CLIENT_ID_PREFIX,
			NATS_SERVER_URL: preparedConfig.NATS_SERVER_URL,
		},
		error: 0,
	};
};
