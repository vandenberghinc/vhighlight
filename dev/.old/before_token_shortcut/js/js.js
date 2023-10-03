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
			"class" // @todo still have to check the parent when it is assigned like "mylib.myclass = class myclass{}" create a on type def keyword callback.
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
		const tokenizer = this.tokenizer;

		// Function modifiers.
		this.function_modifiers = ["async", "static", "get", "set", "*"];

		// Add the parent tokens  from a type def assignment like "mylib.mymodule.MyClass" to the tokenizer.
		// The parameter token must be the type def token so "MyClass" in the example.
		const add_parent_tokens = (type_def_token) => {
			let parents = [];
			let parent_token = tokenizer.get_prev_token(type_def_token.index - 1, [" ", "\t", "\n"]);
			while ((parent_token = tokenizer.get_prev_token(parent_token.index - 1, [])) != null) {
				if ((parent_token.token === undefined && parent_token.data === ".")) {
					continue;
				} else if (parent_token.token === "token_keyword") { // also allow keywords since a user may do something like "mylib.module = ...";
					parents.push(parent_token);
				} else if (parent_token.is_word_boundary === true || parent_token.token !== undefined) {
					break;
				} else {
					parents.push(parent_token);
				}
			}
			parents.iterate_reversed((item) => {
				tokenizer.add_parent(item);
			})
		}

		// Set the on type def keyword callback.
		// The parents always need to be set, but when a class is defined like "mylib.MyClass = class MyClass {}" the tokenizer will not add mylib as a parent.
		// Do not forget to set and update the parents since the tokenizer will not do this automatically when this callback is defined.
		this.tokenizer.on_type_def_keyword = (token) => {

			// Get the assignment token.
			const assignment = tokenizer.get_prev_token(token.index - 1, [" ", "\t", "\n", "class"]);
			if (assignment != null && assignment.data === "=") {

				//
				// No need to copy the old parents and restore them later since the items will still be accessed under this parent+name.
				//

				// Get the token before the assignment, aka the other type def token.
				let type_def_token = tokenizer.get_prev_token(assignment.index - 1, [" ", "\t", "\n"]);

				// Get the parent values but start from the token before the "type_def_token" since that is the name of the type def and not the parent.
				add_parent_tokens(type_def_token);

				// Assign parents to the first type def token for vdocs and not to the second.
				type_def_token.token = "token_type_def";
				token.is_duplicate = true; // assign is duplicate and not the original token type def for vdocs.
				tokenizer.assign_parents(type_def_token);
				tokenizer.add_parent(type_def_token);
			}

			// Assign parents.
			else {
				tokenizer.assign_parents(token);
				tokenizer.add_parent(token);
			}

			// Set the start token to capture inherited classes.
			this.capture_inherit_start_token = token;
		}

		// Set on parenth close callback.
		this.tokenizer.on_parenth_close = ({
			token_before_opening_parenth = token_before_opening_parenth,
			after_parenth_index = after_parenth_index,
		}) => {

			// Get the function modifiers.
			// If any keyword is encoutered that is not a tag or "function" then terminate.
			let type_def_modifiers = [];
			// let prev_token_is_function_keyword = false;
			let iter_prev = token_before_opening_parenth;
			while (iter_prev.token === "token_keyword" || (iter_prev.token === "token_operator" && iter_prev.data === "*")) {
				if (this.function_modifiers.includes(iter_prev.data)) {
					type_def_modifiers.push(iter_prev.data);
				} else if (iter_prev.data === "function") {
					// prev_token_is_function_keyword = true;
				}
				iter_prev = tokenizer.get_prev_token(iter_prev.index - 1, [" ", "\t", "\n"]);
				if (iter_prev == null) {
					return null;
				}
			}

			// Check if the token is a keyword.
			let prev = token_before_opening_parenth;
			if (prev.token === "token_keyword") {
				if (prev.data !== "function" && this.function_modifiers.includes(prev.data) === false) {
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
			// Either a "{" after the closing parentheses.
			// Or a "=>" after the closing parentheses.
			const is_anonymous_func = after_parenth === "=" && tokenizer.code.charAt(after_parenth_index + 1) === ">";
			if (after_parenth === "{" || is_anonymous_func) {

				// Get the previous token, skip whitespace and ":" and function modifiers, but not the "=".
				let token = tokenizer.get_prev_token(prev.index, [" ", "\t", "\n", ":", "function", ...this.function_modifiers]);
				if (token === null) {
					return null;
				}

				// Check if the type def is assigned to a variable.
				let old_parents;
				if (token.data === "=") {

					// When the new parents are assigned using the "=" operator then the old parents need to be restored after assigning the parents to the token.
					// Otherwise it will have the wrong parents when a user does something like "mylib.myfunc = function() { ...; mylib.myotherfunc = function() {}; }"
					old_parents = tokenizer.copy_parents();

					// Get the parent values but start from the token before the var "token" since that is the name of the type def and not the parent.
					token = tokenizer.get_prev_token(token.index - 1, [" ", "\t", "\n"]);	
					add_parent_tokens(token);
				}

				// Check token.
				if (token == null || tokenizer.str_includes_word_boundary(token.data)) {
					return null;
				}

				// Set token.
				token.token = "token_type_def";
				token.pre_modifiers = type_def_modifiers;
				tokenizer.assign_parents(token);
				if (old_parents !== undefined) {
					tokenizer.parents = old_parents;
				}
				return token;
			}

			// Otherwise it is a function call.
			else if (!tokenizer.str_includes_word_boundary(prev.data)) {
				prev.token = "token_type";
				return prev;
			}
		}

		// Set the default callback.
		this.tokenizer.callback = (char) => {

			// Set the inherited classes when the flag is enabled.
			if (char === "}" && this.capture_inherit_start_token !== undefined) {

				// Append current batch by word boundary separator.
				tokenizer.append_batch();

				// Vars.
				const start_token = this.capture_inherit_start_token;
				let success = false;
				let inherited_types = [];

				// Iterate backwards till the extends token is found, capture the types found in between.
				tokenizer.tokens.iterate_tokens_reversed((token) => {
					if (token.index <= start_token.index) {
						return false;
					}
					else if (token.token === "token_keyword" && token.data === "extends") {
						success = true;
						return false;
					}
					else if (token.token === "token_type") {
						inherited_types.push({
							type: "public",
							token: token,
						});
					}
				})

				// Assign the inherited types to the token.
				if (success && inherited_types.length > 0) {
					start_token.inherited = inherited_types;
				}

				// Reset the inherited class check flag.
				this.capture_inherit_start_token = undefined;
			}
		}
	}

	// Reset attributes that should be reset before each tokenize.
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
vhighlight.js = new vhighlight.JS();
