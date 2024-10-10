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
	`${__dirname}/../js/highlight.js`,
	`${__dirname}/../js/iterator.js`,
	`${__dirname}/../js/tokenizer.js`,
	`${__dirname}/../js/bash.js`,
	`${__dirname}/../js/cpp.js`,
	`${__dirname}/../js/css.js`,
	`${__dirname}/../js/html.js`,
	`${__dirname}/../js/js.js`,
	`${__dirname}/../js/js_compiler.js`,
	`${__dirname}/../js/json.js`,
	`${__dirname}/../js/markdown.js`,
	`${__dirname}/../js/python.js`,
	`${__dirname}/../js/yaml.js`,
	`${__dirname}/../js/lmx.js`,
	`${__dirname}/../js/export.js`,
];
const export_path = `${__dirname}/../vhighlight.js`;

// ---------------------------------------------------------
// Bundle.

const version = JSON.parse(libfs.readFileSync(`${__dirname}/../package.json`)).version;

let data = `/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */
`;
for (let i = 0; i < includes.length; i++) {
	let file_data = libfs.readFileSync(includes[i]).toString();
	if (includes[i] === `${__dirname}/../js/export.js`) {
		file_data = file_data.replaceAll("__VERSION__", `"${version}"`)
	}
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
if (process.env.VHIGHLIGHT_COMPILE_LIGHT === "true") {
	console.log(`Bundled into "${export_path}".`)
}

// ---------------------------------------------------------
/* Bundle using bundled library. */

if (!process.argv.includes("--light") && !process.argv.includes("--basic") && process.env.VHIGHLIGHT_COMPILE_LIGHT !== "true") {

	// Import.
	let vhighlight;
	if (libfs.existsSync("/Volumes/persistance")) {
	    vhighlight = require("/Volumes/persistance/private/dev/vinc/vhighlight/vhighlight.js");
	    require("/Volumes/persistance/private/dev/vinc/vlib/js/vlib.js");
	} else {
	    vhighlight = require("/Users/administrator/persistance/private/dev/vinc/vhighlight/vhighlight.js");
	    require("/Users/administrator/persistance/private/dev/vinc/vlib/js/vlib.js");
	}

	// Initialize compiler.
	const compiler = new vhighlight.JSCompiler();

	// Bundle vweb.
	compiler.bundle({
	    export_path: export_path,
	    includes: [export_path],
	    log: false,
	});
	console.log(`\u001b[34m>>>\u001b[0m Compiled vhighlight.js${version ? "@" + version : ""} [${(libfs.statSync(export_path).size / 1024).toFixed(2)}KB].`);

	// Log.
	// console.log(`Bundled into "${export_path}".`);

}