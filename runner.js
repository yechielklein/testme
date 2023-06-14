const fs = require('fs');
const path = require('path');
const color = require('picocolors');
const render = require('./render');


const ignoreDirs = ['node_modules'];

class Runner {
	constructor() {
		this.testFiles = [];
	};

	async runTests() {
		for (let file of this.testFiles) {
			console.log(color.gray(`---- ${file.relativePath}`));

			global.render = render;

			const beforeEaches = [];
			global.beforeEach = (func) => {
				beforeEaches.push(func);
			};

			global.it = async (description, func) => {
				beforeEaches.forEach(beforeEachFunc => beforeEachFunc());

				try {
					await func();
					console.log(color.green(`\tOK - ${description}`));
				} catch (err) {
					const message  = err.message.replace(/\n/g, '\n\t\t')
					console.log(color.red(`\tX - ${description}`));
					console.log(color.red(`\t ${message}`));
				};
			};

			try {
				require(file.name);
			} catch (err) {
				console.log(err);
			};
		};
	};

	async collectFiles(targetPath) {
		const files = await fs.promises.readdir(targetPath);

		for (let file of files) {
			const absolutePath = path.join(targetPath, file);
			const [pathTail] = file.split('\\').slice(-1);

			const stats = await fs.promises.lstat(absolutePath);

			if (stats.isFile() && file.includes('.test.js')) {
				this.testFiles.push({ name: absolutePath, relativePath: file });
			} else if (stats.isDirectory() && !ignoreDirs.includes(pathTail)) {
				const childFiles = await fs.promises.readdir(absolutePath);
				files.push(...childFiles.map(childFile => path.join(file, childFile)));
			};
		};
	};
};

module.exports = Runner;