const { existsSync, mkdirSync } = require("fs");
const path = require("path");

const pino = require("pino");

const isProduction = process.env.NODE_ENV === "production";
const logLevel = isProduction ? "info" : "debug";

const logDir = path.join(__dirname, "logs");
if (!existsSync(logDir)) {
	mkdirSync(logDir, { recursive: true });
}

const targets = [
	{
		level: logLevel,
		target: "pino-roll",
		options: {
			file: path.join(logDir, "application.log"),
			size: 100,
			frequency: "daily",
			limit: {
				count: 30,
			},
			dateFormat: "yyyy-MM-dd",
			encoding: "utf8",
		},
	},
];

if (!isProduction) {
	targets.push({
		level: logLevel,
		target: "pino-pretty",
		options: {
			colorize: true,
			translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l o",
			ignore: "pid,hostname",
			encoding: "utf8",
			singleLine: true,
			escapeString: false,
		},
	});
}

const logger = pino(pino.transport({ targets }));

const morganStream = {
	write: (message) => {
		logger.info({ type: "express-morgan-log", msg: message });
	},
};

module.exports = { logger, morganStream };
