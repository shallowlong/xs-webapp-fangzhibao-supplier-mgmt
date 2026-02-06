module.exports = (sequelize, DataTypes) => {
	const SupplierStoreHistory = sequelize.define(
		"SupplierStoreHistory",
		{
			historyId: {
				type: DataTypes.BIGINT,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			sheetId: {
				type: DataTypes.INTEGER,
				allowNull: false,
				comment: "supplierSheetId",
			},
			storeId: {
				type: DataTypes.INTEGER,
				allowNull: false,
				comment: "supplierStoreId",
			},
			historyType: {
				type: DataTypes.ENUM("新增", "更新", "回滚"),
				allowNull: false,
				defaultValue: "新增",
				comment: "历史类型",
			},
			originSupplierStoreInJson: {
				type: DataTypes.TEXT,
				allowNull: true,
				comment: "原始供应商门店信息的JSON格式",
			},
			newSupplierStoreInJson: {
				type: DataTypes.TEXT,
				allowNull: false,
				comment: "新的供应商门店信息的JSON格式",
			},
		},
		{
			tableName: "fzb_supplier_store_history",
			indexes: [
				{
					name: "idx_storeId",
					fields: ["storeId"],
				},
				{
					name: "idx_sheetId",
					fields: ["sheetId"],
				},
				{
					name: "idx_historyType",
					fields: ["historyType"],
				},
			],
		},
	);

	return SupplierStoreHistory;
};
