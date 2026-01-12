const express = require('express');
const router = express.Router();
const { logger } = require('../logger');

const apiTokenService = require('../services/apiTokenService');
const supplierService = require('../services/supplierService');

/**
 * @description Token验证中间件
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express的next函数
 */
const verifyTokenMidware = async (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;
		if (!authHeader) {
			return res.status(401).json({ success: false, message: '未提供认证令牌' });
		}

		// 提取token，通常格式为 'Bearer token'
		const token = authHeader.split(' ')[1];
		if (!token) {
			return res.status(401).json({ success: false, message: '认证令牌格式错误' });
		}

		const isValid = await apiTokenService.validateToken(token);
		if (!isValid) {
			return res.status(401).json({ success: false, message: '无效的认证令牌' });
		}

		next();
	} catch (error) {
		logger.error(error, '###### verifyTokenMidware error');
		res.status(401).json({ success: false, message: '令牌验证失败' });
	}
};

/**
 * @route POST /api/getToken
 * @description 创建或者刷新访问令牌
 */
router.post('/getToken', async (req, res) => {
	try {
		const { username, password } = req.body;

		if (!username || !password) {
			return res.status(400).json({ success: false, message: '用户名和密码是必填项' });
		}

		const token = await apiTokenService.validateAndRetrieve(username, password);
		if (!token) {
			return res.status(401).json({ success: false, message: '用户名密码验证失败' });
		}

		res.status(200).json({
			success: true,
			token,
			username,
			message: '令牌获取成功'
		});
	} catch (error) {
		logger.error(error, '###### getToken error');
		res.status(500).json({ success: false, message: '服务器内部错误' });
	}
});

/**
 * @route GET /api/getSuppliersByName
 * @description 通过供应商名称查询供应商信息
 */
router.get('/getSuppliersByName', verifyTokenMidware, async (req, res) => {
	try {
		// 从查询参数中获取供应商名称
		const { name } = req.query;

		// 验证请求参数
		if (!name) {
			return res.status(400).json({ success: false, message: '供应商名称是必填项' });
		}

		const suppliers = await supplierService.getSuppliersByName(name);

		res.status(200).json({
			success: true,
			message: `查询到 ${suppliers.length} 个供应商`,
			data: suppliers
		});
	} catch (error) {
		logger.error(error, '###### getSuppliersByName error');
		res.status(500).json({ success: false, message: '服务器内部错误' });
	}
});

/**
 * @route GET /api/getSuppliersByAddress
 * @description 通过地址查询供应商信息
 */
router.get('/getSuppliersByAddress', verifyTokenMidware, async (req, res) => {
	try {
		const { address } = req.query;

		if (!address) {
			return res.status(400).json({ success: false, message: '地址是必填项' });
		}

		const suppliers = await supplierService.getSuppliersByAddress(address);

		res.status(200).json({
			success: true,
			message: `查询到 ${suppliers.length} 个供应商`,
			data: suppliers
		});
	} catch (error) {
		logger.error(error, '###### getSuppliersByAddress error');
		res.status(500).json({ success: false, message: '服务器内部错误' });
	}
});

module.exports = router;