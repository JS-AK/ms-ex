import { Protocols } from "@2people-IT/inwave-erp-types";

import * as Types from "../../types/index.js";

export default class Service {
	#logger;

	constructor(data: { logger: Types.System.Logger.default; }) {
		this.#logger = data.logger;
	}

	async getPermissionMatrix(
		data: { id: string; },
	): Promise<Types.Common.TDataError<
		Protocols.HttpProtocol.User.GetPermissionMatrix.Result
	>> {
		return { data: [] };
	}
}
