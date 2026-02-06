module.exports = (sequelize, DataTypes) => {
	return sequelize.define(
		"User",
		{
			username: {
				type: DataTypes.STRING(50),
				primaryKey: true,
				allowNull: false,
			},
			password: {
				type: DataTypes.STRING(100),
				allowNull: false,
			},
		},
		{
			tableName: "fzb_user",
		},
	);
};
