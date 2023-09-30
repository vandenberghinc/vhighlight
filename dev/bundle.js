/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 *
 * In order to prevent circular dependencies this is just a simple bundle script.
 * Since `vlib` will build the real js bundle class but requires `vhighlight`.
 *
 */

// ---------------------------------------------------------
// Imports.

const libpath = require("path")
const libfs = require("fs")

// ---------------------------------------------------------
// Settings.

const source = libpath.dirname(__dirname);
const includes = [
	libpath.join(source, "js/highlight.js"),
	libpath.join(source, "js/tokenizer.js"),
	libpath.join(source, "js/bash.js"),
	libpath.join(source, "js/cpp.js"),
	libpath.join(source, "js/css.js"),
	libpath.join(source, "js/html.js"),
	libpath.join(source, "js/js.js"),
	libpath.join(source, "js/json.js"),
	libpath.join(source, "js/markdown.js"),
	libpath.join(source, "js/python.js"),
	libpath.join(source, "js/js_compiler.js"),
	libpath.join(source, "js/export.js"),
];
const export_path = libpath.join(source, "vhighlight.js")

// ---------------------------------------------------------
// Bundle.

let data = `/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */
`;
for (let i = 0; i < includes.length; i++) {
	let file_data = libfs.readFileSync(includes[i]).toString();
	file_data = file_data.replaceAll(`/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */`, "");
 	const whitespace = [" ", "\t", "\n"];
 	while (file_data.length > 0 && whitespace.includes(file_data[0])) {
 		file_data = file_data.substr(1);
 	}
 	while (file_data.length > 0 && whitespace.includes(file_data[file_data.length - 1])) {
 		file_data = file_data.substr(0, file_data.length - 1);
 	}
 	data += file_data;
}
libfs.writeFileSync(export_path, data);
console.log(`Bundled into "${export_path}".`)