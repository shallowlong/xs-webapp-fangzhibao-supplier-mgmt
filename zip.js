const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const filesToZip = [
	'bin/',
	'database/',
	'public/',
	'routes/',
	'services/',
	'uploaded_files/',
	'views/',
	'app.js',
	'logger.js',
	'package.json',
	{ source: '.env.production', target: '.env', rename: true }
];
const outputZip = 'fangzhibao-supplier-mgmt-' + Date.now() + '.zip';

const output = fs.createWriteStream(outputZip);
const archive = archiver('zip', {
	zlib: { level: 9 }
});

output.on('close', function () {
	console.log(`成功创建ZIP文件：${outputZip}`);
	console.log(`压缩大小：${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
});

archive.on('error', function (err) {
	throw err;
});

archive.pipe(output);

// 在forEach循环中区分处理普通文件/目录和需要重命名的文件
filesToZip.forEach(item => {
	if (typeof item === 'object' && item.rename) {
		const sourcePath = path.resolve(__dirname, item.source);
		if (fs.existsSync(sourcePath)) {
			archive.file(sourcePath, { name: item.target });
			console.log(`已将${item.source}重命名为${item.target}并添加到ZIP`);
		} else {
			console.log(`警告: ${item.source} 不存在，跳过重命名操作`);
		}
	} else {
		const fullPath = path.resolve(__dirname, item);
		if (fs.existsSync(fullPath)) {
			const stats = fs.statSync(fullPath);
			if (stats.isDirectory()) {
				archive.directory(fullPath, item);
				console.log(`添加目录: ${item}`);
			} else {
				archive.file(fullPath, { name: item });
				console.log(`添加文件: ${item}`);
			}
		} else {
			console.log(`警告: ${item} 不存在，跳过添加`);
		}
	}
});

archive.finalize();