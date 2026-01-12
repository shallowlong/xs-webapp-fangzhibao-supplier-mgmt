const { logger } = require('../logger');
const fs = require('fs/promises');
const path = require('path');
const XLSX = require('xlsx');
const _ = require('underscore');
const { Op } = require("sequelize");
const { SupplierStore, SupplierSheet, SupplierStoreHistory, sequelize } = require('../database');

const supplierStoreModel = SupplierStore;
const supplierSheetModel = SupplierSheet;
const supplierStoreHistoryModel = SupplierStoreHistory;

const MEDIUM_BLOB_MAX_SIZE = 16 * 1024 * 1024 - 1;

async function getAllSuppliers() {
	return await supplierStoreModel.findAll({
		order: [
			['sectionCode', 'ASC'],
			['storeSequence', 'ASC']
		]
	});
}

async function getSuppliersByName(name) {
	return await supplierStoreModel.findAll({
		where: {
			supplierName: {
				[Op.like]: `%${name}%`
			}
		},
		order: [
			['sectionCode', 'ASC'],
			['storeSequence', 'ASC']
		]
	});
}

async function getSuppliersByAddress(address) {
	return await supplierStoreModel.findAll({
		where: {
			storeAddress: {
				[Op.like]: `%${address}%`
			}
		},
		order: [
			['sectionCode', 'ASC'],
			['storeSequence', 'ASC']
		]
	});
}

async function addNewSuppliersFromExcel(excelFile) {
	if (_.isNull(excelFile) || _.isUndefined(excelFile) || _.isEmpty(excelFile)) {
		logger.error('excelFile parameter is empty');
		throw new Error('excelFile parameter is empty');
	}

	let resultJson = {
		message: ''
	}

	const workbook = XLSX.readFile(excelFile);
	const sheetName = workbook.SheetNames[0];
	const worksheet = workbook.Sheets[sheetName];

	// 将工作表转换为JSON数组 - 自动将第一行作为标题行
	const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

	if (_.isEmpty(jsonData)) {
		logger.error('Excel file content is empty, file path: ' + excelFile);
		throw new Error('empty Excel file content');
	}

	const sheetId = await _storeSupplierSheet(excelFile);

	// 列映射关系：Excel列名 -> 目标对象字段名
	const columnMapping = {
		'门店ID': 'storeId',
		'供应商': 'supplierName',
		'门店名称': 'storeName',
		'档口号': 'storeNo',
		'门店地址': 'storeAddress',
		'供应商类型': 'supplierType',
		'是否开启代拿': 'othersTakeGood',
		'直发订单开启用户快递': 'usingUserExpress',
		'自动推送订单打印': 'autoPushAndPrint',
		'待拿货数据同步供应商': 'autoSyncToSupplier',
		'允许改价': 'allowToChangePrice',
		'采购付款节点': 'paymentPoint',
		'联系电话': 'contactPhoneNum',
		'区域编码': 'sectionCode',
		'门店顺序': 'storeSequence'
	}

	const supplierStores = [];
	const storeIds = [];

	for (let i = 0; i < jsonData.length; i++) {
		const rowData = jsonData[i];
		const supplierStore = {};

		// 遍历每一列，根据映射关系转换
		for (const [excelColumn, targetField] of Object.entries(columnMapping)) {
			if (rowData.hasOwnProperty(excelColumn)) {
				const cellValue = rowData[excelColumn];

				// 根据字段类型进行转换
				if (targetField === 'storeId' || targetField === 'storeSequence') {
					supplierStore[targetField] = Number(cellValue) || null;
					if (targetField === 'storeId') storeIds.push(supplierStore[targetField]);
				} else {
					// 其他字段保持原样，处理空值
					supplierStore[targetField] = cellValue !== undefined ? cellValue : '';
				}
			}
		}

		// 文本格式如果不匹配则为空
		if (!_.isEmpty(supplierStore)) supplierStores.push(supplierStore);
	}

	if (_.isEmpty(supplierStores)) {
		logger.error('supplierStores and columnMapping are incorrect');
		throw new Error('supplierStores and columnMapping are incorrect');
	}

	const existingSuppliers = await supplierStoreModel.findAll({
		where: {
			storeId: {
				[Op.in]: storeIds
			}
		}
	})

	if (_.isEmpty(existingSuppliers)) {
		try {
			// 第一次直接初始化
			await supplierStoreModel.bulkCreate(supplierStores);
		} catch (error) {
			logger.error(error, '###### supplierService/addNewSuppliersFromExcel error => supplierStoreModel.bulkCreate init operation failed');
			throw new Error('init data operation failed');
		}

		resultJson.message = '成功插入数据';
		return resultJson;
	}

	let [existingMap, newMap] = [new Map(), new Map()];
	existingSuppliers.forEach((sup) => {
		existingMap.set(sup.storeId, sup);
	})
	supplierStores.forEach((sup) => {
		newMap.set(sup.storeId, sup);
	})

	let [newOnes, changedOnes] = [[], []];
	for (let [key, value] of newMap) {
		if (!existingMap.has(key)) {
			newOnes.push(value);
		} else if (!_isSameSupplierStore(value, existingMap.get(key))) {
			changedOnes.push(existingMap.get(key)); // old
			changedOnes.push(value); // new
		}
	}

	if (newOnes.length === 0) {
		resultJson.message = resultJson.message.concat('无新增数据项|');
	} else {
		resultJson.message = resultJson.message.concat('有 新增 数据项|');
		resultJson.newOnes = newOnes;
	}

	if (changedOnes.length === 0) {
		resultJson.message = resultJson.message.concat('无更新数据项|');
	} else {
		resultJson.message = resultJson.message.concat('有 更新 数据项|');
		resultJson.changedOnes = changedOnes;
	}

	resultJson.sheetId = sheetId; // 添加sheetId到返回结果
	return resultJson
}

