module.exports = (sequelize, DataTypes) => {
	return sequelize.define(
		"SupplierSheet",
		{
			sheetId: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
				allowNull: false,
			},
			sheetName: {
				type: DataTypes.STRING(100),
				allowNull: false,
			},
			sheetBinary: {
				type: DataTypes.BLOB("medium"),
				allowNull: false,
			},
			sheetSize: {
				type: DataTypes.BIGINT,
				allowNull: false,
			},
		},
		{
			tableName: "fzb_supplier_sheet",
		},
	);
};
