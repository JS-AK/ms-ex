import * as Nats from "nats";

import * as Types from "../types/index.js";

export default class NatsJetStreamClient {
	#clientIdPrefix;
	#logger;
	#nats: {
		js: Nats.JetStreamClient;
		jsm: Nats.JetStreamManager;
		nc: Nats.NatsConnection;
	} | null = null;
	#responseCallbacks = new Map<string, (data: unknown) => void>();
	#serverUrl;

	defaultSubj = "mx-ex-cb.main";

	constructor(options: {
		config: Types.Config.ConfigOptions;
		logger: Types.System.Logger.default;
	}) {
		this.#logger = options.logger;
		this.#clientIdPrefix = options.config.NATS_CLIENT_ID_PREFIX;
		this.#serverUrl = options.config.NATS_SERVER_URL;
	}

	async #processMessages(stream: string) {
		if (!this.#nats) throw new Error();

		const c = await this.#nats.js.consumers.get(stream, stream);
		const messages = await c.consume();

		for await (const m of messages) {
			try {
				const data = Nats.JSONCodec().decode(m.data) as {
					jsonrpc: { jsonrpc: "2.0"; id: string; method: string; };
					meta: object;
				};

				m.ack();

				if (data.jsonrpc.id && this.#responseCallbacks.has(data.jsonrpc.id)) {
					const callback = this.#responseCallbacks.get(data.jsonrpc.id);

					if (callback) callback(data.jsonrpc);
				}
			} catch (error) {
				m.nak();
			}
		}
	}

	async init() {
		const connection = await Nats.connect({
			maxReconnectAttempts: 10,
			name: this.#clientIdPrefix,
			reconnectTimeWait: 10000,
			servers: this.#serverUrl,
		});

		this.#nats = {
			js: connection.jetstream(),
			jsm: await connection.jetstreamManager(),
			nc: connection,
		};

		const stream = "mx-ex-cb";
		const subj = "mx-ex-cb.*";

		await this.#nats.jsm.streams.add({ name: stream, subjects: [subj] });

		await this.#nats.jsm.consumers.add(stream, {
			ack_policy: Nats.AckPolicy.Explicit,
			durable_name: stream,
		});

		this.#processMessages(stream);
	}

	async publishWithResponse<P extends { id: string; }, R extends { id: string; }>(
		streamName: string,
		payload: P,
	): Promise<R> {
		if (!this.#nats) {
			throw new Error("NATS connection not established");
		}

		try {
			const subject = `${streamName}.main`;
			const responsePromise = new Promise((resolve) => {
				this.#responseCallbacks.set(payload.id, (responseData) => {
					resolve(responseData);
					this.#responseCallbacks.delete(payload.id);
				});
			});

			await this.#nats.js.publish(
				subject,
				Nats.JSONCodec().encode(payload),
			);

			return responsePromise as unknown as R;
		} catch (error) {
			if (error instanceof Error) {
				this.#logger.error(`Failed to publish and get a response: ${error.message}`);
			}

			throw error;
		}
	}

}
