import * as TypesLocal from "./types.js";

export * as Types from "./types.js";

const badCodes = {
	internalError: -32603,
	invalidParams: -32602,
	invalidRequest: -32600,
	methodNotFound: -32601,
	parseError: -32700,
} as const;

export default class JsonRpc {
	#id: string | number;
	#isValid: boolean;
	#jsonrpc: "2.0";
	#method: string;
	#params: object;
	#badCodes = badCodes;
	#defaultMessage = "Something went wrong";

	constructor(payload?: TypesLocal.Request) {
		if (
			!payload?.id
			|| payload.jsonrpc !== "2.0"
		) {
			this.#isValid = false;

			this.#id = "unknown";
			this.#jsonrpc = "2.0";
			this.#method = "unknown";
			this.#params = {};
		} else {
			this.#isValid = true;

			this.#id = payload.id;
			this.#jsonrpc = payload.jsonrpc;
			this.#method = payload.method;
			this.#params = payload.params;
		}
	}

	#compareBadResponse(
		message = this.#defaultMessage,
		codeError: number,
	): TypesLocal.Response {
		return {
			error: { code: codeError, message },
			id: this.#id || null,
			jsonrpc: this.#jsonrpc,
		};
	}

	get id() {
		return this.#id;
	}

	get method() {
		return this.#method;
	}

	get params() {
		return this.#params;
	}

	validate() {
		if (!this.#isValid) {
			return this.response
				.error
				.invalidRequest
				.compare("Invalid JsonRpc Request", this.#badCodes.invalidRequest);
		}

		return null;
	}

	response = {
		common: {
			compare: (result: unknown): TypesLocal.Response => {
				return {
					id: this.#id,
					jsonrpc: this.#jsonrpc,
					result,
				};
			},
		},
		error: {
			internalError: {
				compare: (message?: string): TypesLocal.Response => {
					return this.#compareBadResponse(
						message,
						this.#badCodes.internalError,
					);
				},
			},
			invalidParams: {
				compare: (
					message?: string,
					errorCode?: number,
				): TypesLocal.Response => {
					if (!errorCode) {
						return this.#compareBadResponse(
							message,
							this.#badCodes.invalidParams,
						);
					}

					return this.#compareBadResponse(message, errorCode);
				},
			},
			invalidRequest: {
				compare: (
					message?: string,
					errorCode?: number,
				): TypesLocal.Response => {
					if (!errorCode) {
						return this.#compareBadResponse(
							message,
							this.#badCodes.invalidRequest,
						);
					}

					return this.#compareBadResponse(message, errorCode);
				},
			},
			methodNotFound: {
				compare: (message = "Method was not found"): TypesLocal.Response => {
					return this.#compareBadResponse(
						message,
						this.#badCodes.methodNotFound,
					);
				},
			},
		},
	};
}
