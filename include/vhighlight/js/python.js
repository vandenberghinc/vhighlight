/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Python highlighter.

vhighlight.python = {};

// The tokenizer options.
vhighlight.python.tokenizer_opts = {
	keywords: [
		"and",
		"as",
		"assert",
		"break",
		"class",
		"continue",
		"def",
		"del",
		"elif",
		"else",
		"except",
		"finally",
		"for",
		"from",
		"global",
		"if",
		"import",
		"in",
		"is",
		"lambda",
		"not",
		"or",
		"pass",
		"raise",
		"return",
		"try",
		"while",
		"with",
		"yield",
		"self",
		"True",
		"False",
		"None",
	],
	type_def_keywords: [
		"def",
		"class",
	], 
	type_keywords: [],
	operators: [
		"==", "!=", "<", ">", "<=", ">=", "+", "-", "*", "/", "%", "**", "//", "=", "!", "?", "&", "|",
		"^", "~", "<<", ">>",
	],
	special_string_prefixes: [
		"f",
		"r",
		"u",
		"b",
	],
	single_line_comment_start: "#",
	multi_line_comment_start: false,
	multi_line_comment_end: false,
}

// Highlight.
vhighlight.python.highlight = function(code, return_tokens = false) {

	// Initialize the tokenizer.
	const tokenizer = new Tokenizer(vhighlight.python.tokenizer_opts);

	// Assign the code.
	tokenizer.code = code;

	// Start.
	tokenizer.callback = function(char) {

		// Highlight function calls.
		if (char == "(") {

			// Append batch by word boundary.
			this.append_batch();

			// Get prev token.
			// Prev token must be null since "token_type_def" is already assigned.
			// And also skip tuples by checking if the prev contains a word boundary.
			const prev = this.get_prev_token(this.tokens.length - 1, [" ", "\t", "\n"]);
			if (prev != null && prev.token == null && !this.str_includes_word_boundary(prev.data)) {
				prev.token = "token_type";
			}

		}

		// Highlight parameters.
		else if (this.parenth_depth > 0 && (char == "=" || char == ")" || char == ",")) {

			// Append batch by word boundary.
			this.append_batch();

			// Get the token index of the opening parentheses.
			let opening_index = null;
			let depth = 0;
			for (let i = this.tokens.length - 1; i >= 0; i--) {
				const token = this.tokens[i];
				if (token.token == null && token.data == "(") {
					--depth;
					if (depth <= 0) {
						opening_index = i;
						break;
					}
				} else if (token.token == null && token.data == ")") {
					++depth;
				}
			}
			if (opening_index == null) {
				return false;
			}

			// Get the preceding token of the opening parentheses.
			// When the token is not a "token_type" or "token_type_def" ...
			// Then stop since it is not a function call / function def, but for example a tuple.
			let preceding = this.get_prev_token(opening_index - 1, [" ", "\t", "\n"]);
			if (
				preceding == null || 
				(
					preceding.token != "token_type_def" &&
					preceding.token != "token_type"
				)
			) {
				return false;
			}
			const func_def = preceding.token == "token_type_def";

			// Skip when the parameter is not inside a function definition and the currenct char is ",".
			// Since only the parameters of a func def without assignment should be highlighted.
			// Not the parameters without assignment in a function call.
			if (!func_def && char == ",") {
				return false;
			}

			// Get prev token.
			const prev = this.get_prev_token(this.tokens.length - 1, [" ", "\t", "\n", "=", ")", ","]);
			if (prev == null) {
				return false;
			}

			// Get prev prev token.
			const prev_prev = this.get_prev_token(prev.index - 1, [" ", "\t", "\n"], true);

			// When the prev prev is a "," or a "(" then the prev is a parameter.
			if (
				prev.token == null && 
				prev_prev != null && 
				prev_prev.token == null && 
				(prev_prev.data == "(" || prev_prev.data == ",")
			) {
				prev.token = "token_parameter";
			}
		}

		// Not appended.
		return false;
	}

	// Tokenize.
	return tokenizer.tokenize(return_tokens);
}
