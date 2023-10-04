import { Types as InwaveTypes } from "@2people-IT/inwave-ms-wrapper";

import * as Types from "../../types/index.js";

export const register = (
	services: Types.ServiceLocator.default["services"],
): InwaveTypes.Protocols.NatsProtocol.Domains.AuthProvider.AuthProviderNatsProtocolApi => {
	return {
		"auth-provider:auth/refresh-token": services.auth.refreshToken.bind(services.auth),
		"auth-provider:auth/sign-in": services.auth.signIn.bind(services.auth),
		"auth-provider:permissions/get-matrix": services.user.getPermissionMatrix.bind(services.user),
	} as const;
};
