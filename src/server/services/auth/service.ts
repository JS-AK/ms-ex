import * as Types from "../../types/index.js";
import BaseService from "../base-service.js";

export default class Service extends BaseService {
	#crypto;
	#jwt;

	constructor(data: {
		crypto: Types.System.Crypto.default;
		jwt: Types.System.Jwt.default;
	}) {
		super();

		this.#crypto = data.crypto;
		this.#jwt = data.jwt;
	}

	#checkJwtPayload(payload: { userId: string; userRoleId: string; }): boolean {
		if (!payload) return false;

		return typeof payload.userId === "string"
			&& typeof payload.userRoleId === "string";
	}

	async refreshToken(data: { refreshToken: string; }): Promise<
		Types.Common.TDataError<{ accessToken: ""; refreshToken: ""; }>
	> {
		return { data: { accessToken: "", refreshToken: "" } };
	}

	async signIn(data: { email: string; password: string; }): Promise<
		Types.Common.TDataError<{ accessToken: ""; refreshToken: ""; }>
	> {
		return { data: { accessToken: "", refreshToken: "" } };
	}

	async processSystemPermissions(payload: { method: string; token?: string; }): Promise<
		Types.Common.TDataError<{ userId: string; userRoleId: string; }>
	> {
		if (!this.services) throw new Error("services is not provided");

		const { method, token } = payload;

		if (!token) {
			return { error: { code: 1, message: "JWT_VALIDATION_ERROR" } };
		}

		const tokenWithoutBearer = token.substring(7);

		const { data, error } = this
			.#jwt
			.verify(tokenWithoutBearer);

		if (error) {
			return { error: { code: 1, message: "JWT_VALIDATION_ERROR" } };
		}

		if (this.#checkJwtPayload(data.payload as { userId: string; userRoleId: string; })) {
			return { error: { code: 1, message: "JWT_VALIDATION_ERROR" } };
		}

		const result = {
			userId: data.payload.userId,
			userRoleId: data.payload.userRoleId,
		};

		const request = {
			id: this.#crypto.getFormattedUuid(),
			jsonrpc: "2.0",
			method,
			params: result,
		};

		const { result: response } = await this.services
			.nats
			.publishWithResponse<typeof request, { id: string; result: boolean; }>(
				"permissions-provider.main",
				request,
			);

		if (!response) {
			return { error: { code: 1, message: "PERMISSIONS_ERROR" } };
		}

		return { data: result };
	}
}
