module.exports = (sequelize, DataTypes) => {
	return sequelize.define(
		"ApiToken",
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
				allowNull: false,
			},
			token: {
				type: DataTypes.STRING(64),
				allowNull: false,
			},
			username: {
				type: DataTypes.STRING(50),
				allowNull: false,
			},
			expireAt: {
				type: DataTypes.DATE,
				allowNull: false,
			},
		},
		{
			tableName: "fzb_api_token",
			indexes: [
				{
					name: "idx_token",
					unique: true,
					fields: ["token"],
				},
			],
		},
	);
};
