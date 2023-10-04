import * as MSWrapper from "@2people-IT/inwave-ms-wrapper";

import { BaseTransport } from "../base-transport.js";
import { Types } from "./index.js";
import { register } from "./methods.js";

export class Server extends BaseTransport {
	#config;
	#logger;
	#sl;

	constructor(options: {
		config: Types.Config.ConfigOptions;
		logger: Types.System.Logger.default;
		sl: Types.ServiceLocator.default;
	}) {
		super();

		this.#config = options.config;
		this.#logger = options.logger;
		this.#sl = options.sl;
	}

	async #init() {
		const servicesList = register(this.#sl.services);

		const authDomain = new MSWrapper.AuthDomainNats({
			natsConnection: {
				consumerPrefix: this.#config.NATS_CLIENT_ID_PREFIX,
				server: this.#config.NATS_SERVER_URL,
			},
		});

		await authDomain.init();

		const server = new MSWrapper.ServerWrapper();

		server.initMicroservice(authDomain, servicesList);
	}

	async listen(): Promise<void> {
		await this.#init();
	}
}
