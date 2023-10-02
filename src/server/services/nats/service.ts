import * as Types from "../../types/index.js";

export default class Service {
	#nats;

	constructor(data: {
		nats: Types.System.Nats.default;
	}) {
		this.#nats = data.nats;
	}

	async publishWithResponse<P extends { id: string; }, R extends { id: string; }>(
		streamName: string,
		payload: P,
	) {
		return this.#nats.publishWithResponse<P, R>(
			streamName,
			payload,
		);
	}
}
