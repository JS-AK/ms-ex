import * as Transport from "./transport/index.js";
import { ConfigOptions } from "./config/index.js";
import ServiceLocator from "./service-locator/index.js";

export async function init(config: ConfigOptions) {
	const sl = new ServiceLocator(config);

	await sl.init();

	const natsInstance = new Transport.Nats.Server({
		logger: sl.loggers.api,
		mode: config.SERVER_MODE,
		sl,
	});

	await natsInstance.listen();
}
