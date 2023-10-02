import * as undici from "undici";
import { IncomingHttpHeaders } from "node:http";

export default class Fetcher {
	getContentType = (headers: IncomingHttpHeaders): string => {
		const resContentType = headers["content-type"]?.split(";")[0];

		if (!resContentType) {
			throw new Error("No headers[content-type] in response", {
				cause: "HEADERS_CONTENT_TYPE_EMPTY",
			});
		}

		return resContentType;
	};

	request = async (data: {
		headers: IncomingHttpHeaders;
		method: string;
		payload?: object;
		url: string;
	}) => {
		const {
			headers,
			method,
			payload,
			url,
		} = data;

		return undici.request(url, {
			body: payload ? JSON.stringify(payload) : undefined,
			headers,
			method: method as undici.Dispatcher.HttpMethod,
		});
	};

	parseResponse = async (
		contentType: NonNullable<IncomingHttpHeaders["content-type"]>,
		body: undici.Dispatcher.ResponseData["body"],
	) => {
		const result: { [key: string]: string | number | boolean; } = {};

		if (
			contentType.split("application/json").length === 2
			|| contentType.split("application/problem+json").length === 2
		) {
			return body.json();
		} else if (
			contentType.split("text/xml").length === 2
			|| contentType.split("application/xml").length === 2
		) {
			return body.text();
		} else if (contentType.split("text/plain").length === 2) {
			return body.text();
		} else if (contentType.split("text/html").length === 2) {
			return body.text();
		} else {
			Object.assign(result, { text: "header[content-type] - \"" + contentType + "\" is not available" });
		}

		return result;
	};
}
