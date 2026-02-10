module.exports = (sequelize, DataTypes) => {
	return sequelize.define(
		"SupplierStore",
		{
			storeId: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				allowNull: false,
				comment: `门店ID`,
			},
			supplierName: {
				type: DataTypes.STRING(100),
				allowNull: false,
				comment: `供应商`,
			},
			storeName: {
				type: DataTypes.STRING(100),
				allowNull: false,
				comment: `门店名称`,
			},
			storeNo: {
				type: DataTypes.STRING(50),
				allowNull: false,
				comment: `档口号`,
			},
			storeAddress: {
				type: DataTypes.STRING(200),
				allowNull: false,
				comment: `门店地址`,
			},
			supplierType: {
				type: DataTypes.STRING(50),
				comment: `供应商类型`,
			},
			othersTakeGood: {
				type: DataTypes.STRING(10),
				comment: `是否开启代拿`,
			},
			usingUserExpress: {
				type: DataTypes.STRING(10),
				comment: `直发订单开启用户快递`,
			},
			autoPushAndPrint: {
				type: DataTypes.STRING(10),
				comment: `自动推送订单打印`,
			},
			autoSyncToSupplier: {
				type: DataTypes.STRING(10),
				comment: `待拿货数据同步供应商`,
			},
			allowToChangePrice: {
				type: DataTypes.STRING(10),
				comment: `允许改价`,
			},
			paymentPoint: {
				type: DataTypes.STRING(50),
				comment: `采购付款节点`,
			},
			contactPhoneNum: {
				type: DataTypes.STRING(20),
				comment: `联系电话`,
			},
			sectionCode: {
				type: DataTypes.STRING(20),
				comment: `区域编码`,
				get() {
					let sc = this.getDataValue("sectionCode") || "";
					if (sc.trim().length > 0) {
						sc = "{" + sc.substring(sc.indexOf("-") + 1) + "}";
					}
					return sc;
				},
			},
			storeSequence: {
				type: DataTypes.INTEGER,
				comment: `门店顺序`,
			},
		},
		{
			tableName: "fzb_supplier_store",
			indexes: [
				{
					name: "idx_supplierName",
					fields: ["supplierName"],
				},
				{
					name: "idx_storeName",
					fields: ["storeName"],
				},
			],
		},
	);
};
