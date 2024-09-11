/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// Import.
let vhighlight = require("../vhighlight.js");

// Initialize compiler.
const compiler = new vhighlight.JSCompiler({tree_shaking: true, mangle: true});

// Bundle vweb.
compiler.bundle({
    export_path: `${__dirname}/tests/dead_code.min.js`,
    includes: [
        `${__dirname}/tests/dead_code.js`,
        // `/Users/administrator/persistance/private/dev/vinc/vweb/js/frontend/min/vweb.js`,
    ],
    log: true,
});
