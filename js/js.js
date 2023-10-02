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
			// "implements",
			// "interface",
			// "package",
			// "private",
			// "protected",
			// "public",
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
		allowed_keywords_before_type_defs = ["function", "async", "static", "get", "set", "*"], // also include function otherwise on_parent_close wont fire.
		excluded_word_boundary_joinings = [], // for js compiler.

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
			allowed_keywords_before_type_defs: allowed_keywords_before_type_defs,
			excluded_word_boundary_joinings: excluded_word_boundary_joinings,
			scope_separators: scope_separators,
		});

		// Function tags.
		this.function_tags = ["async", "static", "get", "set", "*"];

		// Set on parenth close.
		// When a type or type def token is found it should return that token to assign the parameters to it, otherwise return `null` or `undefined`.
		const tokenizer = this.tokenizer;
		this.tokenizer.on_parenth_close = ({
			token_before_opening_parenth = token_before_opening_parenth,
			after_parenth_index = after_parenth_index,
		}) => {

			// Get the function tags.
			// If any keyword is encoutered that is not a tag or "function" then terminate.
			let type_def_tags = [];
			let prev_token_is_function_keyword = false;
			let iter_prev = token_before_opening_parenth;
			while (iter_prev.token === "token_keyword" || (iter_prev.token === "token_operator" && iter_prev.data === "*")) {
				console.log(iter_prev.data);
				if (this.function_tags.includes(iter_prev.data)) {
					type_def_tags.push(iter_prev.data);
				} else if (iter_prev.data === "function") {
					prev_token_is_function_keyword = true;
				}
				iter_prev = tokenizer.get_prev_token(iter_prev.index - 1, [" ", "\t", "\n"]);
				if (iter_prev == null) {
					return null;
				}
			}

			// Check if the token is a keyword.
			let prev = token_before_opening_parenth;
			if (prev.token === "token_keyword") {
				if (prev.data !== "function" && this.function_tags.includes(prev.data) === false) {
					return null;
				}
			} else if (prev.token !== undefined && prev.token !== "token_operator") {
				return null;
			}

			// Check character after closing parentheses.
			if (after_parenth_index == null) {
				return null;
			}
			const after_parenth = tokenizer.code.charAt(after_parenth_index);

			// Valid characters for a function declaration.
			if (after_parenth == "{") {

				// Get the function name when the previous token is a keyword or when it is a "() => {}" function..
				if (prev_token_is_function_keyword) {
					const token = tokenizer.get_prev_token(prev.index - 1, [" ", "\t", "\n", "=", ":", ...this.function_tags]);
					if (token == null || tokenizer.str_includes_word_boundary(token.data)) {
						return null;
					}
					token.token = "token_type_def";
					token.tags = type_def_tags;
					if (type_def_tags.length > 0) { console.log(token.data, type_def_tags); }
					return token;
				}

				// Assign the token type def to the current token.
				else if (!tokenizer.str_includes_word_boundary(prev.data)) {
					prev.token = "token_type_def";
					prev.tags = type_def_tags;
					if (type_def_tags.length > 0) { console.log(prev.data, type_def_tags); }
					return prev;
				}
			}

			// Functions declared as "() => {}".
			else if (after_parenth == "=" && tokenizer.code.charAt(after_parenth_index + 1) == ">") {
				const token = tokenizer.get_prev_token(prev.index - 1, [" ", "\t", "\n", "=", ":", ...this.function_tags]);
				if (token == null || tokenizer.str_includes_word_boundary(token.data)) {
					return null;
				}
				token.token = "token_type_def";
				token.tags = type_def_tags;
				if (type_def_tags.length > 0) { console.log(token.data, type_def_tags); }
				return token;
			}

			// Otherwise it is a function call.
			else if (!tokenizer.str_includes_word_boundary(prev.data)) {
				prev.token = "token_type";
				return prev;
			}
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
vhighlight.js = new vhighlight.JS();
