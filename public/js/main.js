$(document).ready(function () {
	const uploadArea = $("#uploadArea");
	const fileInput = $("#fileInput");
	const uploadMessage = $("#uploadMessage");
	const spinnerContainer = $(".spinner-container");

	// 页面加载时获取供应商统计数据
	loadSupplierStatistics();

	uploadArea.click(function (e) {
		e.stopPropagation();
		fileInput.click();
	});

	fileInput.click(function (e) {
		e.stopPropagation();
	});

	uploadArea.on("dragover", function (e) {
		e.preventDefault();
		uploadArea.addClass("drag-over");
	});

	uploadArea.on("dragleave", function () {
		uploadArea.removeClass("drag-over");
	});

	uploadArea.on("drop", function (e) {
		e.preventDefault();
		uploadArea.removeClass("drag-over");

		if (e.originalEvent.dataTransfer.files.length) {
			const file = e.originalEvent.dataTransfer.files[0];
			handleFileUpload(file);
		}
	});

	fileInput.change(function () {
		const maxSize = 16 * 1024 * 1024;

		if (this.files.length) {
			const file = this.files[0];

			if (file.size > maxSize) {
				alert(`文件过大！最大支持 ${maxSize / 1024 / 1024} MB`);
				this.value = ""; // 清空选中的文件
			} else {
				handleFileUpload(file);
			}
		}
	});

	function handleFileUpload(file) {
		const fileExtension = file.name.split(".").pop().toLowerCase();
		if (
			fileExtension !== "xlsx" &&
			fileExtension !== "xls" &&
			fileExtension !== "csv"
		) {
			showMessage("请上传Excel格式的文件（.xlsx, .xls, .csv）", "danger");
			return;
		}

		const formData = new FormData();
		formData.append("uploadedFile", file);

		// 显示加载状态
		showSpinner(true);
		showMessage("", "");

		$.ajax({
			url: "/upload",
			type: "POST",
			data: formData,
			processData: false,
			contentType: false,
			dataType: "json",
			success: function (response) {
				showSpinner(false);
				if (response.success) {
					if (response.data) {
						showResponseData(response.data);
					} else {
						showMessage(
							response.message || "文件上传成功！",
							"success",
						);
					}

					// window.location.href = '/';
					fileInput.val("");
				} else {
					showMessage(response.message || "文件上传失败", "danger");
				}
			},
			error: function (xhr, status, error) {
				showSpinner(false);
				showMessage("上传请求失败，请稍后重试", "danger");
				console.error("上传错误:", error);
			},
		});
	}

	function showResponseData(data) {
		showMessage(data.message, "success");

		if (data.newOnes) {
			initAddSupplierTable(data.newOnes);
		}
		if (data.changedOnes) {
			initUpdateSupplierTable(data.changedOnes);
		}
		$("#sheetId").val(data.sheetId);
	}

	function showBootstrapModal(title, message, type) {
		$("#modalTitle").text(title);
		$("#modalBody").html(`<p class="text-${type}">${message}</p>`);

		const modal = new bootstrap.Modal(
			document.getElementById("notificationModal"),
		);
		modal.show();

		$("#notificationModal").on("shown.bs.modal", function () {
			$("#modalConfirmBtn").focus();
		});
	}

	function showMessage(text, type) {
		if (text) {
			uploadMessage
				.text(text)
				.removeClass("alert-success alert-danger")
				.addClass("alert-" + type)
				.show();

			// 3秒后自动隐藏成功消息
			// if (type === 'success') {
			// 	setTimeout(function () {
			// 		uploadMessage.fadeOut('slow');
			// 	}, 3000);
			// }
		} else {
			uploadMessage.hide();
		}
	}

	function showSpinner(show) {
		if (show) {
			spinnerContainer.show();
			uploadArea.hide();
		} else {
			spinnerContainer.hide();
			uploadArea.show();
		}
	}

	$("#supplierStoreTable").bootstrapTable({
		locale: "zh-CN",
		page: 1,
		pageSize: 25,
		pagination: true,
		paginationLoop: false,
		search: true,
		searchAlign: "left",
		filterControl: true,
		showSearchClearButton: true,
	});

	$("#supplierStoreTable").show();

	function initAddSupplierTable(addData) {
		$("#addSupplierTable").bootstrapTable("destroy");

		let addColumns = [
			{
				field: "storeId",
				title: "门店ID",
			},
			{
				field: "supplierName",
				title: "供应商",
			},
			{
				field: "storeName",
				title: "门店名称",
			},
			{
				field: "storeNo",
				title: "档口号",
			},
			{
				field: "storeAddress",
				title: "门店地址",
			},
			{
				field: "sectionCode",
				title: "区域编码",
			},
			{
				field: "storeSequence",
				title: "门店顺序",
			},
			{
				field: "supplierType",
				title: "供应商类型",
			},
			{
				field: "othersTakeGood",
				title: "是否开启代拿",
			},
			{
				field: "usingUserExpress",
				title: "直发订单开启<br>用户快递",
			},
			{
				field: "autoPushAndPrint",
				title: "自动推送<br>订单打印",
			},
			{
				field: "autoSyncToSupplier",
				title: "待拿货数据<br>同步供应商",
			},
			{
				field: "allowToChangePrice",
				title: "允许改价",
			},
			{
				field: "paymentPoint",
				title: "采购付款节点",
			},
			{
				field: "contactPhoneNum",
				title: "联系电话",
			},
			{
				field: "operate",
				title: "操作",
				align: "center",
				formatter: function (value, row, index) {
					return `<button class="btn btn-sm btn-success submit-btn" data-storeid="${row.storeId}" data-index="${index}" title="确认增加">
                            <i class="fas fa-paper-plane"></i><br>确认增加
                        </button>`;
				},
				events: {
					"click .submit-btn": function (e, value, row, index) {
						submitAddData(row, index);
					},
				},
			},
		];

		$("#addSupplierTable").bootstrapTable({
			data: addData,
			striped: true,
			pagination: true,
			pageSize: 10,
			pageList: [10, 20],
			columns: addColumns,
		});

		$("#addSupplierCard").show();

		function submitAddData(data, rowIndex) {
			const $btn = $(`button[data-storeid="${data.storeId}"]`);
			const originalText = $btn.html();
			$btn.html(
				'<i class="fas fa-spinner fa-spin"></i><br>提交中...',
			).prop("disabled", true);

			const submitData = {
				sheetId: $("#sheetId").val(),
				suppliersData: [data],
			};

			$.ajax({
				url: "/addNewSupplier",
				type: "POST",
				contentType: "application/json",
				data: JSON.stringify(submitData),
				dataType: "json",
				success: function (response) {
					if (!response.success) {
						showBootstrapModal(
							"操作失败",
							`提交失败: ${response.message}<br>请稍后重试`,
							"danger",
						);
						console.error("提交失败", response.message);
						return;
					}
					const tableData =
						$("#addSupplierTable").bootstrapTable("getData");
					tableData.splice(rowIndex, 1);
					$("#addSupplierTable").bootstrapTable("load", tableData);
					showBootstrapModal(
						"操作成功",
						`数据提交成功！<br>storeId: ${data.storeId}<br>供应商名称: ${data.supplierName}`,
						"success",
					);
					console.log("提交成功", response);
				},
				error: function (xhr, status, error) {
					showBootstrapModal(
						"操作失败",
						`提交失败: ${error}<br>请稍后重试`,
						"danger",
					);
					console.error("提交失败", xhr, status, error);
				},
				complete: function () {
					$btn.html(originalText).prop("disabled", false);
				},
			});
		}
	}

	function commonCellStyle(value, row, index, field) {
		if (index % 2 === 1) {
			const tableData = $("#updateSupplierTable").bootstrapTable(
				"getData",
			);
			const oldRow = tableData.find(
				(item) => item.storeId === row.storeId && item !== row,
			);

			const oldValue = oldRow ? oldRow[field] : null;
			const currentValue = value;

			if (
				(oldValue === null && currentValue !== null) ||
				(oldValue !== null && currentValue === null) ||
				oldValue !== currentValue
			) {
				return { classes: "text-danger fw-bold" };
			}
		}
		return {};
	}

	function initUpdateSupplierTable(updateData) {
		$("#updateSupplierTable").bootstrapTable("destroy");

		let updateColumns = [
			{
				field: "storeId",
				title: "门店ID",
				cellStyle: commonCellStyle,
			},
			{
				field: "supplierName",
				title: "供应商",
				cellStyle: commonCellStyle,
			},
			{
				field: "storeName",
				title: "门店名称",
				cellStyle: commonCellStyle,
			},
			{
				field: "storeNo",
				title: "档口号",
				cellStyle: commonCellStyle,
			},
			{
				field: "storeAddress",
				title: "门店地址",
				cellStyle: commonCellStyle,
			},
			{
				field: "sectionCode",
				title: "区域编码",
				cellStyle: commonCellStyle,
			},
			{
				field: "storeSequence",
				title: "门店顺序",
				cellStyle: commonCellStyle,
			},
			{
				field: "supplierType",
				title: "供应商类型",
				cellStyle: commonCellStyle,
			},
			{
				field: "othersTakeGood",
				title: "是否开启代拿",
				cellStyle: commonCellStyle,
			},
			{
				field: "usingUserExpress",
				title: "直发订单开启<br>用户快递",
				cellStyle: commonCellStyle,
			},
			{
				field: "autoPushAndPrint",
				title: "自动推送<br>订单打印",
				cellStyle: commonCellStyle,
			},
			{
				field: "autoSyncToSupplier",
				title: "待拿货数据<br>同步供应商",
				cellStyle: commonCellStyle,
			},
			{
				field: "allowToChangePrice",
				title: "允许改价",
				cellStyle: commonCellStyle,
			},
			{
				field: "paymentPoint",
				title: "采购付款节点",
				cellStyle: commonCellStyle,
			},
			{
				field: "contactPhoneNum",
				title: "联系电话",
				cellStyle: commonCellStyle,
			},
			{
				field: "operate",
				title: "操作",
				align: "center",
				formatter: function (value, row, index) {
					if (index % 2 === 1) {
						return `<button class="btn btn-sm btn-primary update-btn" data-storeid="${row.storeId}" title="确认更新">
								<i class="fas fa-sync-alt"></i><br>确认更新
							</button>`;
					}
					return "[原数据]";
				},
				events: {
					"click .update-btn": function (e, value, row, index) {
						submitUpdateData(row, index);
					},
				},
			},
		];

		$("#updateSupplierTable").bootstrapTable({
			data: updateData,
			striped: true,
			pagination: true,
			pageSize: 10,
			pageList: [10, 20],
			columns: updateColumns,
		});

		$("#updateSupplierCard").show();

		function submitUpdateData(data, rowIndex) {
			const $btn = $(`.update-btn[data-storeid="${data.storeId}"]`);
			const originalText = $btn.html();
			$btn.html(
				'<i class="fas fa-spinner fa-spin"></i><br>提交中...',
			).prop("disabled", true);

			const submitData = {
				sheetId: $("#sheetId").val(),
				suppliersData: [data],
			};

			$.ajax({
				url: "/updateSupplier",
				type: "POST",
				contentType: "application/json",
				data: JSON.stringify(submitData),
				dataType: "json",
				success: function (response) {
					if (!response.success) {
						showBootstrapModal(
							"操作失败",
							`提交失败: ${response.message}<br>请稍后重试`,
							"danger",
						);
						console.error("提交失败", response.message);
						return;
					}

					const tableData = $("#updateSupplierTable").bootstrapTable(
						"getData",
					);
					const oldRowIndex = rowIndex - 1;

					if (oldRowIndex >= 0 && oldRowIndex < tableData.length) {
						tableData.splice(rowIndex, 1);
						tableData.splice(oldRowIndex, 1);
					}

					$("#updateSupplierTable").bootstrapTable("load", tableData);

					showBootstrapModal(
						"操作成功",
						`数据提交成功！<br>storeId: ${data.storeId}<br>供应商名称: ${data.supplierName}`,
						"success",
					);
					console.log("提交成功", response);
				},
				error: function (xhr, status, error) {
					showBootstrapModal(
						"操作失败",
						`提交失败: ${error}<br>请稍后重试`,
						"danger",
					);
					console.error("提交失败", xhr, status, error);
				},
				complete: function () {
					$btn.html(originalText).prop("disabled", false);
				},
			});
		}
	}

	function loadSupplierStatistics() {
		$.ajax({
			url: "/getSupplierStatistics",
			type: "GET",
			dataType: "json",
			success: function (response) {
				if (response.success && response.data) {
					updateStatisticsDisplay(response.data, false);
				} else {
					console.error("获取统计数据失败:", response.message);
					updateStatisticsDisplay({}, true);
				}
			},
			error: function (xhr, status, error) {
				console.error("获取统计数据失败:", error);
				updateStatisticsDisplay({}, true);
			},
		});
	}

	function updateStatisticsDisplay(data, failed) {
		if (failed) {
			let displayText = "获取失败..";
			$("#lastUpdateTime").text(displayText);
			$("#totalCooperation").text(displayText);
			$("#totalInvalid").text(displayText);
			$("#invalidLastUpdateTime").text(displayText);
			$("#regionSupplierCount").text(displayText);
			return;
		}

		if (data.lastUpdateTimeInCooperation) {
			const updateTime = new Date(data.lastUpdateTimeInCooperation);
			$("#lastUpdateTime").text(updateTime.toLocaleString("zh-CN"));
		} else {
			$("#lastUpdateTime").text("暂无数据");
		}
		$("#totalCooperation").text(data.totalCooperation || 0);

		if (data.lastUpdateTimeInInvalid) {
			const invalidUpdateTime = new Date(data.lastUpdateTimeInInvalid);
			$("#invalidLastUpdateTime").text(
				invalidUpdateTime.toLocaleString("zh-CN"),
			);
		} else {
			$("#invalidLastUpdateTime").text("暂无数据");
		}
		$("#totalInvalid").text(data.totalInvalid || 0);

		if (data.regionSupplierCount && data.regionSupplierCount.length > 0) {
			const regionHtml = data.regionSupplierCount
				.map((region) => {
					return `<div>${region.sectionCode}: ${region.count}</div>`;
				})
				.join("");
			$("#regionSupplierCount").html(regionHtml);
		} else {
			$("#regionSupplierCount").html(
				"<div class='region-item'>暂无数据</div>",
			);
		}
	}
});
