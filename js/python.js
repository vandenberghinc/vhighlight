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
			indent_language: true,

			// Attributes for partial tokenizing.
			scope_separators: [
				":", 
			],
		});
		const tokenizer = this.tokenizer;

		// Set callback.
		this.tokenizer.callback = (char) => {
			
			// Highlight function calls.
			if (char == "(") {

				// Append batch by word boundary.
				tokenizer.append_batch();

				// Get prev token.
				// Prev token must be null since "token_type_def" is already assigned.
				// And also skip tuples by checking if the prev contains a word boundary.
				const prev = tokenizer.get_prev_token(tokenizer.added_tokens - 1, [" ", "\t", "\n"]);
				if (prev != null && prev.token === undefined && !tokenizer.str_includes_word_boundary(prev.data)) {
					prev.token = "token_type";
				}

			}

			// Not appended.
			return false;
		}

		// Function modifiers.
		this.function_modifiers = ["async"];

		// Set the on type def keyword callback.
		// Used to detect the "async" function modifier.
		// Do not forget to set and update the parents since the tokenizer will not do this automatically when this callback is defined.
		this.tokenizer.on_type_def_keyword = (token) => {

			// // Get the assignment token.
			// const assignment = tokenizer.get_prev_token(token.index - 1, [" ", "\t", "\n", "class"]);
			// if (assignment != null && assignment.data === "=") {

			// 	//
			// 	// No need to copy the old parents and restore them later since the items will still be accessed under this parent+name.
			// 	//

			// 	// Get the token before the assignment, aka the other type def token.
			// 	let type_def_token = tokenizer.get_prev_token(assignment.index - 1, [" ", "\t", "\n"]);

			// 	// Get the parent values but start from the token before the "type_def_token" since that is the name of the type def and not the parent.
			// 	add_parent_tokens(type_def_token);

			// 	// Assign parents to the first type def token for vdocs and not to the second.
			// 	type_def_token.token = "token_type_def";
			// 	tokenizer.assign_parents(type_def_token);
			// 	console.log(type_def_token.data,":", type_def_token.parents);
			// 	tokenizer.add_parent(type_def_token.data);
			// }

			// // Assign parents.
			// else {
				tokenizer.assign_parents(token);
				tokenizer.add_parent(token.data);
			// }
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
			@name: code
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
			@name: tokens
			@type: array[object]
			@description: The old tokens.
		}
	} */
	partial_highlight({
		code = null,
		edits_start = null,
		edits_end = null,
		line_additions = 0,
		tokens = [],
	}) {

		// Assign code when not assigned.
		// So the user can also assign it to the tokenizer without cause two copies.
		if (code !== null) {
			this.tokenizer.code = code;
		}

		// Reset.
		if (this.reset != undefined) {
			this.reset();
		}

		// Partial tokenize.
		return this.tokenizer.partial_tokenize({
			edits_start: edits_start,
			edits_end: edits_end,
			line_additions: line_additions,
			tokens: tokens,
		})
	}
}

// Initialize.
vhighlight.python = new vhighlight.Python();
