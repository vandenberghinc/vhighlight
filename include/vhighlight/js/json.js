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

vhighlight.Json = class Json {
	constructor() {

		// Initialize the this.tokenizer.
		this.tokenizer = new vhighlight.Tokenizer({
			keywords: [
				"true",
				"false",
				"null",
			],
			single_line_comment_start: "//",
			multi_line_comment_start: "/*",
			multi_line_comment_end: "*/",
		});
	}

	// Highlight.
	highlight(code, return_tokens = false) {
		this.tokenizer.code = code;
		return this.tokenizer.tokenize(return_tokens);
	}
}

// Initialize.
vhighlight.json = new vhighlight.Json();
