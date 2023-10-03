/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

 // ---------------------------------------------------------
// Highlight.

// Highlight.
/* 
const vlib = require(`/Volumes/persistance/private/vinc/vlib/js/vlib.js`);
const vhighlight = require("../../vhighlight.js")
console.log("Highlighting...");
const now = Date.now();
const tokens = vhighlight.js.highlight(new vlib.Path("/Volumes/persistance/private/vinc/vhighlight/dev/tests/test2.js").load_sync(), true);
console.log(tokens[6]);
// for (let i = Math.max(0, tokens.length - 100); i < tokens.length; i++) {
//     console.log(tokens[i]);
// }
// tokens.iterate_tokens((token) => {
//     if (token.token === "token_type_def") {
//         console.log(token.data, token.parents);
//     }
// })
console.log("Speed: ", Date.now() - now);
*/
// ---------------------------------------------------------
// Imports.
/* */ 
const vweb = require(`/Volumes/persistance/private/vinc/vweb/js/backend/vweb.js`);
const vlib = require(`/Volumes/persistance/private/vinc/vlib/js/vlib.js`);
// const vweb = require(`@vandenberghinc/vweb`);
// const vlib = require(`@vandenberghinc/vlib`);

// ---------------------------------------------------------
// Server.

// Source.
const source = new vlib.Path(__dirname).base(2);

// Initialize the server.
const server = new vweb.Server({
	port: 8000,
	ip: "127.0.0.1",
	statics: [
		source.join("js/"),
        source.join("css/"),
	],
    domain: "127.0.0.1:8000",
    database: `${__dirname}/.db/`,
    default_headers: null,
    token_expiration: 86400,
    enable_2fa: false,
    smtp_sender: null,
    smtp: null,
    production: false,
    file_watcher: {
        source: (new vlib.Path(__dirname).base(2)).str(),
        target: "dev/server/start.js",
    },
})

// Load file.
server.endpoint({
    method: "GET",
    endpoint: "/load_file",
    callback: async (request, response) => {
        let path;
        try {
            path = request.param("path");
        } catch (err) {
            return response.error({
                status: 400, 
                headers: {"Content-Type": "text/plain"},
                data: `Bad Request - ${err}`,
            })    
        }
        response.success({
            data: path.charAt(0) != "/" ? source.join(path).load_sync() : new vlib.Path(path).load_sync(),
        })
    },
})

// Demo endpoint.
server.endpoint({
	method: "GET",
    endpoint: "/",
    // authenticated: true,
    view: {
        includes: [
            `js/highlight.js`,
            `js/tokenizer.js`,
            `js/cpp.js`,
            `js/markdown.js`,
            `js/python.js`,
            `js/js.js`,
            `js/bash.js`,
            `js/css.js`,
            `js/html.js`,
        ],
        css_includes: [
            `css/vhighlight.css`,
        ],
    	callback: () => {
    		vweb.utils.on_load(async () => {
                const pre = CodePre()
                    .color("#FFFFFF")
                    .background("black")
                    .border_radius(0)
                    .frame("100%", "100%")
                    .overflow("scroll");
                const {status, data} = await vweb.utils.request({
                    method: "GET",
                    url: "/load_file",
                    json: false,
                    params: {
                        // path: "dev/tests/test.html",
                        // path: "/Volumes/persistance/private/vinc/vlib/js/include/cli/cli.js",
                        // path: "/Users/administrator/persistance/private/vinc/vlib/js/include/cli/cli.js",
                        // path: "/Volumes/persistance/private/vinc/vide/node_modules/typescript/lib/tsserver.js",
                        path: "/Volumes/persistance/private/vinc/vhighlight/dev/tests/test2.js",
                    },
                })
                pre.innerHTML = vhighlight.js.highlight(data);
    			return View(pre);
    		})
    	}
    },
})

// Start the server.
server.start();