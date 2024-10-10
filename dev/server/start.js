/* CODE TEST. 
console.log("=========================================")

const vlib = require(`${process.env.PERSISTANCE}/private/dev/vinc/vlib/js/vlib.js`);
const vhighlight = require("../../vhighlight.js")

const now = Date.now();

const path = new vlib.Path(`${__dirname}/../tests/js/test_funcs.js`);
const tokenizer = vhighlight.init_tokenizer_by_extension(path.extension())
const tokens = tokenizer.tokenize({code: path.load_sync()});

tokens.iterate_tokens((token) => {
    if (token.token === "type_def") {
        console.log(token.data, token.parents);
    }
})
// tokens.iterate_tokens((token) => {
//     if (token.token === "type_def") {
//         let parents = "";
//         token.parents.iterate((i) => {
//             parents += i.data + ".";
//         })
//         console.log(token.data, "==>", parents);
//     }
//     // if (token.token === "preprocessor") {
//     //     console.log(token.data);
//     // }
// })
// console.log(JSON.stringify(tokens, null, 4))

console.log("Speed: ", Date.now() - now);
const data = tokenizer.build_html();
const source = new vlib.Path(__dirname).base(2);
const html = `
<head>
<style>
${source.join("css/vhighlight.css").load_sync()}
</style>
</head>
<body style='background: black'>
<pre style='color: white'>
${data}
</pre>
</body>
`
new vlib.Path("/tmp/vhighlight.html").save_sync(html);

*/
/* UI TEST */

// ---------------------------------------------------------
// Imports.

const vweb = require(`${process.env.PERSISTANCE}/private/dev/vinc/vweb/backend/vweb.js`);
const vlib = require(`${process.env.PERSISTANCE}/private/dev/vinc/vlib/js/vlib.js`);
// const vweb = require(`@vandenberghinc/vweb`);
// const vlib = require(`@vandenberghinc/vlib`);

// ---------------------------------------------------------
// Server.

const join_array_tokens_data = (tokens, joiner = "") => {
    if (!Array.isArray(tokens)) { return "<undef>"}
    const data = [];
    tokens.iterate(token => {data.append(token.data)});
    return data.join(joiner);
}
const debug_tokens = (tokens) => {
    // console.log(tokens)
    console.log(JSON.stringify(tokens,null,4))

    // Dump classes.
    // tokens.iterate_tokens((token) => {
    //     if (token.token === "type_def") {
    //         // console.log(token)
    //         console.log(JSON.stringify(token,null,4))
    //     }
    // })

    // Dump parents.
    // tokens.iterate_tokens((token) => {
    //     if (token.token === "type_def") {
    //         // if (!Array.isArray(token.parents)) {
    //         //     console.log(token.data, "<no parents>");
    //         // } else {
    //         //     console.log(token.data, join_array_tokens_data([...token.parents, token], "."));
    //         // }
    //         console.log(token.data, token.parameter_tokens);
    //         console.log(token.data, token.is_assignment_parameters);
    //     }
    // })

    // Dump paremeters.
    // tokens.iterate_tokens((token) => {
    //     if (token.token === "type_def") {
    //         console.log(token.data, token.parameters);
    //     }
    // })
    return ;
}

// Source.
const source = new vlib.Path(__dirname).base(2);

// Initialize the server.
const server = new vweb.Server({
	port: 10000,
	ip: "127.0.0.1",
	statics: [
		source.join("js/"),
        source.join("css/"),
	],
    domain: "127.0.0.1:8000",
    source: `${__dirname}/.vweb/`,
    database: false,
    token_expiration: 86400,
    file_watcher: {
        source: `${__dirname}/../`,
        start_file: `${__dirname}/start.js`,
    },
    // file_watcher: {
    //     source: (new vlib.Path(__dirname).base(2)).str(),
    //     target: "dev/server/start.js",
    // },
})

// Load file.
server.endpoint({
    method: "GET",
    endpoint: "/",
    params: {path: "string"},
    callback: async (stream, params) => {
        const path = new vlib.Path(`${__dirname}/../tests/` + params.path);

        process.env.VHIGHLIGHT_COMPILE_LIGHT = "true";
        const bundle = require.resolve("../bundle.js");
        delete require.cache[bundle];
        require(bundle);

        const vhighlight_path = require.resolve("../../vhighlight.js");
        delete require.cache[vhighlight_path];
        const vhighlight = require(vhighlight_path);

        console.log('==========================\nHighlight:')

        const line_mode_tokenizer = vhighlight.init_tokenizer_by_extension(path.extension());
        const line_mode_tokens = line_mode_tokenizer.tokenize({code: path.load_sync()});
        debug_tokens(line_mode_tokens);

        const html = `
<html>
<style>
${new vlib.Path(`${__dirname}/../../css/vhighlight.css`).load_sync()}
</style>
<body style='width: 100vw; height: 100vh; margin: 0px; display: flex; padding: 0px; background: black;'>
<pre style='background: black; color: white; width: 100%; height: 100%; padding: 10px; margin: 0;'>
${line_mode_tokenizer.build_html({tokens: line_mode_tokens})}
</pre>
</body>
</html>
`
        stream.send({status: 200, data: html, headers: {"content-type": "text/html"}});
    },
})

// Start the server.
server.start();