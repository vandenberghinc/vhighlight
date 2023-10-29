/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Javascript highlighter.

vhighlight.JS = class JS extends vhighlight.Tokenizer {
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
			"undefined",
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

		// Initialize the tokenizer.
		super({
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

			// Language, must never be changed it is used by dependents, such as vdocs.
			language: "JS",
		});

		// Function modifiers.
		this.function_modifiers = ["async", "static", "get", "set", "*"];
	}

	// Reset attributes that should be reset before each tokenize.
	derived_reset() {

		// Used to detect type def inheritance.
		this.capture_inherit_start_token = undefined;
	}

	// Set the on type def keyword callback.
	// Do not forget to set and update the parents since the tokenizer will not do this automatically when this callback is defined.
	on_type_def_keyword(token) {

		// Parse the parents from assignment definition, so parse `vweb` and `utils` in `vweb.utils.myclass = class MyClass`.
		const assignment = this.get_prev_token(token.index - 1, [" ", "\t", "\n", "class"]);
		if (assignment != null && assignment.data === "=") {

			// Get the previous token before the assignment.
			// Also assign the token to a type def but indicate it is a duplicate type def of the original.
			const before_assignment = this.get_prev_token(assignment.index - 1, [" ", "\t", "\n"]);
			before_assignment.token = "type_def";
			before_assignment.is_duplicate = true; // indicate it is a duplicate, vdocs also depends on this.
			
			// Parse parents, exclude dots.
			let parents = [];
			let parent = before_assignment;
			while (true) {
				parent = this.get_prev_token(parent.index - 1, []);
				if (parent == null) {
					break;
				}
				else if (parent.data === ".") {
					continue;
				}
				else if (this.str_includes_word_boundary(parent.data)) { // must be after dot check since dot is a word boundary ofc.
					break;
				}
				parents.push(parent);
			}
			
			// Add the parents to the tokenizer so that when the user does something like `vweb.utils.myclass = class myclass{}` the functions from the class will also have the parent.
			token.parents = [];
			parents.iterate_reversed((parent) => {
				token.parents.push(parent);
				this.add_parent(parent);
			})

			// Add the current token also as a parent since it can have child functions.
			this.add_parent(token);
		}

		// Assign parents existing parents and add the current token as a parent.
		else {
			this.assign_parents(token);
			this.add_parent(token);
		}

		// Set the type array of the token, basically always "class" etc.
		token.type = [this.get_prev_token(token.index - 1, [" ", "\t", "\n"])];	

		// Set the start token to capture inherited classes.
		this.capture_inherit_start_token = token;
	}
	

	// Set on parenth close callback.
	on_parenth_close({
		token_before_opening_parenth,
		after_parenth_index,
	}) {

		// Get the function modifiers.
		let type_def_modifiers = [];
		let prev_modifier = this.get_prev_token(token_before_opening_parenth.index - 1, [" ", "\t", "\n"]);
		while (prev_modifier != null && (prev_modifier.token === "keyword" || (prev_modifier.token === "operator" && prev_modifier.data === "*"))) {
			if (this.function_modifiers.includes(prev_modifier.data)) {
				type_def_modifiers.push(prev_modifier);
			}
			prev_modifier = this.get_prev_token(prev_modifier.index - 1, [" ", "\t", "\n"]);
			if (prev_modifier == null) {
				break;
			}
		}

		// Check if the token is a keyword.
		let prev = token_before_opening_parenth;
		if (prev.token === "keyword") {
			if (prev.data !== "function" && this.function_modifiers.includes(prev.data) === false) {
				return null;
			}
		} else if (prev.token !== undefined && prev.token !== "operator") {
			return null;
		}

		// Check character after closing parentheses.
		if (after_parenth_index == null) {
			return null;
		}
		const after_parenth = this.code.charAt(after_parenth_index);

		// Check if the function is an anonymous function like `() => {};`
		const is_anonymous_func = after_parenth === "=" && this.code.charAt(after_parenth_index + 1) === ">";

		// Valid characters for a function declaration.
		// Either a "{" after the closing parentheses or a "=>" after the closing parentheses.
		if (after_parenth === "{" || is_anonymous_func) {

			// Get the previous token.
			let token = prev;
			token = this.get_prev_token(token.index, [" ", "\t", "\n", ":", "function", ...this.function_modifiers]);

			// When the token is assigned.
			let is_assignment_definition = false;
			if (token.data === "=") {
				token = this.get_prev_token(token.index - 1, [" ", "\t", "\n"]);				
				is_assignment_definition = true;
			}

			// Check token.
			if (token == null || this.str_includes_word_boundary(token.data)) {
				return null;
			}

			// Assign type def.
			token.token = "type_def";
			token.pre_modifiers = type_def_modifiers;

			// Parse the parents from assignment definition, so parse `vweb` and `utils` in `vweb.utils.func = () => {}`.
			if (is_assignment_definition) {

				// Parse parents, exclude dots.
				let parents = [];
				let parent = token;
				while (true) {
					parent = this.get_prev_token(parent.index - 1, []);
					if (parent == null) {
						break;
					}
					else if (parent.data === ".") {
						continue;
					}
					else if (this.str_includes_word_boundary(parent.data)) { // must be after dot check since dot is a word boundary ofc.
						break;
					}
					parents.push(parent);
				}
				
				// Add the parents to the tokenizer so that when the user does something like `vweb.utils.myclass = class myclass{}` the functions from the class will also have the parent.
				token.parents = [];
				parents.iterate_reversed((parent) => {
					token.parents.push(parent);
					this.add_parent(parent);
				})
			}

			// Return the token.
			return token;
		}

		// Otherwise it is a function call.
		else if (!this.str_includes_word_boundary(prev.data)) {
			prev.token = "type";
			return prev;
		}
	}

	// Set the default callback.
	callback(char) {

		// Set the inherited classes when the flag is enabled.
		if (char === "}" && this.capture_inherit_start_token !== undefined) {

			// Append current batch by word boundary separator.
			this.append_batch();

			// Vars.
			const start_token = this.capture_inherit_start_token;
			let success = false;
			let inherited_types = [];

			// Iterate backwards till the extends token is found, capture the types found in between.
			this.tokens.iterate_tokens_reversed((token) => {
				if (token.index <= start_token.index) {
					return false;
				}
				else if (token.token === "keyword" && token.data === "extends") {
					success = true;
					return false;
				}
				else if (token.token === "type") {
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

		// Check word boundary and uppercase constants.
		// Must be last.
		else if (this.word_boundaries.includes(char)) {

			// Check uppercase constant.
			if (this.batch.length > 0 && char !== ":" && this.is_full_uppercase(this.batch)) {
				this.append_batch("type");
			}

			// Append word boundary.
			this.append_batch();
			this.batch += char;
			this.append_batch(null, {is_word_boundary: true}); // do not use "false" as parameter "token" since the word boundary may be an operator.
			return true;
		}
	}
}

// Initialize.
vhighlight.js = new vhighlight.JS();
