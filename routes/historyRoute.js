const { logger } = require('../logger');

const express = require('express');
const router = express.Router();
const authToken = require('./authRoute');

const supplierService = require('../services/supplierService');

/**
 * @route GET /history
 * @description 供应商操作历史记录页面
 */
router.get('/', authToken, (req, res) => {
	res.render('history');
});

/**
 * @route GET /history/data
 * @description 获取所有供应商操作历史记录
 */
router.get('/data', authToken, async (req, res) => {
	try {
		const histories = await supplierService.getAllSupplierHistories();

		res.status(200).json({
			success: true,
			message: '供应商历史记录获取成功',
			data: histories
		});
	} catch (error) {
		logger.error(error, '###### historyRoute/data error');
		res.status(500).json({ success: false, message: '服务器内部错误' });
	}
});

module.exports = router;
