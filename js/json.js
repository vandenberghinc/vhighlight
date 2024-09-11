/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Json highlighter.

vhighlight.JSON = class JSON extends vhighlight.Tokenizer {
	constructor() {

		// Initialize the tokenizer.
		super({
			keywords: [
				"true",
				"false",
				"null",
			],
			single_line_comment_start: "//",
			multi_line_comment_start: "/*",
			multi_line_comment_end: "*/",

			// Attributes for partial tokenizing.
			scope_separators: [
				"{", 
				"}", 
				",",
			],

			// Language, must never be changed it is used by dependents, such as Libris.
			language: "JSON",
		});
	}
}

// Initialize.
vhighlight.json = new vhighlight.JSON();
