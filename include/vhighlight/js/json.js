/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Python highlighter.

vhighlight.json = {};

// The tokenizer options.
vhighlight.json.tokenizer_opts = {
	keywords: [
		"true",
		"false",
		"null",
	],
	single_line_comment_start: "//",
	multi_line_comment_start: "/*",
	multi_line_comment_end: "*/",
}

// Highlight.
vhighlight.json.highlight = function(code, return_tokens = false) {

	// Initialize the tokenizer.
	const tokenizer = new Tokenizer(vhighlight.json.tokenizer_opts);

	// Assign the code.
	tokenizer.code = code;

	// Tokenize.
	return tokenizer.tokenize(return_tokens);
}
