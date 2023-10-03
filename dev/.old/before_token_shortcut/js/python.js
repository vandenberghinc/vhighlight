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
				"async",
				"await",
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

				// Do a forward lookup to parse the inherited classes when the `this.capture_inherit_start_token` flag is enanabled.
				// A forward lookup is requires since we can not catch the ")" parenth closed event since that is catched by tokenizer to parse the params.
				// And we also dont want to assign the on_parenth_close callback.
				if (this.capture_inherit_start_token !== undefined) {

					// Vars.
					const start_token = this.capture_inherit_start_token;
					let depth = 0; 						// parenth depth.
					let batch = "";						// the current batch.
					let lookup_tokens = [];				// the lookup token data `[token_type, token_data]`.
					let resume_on_index;				// resume on index of the closing parentheses, only assigned when the closing parenth is successfully found.

					// Append batch wrapper.
					const append_batch = (token = null) => {
						if (batch.length > 0) {
							if (token != null) {
								lookup_tokens.push([token, batch]);
							} else {
								lookup_tokens.push(["token_type", batch]);
							}
							batch = "";
						}
					}
					
					// Iterate forwards till the closing parentheses.
					for (let i = tokenizer.index; i < tokenizer.code.length; i++) {
						const c = tokenizer.code.charAt(i);

						// Depth increaser.
						if (c === "(") {
							append_batch();
							batch = c;
							append_batch(false);
							++depth;
						}

						// Depth increaser.
						else if (c === ")") {
							append_batch();
							batch = c;
							append_batch(false);
							--depth;
							if (depth === 0) {
								resume_on_index = i;
								break;
							}
						}

						// Allowed word boundaries.
						else if (c === "," || c === " " || c === "\t" || c === "\n") {
							append_batch();
							batch = c;
							append_batch(false);
						}

						// Non allowed word boundary.
						else if (c !== "." && c !== "_" && tokenizer.word_boundaries.includes(c)) {
							break;
						}

						// New batch and char is not alphabetical and not "_" so stop.
						else if (batch.length === 0 && c !== "_" && tokenizer.is_alphabetical(c) === false) {
							break;
						}

						// Append to batch.
						else {
							batch += c;
						}
					}

					// Reset capture inherit flag.
					this.capture_inherit_start_token = undefined;

					// Append the lookup tokens.
					// Check the appended tokens from `append_forward_lookup_batch()` and when any of them are type tokens then add them to the inherited types.
					// Since the inerhited array contains the actual tokens the building of the `inherited_types` array cant be done any earlier.
					if (resume_on_index !== undefined) {
						let inherited_types = [];
						for (let i = 0; i < lookup_tokens.length; i++) {
							const appended_tokens = tokenizer.append_forward_lookup_batch(lookup_tokens[i][0], lookup_tokens[i][1]);
							appended_tokens.iterate((token) => {
								if (token.token === "token_type") {
									inherited_types.push({
										type: "public",
										token: token,
									});
								}
							})
						}
						tokenizer.resume_on_index(resume_on_index - 1);
						if (inherited_types.length > 0) {
							start_token.inherited = inherited_types;
						}
						return true;
					}
				}

				// Resume as usual, check if it is a function call.
				else {

					// Get prev token.
					// Prev token must be null since "token_type_def" is already assigned.
					// And also skip tuples by checking if the prev contains a word boundary.
					const prev = tokenizer.get_prev_token(tokenizer.added_tokens - 1, [" ", "\t", "\n"]);
					if (prev != null && prev.token === undefined && !tokenizer.str_includes_word_boundary(prev.data)) {
						prev.token = "token_type";
					}
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

			// Get the assignment token.
			const async_token = tokenizer.get_prev_token(token.index - 1, [" ", "\t", "\n", "def"]);
			if (async_token != null && async_token.token === "token_keyword" && async_token.data === "async") {
				token.pre_modifiers = [async_token];
			}

			// Set the start token to capture inherited classes when the previous token is either struct or class.
			const prev = tokenizer.get_prev_token(token.index - 1, [" ", "\t", "\n"]);
			if (prev !== null && prev.data === "class") {
				this.capture_inherit_start_token = token;
			}

			// Assign parents.
			tokenizer.assign_parents(token);
			tokenizer.add_parent(token);
		}
	}

	// Reset attributes that need to reset for each parse.
	reset() {

		// Used to detect type def inheritance.
		this.capture_inherit_start_token = undefined;
	}

	// Highlight.
	highlight(code = null, return_tokens = false) {
		this.reset();
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
