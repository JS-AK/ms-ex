import { Protocols } from "@2people-IT/inwave-erp-types";

import * as Types from "../../types/index.js";

export const register = (
	services: Types.ServiceLocator.default["services"],
): {
	methods: any;
	methodsList: typeof Protocols.HttpProtocol.HttpMethodsList;
} => {
	return {
		methods: {
			"auth-provider:auth/sign-in": services.auth.signIn,
			"auth-provider:auth/permissions-matrix": services.auth.signIn,
		},
		methodsList: Protocols.HttpProtocol.HttpMethodsList,
	} as const;
};
