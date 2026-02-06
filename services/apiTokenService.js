const { logger } = require("../logger");

const crypto = require("crypto");
const { ApiToken } = require("../database");
const { validateUser } = require("./userService");

const apiTokenModel = ApiToken;

const _generateSecureApiToken = () => {
	return crypto.randomBytes(16).toString("hex");
};

const _generateExpirationTime = () => {
	const now = new Date();
	now.setDate(now.getDate() + 7); // 过期时间设置为7天
	return now;
};

async function validateAndRetrieve(username, password) {
	username = username.trim();
	password = password.trim();

	try {
		const isValid = await validateUser(username, password);
		if (!isValid) {
			logger.info(`用户名或者密码错误，username=${username}`);
			return false;
		}

		const existingToken = await apiTokenModel.findOne({
			where: { username },
		});

		if (existingToken) {
			if (existingToken.expireAt > new Date()) {
				return existingToken.token;
			} else {
				const updatedToken = await existingToken.update({
					token: _generateSecureApiToken(),
					expireAt: _generateExpirationTime(),
				});
				return updatedToken.token;
			}
		}

		const token = _generateSecureApiToken();
		const expireAt = _generateExpirationTime();

		const newToken = await apiTokenModel.create({
			token,
			username,
			expireAt,
		});

		return newToken.token;
	} catch (error) {
		logger.error(
			error,
			`###### apiTokenService/validateAndRetrieve error => 用户：${username}`,
		);
		return false;
	}
}

async function validateToken(token) {
	try {
		const existingToken = await apiTokenModel.findOne({
			where: { token },
		});

		if (existingToken) {
			logger.info(
				`验证API token成功 => token: ${token}, 过期时间: ${existingToken.expireAt}`,
			);
			return existingToken.expireAt > new Date();
		}

		return false;
	} catch (error) {
		logger.error(
			error,
			`###### apiTokenService/validateToken error => token: ${token}`,
		);
		return false;
	}
}

module.exports = {
	validateAndRetrieve: validateAndRetrieve,
	validateToken: validateToken,
};
