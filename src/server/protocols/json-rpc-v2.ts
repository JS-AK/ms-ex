import { performance } from "node:perf_hooks";

import * as Types from "../types/index.js";
import { Protocols } from "@2people-IT/inwave-erp-types";
import Validator from "./validator.js";

type JsonRpcRequest = {
	data: Types.System.JsonRpc.Types.Request;
	headers: { authorization?: string; };
};

function GetTimeExec() {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
	return function decorator(
		originalMethod: any,
		context: ClassMethodDecoratorContext,
	) {
		async function replacementMethod(
			this: Protocol,
			request: JsonRpcRequest,
		) {
			const start = performance.now();
			const result = await originalMethod.call(this, request);
			const isHaveError = !!result?.error;
			const execTime = Math.round(performance.now() - start);

			if (isHaveError) {
				const requestText = `Request: ${JSON.stringify(request.data)}`;
				const responseText = `Response: ${JSON.stringify(result)}`;

				this.logger.warn(`${requestText}. ${responseText}. Execution time: ${execTime}ms`);
			} else {
				this.logger.info(`method: ${request.data.method}, id: ${request.data.id}. Execution time: ${execTime}ms`);
			}

			return result;
		}

		return replacementMethod;
	};
}

export class Protocol {
	#apiRepository;
	#sl;

	logger;

	constructor(options: {
		methods: Protocols.HttpProtocol.HttpProtocolApi;
		methodsList: typeof Protocols.HttpProtocol.HttpMethodsList;
		sl: Types.ServiceLocator.default;
	}) {
		this.#apiRepository = new Map(Object.entries(options.methods));
		this.#sl = options.sl;

		this.logger = options.sl.loggers.api;
	}

	// eslint-disable-next-line new-cap
	@GetTimeExec()
	async exec(
		request: JsonRpcRequest,
	): Promise<Types.System.JsonRpc.Types.Response> {
		const jsonrpc = new this.#sl.system.JsonRpc(request.data);
		const jsonrpcError = jsonrpc.validate();

		if (jsonrpcError) return jsonrpcError;

		const method = jsonrpc.method as Protocols.HttpProtocol.MethodsKeys;
		const params = jsonrpc.params;
		const execute = this.#apiRepository.get(method);

		if (!execute) {
			return jsonrpc
				.response
				.error
				.methodNotFound
				.compare();
		}

		// VALIDATE PARAMS
		const {
			params: paramsSchema,
			result: resultSchema,
			systemPermissions,
		} = Protocols.HttpProtocol.HttpMethodsList[method];

		const meta: { userId?: string; } = { userId: undefined };

		if (systemPermissions) {
			const { data, error } = await this.#sl
				.services
				.auth
				.processSystemPermissions({ method, token: request.headers.authorization });

			if (error) {
				return jsonrpc
					.response
					.error
					.invalidParams
					.compare(error.message, error.code);
			}

			meta.userId = data.userId;
		}

		const { error } = Validator.validate(
			paramsSchema,
			params,
		);

		if (error) {
			return jsonrpc
				.response
				.error
				.invalidParams
				.compare(error.message, error.code);
		}

		try {
			const { data: result, error } = await execute(
				params as never,
				meta as never,
			);

			// BUSINESS ERRORS CHECK
			if (error) {
				return jsonrpc
					.response
					.error
					.invalidRequest
					.compare(error.message, error.code);
			}

			// SERIALIZE RESULT
			{
				const { error } = Validator.validate(
					resultSchema,
					JSON.parse(JSON.stringify(result)),
				);

				if (error) {
					return jsonrpc
						.response
						.error
						.invalidParams
						.compare(error.message, error.code);
				}
			}

			return jsonrpc
				.response
				.common
				.compare(result);
		} catch (error) {
			if (error instanceof Error) {
				this.logger.error(error.message);

				return jsonrpc
					.response
					.error
					.internalError
					.compare(error.message);
			} else {
				return jsonrpc
					.response
					.error
					.internalError
					.compare();
			}
		}
	}
}
