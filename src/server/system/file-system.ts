import fs from "node:fs";

export default class FileSystem {
	#defaultErrorMessage = "FileSystemService something went wrong";

	getPathToFileInfo(path: string): {
		message?: string;
		info?: {
			ext?: string;
			fileName: string;
			fileNameWOExt: string;
			pathToFile: string;
		};
	} {
		const fileName = path.split("/").pop();

		if (!fileName) {
			return { message: "Wrong path (fileName not found)" };
		}

		let ext;
		let fileNameWOExt;
		const fileNameChunks = fileName.split(".");

		if (fileNameChunks.length > 1) {
			ext = fileNameChunks.at(-1);
			const splittedFileName = fileName.split(`.${ext}`);

			splittedFileName.pop();
			fileNameWOExt = splittedFileName.join(`.${ext}`);
		} else {
			fileNameWOExt = fileName;
		}

		const pathToFile = path.split(fileName)[0] as string;

		return { info: { ext, fileName, fileNameWOExt, pathToFile } };
	}

	async copyFile(path: string, newPath: string) {
		return new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(path);
      const writeStream = fs.createWriteStream(newPath);

      readStream.on("error", reject);
      writeStream.on("error", reject);
      writeStream.on("finish", resolve);
      readStream.pipe(writeStream);
    });
	}

	async getStatFile(path: string) {
		try {
			const stat = await fs.promises.stat(path);

			return { error: 0, stat };
		} catch (error) {
			if (error instanceof Error) {
				return { error: 1, message: error.message };
			}

			return { error: 1, message: this.#defaultErrorMessage };
		}
	}

	async #checkAccessFile(path: string, mode: number) {
		try {
			await fs.promises.access(path, mode);

			return { error: 0 };
		} catch (error) {
			if (error instanceof Error) {
				return { error: 1, message: error.message };
			}

			return { error: 1, message: this.#defaultErrorMessage };
		}
	}

	checkAccessFile = {
		execute: async (path: string) =>
			this.#checkAccessFile(path, fs.constants.X_OK),
		read: async (path: string) =>
			this.#checkAccessFile(path, fs.constants.R_OK),
		write: async (path: string) =>
			this.#checkAccessFile(path, fs.constants.W_OK),
	};

	async createFolder(path: string) {
		try {
			await fs.promises.mkdir(path, { recursive: true });

			return true;
		} catch (error) {
			return false;
		}
	}

	async deleteFile(path: string) {
		try {
			await fs.promises.unlink(path);

			return { error: 0 };
		} catch (error) {
			if (error instanceof Error) {
				return { error: 1, message: error.message };
			}

			return { error: 1, message: this.#defaultErrorMessage };
		}
	}
}
