import * as crypto from "node:crypto";
import { promisify } from "node:util";

const randomBytesAsync = promisify(crypto.randomBytes);
const pbkdf2Async = promisify(crypto.pbkdf2);

export default class Crypto {
	getRandomString = async (length = 16) => (await randomBytesAsync(length)).toString("hex");

	getHashWithSalt = async (data: string, salt: string) => (await pbkdf2Async(data, salt, 1000, 64, "sha512")).toString("hex");

	getFormattedUuid = () => crypto.randomUUID({ disableEntropyCache: true });
}
