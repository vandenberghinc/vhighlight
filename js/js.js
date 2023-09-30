/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Javascript highlighter.

vhighlight.JS = class JS {
	constructor({
		keywords = [
			"break",
			"case",
			"catch",
			"class",
			"const",
			"continue",
			"debugger",
			"default",
			"delete",
			"do",
			"else",
			"export",
			"extends",
			"finally",
			"for",
			"function",
			"if",
			"import",
			"in",
			"instanceof",
			"let",
			"new",
			"of",
			"return",
			"super",
			"switch",
			"this",
			"throw",
			"try",
			"typeof",
			"var",
			"void",
			"while",
			"with",
			"yield",
			"prototype",
			"true",
			"false",
			"null",
			"static",
			"async",
			"await",
			"process",
			"module",
			"exports",
			"get",
			"set",
			// "enum",
			"implements",
			"interface",
			"package",
			"private",
			"protected",
			"public",
		],
		type_def_keywords = [
			"class"
		], 
		type_keywords = [
			"extends",
		],
		operators = [
			"+", "-", "*", "/", "%", "**", "=", "+=", "-=", "*=", "/=", "%=", "**=",
			"==", "!=", "===", "!==", ">", "<", ">=", "<=", "&&", "||", "!", "&", "|",
			"^", "~", "<<", ">>", ">>>", "++", "--", "?",
		],
		single_line_comment_start = "//",
		multi_line_comment_start = "/*",
		multi_line_comment_end = "*/",
		allow_slash_regexes = true,
		allow_decorators = true,
		excluded_word_boundary_joinings = [],

		// Attributes for partial tokenizing.
		scope_separators = [
			"{", 
			"}", 
		],
	} = {}) {

		// Initialize the this.tokenizer.
		this.tokenizer = new vhighlight.Tokenizer({
			keywords: keywords,
			type_def_keywords: type_def_keywords, 
			type_keywords: type_keywords,
			operators: operators,
			single_line_comment_start: single_line_comment_start,
			multi_line_comment_start: multi_line_comment_start,
			multi_line_comment_end: multi_line_comment_end,
			allow_slash_regexes: allow_slash_regexes,
			allow_decorators: allow_decorators,
			excluded_word_boundary_joinings: excluded_word_boundary_joinings,
			scope_separators: scope_separators,
		});

		// Assign attributes.
		this.reset();

		// Set callback.
		this.tokenizer.callback = (char) => {
			
			// Opening parentheses.
			if (char == "(") {

				// Append current batch by word separator.
				this.tokenizer.append_batch();

				// Get the previous token.
				const prev = this.tokenizer.get_prev_token(this.tokenizer.added_tokens - 1, [" ", "\t", "\n"]);

				// No previous token or previous token is a keyword.
				if (prev == null) {
					return false;
				}

				// Check if the token is a keyword.
				let prev_token_is_function_keyword = false;
				if (prev.token == "token_keyword") {
					if (prev.data == "function") {
						prev_token_is_function_keyword = true;
					} else if (prev.data != "async") {
						return false;
					}
				} else if (prev.token !== undefined && prev.token != "token_operator") {
					return false;
				}

				// Get closing parentheses.
				const closing_parentheses = this.tokenizer.get_closing_parentheses(this.tokenizer.index);
				if (closing_parentheses == null) {
					return false;
				}

				// Check character after closing parentheses.
				const after_parenth = this.tokenizer.get_first_non_whitespace(closing_parentheses + 1, true);

				// Valid characters for a function declaration.
				const c = this.tokenizer.code.charAt(after_parenth);
				if (c == "{") {

					// Get the function name when the previous token is a keyword or when it is a "() => {}" function..
					if (prev_token_is_function_keyword) {
						const token = this.tokenizer.get_prev_token(prev.index - 1, [" ", "\t", "\n", "=", ":", "async"]);
						if (this.tokenizer.str_includes_word_boundary(token.data)) {
							return false;
						}
						token.token = "token_type_def";
					}

					// Assign the token type def to the current token.
					else if (!this.tokenizer.str_includes_word_boundary(prev.data)) {
						prev.token = "token_type_def";
					}
				}

				// Functions declared as "() => {}".
				else if (c == "=" && this.tokenizer.code.charAt(after_parenth + 1) == ">") {
					const token = this.tokenizer.get_prev_token(prev.index - 1, [" ", "\t", "\n", "=", ":", "async"]);
					if (this.tokenizer.str_includes_word_boundary(token.data)) {
						return false;
					}
					token.token = "token_type_def";
				}

				// Otherwise it is a function call.
				else if (!this.tokenizer.str_includes_word_boundary(prev.data)) {
					prev.token = "token_type";
				}
			}

			// Not appended.
			return false;
		}
	}

	// Reset attributes that should be reset before each tokenize.
	reset() {
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
vhighlight.js = new vhighlight.JS();
