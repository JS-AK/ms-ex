import * as Nats from "nats";

import * as Protocols from "../../protocols/index.js";
import { BaseTransport } from "../base-transport.js";
import { Types } from "./index.js";
import { register } from "./methods.js";

export class Server extends BaseTransport {
	#logger;
	#sl;
	#server: {
		js: Nats.JetStreamClient;
		jsm: Nats.JetStreamManager;
		nc: Nats.NatsConnection;
	} | null = null;

	constructor(options: {
		mode: string;
		logger: Types.System.Logger.default;
		sl: Types.ServiceLocator.default;
	}) {
		super();

		this.#logger = options.logger;
		this.#sl = options.sl;
	}

	async #init() {
		const connection = await Nats.connect({
			maxReconnectAttempts: 10,
			name: "PERMISSIONS-PROVIDER",
			reconnectTimeWait: 10000,
			servers: "nats://localhost:4222",
		});

		this.#server = {
			js: connection.jetstream(),
			jsm: await connection.jetstreamManager(),
			nc: connection,
		};
	}

	async #processMessages(stream: string) {
		if (!this.#server) throw new Error();

		const c = await this.#server.js.consumers.get(stream, stream);
		const { methods, methodsList } = register(this.#sl.services);
		const protocol = new Protocols.JsonRpcV2.Protocol({
			methods,
			methodsList,
			sl: this.#sl,
		});
		const messages = await c.consume();

		for await (const m of messages) {
			try {
				const data = Nats.JSONCodec().decode(m.data) as {
					jsonrpc: { jsonrpc: "2.0"; id: string; method: string; };
					id: string;
					meta: { source: string; };
				};

				const result = await protocol.exec({ data: data.jsonrpc } as never);

				if (data.meta.source) {
					const request = {
						jsonrpc: result,
						id: data.jsonrpc.id,
					};

					await this.#server.js.publish(
						data.meta.source,
						Nats.JSONCodec().encode(request),
					);
				}

				m.ack();
			} catch (error) {
				m.nak();
			}
		}
	}

	async listen(): Promise<void> {
		await this.#init();

		if (!this.#server) throw new Error();

		const stream = "permissions-provider";
		const subj = "permissions-provider.*";

		await this.#server.jsm.streams.add({ name: stream, subjects: [subj] });
		await this.#server.jsm.consumers.add(stream, {
			ack_policy: Nats.AckPolicy.Explicit,
			durable_name: stream,
		});

		this.#processMessages(stream);

		this.#logger.info(`NATS listening ${subj}`);
	}

	async close(): Promise<void> {
		if (!this.#server) throw new Error();

		await this.#server.nc.close();
	}
}
