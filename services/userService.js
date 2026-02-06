const { logger } = require("../logger");
const bcrypt = require("bcryptjs");
const { User } = require("../database");

const userModel = User;

async function validateUser(username, password) {
	const salt = await bcrypt.genSalt(10);
	const encryptedPassword = await bcrypt.hash(password, salt);
	logger.debug(`encryptedPassword = ${encryptedPassword}`);

	const user = await userModel.findOne({
		where: { username: username },
	});

	return user && (await bcrypt.compare(password, user.password));
}

module.exports = {
	validateUser,
};
