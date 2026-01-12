$(document).ready(function () {
	// 初始化历史记录表格
	$('#historyTable').bootstrapTable({
		url: '/history/data',
		method: 'GET',
		striped: true,
		pagination: true,
		pageSize: 10,
		pageList: [10, 20, 50],
		sortName: 'createdAt',
		sortOrder: 'desc',
		responseHandler: function (res) {
			return res.data || [];
		},
		columns: [
			{
				field: 'historyId',
				title: '历史记录ID',
				align: 'center',
				sortable: true
			},
			{
				field: 'historyType',
				title: '操作类型',
				align: 'center',
				formatter: function (value, row, index) {
					if (value === '新增') {
						return '<span class="badge bg-danger">新增</span>';
					} else if (value === '更新') {
						return '<span class="badge bg-success">更新</span>';
					} else {
						return `<span class="badge bg-info">${value}</span>`;
					}
				}
			},
			{
				field: 'storeId',
				title: '供应商ID',
				align: 'center'
			},
			{
				field: 'sheetId',
				title: '上传文件ID',
				align: 'center'
			},
			{
				field: 'originSupplierStoreInJson',
				title: '原始数据',
				align: 'left',
				formatter: function (value, row, index) {
					if (value === null || value === '') {
						return '-';
					}
					return '<span class="json-content">' + value.substring(0, 50) + '...</span>';
				}
			},
			{
				field: 'newSupplierStoreInJson',
				title: '新数据',
				align: 'left',
				formatter: function (value, row, index) {
					if (value === null || value === '') {
						return '-';
					}
					return '<span class="json-content">' + value.substring(0, 50) + '...</span>';
				}
			},
			{
				field: 'createdAt',
				title: '操作时间',
				align: 'center',
				formatter: function (value, row, index) {
					return new Date(value).toLocaleString();
				}
			},
			{
				field: 'operation',
				title: '操作',
				align: 'center',
				formatter: function (value, row, index) {
					return `
							<button type="button" class="btn btn-info btn-sm btn-compare" data-history="${JSON.stringify(row).replace(/"/g, '&quot;')}" title="对比数据">
								<i class="bi bi-eye"></i>
							</button>
						`;
				},
				events: {
					'click .btn-compare': function (e, value, row, index) {
						showCompareModal(row);
					}
				}
			}
		]
	});
});

function goBack() {
	window.location.href = '/';
}

/**
 * 显示数据对比模态框
 * @param {Object} row - 当前行数据
 */
function showCompareModal(row) {
	try {
		// 解析原始数据
		let originJson = null;
		if (row.originSupplierStoreInJson) {
			originJson = JSON.parse(row.originSupplierStoreInJson);
		}

		// 解析新数据
		let newJson = null;
		if (row.newSupplierStoreInJson) {
			newJson = JSON.parse(row.newSupplierStoreInJson);
		}

		// 生成原始数据HTML
		let originHtml = '';
		if (originJson) {
			originHtml = generateJsonHtml(originJson);
		} else {
			originHtml = '<p class="text-muted">无原始数据</p>';
		}

		// 生成新数据HTML
		let newHtml = '';
		if (newJson) {
			newHtml = generateJsonHtml(newJson);
		} else {
			newHtml = '<p class="text-muted">无新数据</p>';
		}

		// 更新模态框内容
		$('#originData').html(originHtml);
		$('#newData').html(newHtml);

		// 显示模态框
		new bootstrap.Modal(document.getElementById('compareModal')).show();
	} catch (error) {
		console.error('解析JSON数据时出错:', error);
		alert('数据解析失败，请检查数据格式');
	}
}

/**
 * 生成JSON数据的HTML展示
 * @param {Object} json - 要展示的JSON对象
 * @returns {string} - 生成的HTML字符串
 */
function generateJsonHtml(json) {
	let html = '<table class="table table-sm table-borderless">';
	for (let key in json) {
		if (json.hasOwnProperty(key)) {
			let value = json[key];
			if (value === null || value === undefined) {
				value = '<span class="text-muted">null</span>';
			} else if (typeof value === 'object') {
				value = '<span class="text-info">[对象]</span>';
			}
			html += `<tr><td class="text-nowrap font-weight-medium pr-3">${key}:</td><td>${value}</td></tr>`;
		}
	}
	html += '</table>';
	return html;
}