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
		allow_preprocessors = false, // for the js compiler.
		allowed_keywords_before_type_defs = ["function", "async", "static", "get", "set", "*"], // also include function otherwise on_parent_close wont fire.
		excluded_word_boundary_joinings = [], // for js compiler.

		// Compiler options.
		compiler = false,

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
			allow_preprocessors: allow_preprocessors,
			allowed_keywords_before_type_defs: allowed_keywords_before_type_defs,
			excluded_word_boundary_joinings: excluded_word_boundary_joinings,

			// Language, must never be changed it is used by dependents, such as Libris.
			language: "JS",

			// Compiler options.
			compiler,
		});

		// Function modifiers.
		this.function_modifiers = ["async", "static", "get", "set", "*"];
	}

	// Reset attributes that should be reset before each tokenize.
	derived_reset() {

		// Used to detect type def inheritance.
		this.capture_inherit_start_token = undefined;

		// Detecting some very limited scopes.
		// Currently mainly used for detecting when inside a raw object literal.
		this.js_scopes = [];
	}

	// Derived retrieve state.
	derived_retrieve_state(data) {
		data.capture_inherit_start_token = this.capture_inherit_start_token;
		data.js_scopes = this.js_scopes;
	}

	// Set the on type def keyword callback.
	// Do not forget to set and update the parents since the tokenizer will not do this automatically when this callback is defined.
	on_type_def_keyword(token) {

		// Set the type array of the token, basically always "class" etc.
		token.type = [this.get_prev_token_by_token(token, [" ", "\t", "\n"])];	

		// Parse the parents from assignment definition, so parse `vweb` and `utils` in `vweb.utils.myclass = class MyClass`.
		const assignment = this.get_prev_token_by_token(token, [" ", "\t", "\n", "class"]);
		if (assignment != null && assignment.data === "=") {

			// Get the previous token before the assignment.
			// Also assign the token to a type def but indicate it is a duplicate type def of the original.
			const before_assignment = this.get_prev_token_by_token(assignment, [" ", "\t", "\n"]);
			token.is_duplicate = true; // indicate the post "class" name is a duplicate since this name will NOT be used primarily, libris also depends on this.
			
			// Parse parents, exclude dots.
			let parents = [];
			let parent = before_assignment;
			while (true) {
				parent = this.get_prev_token_by_token(parent, []);
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

			// Assign parents to before assignment token.
			this.assign_parents(before_assignment);

			// Assign as type def.
			// @warning must be after the `assign_parents`.
			this.assign_token_as_type_def(before_assignment);

			// Add the before assignment token also as a parent since it can have child functions.
			this.add_parent(before_assignment);

			// Copy the type.
			before_assignment.type = token.type;
		}

		// Assign parents existing parents and add the current token as a parent.
		else {
			this.assign_parents(token);
			this.assign_token_as_type_def(token);
			this.add_parent(token);
		}

		// Add a scope.
		this.js_scopes.append({scope: "class", depth: new vhighlight.NestedDepth(this.curly_depth, this.bracket_depth, this.parenth_depth)})

		// Set the start token to capture inherited classes.
		this.capture_inherit_start_token = token;
	}

	// Parse the parents from assignment definition, so parse `vweb` and `utils` in `vweb.utils.func = () => {}`, the `token` parameter should be token `func` from the example.
	// Also assigns them to the token.
	parse_assignment_parents(token) {

		// Parse parents, exclude dots.
		let parents = [];
		let parent = token;
		while (true) {
			parent = this.get_prev_token_by_token(parent, []);
			if (parent == null) {
				break;
			}
			else if (parent.data === ".") {
				continue;
			}
			else if (parent.is_word_boundary || this.str_includes_word_boundary(parent.data)) { // must be after dot check since dot is a word boundary ofc.
				break;
			}
			parents.push(parent);
		}
		
		// Add the parents to the tokenizer so that when the user does something like `vweb.utils.myclass = class myclass{}` the functions from the class will also have the parent.
		token.parents = [];
		parents.iterate_reversed((parent) => {
			token.parents.push(parent);
			// do not add to `this.add_parent` since it would remove earlier parents.
		})
	}

	// Set on parenth open callback.
	// For JS this callback is basically only for the line-by-line mode.
	on_parenth_open(token) {
		/*
		const me = static async () => {}
		const me = static async function () {}
		async function me () {}
		class Me {
			async me () {}
		}
		{
			me: async function() {},
			async me() {},
		}
		*/

		// Do not stop on keywords or word boundaries.
		// Keywords are allowed e.g., `const x = function(){}`
		// Word boundaries / operators are allowed e.g., `const x = () =>{}`

		// Retrieve the pre modifiers of a type def.
		// The `from_token` can either be the first possible modifier or the token after that.
		const extract_pre_modifiers = (from_token, auto_prev_on_initial_token = true) => {
			let pre_modifiers = [];
			let name_token;
			if (!auto_prev_on_initial_token || from_token.token === "keyword" || (from_token.token === "operator" && (from_token.data === "*" || from_token.data === "#"))) {
				name_token = from_token;
			} else {
				name_token = this.get_prev_token_by_token(from_token, [" ", "\t", "\n"]);
			}
			while (name_token != null && (name_token.token === "keyword" || (name_token.token === "operator" && (name_token.data === "*" || name_token.data === "#")))) {
				if (this.function_modifiers.includes(name_token.data)) {
					pre_modifiers.push(name_token);
				}
				name_token = this.get_prev_token_by_token(name_token, [" ", "\t", "\n"]);
				if (name_token == null) {
					break;
				}
			}
			return {pre_modifiers, name_token}
		}

		// Get previous.
		let prev = this.get_prev_token_by_token(token, [" ", "\t", "\n"], false, true);

		// When the previous token is `extends` then skip.
		if (prev && prev.token === "keyword" && prev.data === "extends") {
			return ;
		}

		// When the previous token is a function keyword.
		// Syntax: `async function me() {}`
		if (prev && prev.token === "keyword" && prev.data === "function") {
			const {pre_modifiers} = extract_pre_modifiers(token);
			this.assign_parents(token);
			this.assign_token_as_type_def(token);
			this.js_scopes.append({scope: "parameters", depth: new vhighlight.NestedDepth(this.curly_depth, this.bracket_depth, this.parenth_depth - 1)})
			token.pre_modifiers = pre_modifiers;
			return token;
		}

		// When inside an object or class by scope.
		let last_scope = this.js_scopes.last();
		if (last_scope && last_scope.scope === "class") {
		// if (this.parents.length > 0 && this.parents.last().curly + 1 === this.curly_depth) {

			// Syntax: `{ me: () => {}, }`
			if (token.data === ":") {
				const prev = this.get_prev_token_by_token(token, [" ", "\t", "\n"]);
				this.assign_parents(prev);
				this.assign_token_as_type_def(prev);
				this.js_scopes.append({scope: "parameters", depth: new vhighlight.NestedDepth(this.curly_depth, this.bracket_depth, this.parenth_depth - 1)})
				return prev;
			}

			// Syntax: `{ me: async function() {}, }`
			// Syntax: `{ me: async () => {}, }`
			else if (token.token === "keyword") {
				const {name_token, pre_modifiers} = extract_pre_modifiers(token);
				if (name_token && name_token.data === ":") {
					const prev = this.get_prev_token_by_token(name_token, [" ", "\t", "\n"]);
					this.assign_parents(prev);
					this.assign_token_as_type_def(prev);
					this.js_scopes.append({scope: "parameters", depth: new vhighlight.NestedDepth(this.curly_depth, this.bracket_depth, this.parenth_depth - 1)})
					prev.pre_modifiers = pre_modifiers;
					return prev;
				}
				// fallthrough due to incorrect syntax.
			}

			// Syntax: `{ async me() {}, }`
			const prev = this.get_prev_token_by_token(token); // always start on previous token since the current token is always the type def and otherwise a func named `get` would be counted as a pre modifier.
			if (prev) {
				const {pre_modifiers} = extract_pre_modifiers(prev, false);
				this.assign_parents(token);
				this.assign_token_as_type_def(token);
				this.js_scopes.append({scope: "parameters", depth: new vhighlight.NestedDepth(this.curly_depth, this.bracket_depth, this.parenth_depth - 1)})
				token.pre_modifiers = pre_modifiers;
				return token;
			}

		}

		// Assignment operators.
		// Syntax: `const me = () => {}`
		// Syntax: `const me = static async () => {}`
		// Syntax: `const me = static async function () {}`
		// Syntax: `me: static async function () {}` from uncaptured parent since plain objects are not detected as parents.
		const {name_token, pre_modifiers} = extract_pre_modifiers(token, false);
		if (name_token && (name_token.data === "=" || name_token.data === ":")) {
			const prev = this.get_prev_token_by_token(name_token, [" ", "\t", "\n"]);
			this.parse_assignment_parents(prev);
			this.assign_token_as_type_def(prev);
			this.js_scopes.append({scope: "parameters", depth: new vhighlight.NestedDepth(this.curly_depth, this.bracket_depth, this.parenth_depth - 1)})
			prev.pre_modifiers = pre_modifiers;	
			return prev;
		}	

		// Inside an object with syntax `const x = { ... ,\n me() {}, }`.
		if (
			last_scope &&
			last_scope.scope === "raw_object" &&
			token.token === undefined &&
			!token.is_word_boundary &&
			last_scope.depth.eq_values(this.curly_depth - 1, this.bracket_depth, this.parenth_depth - 1)
		) {
			// always start on previous token since the current token is always the type def and otherwise a func named `get` would be counted as a pre modifier.
			const prev = this.get_prev_token_by_token(token, [" ", "\t", "\n"], false /* check passed token */, true /* exclude comments */);
			if (prev && (!prev.is_word_boundary || prev.data === "," || prev.data === "{")) { // skip when prev is a word boundary, because then it could also be `{x: myfunc()}`
				const {name_token, pre_modifiers} = extract_pre_modifiers(prev, false);
				if (name_token && (name_token.data === "," || name_token.data === "{")) {
					this.assign_parents(token);
					this.assign_token_as_type_def(token);
					this.js_scopes.append({scope: "parameters", depth: new vhighlight.NestedDepth(this.curly_depth, this.bracket_depth, this.parenth_depth - 1)})
					token.pre_modifiers = pre_modifiers;
					return token;
				}
			}
		}

		// If the last token is not a word boundary than assign it as a type.
		// Also skip keywords for `if ()` like statements.
		if (!token.is_whitespace && !token.is_line_break && !token.is_word_boundary && (token.token !== "keyword" || token.data === "await")) {
			this.assign_token_as_type(token);
		}

	}
	
	/* @todo TMP 
	// Set on parenth close callback.
	on_parenth_close({
		token_before_opening_parenth,
		after_parenth_index,
	}) {

		// Get the function modifiers.
		let type_def_modifiers = [];
		let has_function_modifier = false;
		let prev_modifier = this.get_prev_token_by_token(token_before_opening_parenth, [" ", "\t", "\n"]);
		while (prev_modifier != null && (prev_modifier.token === "keyword" || (prev_modifier.token === "operator" && prev_modifier.data === "*"))) {
			if (this.function_modifiers.includes(prev_modifier.data)) {
				type_def_modifiers.push(prev_modifier);
			}
			if (prev_modifier.token === "keyword" && prev_modifier.data === "function") {
				has_function_modifier = true;
			}
			prev_modifier = this.get_prev_token_by_token(prev_modifier, [" ", "\t", "\n"]);
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
		} else if (prev.token !== undefined && prev.token !== "operator" && prev.token !== "type_def") {
			return null;
		}

		// Check character after closing parentheses.
		if (after_parenth_index == null) {

			// No char after so it is a func call when prev is not a word boundary.
			// Unless prev token is keyword "function".
			if (!this.str_includes_word_boundary(prev.data)) {
				if (has_function_modifier) {
					this.assign_token_as_type_def(prev)
				} else {
					this.assign_token_as_type(prev)
				}
			}
			return null;
		}
		const after_parenth = this.code.charAt(after_parenth_index);

		// Check if the function is an anonymous function like `() => {};`
		const is_anonymous_func = after_parenth === "=" && this.code.charAt(after_parenth_index + 1) === ">";

		// Valid characters for a function declaration.
		// Either a "{" after the closing parentheses or a "=>" after the closing parentheses.
		if (after_parenth === "{" || is_anonymous_func) {

			// Skip anonymous functions when they do not start with a {.
			if (is_anonymous_func) {
				let c, next_index = after_parenth_index + 2;
				while ((c = this.code.charAt(next_index)) === " " || c === "\t" === "\n") {
					++next_index;
				}
				if (c !== "{") {
					// console.log("Stop arrow func with char", {c, line: this.code.substr(next_index - 20, 40)});
					return null;
				}
			}

			// Get the previous token.
			let token = prev;
			token = this.get_prev_token(token.index, [" ", "\t", "\n", ":", "function", ...this.function_modifiers]);

			// When the token is assigned.
			let is_assignment_definition = false;
			if (token.data === "=") {
				token = this.get_prev_token_by_token(token, [" ", "\t", "\n"]);				
				is_assignment_definition = true;
			}

			// Skip anonymous function without an assignment variable.
			if (!is_assignment_definition && is_anonymous_func) {
				return null;
			}

			// Check token.
			if (token == null || this.str_includes_word_boundary(token.data)) {
				return null;
			}

			// Parse the parents from assignment definition, so parse `vweb` and `utils` in `vweb.utils.func = () => {}`.
			if (is_assignment_definition) {
				this.parse_assignment_parents(token);
			}

			// Assign parents.
			else {
				this.assign_parents(token);
			}

			// Assign type def.
			this.assign_token_as_type_def(token) // must be after assigning the parents.
			token.pre_modifiers = type_def_modifiers;

			// Return the token.
			return token;
		}

		// Otherwise it is a function call.
		else if (!this.str_includes_word_boundary(prev.data)) {
			this.assign_token_as_type(prev)
			return prev;
		}
	}
	*/

	// Set the default callback.
	callback(char) {

		// Detect raw object scope.
		if (char === "{") {
			this.append_batch();
			const prev = this.get_prev_token_by_token("last", [" ", "\t", "\n"], false, true);
			if (prev && (
				prev.data === "return" ||
				prev.data === "," ||
				prev.data === ":" ||
				prev.data === "=" ||
				prev.data === "[" ||
				prev.data === "(" ||
				prev.data === "?" || // from ternary operator `true ? X : Y`. 
				prev.data === "|" // from `x || {}`. 
			)) {
				this.js_scopes.append({
					depth: new vhighlight.NestedDepth(this.curly_depth - 1, this.bracket_depth, this.parenth_depth),
					scope: "raw_object",
				})

				// Add parent.
				if (prev.data === ":" || prev.data === "=") {
					let prev_prev = this.get_prev_token_by_token(prev);
					if (prev_prev && !prev_prev.is_word_boundary && prev_prev.token !== "keyword") {
						this.add_parent(prev_prev, this.curly_depth - 1);
						prev_prev.is_object_def = true;
					}
				}
			}

			// fallthrough.
		}

		// Open scope by "{".
		// if (this.js_scopes.length > 0 && char === "{") {
		// 	let scope;
		// 	if (
		// 		(scope = this.js_scopes.last()) != null &&
		// 		scope.is_open === false &&
		// 		scope.depth.eq_values(this.curly_depth - 1, this.bracket_depth, this.parenth_depth)
		// 	) {
		// 		scope.is_open = true;
		// 	}
		// }

		// Close parameter scope and optionally resume with function scope.
		if (this.js_scopes.length > 0 && char === ")") {
			let scope;
			if (
				(scope = this.js_scopes.last()) != null &&
				scope.scope === "parameters" &&
				(scope.is_open === undefined || scope.is_open === true) &&
				scope.depth.eq_values(this.curly_depth, this.bracket_depth, this.parenth_depth)
			) {
				this.js_scopes.pop();

				// Check if the scope continues in a function scope.
				let index = this.get_first_non_whitespace(this.index + 1, true /* include line breaks as whitespace */ );
				if (this.code.charAt(index) === "=" && this.code.charAt(index+1) === ">") {
					index = this.get_first_non_whitespace(index + 2, true /* include line breaks as whitespace */ );
				}
				if (index !== null && this.code.charAt(index) === "{") {
					this.js_scopes.append({scope: "function", depth: scope.depth})
				}
			}

			// fallthrough.
		}

		// Close scopes.
		else if (this.js_scopes.length > 0 && char === "}") {
			let scope;
			while (
				(scope = this.js_scopes.last()) != null &&
				scope.scope !== "parameters" &&
				scope.depth.eq_values(this.curly_depth, this.bracket_depth, this.parenth_depth)
			) {
				this.js_scopes.pop();
			}

			// fallthrough.
		}

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

		// Spread operator.
		else if (
			char === "." &&
			this.code.charAt(this.index + 1) === "." &&
			this.code.charAt(this.index + 2) === "."
		) {
			this.append_batch();
			this.batch = "...";
			this.append_batch("keyword");
			this.resume_on_index(this.index + 2);
			return true;
		}

		// @deprecated: CAUSES ISSUES WITH CLASS/FUNC DECLARATION NAMES THAT ARE ALL UPPERCASE.
		// Check word boundary and uppercase constants.
		// Must be last.
		// else if (this.word_boundaries.includes(char)) {

		// 	// Check uppercase constant.
		// 	if (this.batch.length > 0 && char !== ":" && this.is_full_uppercase(this.batch)) {
		// 		this.append_batch("type");
		// 	}

		// 	// Append word boundary.
		// 	this.append_batch();
		// 	this.batch += char;
		// 	this.append_batch(null, {is_word_boundary: true}); // do not use "false" as parameter "token" since the word boundary may be an operator.
		// 	return true;
		// }
	}
}

// Initialize.
vhighlight.js = new vhighlight.JS();
