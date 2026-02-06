require("dotenv").config();

const { logger } = require("../logger");
const { closeDBConnection, closeCustomConnectionPool } = require("../database");

const app = require("../app");
const port = normalizePort(process.env.PORT || "3000");
app.set("port", port);

const http = require("http");
const server = http.createServer(app);
server.on("error", onError);
server.on("listening", onListening);
server.listen(port);

function normalizePort(val) {
	let port = parseInt(val, 10);
	if (isNaN(port)) return val; // named pipe
	if (port >= 0) return port; // port number
	return false;
}

function onError(error) {
	if (error.syscall !== "listen") throw error;

	let bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

	// handle specific listen errors with friendly messages
	switch (error.code) {
		case "EACCES":
			logger.error(bind + " requires elevated privileges");
			process.exit(1);
			break;
		case "EADDRINUSE":
			logger.error(bind + " is already in use");
			process.exit(1);
			break;
		default:
			throw error;
	}
}

function onListening() {
	let addr = server.address();
	let bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
	logger.info(">>>> HTTP server is listening on " + bind);
}

async function cleanup() {
	logger.info(">>>> closing 2 database connections...");
	await closeCustomConnectionPool();
	await closeDBConnection();

	logger.info(">>>> closing the HTTP server...");
	server.close(async (err) => {
		if (err) {
			logger.error(
				err,
				"##### fail to close the HTTP server, exit with code 1",
			);
			process.exit(1);
		}
		logger.info("<<<< HTTP server closed, exit with code 0");
		process.exit(0);
	});
}

// 监听终止信号：SIGINT（Ctrl+C）、SIGTERM（kill命令）
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
// 处理未捕获的异常
process.on("uncaughtException", (err) => {
	logger.error(err, "###### uncaughtException, exit with code 1:");
	cleanup().then(() => process.exit(1));
});
// 处理未捕获的Promise拒绝
process.on("unhandledRejection", (reason) => {
	logger.error(reason, "###### unhandledRejection, exit with code 1:");
	cleanup().then(() => process.exit(1));
});
