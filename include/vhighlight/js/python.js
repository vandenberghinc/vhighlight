/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Python highlighter.

vhighlight.Python = class Python {
	constructor() {

		// Initialize the this.tokenizer.
		this.tokenizer = new vhighlight.Tokenizer({
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
		});

		// Set callback.
		this.tokenizer.callback = (char) => {
			const tokenizer = this.tokenizer;
			
			// Highlight function calls.
			if (char == "(") {

				// Append batch by word boundary.
				tokenizer.append_batch();

				// Get prev token.
				// Prev token must be null since "token_type_def" is already assigned.
				// And also skip tuples by checking if the prev contains a word boundary.
				const prev = tokenizer.get_prev_token(tokenizer.added_tokens - 1, [" ", "\t", "\n"]);
				if (prev != null && prev.token == null && !tokenizer.str_includes_word_boundary(prev.data)) {
					prev.token = "token_type";
				}

			}

			// Highlight parameters.
			else if (tokenizer.parenth_depth > 0 && (char == "=" || char == ")" || char == ",")) {

				// Append batch by word boundary.
				tokenizer.append_batch();

				// Get the token index of the opening parentheses.
				let opening_index = null;
				let depth = 0;
				for (let i = tokenizer.added_tokens - 1; i >= 0; i--) {
					const token = tokenizer.tokens[i];
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
				let preceding = tokenizer.get_prev_token(opening_index - 1, [" ", "\t", "\n"]);
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
				const prev = tokenizer.get_prev_token(tokenizer.added_tokens - 1, [" ", "\t", "\n", "=", ")", ","]);
				if (prev == null) {
					return false;
				}

				// Get prev prev token.
				const prev_prev = tokenizer.get_prev_token(prev.index - 1, [" ", "\t", "\n"], true);

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
	}

	// Highlight.
	highlight(code = null, return_tokens = false) {
		if (code !== null) {
			this.tokenizer.code = code;
		}
		return this.tokenizer.tokenize(return_tokens);
	}

	// Partial highlight.
	/*	@docs: {
		@title Partial highlight.
		@description: Partially highlight text based on edited lines.
		@parameter: {
			@name: data
			@type: string
			@description: The new code data.
		}
		@parameter: {
			@name: edits_start
			@type: string
			@description: The start line of the new edits.
		}
		@parameter: {
			@name: edits_end
			@type: string
			@description: The end line of the new edits. The end line includes the line itself.
		}
		@parameter: {
			@name: insert_start
			@type: string
			@description: The start line from where to insert the new tokens into.
		}
		@parameter: {
			@name: insert_end
			@type: string
			@description: The end line from where to insert the new tokens into. The end line includes the line itself.
		}
		@parameter: {
			@name: tokens
			@type: array[object]
			@description: The old tokens.
		}
		@parameter: {
			@name: update_offsets
			@type: boolean
			@description: Update the offsets of the new tokens.
		}
	} */
	partial_highlight({
		code = null,
		edits_start = null,
		edits_end = null,
		insert_start = null,
		insert_end = null,
		tokens = [],
		update_offsets = true,
	}) {

		// Assign code when not assigned.
		// So the user can also assign it to the tokenizer without cause two copies.
		if (code !== null) {
			this.tokenizer.code = code;
		}

		// Partial tokenize.
		return this.tokenizer.partial_tokenize({
			edits_start: edits_start,
			edits_end: edits_end,
			insert_start: insert_start,
			insert_end: insert_end,
			tokens: tokens,
			update_offsets: update_offsets,
		})
	}
}

// Initialize.
vhighlight.python = new vhighlight.Python();
