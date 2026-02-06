const { logger } = require("../logger");

const jwt = require("jsonwebtoken");

const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const userService = require("../services/userService");

const captchaLimiter = rateLimit({
	windowMs: 60 * 1000, // 1分钟
	limit: 10, // 每个IP最多10次请求
	message: { success: false, message: "请求过于频繁，请1分钟后再试" },
	validate: { trustProxy: true },
});

router.get("/", (req, res, next) => {
	const { code, svg } = generateCaptcha();

	setupCaptchaInSession(req, code);

	res.render("login", { captchaImage: svg });
});

router.post("/", async (req, res, next) => {
	const { username, password, captchaCode } = req.body;

	let respJson = {
		success: false,
		message: "",
	};

	const captchaCodeInSession = req.session.captchaCode;
	const captchaExpiresInSession = req.session.captchaExpires;
	if (!captchaCodeInSession || Date.now() > captchaExpiresInSession) {
		respJson.message = "验证码已过期，请刷新";

		delete req.session.captchaCode;
		delete req.session.captchaExpires;

		res.json(respJson);
		return;
	}

	if (captchaCode.toLowerCase() !== captchaCodeInSession) {
		respJson.message = "验证码错误，请重试";
		res.json(respJson);
		return;
	}

	let validated = await userService.validateUser(username, password);
	let message = "登录成功";

	logger.debug(`validate result = ${validated}`);

	if (validated) {
		let jwt_token = jwt.sign(
			{ username: username },
			process.env.JWT_SECRET,
			{ expiresIn: "1h" }, // 令牌1小时后过期
		);
		res.cookie("jwt_token", jwt_token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			maxAge: 60 * 60 * 1000, // 对应1小时过期
			sameSite: "strict",
		});
	} else {
		message = "用户名或密码错误";
	}

	respJson.success = validated;
	respJson.message = message;

	res.json(respJson);
});

router.get("/refreshCaptcha", captchaLimiter, (req, res) => {
	const { code, svg } = generateCaptcha();

	setupCaptchaInSession(req, code);

	res.json({ success: true, captchaImage: svg });
});

function setupCaptchaInSession(req, code) {
	req.session.captchaCode = code.toLowerCase();
	req.session.captchaExpires = Date.now() + 5 * 60 * 1000; // 5分钟过期
}

// 生成SVG验证码
function generateCaptcha() {
	// 生成4位随机字符（数字+字母）
	const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";
	let code = "";
	for (let i = 0; i < 4; i++) {
		code += chars.charAt(Math.floor(Math.random() * chars.length));
	}

	// 生成SVG
	const width = 160;
	const height = 42;
	const svg = `
	  <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
		<rect width="100%" height="100%" fill="#f3f4f6"/>
		
		<!-- 干扰线 -->
		${Array.from({ length: 4 })
			.map(() => {
				const x1 = Math.random() * width;
				const y1 = Math.random() * height;
				const x2 = Math.random() * width;
				const y2 = Math.random() * height;
				const stroke = `rgb(${Math.random() * 100 + 100}, ${Math.random() * 100 + 100}, ${Math.random() * 100 + 100})`;
				return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="1.5"/>`;
			})
			.join("")}
		
		<!-- 噪点 -->
		${Array.from({ length: 80 })
			.map(() => {
				const x = Math.random() * width;
				const y = Math.random() * height;
				const r = Math.random() * 1.5;
				const fill = `rgb(${Math.random() * 200}, ${Math.random() * 200}, ${Math.random() * 200})`;
				return `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
			})
			.join("")}
		
		<!-- 验证码文字 -->
		${Array.from(code)
			.map((char, i) => {
				const x = 30 + i * 30;
				const y = height / 2 + 8; // 垂直居中偏下
				const rotate = Math.random() * 60 - 30; // -30到30度旋转
				const fill = `rgb(${Math.random() * 80 + 80}, ${Math.random() * 80 + 80}, ${Math.random() * 80 + 80})`;
				return `
			<text 
			  x="${x}" y="${y}" 
			  font-family="Arial, sans-serif" 
			  font-size="24" 
			  font-weight="bold" 
			  fill="${fill}" 
			  text-anchor="middle" 
			  transform="rotate(${rotate}, ${x}, ${y})"
			>
			  ${char}
			</text>
		  `;
			})
			.join("")}
	  </svg>
	`;

	return {
		code,
		svg: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
	};
}

module.exports = router;
