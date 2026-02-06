const _database = process.env.DATABASE_NAME;
const _user = process.env.DATABASE_USER;
const _pass = process.env.DATABASE_PASS;

exports.dbConfig = {
	database: _database,
	username: _user,
	password: _pass,
	host: "localhost",
	dialect: "mysql",
	dialectOptions: {
		charset: "utf8mb4",
	},
	define: {
		timestamps: true, // 添加 createdAt 和 updatedAt 字段
		underscored: false,
		freezeTableName: true, // 禁用自动复数表名
	},
	pool: {
		max: 3,
		min: 0,
		acquire: 30000,
		idle: 60000,
	},
};

exports.customPoolConfig = {
	host: "localhost",
	user: _user,
	password: _pass,
	database: _database,
	charset: "utf8mb4",
	connectionLimit: 3,
	idleTimeout: 60000,
};
