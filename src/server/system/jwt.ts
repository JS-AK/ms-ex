import jwt from "jsonwebtoken";

import * as Types from "../types/index.js";

export default class Jwt {
	#jwtSecret;
	#jwtAccess;
	#jwtAccessTime;
	#jwtIssuer;
	#jwtAudience;

	constructor(data: { config: Types.Config.ConfigOptions; }) {
		this.#jwtSecret = data.config.JWT_SECRET;
		this.#jwtAccess = data.config.JWT_ACCESS;
		this.#jwtAccessTime = data.config.JWT_ACCESS_TTL;
		this.#jwtIssuer = data.config.JWT_ISSUER;
		this.#jwtAudience = data.config.JWT_AUDIENCE;
	}

	#sign(id: string, expiresIn: number) {
		return jwt.sign(
			{
				type: this.#jwtAccess,
			},
			this.#jwtSecret,
			{
				audience: this.#jwtAudience,
				expiresIn,
				issuer: this.#jwtIssuer,
				subject: id,
			},
		);
	}

	sign = (id: string) => {
    return this.#sign(id, this.#jwtAccessTime);
  };

	verify = (
		token: string,
	): Types.Common.TDataError<{ payload: jwt.JwtPayload; }> => {
    try {
    	const data = jwt.verify(token, this.#jwtSecret) as jwt.JwtPayload;

    	return { data: { payload: data } };
    } catch (error) {
    	if (error instanceof jwt.JsonWebTokenError) {
    		if (error instanceof jwt.TokenExpiredError) {
    			return { error: { code: 1, message: "jwt expired" } };
    		}

    		return { error: { code: 1, message: error.message } };
    	} else {
    		return { error: { code: 1, message: "Something went wrong" } };
    	}
    }
  };
}
