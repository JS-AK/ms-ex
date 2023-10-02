import Ajv from "ajv";
import ajvFormats from "ajv-formats";
import ajvKeywords from "ajv-keywords";

export type TDataError<T> =
	| { data: T; error?: never; }
	| { data?: never; error: { code: number; message: string; }; };

class Validator {
	#ajv;
	#repository = new Map<Ajv.Schema, Ajv.ValidateFunction>();

	constructor() {
		this.#ajv = new Ajv.default({ coerceTypes: true, useDefaults: true });

		this.#ajv.addKeyword({
			compile: () => (bigIntRaw: string) => {
				const int = Number(bigIntRaw);

				if (!Number.isInteger(int)) return false;

				const bigInt = BigInt(bigIntRaw);

				/* 9223372036854775807 is max in PostgreSQL */
				if (bigInt > 9223372036854775807n) {
					return false;
				}

				return bigIntRaw === int.toString() || bigIntRaw === bigInt.toString();
			},
			error: { message: "Wrong id" },
			keyword: "isBigint",
			schemaType: "boolean",
			type: "string",
		});

		ajvKeywords.default(this.#ajv);
		ajvFormats.default(this.#ajv);
	}

	#addValidateFunction(validator: Ajv.default, schema: Ajv.Schema) {
		const validateFunction = validator.compile(schema);

		this.#repository.set(schema, validateFunction);

		return validateFunction;
	}

	#getCompiledFunction(schema: Ajv.Schema): Ajv.ValidateFunction {
		const validateFunction = this.#repository.get(schema);

		if (!validateFunction) {
			return this.#addValidateFunction(this.#ajv, schema);
		}

		return validateFunction;
	}

	validate(schema: Ajv.Schema, payload: unknown): TDataError<true> {
		const validateFunction = this.#getCompiledFunction(schema);
		const isValid = validateFunction(payload);

		if (!isValid) {
			const defaultErrorMessage = "Invalid params";

			if (validateFunction.errors) {
				const errorMessage = validateFunction.errors[0]?.message || defaultErrorMessage;

				return { error: { code: 1, message: errorMessage } };
			} else {
				return { error: { code: 1, message: defaultErrorMessage } };
			}
		}

		return { data: true };
	}
}

export default new Validator();