async function _storeSupplierSheet(filePath) {
	if (_.isEmpty(filePath)) return null;

	logger.debug(filePath);

	try {
		let fileName = path.basename(filePath);
		if (fileName.length > 100) {
			fileName = fileName.slice(-100);
		}

		const fileStats = await fs.stat(filePath);
		const fileSize = fileStats.size; // 核心：获取文件长度

		const msg = `最大支持 ${MEDIUM_BLOB_MAX_SIZE / 1024 / 1024}MB，当前文件 ${fileSize / 1024 / 1024}MB`
		logger.debug(msg);

		if (fileSize > MEDIUM_BLOB_MAX_SIZE) {
			throw new Error('文件大小超过限制！' + msg);
		}

		const fileBinary = await fs.readFile(filePath);

		const sheet = await supplierSheetModel.create({
			sheetName: fileName,
			sheetBinary: fileBinary,
			sheetSize: fileSize
		});

		logger.info(`file stored successfully, sheetId: ${sheet.sheetId}, fileName: ${fileName}`);
		return sheet.sheetId;
	} catch (error) {
		logger.error(error, '###### supplierService/_storeSupplierSheet error => file store operation failed');
		return null;
	}
}

/**
 * 辅助函数：比较两个字段是否相等（处理null和空字符串）
 * @param {*} aField - 对象a的字段值
 * @param {*} bField - 对象b的字段值
 * @returns {boolean} 两个字段是否相等
 */
function _isSameField(aField, bField) {
	// 若两个字段都为null或空字符串，视为相等
	if ((aField === null || aField === '') && (bField === null || bField === '')) {
		return true
	}
	// 否则使用严格相等比较（类型+值都相同）
	return aField === bField
}

/**
 * 判断两个供应商门店对象是否完全相同
 * @param {Object} a - 供应商门店对象a
 * @param {Object} b - 供应商门店对象b
 * @returns {boolean} 两个对象是否相同
 */
function _isSameSupplierStore(a, b) {
	// 需要比较的字段列表（与原逻辑保持一致）
	const fields = [
		'storeId',
		'supplierName',
		'storeName',
		'storeNo',
		'storeAddress',
		'supplierType',
		'othersTakeGood',
		'usingUserExpress',
		'autoPushAndPrint',
		'autoSyncToSupplier',
		'allowToChangePrice',
		'paymentPoint',
		'contactPhoneNum',
		'storeSequence'
	]

	// 遍历所有字段，使用辅助函数逐个比较
	return fields.every(field => _isSameField(a[field], b[field]))
}


