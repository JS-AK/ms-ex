import { Types as InwaveTypes } from "@2people-IT/inwave-ms-wrapper";

import * as Types from "../../types/index.js";

export default class Service {
	#logger;

	constructor(data: { logger: Types.System.Logger.default; }) {
		this.#logger = data.logger;
	}

	async getPermissionMatrix(data: { userId: string; }) {
		return { data: [] };
	}
}
