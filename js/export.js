/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// Export vhighlight.
if (typeof module !== "undefined" && typeof module.exports !== "undefined") {

    // Set export file paths for web inclusions.
    // Remember this is bundled into vhighlight/vhighlight.js
    vhighlight.web_exports = {
        "css": `${__dirname}/css/vhighlight.css`,
        "js": `${__dirname}/vhighlight.js`,
    }

    // Set version.
    vhighlight.version = __VERSION__;

    // Export the library.
	module.exports = vhighlight;
}