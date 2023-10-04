import * as Transport from "./transport/index.js";
import { ConfigOptions } from "./config/index.js";
import ServiceLocator from "./service-locator/index.js";

export async function init(config: ConfigOptions) {
	const sl = new ServiceLocator(config);

	await sl.init();

	const inwaveInstance = new Transport.Inwave.Server({
		logger: sl.loggers.api,
		config: sl.config,
		sl,
	});

	await inwaveInstance.listen();
}