async function addNewSuppliersFromData(suppliers, sheetId) {
	if (_.isNull(suppliers) || _.isUndefined(suppliers) || _.isEmpty(suppliers)) {
		throw new Error('suppliers parameter is empty')
	}

	if (!_.isArray(suppliers)) {
		throw new Error('suppliers parameter is not an array')
	}

	const t = await sequelize.transaction();
	logger.info(`start the transaction`);
	try {
		for (let supplier of suppliers) {
			let newSupplier = await supplierStoreModel.create(supplier);
			logger.info(`new supplier added, supplierId: ${newSupplier.storeId}`);

			await supplierStoreHistoryModel.create({
				storeId: newSupplier.storeId,
				sheetId: sheetId,
				historyType: '新增',
				originSupplierStoreInJson: null,
				newSupplierStoreInJson: JSON.stringify(newSupplier)
			});
		}
		await t.commit();
		logger.info(`transaction committed`);
	} catch (error) {
		await t.rollback();
		logger.info(`transaction rolled back`);
		logger.error(error, 'addNewSuppliersFromData operation failed');
		throw new Error('add new supplier operation failed')
	}
}

async function updateSuppliersFromData(suppliers, sheetId) {
	if (_.isNull(suppliers) || _.isUndefined(suppliers) || _.isEmpty(suppliers)) {
		throw new Error('suppliers parameter is empty')
	}

	if (!_.isArray(suppliers)) {
		throw new Error('suppliers parameter is not an array')
	}

	const t = await sequelize.transaction();
	logger.info(`start the transaction`);
	try {
		for (let supplier of suppliers) {
			// 获取旧数据
			let existingSupplier = await supplierStoreModel.findOne({
				where: {
					storeId: supplier.storeId
				}
			});
			logger.info(`existing supplier found, supplierId: ${existingSupplier.storeId}`);

			if (existingSupplier) {
				let originSupplierJson = JSON.stringify(existingSupplier);
				logger.info(`origin supplier: ${originSupplierJson}`);

				existingSupplier.set(supplier);
				await existingSupplier.save();
				let newSupplierJson = JSON.stringify(existingSupplier);
				logger.info(`new supplier: ${newSupplierJson}`);

				await supplierStoreHistoryModel.create({
					storeId: existingSupplier.storeId,
					sheetId: sheetId,
					historyType: '更新',
					originSupplierStoreInJson: originSupplierJson,
					newSupplierStoreInJson: newSupplierJson
				});
			}
		}
		await t.commit();
		logger.info(`transaction committed`);
	} catch (error) {
		await t.rollback();
		logger.info(`transaction rolled back`);
		logger.error(error, 'updateSuppliersFromData operation failed');
		throw new Error('update supplier operation failed')
	}
}

/**
 * @description 获取供应商统计数据
 * @returns {Object} 统计数据对象
 */
async function getSupplierStatistics() {
	try {
		const lastUpdatedSupplier = await supplierStoreModel.findOne({
			order: [['updatedAt', 'DESC']],
			attributes: ['updatedAt']
		});

		const totalCooperation = await supplierStoreModel.count({
			where: {
				supplierType: '代发'
			}
		});

		const totalInvalid = await supplierStoreModel.count({
			where: {
				supplierType: {
					[Op.ne]: '代发'
				}
			}
		});

		const regionStats = await supplierStoreModel.findAll({
			attributes: [
				'sectionCode',
				[sequelize.fn('COUNT', sequelize.col('sectionCode')), 'count']
			],
			where: {
				supplierType: '代发',
				sectionCode: {
					[Op.ne]: ''
				}
			},
			group: ['sectionCode'],
			order: [['count', 'DESC']]
		});

		// 格式化区域统计数据
		const regionSupplierCount = regionStats.map(stat => ({
			sectionCode: stat.sectionCode,
			count: stat.dataValues.count
		}));

		return {
			lastUpdateTime: lastUpdatedSupplier ? lastUpdatedSupplier.updatedAt : null,
			totalCooperation,
			totalInvalid,
			regionSupplierCount
		};
	} catch (error) {
		logger.error(error, 'supplierService/getSupplierStatistics operation failed');
		throw new Error('get supplier statistics operation failed');
	}
}

/**
 * @description 获取供应商店铺历史记录
 * @returns {Array} 历史记录数组
 */
async function getAllSupplierHistories() {
	try {
		return await supplierStoreHistoryModel.findAll({
			order: [['createdAt', 'DESC']]
		});
	} catch (error) {
		logger.error(error, 'supplierService/getAllSupplierHistories operation failed');
		throw new Error('get supplier histories operation failed');
	}
}

module.exports = {
	getAllSuppliers,
	getSuppliersByName,
	getSuppliersByAddress,
	addNewSuppliersFromExcel,
	addNewSuppliersFromData,
	updateSuppliersFromData,
	getSupplierStatistics,
	getAllSupplierHistories
}