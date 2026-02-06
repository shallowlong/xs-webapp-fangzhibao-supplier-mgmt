$(document).ready(function () {
	$("#refreshCaptcha, #captchaImage").click(function () {
		loadCaptcha();
		$("#captcha").val("").focus();
	});

	function loadCaptcha() {
		$.ajax({
			url: "/login/refreshCaptcha",
			type: "GET",
			dataType: "json",
			success: function (response) {
				if (response.success) {
					$("#captchaImage").attr("src", response.captchaImage);
					$("#captcha").val("").focus();
				} else {
					showError("刷新验证码失败，请重试");
				}
			},
			error: function (error) {
				if (error.status === 429) {
					showError(error.responseJSON.message);
				} else {
					showError("服务器连接失败，无法刷新验证码");
				}
			},
		});
	}

	$("#loginForm").submit(function (event) {
		event.preventDefault();

		$(".error-message").hide().text("");

		let formData = {
			username: $("#username").val().trim(),
			password: $("#password").val().trim(),
			captchaCode: $("#captcha").val().trim(),
		};

		if (!formData.username) {
			showError("请输入用户名");
			return;
		}

		if (!formData.password) {
			showError("请输入密码");
			return;
		}

		if (!formData.captchaCode) {
			showError("请输入验证码");
			return;
		}

		$.ajax({
			url: "/login",
			type: "POST",
			data: JSON.stringify(formData),
			contentType: "application/json",
			dataType: "json",
			beforeSend: function () {
				$('button[type="submit"]')
					.prop("disabled", true)
					.html(
						'<i class="fas fa-spinner fa-spin me-1"></i> 登录中...',
					);
			},
			success: function (response) {
				$('button[type="submit"]')
					.prop("disabled", false)
					.html('<i class="fas fa-sign-in-alt me-1"></i> 登录');

				if (response.success) {
					window.location.href = "/";
				} else {
					showError(
						response.message || "登录失败，请检查用户名和密码",
					);
					loadCaptcha();
				}
			},
			error: function (xhr, status, error) {
				$('button[type="submit"]')
					.prop("disabled", false)
					.html('<i class="fas fa-sign-in-alt me-1"></i> 登录');

				showError("服务器连接失败，请稍后再试");
				console.error("登录请求错误:", error);
				loadCaptcha();
			},
		});
	});

	function showError(message) {
		$(".error-message").text(message).show();
	}

	$("#username, #password, #captcha").focus(function () {
		setTimeout(() => {
			$(".error-message").fadeOut("slow");
		}, 5000);
	});
});
