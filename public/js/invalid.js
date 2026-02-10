$(document).ready(function () {
	$("#invalidSupplierTable").bootstrapTable({
		locale: "zh-CN",
		page: 1,
		pageSize: 100,
		pagination: true,
		paginationLoop: false,
		paginationVAlign: "both",
		search: true,
		searchAlign: "left",
		showSearchClearButton: true,
	});
});
