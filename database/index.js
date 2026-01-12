const mysql = require('mysql2/promise');
const { Sequelize } = require("sequelize");

const { dbConfig, customPoolConfig } = require('./config');
const customConnectionPool = mysql.createPool(customPoolConfig);

const isProduction = process.env.NODE_ENV === 'production';

const sequelize = new Sequelize(
	dbConfig.database,
	dbConfig.username,
	dbConfig.password,
	dbConfig
);

const db = {
	sequelize,
	customConnectionPool,
	models: {}
};

let logger;
setTimeout(() => {
	logger = require('../logger').logger;
}, 0);

/**
 * 关闭自定义连接池
 * @returns {Promise<void>} - 无返回值
 */
async function closeCustomConnectionPool() {
	try {
		await customConnectionPool.end();
		logger?.info('>>>> the custom connection pool has been closed');
	} catch (err) {
		logger?.error(err, '###### fail to close the custom connection pool');
	}
}

async function testDBConnection() {
	try {
		await sequelize.authenticate();
		logger?.info('>>>> sequelize database connection is successful');
	} catch (error) {
		logger?.error(error, '###### sequelize database connection failed');
	}
}

async function closeDBConnection() {
	try {
		await sequelize.close();
		logger?.info('>>>> sequelize database connection has been closed');
	} catch (error) {
		logger?.error(error, '###### fail to close the sequelize database connection');
	}
}

async function initTables() {
	if (!isProduction) {
		await sequelize.sync({ alter: true });
	} else {
		await sequelize.sync();
	}
}

async function initUser() {
	const userModel = db.models.User;
	await userModel.findOrCreate({
		where: { username: process.env.DB_DEFAULT_USER },
		defaults: {
			password: process.env.DB_DEFAULT_PASS
		}
	});
}

// 加载所有模型
db.models.User = require('./models/User')(sequelize, Sequelize.DataTypes);
db.models.SupplierStore = require('./models/SupplierStore')(sequelize, Sequelize.DataTypes);
db.models.SupplierSheet = require('./models/SupplierSheet')(sequelize, Sequelize.DataTypes);
db.models.ApiToken = require('./models/ApiToken')(sequelize, Sequelize.DataTypes);
db.models.SupplierStoreHistory = require('./models/SupplierStoreHistory')(sequelize, Sequelize.DataTypes);


db.User = db.models.User;
db.SupplierStore = db.models.SupplierStore;
db.SupplierSheet = db.models.SupplierSheet;
db.ApiToken = db.models.ApiToken;
db.SupplierStoreHistory = db.models.SupplierStoreHistory;
db.closeCustomConnectionPool = closeCustomConnectionPool;
db.closeDBConnection = closeDBConnection;

setTimeout(() => {
	testDBConnection().then(() => initTables().then(() => initUser()));
}, 0);

module.exports = db;
