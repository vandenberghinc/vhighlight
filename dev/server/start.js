/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Imports.

const vweb = require(`/Volumes/persistance/private/vinc/vweb/js/backend/vweb.js`);
const libpath = require("path")
const libfs = require("fs")

// ---------------------------------------------------------
// Server.

// Source.
const source = libpath.dirname(libpath.dirname(__dirname));

// Initialize the server.
const server = new vweb.Server({
	port: 8000,
	ip: "127.0.0.1",
	// private_key: `${__dirname}/../dev/tls/private-key.pem`,
	// certificate: `${__dirname}/../dev/tls/certificate.pem`,
	// passphrase: "Doeman12!",
	statics: [
		`${source}/include/vhighlight/`,
	],
    domain: "127.0.0.1:8000",
    database: `${__dirname}/.db/`,
    default_headers: null,
    token_expiration: 86400,
    enable_2fa: false,
    smtp_sender: null,
    smtp: null,
    production: false,
    file_watcher: __dirname,
})

// Load file.
server.endpoint({
    method: "GET",
    endpoint: "/",
    callback: async (request, response) => {
        // console.log(request);
        console.log(request.url);
        // let path = ...;
        // if (path.charAt(0) !== "/") {
        //     path = source + "/" + path;
        // }
        // const data = await libfs.readFileSync(path);
        // response.success({
        //     data: data.toString(),
        // })
        response.error({
            data: "Err",
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
            `vhighlight/js/highlight.js`,
            `vhighlight/js/tokenizer.js`,
            `vhighlight/js/utils.js`,
            `vhighlight/js/cpp.js`,
            `vhighlight/js/markdown.js`,
            `vhighlight/js/python.js`,
            `vhighlight/js/js.js`,
            `vhighlight/js/bash.js`,
            `vhighlight/js/css.js`,
            `vhighlight/js/html.js`,
        ],
        css_includes: [
            `vhighlight/css/vhighlight.css`,
        ],
    	callback: () => {
    		vweb.utils.on_load(() => {
                const pre = CodePre()
                    .color("#FFFFFF")
                    .background("black")
                    .border_radius(0)
                    .frame("100%", "100%");
                const code = vweb.utils.request({
                    method: "GET",
                    url: "/load_file",
                    data: {
                        path: "dev/tests/test.html",
                    }
                })
    			return View(pre);
    		})
    	}
    },
})

// Start the server.
server.start();