/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// C++ highlighter.

vhighlight.CPP = class CPP extends vhighlight.Tokenizer {
	constructor({
		allow_header_type_defs = true, 	// allow header type definitions like `void myfunc();` to be highlighted as a type def, when disabled it will not be highlighted, therefore is is a variable name of a constuctor initialization with parentheses.
		compiler = false,				// compiler options enabled.
		inside_func = false,
	} = {}) {

		// Initialize the tokenizer.
		super({
			keywords: [
				"alignas",
				"alignof",
				"and",
				"and_eq",
				"asm",
				"atomic_cancel",
				"atomic_commit",
				"atomic_noexcept",
				"auto",
				"bitand",
				"bitor",
				"bool",
				"break",
				"case",
				"catch",
				"char",
				"char8_t",
				"char16_t",
				"char32_t",
				"class",
				"compl",
				"concept",
				"const",
				"consteval",
				"constexpr",
				"constinit",
				"const_cast",
				"continue",
				"co_await",
				"co_return",
				"co_yield",
				"decltype",
				"default",
				"delete",
				"do",
				"double",
				"dynamic_cast",
				"else",
				"enum",
				"explicit",
				"export",
				"extern",
				"false",
				"float",
				"for",
				"friend",
				"goto",
				"if",
				"inline",
				"int",
				"long",
				"mutable",
				"namespace",
				"new",
				"noexcept",
				"not",
				"not_eq",
				"nullptr",
				"operator",
				"or",
				"or_eq",
				"private",
				"protected",
				"public",
				"reflexpr",
				"register",
				"reinterpret_cast",
				"requires",
				"return",
				"short",
				"signed",
				"sizeof",
				"static",
				"static_assert",
				"static_cast",
				"struct",
				"switch",
				"synchronized",
				"template",
				"this",
				"thread_local",
				"throw",
				"true",
				"try",
				"typedef",
				"typeid",
				"typename",
				"union",
				"unsigned",
				"using",
				"virtual",
				"void",
				"volatile",
				"wchar_t",
				"while",
				"xor",
				"xor_eq",
			],
			type_def_keywords: [
				"namespace",
				"struct",
				"class",
				"enum",
				"union",
			],
			exclude_type_def_keywords_on_prev: [
				"using",
			],
			allowed_keywords_before_type_defs: [
				"operator", // since the operator keyword before a func like `operator []()` will be made a type def token, vdocs also depends on this.
			],
			type_keywords: [
				"const",
				"constexpr",
				"static",
				"volatile",
				"mutable",
				"namespace", // for the exclude_type_def_keywords_on_prev so that the using namespace xxx will make xxx as a type. 
			],
			operators: [
				"&&", "||", "!", "==", "!=", ">", "<", ">=", "<=", "+", "-", "*", "/", "%",
				"=", "+=", "-=", "*=", "/=", "%=", "++", "--", "<<", ">>", "&", "|", "^", "~",
				"?",
			],
			special_string_prefixes: [
				"L",
				"u",
				"U",
				"R",
				"u8",
			],
			single_line_comment_start: "//",
			multi_line_comment_start: "/*",
			multi_line_comment_end: "*/",
			allow_preprocessors: true,
			excluded_word_boundary_joinings: ["."],
			is_type_language: true,

			// Language, must never be changed it is used by dependents, such as Libris.
			language: "C++",

			// Compiler options.
			compiler,
		});

		// Parameters.
		this.allow_header_type_defs = allow_header_type_defs;

		// Function modifiers.
		this.all_function_modifiers = ["static", "virtual", "volatile", "inline", "friend", "extern", "explicit", "noexcept", "const", "constexpr", "mutable", "decltype", "override", "final", "requires", "template"];
		this.post_function_modifiers = ["static", "virtual", "volatile", "inline", "friend", "extern", "explicit", "noexcept", "const", "constexpr", "mutable", "decltype", "override", "final", "requires", "template"];
		this.pre_function_modifiers = ["static", "virtual", "volatile", "inline", "friend", "extern", "explicit", "noexcept", "constexpr", "mutable", "decltype", "override", "final", "requires", "template"];

		// Set inside func scope.
		if (inside_func) {
			this.cpp_scopes.append({
				depth: new vhighlight.NestedDepth(-1, -1, -1),
				scope: "func",
				is_open: true,
			})
		}
	}

	// ---------------------------------------------------------
	// On default callback.
	callback(char) {
		
		// Close is func.
		// @deprecated.
		// if (
		// 	this.inside_func && 
		// 	char === "}" && // since the opening curly can be encoutered before assinging `this.inside_func_closing_curly`.
		// 	this.curly_depth <= this.inside_func_closing_curly
		// 	// this.index > this.inside_func_closing_curly
		// ) {
		// 	this.inside_func = false;
		// }

		// Open scope by "{".
		if (this.cpp_scopes.length > 0 && char === "{") {
			let scope;
			// console.log("OPEN? line ", this.line, this.cpp_scopes.last(), {curly: this.curly_depth, bracket: this.bracket_depth, parenth: this.parenth_depth})
			if (
				(scope = this.cpp_scopes.last()) != null &&
				!scope.is_open &&
				scope.depth.eq_values(this.curly_depth - 1, this.bracket_depth, this.parenth_depth)
			) {
				scope.is_open = true;
				// console.log(">>> open")
			}
		}

		// Close scope.
		if (this.cpp_scopes.length > 0 && (char === ")" || char === "}")) {
			let scope;
			// console.log("POP? line ", this.line, this.cpp_scopes.last(), {curly: this.curly_depth, bracket: this.bracket_depth, parenth: this.parenth_depth})
			while (
				(scope = this.cpp_scopes.last()) != null &&
				scope.is_open &&
				scope.depth.eq_values(this.curly_depth, this.bracket_depth, this.parenth_depth)
			) {
				this.cpp_scopes.pop();
				// console.log(">>> pop")
			}
		}

		// Set the inherited classes when the flag is enabled.
		if (char === "{" && this.capture_inherit_start_token !== undefined) {

			// Append current batch by word boundary separator.
			this.append_batch();

			// Vars.
			const start_token = this.capture_inherit_start_token;
			let success = false;
			let inherited_types = [];
			let inherit_privacy_type = null;
			let post_colon = false;

			// Iterate backwards till the extends token is found, capture the types found in between.
			this.tokens.iterate_tokens(start_token.line, null, (token) => {
				if (token.index > start_token.index) {
					if (post_colon) {
						if (token.token === "keyword") {
							inherit_privacy_type = token.data;
						} else if (inherit_privacy_type != null) {
							if (token.is_whitespace) {
								return null;
							}
							else if (token.is_word_boundary) {
								inherit_privacy_type = null;
							} else {
								token.token = "type";
								inherited_types.push({
									type: inherit_privacy_type,
									token: token,
								})
							}
						}
					}
					else if (token.token === undefined && token.data === ":") {
						post_colon = true;
					}
				}
			})

			// Assign the inherited types to the token.
			if (inherited_types.length > 0) {
				start_token.inherited = inherited_types;
			}

			// Reset the inherited class check flag.
			this.capture_inherit_start_token = undefined;
		}

		// Template keyword.
		if (this.cpp_inside_template_keyword === 0 && char === "<") {
			// beware that the "<" and ">" tokens should not be added as operators.

			// Append current batch.
			this.append_batch();

			// Template keyword.
			const prev = this.get_prev_token_by_token("last", [" ", "\t", "\n"], true); // may also return current token because of `true`.
			if (
				prev && (
					(prev.token === "keyword" && prev.data === "template")
					// lambda funcs is not supported otherwise it would also catch `m_arr[i] << '"'` like syntax as a template.
					// || (prev.token === undefined && prev.data === "]") // lambda funcs can also have templates like this `[]<typename T>(T x) {}`.
				)
			) {

				// Set flag.
				this.cpp_inside_template_keyword = 1;

				// Add scope.
				this.cpp_scopes.append({
					depth: new vhighlight.NestedDepth(), // filled with undefinded so it never closes automatically.
					scope: "template_keyword",
					is_open: false,
				})

				// Append.
				this.batch = char;
				this.append_batch(false);
				return true;
			}

			// Check template arguments.
			// Also try to highlight the template arguments.
			// It is not extremely accurate but Libris does not depend on this so its fine. 
			else {

				// Do a forward lookup till the closing >, if there are any unallowed characters stop the lookup.
				// Since lines like "x < y;" are allowed, so not everything is a template.
				let is_template = false;
				let depth = 1;
				let parenth_depth = 0;
				let word = "";
				let append_to_batch = [[false, char]];
				let index;
				let next_is_type = true;
				let c;
				const add_word = (is_word_boundary = false, set_seperator = false) => {
					if (word.length > 0) {
						if (word === "typename") {
							append_to_batch.push(["keyword", word]);
							next_is_type = true;
						}
						else if (this.keywords.includes(word)) {
							append_to_batch.push(["keyword", word]);
						}
						else if (next_is_type) {
							append_to_batch.push(["type", word]);
							next_is_type = false;
						}
						else {
							append_to_batch.push([false, word]);
						}
						word = "";
						if (set_seperator) {
							// if (c == " ") {
							// 	next_is_type = false;
							// } else
							if (c == ",") {
								next_is_type = true;
							} else if (c == "(") {
								next_is_type = true;
							}
						}
					}
				}
				for (index = this.index + 1; index < this.code.length; index++) {
					c = this.code.charAt(index);

					// Closing template.
					if (c == "<") {
						next_is_type = true;
						add_word();
						append_to_batch.push([false, c]);
						++depth;
					} else if (c == ">") {
						next_is_type = true;
						add_word();
						append_to_batch.push([false, c]);
						--depth;
						if (depth == 0) {
							is_template = true;
							break;
						}
					}

					// Allowed separator characters.
					else if (c === "(") {
						++parenth_depth;
						next_is_type = true;
						add_word(true);
						append_to_batch.push([false, c]);
					}
					else if (c === ")") {
						if (parenth_depth === 0) {
							break; // stop, there must be an opening parenth first otherwise it can also be an if statement like "if(... < ...)"
						}
						--parenth_depth;
						next_is_type = true;
						add_word(true);
						append_to_batch.push([false, c]);
					}
					else if (c === "{" || c === "}") {
						if (parenth_depth === 0) {
							break; // stop, there must be an opening parenth first otherwise it can also be an if statement like "auto& operator <() {"
						}
						add_word(true);
						append_to_batch.push([false, c]);
					}
					else if (c === "=") {
						add_word(true);
						append_to_batch.push(["operator", c]);
						next_is_type = true;
					}
					else if (this.operators.includes(c)) {
						if (c === "&" && this.code.charAt(index + 1) === "&") {
							break; // stop dont allow double &&.
						}
						else if (c === "|" && this.code.charAt(index + 1) === "|") {
							break; // stop dont allow double ||.
						}
						add_word(true);
						append_to_batch.push(["operator", c]);
					}

					// Allowed colon word boundary and on double colon next is type.
					else if (c === ":") {
						add_word(true);
						append_to_batch.push([false, c]);
						if (this.code.charAt(index - 1) === ":") {
							next_is_type = true;
						}
					}

					// Allowed word boundaries.
					else if (this.is_whitespace(c) || c == "," || c == ":" || c == "\n" || c == "[" || c == "]" || c == "_") {
						add_word(true);
						append_to_batch.push([false, c]);
					}

					// Allowed alpha and numeric
					else if (this.is_alphabetical(c) || this.is_numerical(c)) {
						word += c;
					}

					// Non allowed characters.
					else {
						break;
					}
				}

				// Add the batches when it is a template.
				if (is_template) {
					for (let i = 0; i < append_to_batch.length; i++) {
						this.append_forward_lookup_batch(append_to_batch[i][0], append_to_batch[i][1], {is_template: true});
					}
					this.resume_on_index(index);
					return true;
				}

			}

			// Append.
			this.batch = char;
			this.append_batch();
			return true;
		}

		// Inside template keyword.
		else if (this.cpp_inside_template_keyword > 0) {
			// beware that `template <bool x = myint > 10>` is not allowed since the templates need to be computable at compile time.
			// beware the other nested templates are allowed.`
			// beware that keywords, strings, numbers etc are already captured in the main tokenizer's callback.
			// beware that the "<" and ">" tokens should not be added as operators.

			// Increment / decrement template depth.
			if (char === "<") {
				++this.cpp_inside_template_keyword;
			} else if (char === ">") {
				--this.cpp_inside_template_keyword;
				if (this.cpp_inside_template_keyword === 0) {

					// Append token.
					this.append_batch();
					this.batch = char;
					const token = this.append_batch(false);

					// Set the `is_template` flag on all the template tokens.
					// This is for the parsing of pre modifier tokens.
					let prev = token;
					while (true) {
						prev.is_template = true;
						prev = this.get_prev_token_by_token(prev, []);
						if (prev == null || (prev.token === "keyword" && prev.data === "template")) {
							break;
						}
					}

					// Remove scope.
					if (this.cpp_scopes.length > 0 && this.cpp_scopes.last().scope === "template_keyword") {
						--this.cpp_scopes.length;
					}

					// Appended char response.
					return true;
				}
			}

			// Detect types.
			if (this.word_boundaries.includes(char)) {
				this.append_batch();
				const last = this.get_prev_token_by_token("last", [" ", "\t", "\n"], true); // may also return current token because of `true`.
				if (last != null && last.token === undefined) {
					const prev = this.get_prev_token_by_token(last, [" ", "\t", "\n"]);
					if (prev.token === undefined && (prev.data === "<" || prev.data === ",")) {
						this.assign_token_as_type(last);
					}
				}
				this.batch = char;
				this.append_batch(null, {is_word_boundary: true}); // do not use "false" as parameter "token" since the word boundary may be an operator or white space.
				return true;
			}
		}

		// Inside template activation `Array<Me>`.
		// @todo
		// if () {

		// }

		// Detect types by the first x words on the line preceded by whitespace and another alphabetical character.
		// Must be first since other if statements in this func check if the token before x is not a type.
		if (
			(this.last_line_type != this.line && char != " " && char != "\t") || // types are allowed at the start of the line.
			(this.is_keyword_before_parentheses !== true && this.prev_char == "(" || (this.parenth_depth > 0 && this.prev_char == ",")) // types are allowed inside parentheses.
		) {
			this.last_line_type = this.line;

			// Append the batch because of the lookup.
			this.append_batch();

			// Do a lookup to check if there are two consecutive words without any word boundaries except for whitespace.
			let is_type = false;
			let hit_template = 0;
			let word = "";
			let words = 0;
			let append_to_batch = [];
			let last_index, last_append_index;
			for (let index = this.index; index < this.code.length; index++) {
				const c = this.code.charAt(index);

				// Hit template, treat different.
				// Iterate till end of template and then check if there is only whitespace and then a char.
				if (hit_template == 2) {

					// Allowed chars.
					if (c == " " || c == "\t" || c == "*" || c == "&" || c == "\n") {
						continue;
					}

					// Stop at first word char.
					else if (this.is_alphabetical(c)) {
						if (words == 1) {
							is_type = true;
							break;
						}
						break;
					}

					// Non allowed chars.
					else {
						break;
					}
				}
				else if (hit_template == 1) {
					if (c == ">") {
						hit_template = 2;
					}
				}

				// Did not hit any template.
				else {

					// Allowed separator characters.
					if (c == " " || c == "\t" || c == ":" || c == "*" || c == "&" || (words == 0 && c == "<")) {
						if (c == "<") {
							hit_template = 1;
						}
						if (word.length > 0) {
							if (this.keywords.includes(word)) { // do not increment words on a keyword.
								// Stop when a type def keyword was encoutered.
								if (this.type_def_keywords.includes(word)) {
									return false;
								}
								append_to_batch.push(["keyword", word]);
							} else {
								if (c != ":" || this.code.charAt(index + 1) != ":") { // do not increment on colons like "vlib::String" since they should count as one word.
									++words;
								}
								append_to_batch.push(["type", word]);
							}
							last_index = index;
							last_append_index = append_to_batch.length - 1;
							word = "";
						}
						if (c == "*" || c == "&") {
							append_to_batch.push(["operator", c]);
						} else {
							append_to_batch.push([null, c]); // @todo changed jerre [false, c] to [null, c] still have to check but it should still highlight numerics in append_token called by append_forward_lookup_token
						}
					}

					// Allowed word chars.
					else if (this.is_alphabetical(c) || (word.length > 0 && this.is_numerical(c))) {
						if (words == 1) {
							is_type = true;
							break;
						}
						word += c;
					}

					// Non allowed chars.
					else {
						break;
					}
				}
			}

			// Add the batches when it is a type.
			if (is_type) {
				for (let i = 0; i <= last_append_index; i++) {
					this.append_forward_lookup_batch(append_to_batch[i][0], append_to_batch[i][1]);
				}
				this.resume_on_index(last_index - 1);
				return true;
			}
			return false;

		}

		// Braced initialiatons, depends on a ">" from a template on not being an operator.
		if (char == "{") {

			// Append current batch by word boundary separator.
			this.append_batch();

			// Edit the previous token when the token is not already assigned and when the data is not "(" for a func or "if", and skip operators etc.
			// Skip where the token before the previous is already type for example "String x {}".
			// Also skip the tokens between < and > when the initial prev and the prev prev token is a ">".
			let prev = this.get_prev_token(this.added_tokens - 1, [" ", "\t", "\n", "&", "*"]);
			if (prev == null) { return false; }
			let prev_prev = this.get_prev_token_by_token(prev, [" ", "\t", "\n", "*", "&"]);
			if (prev.data === ">" && (prev_prev == null || prev_prev.data !== "-")) {
				const token = this.get_opening_template(prev.index);
				if (token != null) {
					prev = this.get_prev_token_by_token(token, []);
				}
			}
			prev_prev = this.get_prev_token_by_token(prev, [" ", "\t", "\n", "&", "*"]);
			if (prev_prev != null && prev_prev.data == ">") {
				let prev_prev_prev = this.get_prev_token_by_token(prev, [" ", "\t", "\n", "*", "&"]);
				if (prev_prev == null || prev_prev.data !== "-") {
					const token = this.get_opening_template(prev_prev.index);
					if (token != null) {
						prev_prev = this.get_prev_token_by_token(token, []);
					}
				}
			}
			if (
				(prev_prev == null || prev_prev.token != "type") && 
				prev.token === undefined && prev.is_word_boundary !== true
			) {
				prev.token = "type";
			}
			return false;
		}

		// Types inside templates not only the keyword template but also for type or function templates.
		// else if (char == "<") {

		// 	// Append the batch because of the lookup.
		// 	this.append_batch();

		// 	// Do a forward lookup till the closing >, if there are any unallowed characters stop the lookup.
		// 	// Since lines like "x < y;" are allowed, so not everything is a template.
		// 	let is_template = false;
		// 	let depth = 1;
		// 	let parenth_depth = 0;
		// 	let word = "";
		// 	let append_to_batch = [[false, char]];
		// 	let index;
		// 	let next_is_type = true;
		// 	let c;
		// 	const add_word = (is_word_boundary = false, set_seperator = false) => {
		// 		if (word.length > 0) {
		// 			if (word === "typename") {
		// 				append_to_batch.push(["keyword", word]);
		// 				next_is_type = true;
		// 			}
		// 			else if (this.keywords.includes(word)) {
		// 				append_to_batch.push(["keyword", word]);
		// 			}
		// 			else if (next_is_type) {
		// 				append_to_batch.push(["type", word]);
		// 				next_is_type = false;
		// 			}
		// 			else {
		// 				append_to_batch.push([false, word]);
		// 			}
		// 			word = "";
		// 			if (set_seperator) {
		// 				// if (c == " ") {
		// 				// 	next_is_type = false;
		// 				// } else
		// 				if (c == ",") {
		// 					next_is_type = true;
		// 				} else if (c == "(") {
		// 					next_is_type = true;
		// 				}
		// 			}
		// 		}
		// 	}
		// 	for (index = this.index + 1; index < this.code.length; index++) {
		// 		c = this.code.charAt(index);

		// 		// Closing template.
		// 		if (c == "<") {
		// 			next_is_type = true;
		// 			add_word();
		// 			append_to_batch.push([false, c]);
		// 			++depth;
		// 		} else if (c == ">") {
		// 			next_is_type = true;
		// 			add_word();
		// 			append_to_batch.push([false, c]);
		// 			--depth;
		// 			if (depth == 0) {
		// 				is_template = true;
		// 				break;
		// 			}
		// 		}

		// 		// Allowed separator characters.
		// 		else if (c === "(") {
		// 			++parenth_depth;
		// 			next_is_type = true;
		// 			add_word(true);
		// 			append_to_batch.push([false, c]);
		// 		}
		// 		else if (c === ")") {
		// 			if (parenth_depth === 0) {
		// 				break; // stop, there must be an opening parenth first otherwise it can also be an if statement like "if(... < ...)"
		// 			}
		// 			--parenth_depth;
		// 			next_is_type = true;
		// 			add_word(true);
		// 			append_to_batch.push([false, c]);
		// 		}
		// 		else if (c === "{" || c === "}") {
		// 			if (parenth_depth === 0) {
		// 				break; // stop, there must be an opening parenth first otherwise it can also be an if statement like "auto& operator <() {"
		// 			}
		// 			add_word(true);
		// 			append_to_batch.push([false, c]);
		// 		}
		// 		else if (c === "=") {
		// 			add_word(true);
		// 			append_to_batch.push(["operator", c]);
		// 			next_is_type = true;
		// 		}
		// 		else if (this.operators.includes(c)) {
		// 			add_word(true);
		// 			append_to_batch.push(["operator", c]);
		// 		}

		// 		// Allowed colon word boundary and on double colon next is type.
		// 		else if (c === ":") {
		// 			add_word(true);
		// 			append_to_batch.push([false, c]);
		// 			if (this.code.charAt(index - 1) === ":") {
		// 				next_is_type = true;
		// 			}
		// 		}

		// 		// Allowed word boundaries.
		// 		else if (this.is_whitespace(c) || c == "," || c == ":" || c == "\n" || c == "[" || c == "]" || c == "_") {
		// 			add_word(true);
		// 			append_to_batch.push([false, c]);
		// 		}

		// 		// Allowed alpha and numeric
		// 		else if (this.is_alphabetical(c) || this.is_numerical(c)) {
		// 			word += c;
		// 		}

		// 		// Non allowed characters.
		// 		else {
		// 			break;
		// 		}
		// 	}

		// 	// Add the batches when it is a template.
		// 	if (is_template) {
		// 		for (let i = 0; i < append_to_batch.length; i++) {
		// 			this.append_forward_lookup_batch(append_to_batch[i][0], append_to_batch[i][1], {is_template: true});
		// 		}
		// 		this.resume_on_index(index);
		// 		return true;
		// 	}
		// }

		// Double colon.
		if (char == ":" && this.prev_char == ":") {

			// Append batch by separator.
			this.append_batch();

			// Append to new batch.
			this.batch += char;
			this.append_batch(false);

			// Set next token.
			this.next_token = "type";

			// Set prev token.
			// Skip the tokens between < and > when the initial prev token is a ">".
			let prev = this.get_prev_token(this.added_tokens - 1, [":"]);
			if (prev == null) {
				return true;
			}
			let prev_prev = this.get_prev_token_by_token(prev, [" ", "\t", "\n", "*", "&"]);
			if (prev.data === ">" && (prev_prev == null || prev_prev.data !== "-")) {
				prev = this.get_opening_template(prev.index);
				if (prev !== null) {
					prev = this.get_prev_token_by_token(prev, [])
				}
			}
			if (prev == null) {
				return true;
			}
			if (
				(prev.token === undefined || prev.token == "type_def") && // when token is null or prev token from like "using namespace a::b::c;"
				!this.str_includes_word_boundary(prev.data)
			) {
				prev.token = "type";
			}
			return true;
		}

		// Not appended.
		return false;
	}

	// ---------------------------------------------------------
	// Parsing type definitions, functions, function modifiers, function requires clause, function templates clause and function types.

	// Check if a character matches the first char of one of the function modifiers.
	first_char_matches_function_modifier(char) {
		for (let i = 0; i < this.all_function_modifiers.length; i++) {
			if (this.all_function_modifiers[i].charAt(0) === char) {
				return true;
			}
		}
		return false;
	}

	// Parse the pre modifiers, requires clause, template clause and the function type on a type def token match from inside the `on_parent_close()` callback.
	parse_pre_type_def_modifiers(first_type_def_token, type_def_token, type_defs_from_colon = []) {

		// Vars.
		let type_tokens = []; 							// function's type tokens.
		let templates_tokens = [];						// function's template clause tokens.
		let requires_tokens = []; 						// function's requires clause tokens.
		let modifier_tokens = [];						// the modifier tokens.
		let first_type_keyword = true;					// the first keyword is still a type when the post_type flag is false.
		let post_type = false;							// tokens in the iteration are before the type tokens.
		let is_template = false;						// if the previous post type token was a (inside) template.
		let parenth_depth = 0;	 						// parenth depth when the post_type flag is true.
		let check_reset_requires_tokens = false;		// check a reset of the requires tokens on the next token.
		let on_lower_than_index = first_type_def_token.index; // only check tokens with a lower index than this index.
		let lookback_requires_tokens = [];				// the lookback potential requires clause token for `check_end_of_modifiers()`.
		let template_closed = false;					// flag for when the templates are already parsed and closed.
		let requires_closed = false;					// flag for when the requires clause is already parsed and closed.

		// Check the end of modiers.
		// However since the requires clause is not required to be in parentheses there must be a lookback ...
		// For either the keyword "requires" to resume the iteration, or a iteration termination by an unallowed word boundary.
		const check_end_of_modifiers = (token) => {

			// Requires tokens are already defined so always stop.
			if (requires_tokens.length > 0) {
				return false; // STOP ITERATION.
			}

			// Do a lookback.
			let ends_with_requires = false;
			let lookback_parenth_depth = 0;
			let lookback_curly_depth = 0;
			this.tokens.iterate_tokens_reversed(0, token.line + 1, (lookback) => {
				if (lookback.index <= token.index) {

					// Set depths.
					if (lookback.token === undefined && lookback.data.length === 1) {
						if (lookback.data === "{") { 
							--lookback_curly_depth;
							if (lookback_curly_depth === 0) {
								lookback_requires_tokens.push(lookback);
								return null; // prevent fallthrough since this token is also a word boundary which would terminate the loop otherwise.
							}
						}
						else if (lookback.data === "}") { ++lookback_curly_depth; }
						else if (lookback.data === "(") { 
							--lookback_parenth_depth;
							if (lookback_parenth_depth === 0) {
								lookback_requires_tokens.push(lookback);
								return null; // prevent fallthrough since this token is also a word boundary which would terminate the loop otherwise.
							}
						}
						else if (lookback.data === ")") { ++lookback_parenth_depth; }
					}

					//
					// Resume with if after "Set depths" since the depth incremental tokens still need to be parsed.
					//

					// Whitespace is allowed.
					if (lookback.is_whitespace === true) {
						lookback_requires_tokens.push(lookback);
					}

					// Inside curly depth but not inside parenth depth is not allowed.
					// Since direct curly not encapsulated by parentheses are not allowed inside the pre modifiers.
					// Otherwise it could catch the closing curly of the previous func definition and include every token till a requires token is reached.
					else if (lookback_curly_depth > 0 && lookback_parenth_depth === 0) {
						return false; // STOP ITERATION.
					}

					// Inside parenth or curly depth is allowed.
					else if (lookback_curly_depth !== 0 || lookback_parenth_depth !== 0) {
						lookback_requires_tokens.push(lookback);
					}

					// Inisde a template is allowed.
					else if (lookback.is_template === true) {
						lookback_requires_tokens.push(lookback);
					}

					// Check termination by the lookback is the "requires" keyword.
					else if (lookback.token === "keyword" && lookback.data === "requires") {
						ends_with_requires = true;
						modifier_tokens.push(lookback)
						on_lower_than_index = lookback.token; // set the on lower than index to this token's index for the parent iteration.
						return false;
					}

					// Operators are allowed.
					else if (lookback.token === "operator") {
						lookback_requires_tokens.push(lookback);	
					}

					// Stop termination by a word boundary that is not an operator or a single/double colon or closing template.
					else if (lookback.is_word_boundary === true && lookback.data !== ":" && lookback.data !== ">") {
						return false; // STOP ITERATION.
					}

					// Still allowed.
					else {
						lookback_requires_tokens.push(lookback);
					}
				}
			});
			if (ends_with_requires) {
				requires_tokens = lookback_requires_tokens;
				return null;
			} else {
				return false; // STOP ITERATION.
			}
		}

		// Iterate the previous tokens reversed from the type def token.
		this.tokens.iterate_tokens_reversed(0, first_type_def_token.line + 1, (token) => {
			if (token.index < on_lower_than_index) {

				// First go back to the token before the type definition.
				// This means also skipping tokens with `is_template === true` and colon ":" tokens since these are allowed as part of the type.
				// Also the first keyword that appears when the func_type is undefined counts as a type.
				if (post_type === false) {

					// Inside a template.
					if (token.is_template === true) {
						type_tokens.push(token);
						return null; // prevent fallthrough to "Check modifiers".
					}

					// Whitespace.
					// Must be after "Inside a template" to allow whitespace in templates.
					else if (token.is_whitespace === true) {
						type_tokens.push(token);
						return null; // prevent fallthrough to "Check modifiers".	
					}

					// Is a type token.
					else if (token.token === "type") {
						type_tokens.push(token);
						return null; // prevent fallthrough to "Check modifiers".
					}

					// End of types by a keyword.
					// Must be after the inside template check, cause keywords are allowed inside templates.
					// @todo keywords are also allowed for require clauses.
					else if (first_type_keyword && token.token === "keyword" && this.pre_function_modifiers.includes(token.data) === false) {
						type_tokens.push(token);
						post_type = true;
						first_type_keyword = false;
						return null; // prevent fallthrough to "Check modifiers".
					}

					// Resume on colons keep in mind that they might be joined together instead of a single token with ":" as data.
					else if (token.token === undefined && token.data.indexOf(":") !== -1) {
						type_tokens.push(token);
						return null; // prevent fallthrough to "Check modifiers".
					}

					// Allowed operators.
					else if (token.token === "operator" && (token.data === "&" || token.data === "*")) {
						type_tokens.push(token);
						return null; // prevent fallthrough to "Check modifiers".
					}


					// Enable post_type flag.
					post_type = true;

					// fallthrough to "Check modifiers".
				}

				// Check modifiers.
				if (post_type === true) {

					// Set check reset requires flag.
					if (check_reset_requires_tokens === 1) {
						check_reset_requires_tokens = true;
					} else {
						check_reset_requires_tokens = false; // must reset to false since the "Reset the requires tokens..." is not always matched and otherwise the templates wont be parsed.
					}

					// Skip whitespace.
					// @edit white space should also be included in the pre modifiers for example for in vdocs.
					// if (token.is_whitespace === true) {
					// 	if (template_closed === false && is_template && parenth_depth === 0) {
					// 		templates_tokens.push(token);
					// 	}
					// 	return null;
					// }

					// Set parenth depth.
					// Do not set when inside templates since this would cause the templates not to be parsed.
					if (is_template === false) {
						if (token.token === undefined && token.data == "(") {
							if (parenth_depth === 0) {
								return false; // STOP ITERATION.
							}
							--parenth_depth;
							if (requires_closed === false && parenth_depth === 0) {
								requires_tokens.push(token);
								check_reset_requires_tokens = 1;
								return null;
							}
						} else if (token.token === undefined && token.data == ")") {
							++parenth_depth;
						}
					}

					//
					// Resume with if statements after the set parenth depth statement.
					//

					// Reset the templates when the token before the the opening template is not "template".
					// Also when the template is not reset there must be checked for a end of modifiers 1) since it was potentially part of a requires clause without parenth or it was the actual close.
					if (template_closed === false && is_template && parenth_depth === 0 && token.is_template !== true && token.is_whitespace !== true && (token.token !== "keyword" || token.data !== "template")) {
						lookback_requires_tokens = templates_tokens;
						templates_tokens = [];
						is_template = false;
						return check_end_of_modifiers(token);
					}

					// End of template.
					else if (template_closed === false && is_template && parenth_depth === 0 && token.is_template !== true && token.token === "keyword" && token.data === "template") {
						modifier_tokens.push(token);
						return check_end_of_modifiers(token);
					}

					// Reset the requires tokens when the token before the opening parenth is not "requires".
					else if (requires_closed === false && check_reset_requires_tokens === true && is_template === false && token.is_whitespace !== true && (token.token !== "keyword" || token.data !== "requires")) {
						lookback_requires_tokens = requires_tokens;
						requires_tokens = [];
						check_reset_requires_tokens = false;
						return check_end_of_modifiers(token);
					}

					// End of requires clause.
					else if (requires_closed === false && check_reset_requires_tokens === true && is_template === false && token.token === "keyword" && token.data === "requires") {
						modifier_tokens.push(token);
						requires_closed = true;
						return check_end_of_modifiers(token);
					}

					// Is inside a parenth.
					// Must be before the "Inside templates" templates.
					else if (requires_closed === false && is_template === false && parenth_depth !== 0) {
						requires_tokens.push(token);
					}

					// Inside templates.
					// But not inside a template since then it should be appended to the template tokens.
					else if (template_closed === false && parenth_depth === 0 && token.is_template === true) {
						templates_tokens.push(token);
						is_template = true;
					}

					// Is a modifier.
					else if ((token.token === undefined || token.token === "keyword") && this.pre_function_modifiers.includes(token.data)) {
						modifier_tokens.push(token);
					}

					// All capital token without an assigned token, assume it is a preprocessor variable.
					// Otherwise the pre modifiers would be terminated too soon when a user uses a preprocesor variable in the pre tokens.
					// And since there can not be a valid token without a ";" or another scope seperator this is probably safe.
					else if (token.is_whitespace !== true && token.is_line_break !== true && this.is_full_uppercase(token.data, ["_", "1", "2", "3", "4", "5", "6", "7", "8", "9"])) { 
						token.token = "type";
						modifier_tokens.push(token);
					}

					// Check the end of modiers.
					else if (token.is_whitespace !== true && token.is_line_break !== true){
						lookback_requires_tokens = [];
						return check_end_of_modifiers(token);
					}

				}
			}
		})

		// Assign the type, remove whitespace at the start and end and then concat the tokens to a type.
		type_tokens = this.trim_tokens(type_tokens, true);
		type_def_token.type = type_tokens;	
	
		/* deprecated, could cause unstable tokenization since it may never exit the scope if it was incorrect.
		// Unable to determine the type.
		// So just assume this is actually a function call instead of a type/function definition.
		// This can for example happen when a user highlights code that is actually within a function without passing the function headers in the code data.
		type_tokens = this.trim_tokens(type_tokens, true)
		if (type_tokens.length === 0) {

			// Skip constructors.
			let parent_name = type_defs_from_colon.length > 0 ? type_defs_from_colon.last().data : (this.parents.length > 0 ? this.parents.last().token.data : null);
			console.log({parent_name});
			if (parent_name !== type_def_token.data) {

				// Set to type.
				if (first_type_def_token.token === "type_def") {
					first_type_def_token.token = "type";
				}
				if (type_def_token.token === "type_def") {
					type_def_token.token = "type";
				}
				type_defs_from_colon.iterate((token) => {
					if (token.token === "type_def") {
						token.token = "type";
					}	
				})

				// Add inside func scope, but only when no scopes are defined, otherwise this could also happen inside parameters when a scope has just been defined and the parameter tokens are traversed.
				if (this.cpp_scopes.length === 0) {
					this.cpp_scopes.append({
						depth: new vhighlight.NestedDepth(this.curly_depth + 1, this.bracket_depth, this.parenth_depth),
						scope: "func",
						is_open: true,
					})
				}

				// Stop.
				return null;

			}
		}

		// Assign the type, remove whitespace at the start and end and then concat the tokens to a type.
		else {
			type_def_token.type = type_tokens;	
		}
		*/

		// Assign the template tokens.
		templates_tokens = this.trim_tokens(templates_tokens, true);
		if (templates_tokens.length > 0) {

			// Initialize a template object.
			const init_template = () => {
				template = {
					name: null, 	// the parameter name.
					index: null, 	// the parameter index.
					value: [], 		// the default value tokens.
					type: [], 		// the type tokens.
				};
			}

			// Append a template.
			const append_template = () => {
				if (template !== null) {
					template.type = this.trim_tokens(template.type);
					if (template.type.length > 0) {
						template.name = template.type.pop().data;
						if (template.name != null) {
							template.name = template.name.trim();
						}
						template.type = this.trim_tokens(template.type);
						template.value = this.trim_tokens(template.value);
						template.index = templates.length;
						templates.push(template);
					}
					template = null;
				};
			}

			// Parse the templates into objects.
			// Create the array with parameters and assign the token_param to the tokens.
			let mode = 1; // 1 for type 2 for value.
			const templates = [];
			let template = null;
			let template_depth = 0, curly_depth = 0, parenth_depth = 0, bracket_depth = 0;

			// Iterate the templates but skip the first < and last >.
			templates_tokens.iterate(1, templates_tokens.length - 1, (token) => {

				// Set depths.
				if ((token.token === undefined || token.token === "operator") && token.data.length === 1) {
					if (token.data === "<") { ++template_depth; }
					else if (token.data === ">") { --template_depth; }
					else if (token.data === "(") { ++parenth_depth; }
					else if (token.data === ")") { --parenth_depth; }
					else if (token.data === "[") { ++bracket_depth; }
					else if (token.data === "]") { --bracket_depth; }
					else if (token.data === "{") { ++curly_depth; }
					else if (token.data === "}") { --curly_depth; }
				}

				// Seperator.
				if (template_depth === 0 && parenth_depth === 0 && curly_depth === 0 && bracket_depth === 0 && token.data === ",") {
					append_template();
					mode = 1;
				}

				// Add to type / name.
				else if (mode === 1) {
					if (template === null) {
						init_template();
					}

					// Is value.
					if (token.data === "=") {
						mode = 2;
					}

					// Add to type.
					// Later the trimmed last token will be used as name.
					else  {
						template.type.push(token);
					}
				}

				// Add to value.
				else if (mode === 2) {
					template.value.push(token);
				}
			})
			append_template();

			// Assign templates.
			type_def_token.templates = templates;
			type_def_token.template_tokens = templates_tokens;
		}

		// Assign the requires tokens.
		requires_tokens = this.trim_tokens(requires_tokens, true);
		if (requires_tokens.length > 0) {
			type_def_token.requires_tokens = requires_tokens;
		}

		// Assign modifier tokens.
		if (modifier_tokens.length > 0) {
			type_def_token.pre_modifiers = [];
			modifier_tokens.iterate_reversed((item) => {
				type_def_token.pre_modifiers.push(item);
			})
		}

		// Get the first token of the entire func header.
		let first_token = null;
		const get_first_token = (token) => {
			if (first_token == null || token.index < first_token.index) {
				first_token = token;
			}
		}
		requires_tokens.iterate(get_first_token);
		modifier_tokens.iterate(get_first_token);
		templates_tokens.iterate(get_first_token);
		type_tokens.iterate(get_first_token);
		return first_token;
	}

	// Set on parenth open callback.
	on_parenth_open(token_before_opening_parenth) {

		// Stop when previous token is a keyword or word boundary.
		// @warning: Do not skip word boundaries since it could also be a operator overload function.
		// if (token_before_opening_parenth.is_word_boundary || token_before_opening_parenth.token === "keyword" || token_before_opening_parenth.token === "operator") { return ; }

		// Get previous token whitespace excluded.
		// Was from old version, new version automatically excludes whitespace and newlines from the token_before_opening_parenth.
		let prev = token_before_opening_parenth;

		// Check exceptions.
		// When the previous token is a ">", "*" or "&" then it can not be a function declaration.
		// It likely is a function call not catched inside a function because the user specified code that was inside a function without passing the function header.
		if ((prev.data === ">" && !prev.is_template) || prev.data === "*" || prev.data === "&") {
			let prev_prev = this.get_prev_token_by_token(prev, [" ", "\t", "\n", "*", "&"]);
			if (prev_prev.data !== "operator") {
				if (prev.data === "*") {
					prev.token = "operator";
				} else if (prev.token !== undefined) {
					delete prev.token;
				}

				// Check if the prev token is a template closing.
				// Except when used on pointers with "->"
				if (prev.data === ">" && (prev_prev == null || prev_prev.data !== "-")) {
					const token = this.get_opening_template(prev.index);
					if (token != null) {
						prev = this.get_prev_token_by_token(token, [" ", "\t", "\n"]);
					}
				}

				// Assign type.
				prev_prev = this.get_prev_token_by_token(prev, [" ", "\t", "\n", "*", "&"]);
				if (prev_prev == null || prev_prev.token != "type") {
					this.assign_token_as_type(prev);
				}

				// Add inside func scope, but only when no scopes are defined, otherwise this could also happen inside parameters when a scope has just been defined and the parameter tokens are traversed.
				if (this.cpp_scopes.length === 0) {
					this.cpp_scopes.append({
						depth: new vhighlight.NestedDepth(this.curly_depth + 1, this.bracket_depth, this.parenth_depth),
						scope: "func",
						is_open: true,
					})
				}

				// Stop.
				return null;
			}
		}

		// Catch structurized initializations of attributes on constructors.
		// When the previous token is a ":" but not a "::" then it is not a function declaration but likely a constructor structurized initialization like `CLI() : m_attr(0) {}`
		// These need to be catched separately since the attribute initialization can be followed by a "{".
		let prev_prev = this.get_prev_token_by_token(prev, [" ", "\t", "\n"]); // "*", "&"
		let prev_prev_prev = this.get_prev_token_by_token(prev_prev, [" ", "\t", "\n"]); // "*", "&"
		if (
			(prev_prev != null && prev_prev.data === ",") || // comma in structured init list.
			( // single colon.
				prev_prev != null && prev_prev.data === ":" &&
				(prev_prev_prev == null || (prev_prev_prev != null && prev_prev_prev.data !== ":"))
			)
		) {
			this.assign_token_as_type(prev);

			// Stop.
			return null;
		}

		// Set default type def token so it can be edited by "Catch operator function" and optional future others.
		let type_def_token = prev;

		// Catch operator overload function with operator names, for instance `operator =()`.
		// However the type cast operator funcs will not be catched by this, for instance `operator const Type*()` will not be catched.
		// @note: The overloaded operators attr is used by Libris.
		let is_operator_overload = false;
		let overloaded_operator_tokens = [];
		if (
			type_def_token.token === "operator" ||
			type_def_token.data === "[" || type_def_token.data === "]" || // subscript operator overload.
			type_def_token.data === "(" || type_def_token.data === ")" // function call operator.
		) {
			let operator_keyword = type_def_token;
			while (true) {
				if (operator_keyword.token === "keyword" && operator_keyword.data === "operator") {
					type_def_token = operator_keyword;
					type_def_token.token = "type_def"; // otherwise it will be skipped since it is a keyword.
					type_def_token.overloaded_operators = [];
					overloaded_operator_tokens.iterate_reversed((token) => {
						type_def_token.overloaded_operators.push(token);
					});
					is_operator_overload = true;
					break;
				} else if (
					operator_keyword.is_whitespace !== true &&
					operator_keyword.token !== "operator" && 
					operator_keyword.data !== "[" && operator_keyword.data !== "]" && // subscript operator overload.
					operator_keyword.data !== "(" && operator_keyword.data !== ")" // function call operator.
				) {
					break;
				} else {
					overloaded_operator_tokens.push(operator_keyword);
				}
				operator_keyword = this.get_prev_token_by_token(operator_keyword, ["\n"]); // must be as last so the first token will also be added to the `overloaded_operator_tokens`.
			}
		}

		// Lambda functions.

		// Skip when the token before is a word boundary or keyword.
		if (type_def_token.is_word_boundary || type_def_token.token === "keyword") {
			return ;
		}

		// Get the last scope.
		const last_scope = this.cpp_scopes.last();
		const inside_func = last_scope != null && (last_scope.scope === "func" || last_scope.scope === "template_keyword"); // do not use "is_open" to check wether inside func, so function calls inside parameters can also be catched as inside func.

		// When outside a function it is always a type definition.
		if (!inside_func) {

			// The token for the pre modifiers.
			type_def_token.token = "type_def"; // must be assigned since after here some checks are done to check if it is assigned, later the `assign_token_as..` will be performed.
			let token_for_parse_pre_type_def_modifiers = type_def_token;

			// When the token before the type def token is a colon then also set the type_def token on the name tokens.
			// So the entire "mylib::mychapter::myfunc() {}" will be a token type def, not just "myfunc" but also "mylib" and "mychapter".
			const colon_token = this.get_prev_token_by_token(type_def_token, []);
			let before_colon_token;
			const parents = [];
			if (
				colon_token && colon_token.data === ":" && 
				(before_colon_token = this.get_prev_token_by_token(colon_token, [])) != null && before_colon_token.data === ":"
			) {

				// Parse parents.
				let parent = before_colon_token;
				while (true) {
					parent = this.get_prev_token_by_token(parent, []);
					if (parent == null) {
						break;
					}
					else if (parent.data === ":") {
						continue;
					}
					else if (this.str_includes_word_boundary(parent.data)) { // must be after dot check since dot is a word boundary ofc.
						break;
					}
					parent.token = "type_def"; // no need to use assign_token_as due to duplicate.
					parent.is_duplicate = true; // indicate it is a duplicate, vdocs also depends on this.
					token_for_parse_pre_type_def_modifiers = parent; // since the `parse_pre_type_def_modifiers()` func needs the first type def token, so `mylib` in `mylib::mychapter::myfunc`.
					parents.push(parent);
				}
			}
			if (parents.length > 0) {
				type_def_token.parents = [];
				parents.iterate_reversed((parent) => {
					type_def_token.parents.push(parent);
					// @warning: do not add this.add_parent since this can either be a func call, and these parents are only defined for a single scope for functions, so NEVER add that will cause huge issues.
				})
			}

			// Parse the type def pre modifiers.
			const first_func_token = this.parse_pre_type_def_modifiers(token_for_parse_pre_type_def_modifiers, type_def_token, parents);



			// Check if the `parse_pre_type_def_modifiers` func has not reversed the function to a type instead of type_def.
			if (type_def_token.token === "type_def") {

				// Add scope.
				this.cpp_scopes.append({
					depth: new vhighlight.NestedDepth(this.curly_depth, this.bracket_depth, this.parenth_depth - 1),
					scope: "func",
					is_open: false,
				})

				// Add parents.
				if (parents.length === 0) { // skip when colon parents where already defined.
					this.assign_parents(type_def_token);
				}

				// Assign as type def token to enable additional options.
				this.assign_token_as_type_def(type_def_token, {start_token: first_func_token});
			}

			// Return the set token.
			return type_def_token;

		}

		// When inside a function is is always a func call.
		else {

			// Check if the type_def_token token is a template closing but skip "->" pointer attrs.
			let prev_prev = this.get_prev_token_by_token(type_def_token, [" ", "\t", "\n", "*", "&"]);
			if (type_def_token.data === ">" && (prev_prev == null || prev_prev.data !== "-")) {
				const token = this.get_opening_template(type_def_token.index);
				if (token != null) {
					type_def_token = this.get_prev_token_by_token(token, [" ", "\t", "\n"]);
				}
			}

			// Small fix sometimes the ">" inside a `x->get();` does not get highlighted as an operator, use `prev_prev` because `type_def_token` is `get` in the example.
			else if (prev_prev != null && prev_prev.data === ">" && prev_prev.token !== "operator") {
				prev_prev.token = "operator"
			}

			// Assign type but skip when the previous token is already a type (aka in constructors).
			prev_prev = this.get_prev_token_by_token(type_def_token, [" ", "\t", "\n", "*", "&"]);
			if (prev_prev == null || prev_prev.token != "type") {

				// Lambda function.
				if (prev_prev.data === "]") {
					return ;
				}

				// Assign as type.
				this.assign_token_as_type(type_def_token);

				// When the token before the type  token is a colon then also set the type token on the name tokens.
				// So the entire "mylib::mychapter::myfunc()" will be a token type, not just "myfunc" but also "mylib" and "mychapter".
				const colon_token = this.get_prev_token_by_token(type_def_token, []);
				let before_colon_token;
				if (
					colon_token && colon_token.data === ":" && 
					(before_colon_token = this.get_prev_token_by_token(colon_token, [])) != null && before_colon_token.data === ":"
				) {
					let parent = before_colon_token;
					while (true) {
						parent = this.get_prev_token_by_token(parent, []);
						if (parent == null) {
							break;
						}
						else if (parent.data === ":") {
							continue;
						}
						else if (this.str_includes_word_boundary(parent.data)) { // must be after dot check since dot is a word boundary ofc.
							break;
						}
						parent.token = "type";
					}
				}
			}
		}


		/*
		// Set the inside func flag.
		// It is being set a little too early but that doesnt matter since ...
		// Semicolons (for header func detection) should not be used in the context between here and the opening curly.
		// Unless the func is a header definition, but then the forward lookup loop stops.
		if (this.inside_func !== true) {
			let opening = null;
			for (let i = this.index; i < this.code.length; i++) {
				const c = this.code.charAt(i);
				if (c == ";") {
					break;
				}
				else if (c == "{") {
					opening = i;
					break;
				}
			}
			if (opening != null) {
				this.inside_func = true;
				this.inside_func_closing_curly = this.curly_depth;
				// this.inside_func_closing_curly = this.get_closing_curly(opening);
			}
		}

		// Edit the previous token when the token is not already assigned, for example skip the keywords in "if () {".
		// And skip lambda functions with a "]" before the "(".
		// @todo also need to catch functions like `operator const Type*(){}` and `auto& operator=(){}`.
		if (
			is_operator_overload ||
			(type_def_token.token === undefined && type_def_token.data !== "]") || // when no token is specified and exclude lambda funcs.
			(type_def_token.token === "type") // when the previous token is a type.
		) {

			// When the first character after the closing parentheses is a "{", the previous non word boundary token is a type def.
			// Unless the previous non word boundary token is a keyword such as "if () {".
			const lookup = this.code.charAt(after_parenth_index); 
			if (
				(this.allow_header_type_defs && lookup === ";" && !this.inside_func) || // from semicolon when not inside a function body.
				lookup === "{" || // from opening curly.
				lookup === ":" || // from a colon of structured initialization from constructors.
				this.first_char_matches_function_modifier(lookup) // from function modifier.
			) {
				type_def_token.token = "type_def";
				let token_for_parse_pre_type_def_modifiers = type_def_token;

				// When the token before the type def token a colon then also set the type_def token on the name tokens.
				// So the entire "mylib::mychapter::myfunc() {}" will be a token type def, not just "myfunc" but also "mylib" and "mychapter".
				const colon_token = this.get_prev_token_by_token(type_def_token, []);
				const parents = [];
				if (colon_token.data === "::") { // lookup === "}" && 

					// Parse parents.
					let parent = colon_token;
					while (true) {
						parent = this.get_prev_token_by_token(parent, []);
						if (parent == null) {
							break;
						}
						else if (parent.data === "::") {
							continue;
						}
						else if (this.str_includes_word_boundary(parent.data)) { // must be after dot check since dot is a word boundary ofc.
							break;
						}
						parent.token = "type_def";
						parent.is_duplicate = true; // indicate it is a duplicate, vdocs also depends on this.
						token_for_parse_pre_type_def_modifiers = parent; // since the `parse_pre_type_def_modifiers()` func needs the first type def token, so `mylib` in `mylib::mychapter::myfunc`.
						parents.push(parent);
					}
				}

				// Check before.
				// When the token before the type def token (or first token of column name tokens) is an operator such as "=" or a dot "." from something like "cli.myfunc();.
				// Then it is not a type definition but a function call in a scope where type defitions are also allowed.
				if (lookup === ";") {
					const check_before = this.get_prev_token_by_token(token_for_parse_pre_type_def_modifiers, [" ", "\t", "\n"]);
					if (
						check_before != null && 
						(
							(check_before.token === undefined && check_before.data === ".") ||
							(check_before.token === "operator" && check_before.data !== "*" && check_before.data !== "&")
						)
					) {
						this.assign_token_as_type(type_def_token);
						parents.iterate_reversed((parent) => this.assign_token_as_type(parent))
						return null;
					}
				}

				// Add the parents to the tokenizer so that when the user does something like `vweb.utils.myclass = class myclass{}` the functions from the class will also have the parent.
				// But after the "check before" check.
				// Must check if new parents length is higher than 0 otherwise it overwrites the function's parents and the parents will be empty, instead of filled where it was filled.
				if (parents.length > 0) {
					type_def_token.parents = [];
					parents.iterate_reversed((parent) => {
						type_def_token.parents.push(parent);
						this.add_parent(parent);
					})
				}

				// Set the inside func flag.
				// It is being set a little too early but that doesnt matter since ...
				// Semicolons (for header func detection) should not be used in the context between here and the opening curly.
				// Unless the func is a header definition, but then the forward lookup loop stops.
				if (this.inside_func !== true) {
					let opening = null;
					for (let i = this.index; i < this.code.length; i++) {
						const c = this.code.charAt(i);
						if (c == ";") {
							break;
						}
						else if (c == "{") {
							opening = i;
							break;
						}
					}
					if (opening != null) {
						this.inside_func = true;
						this.inside_func_closing_curly = this.curly_depth;
						// this.inside_func_closing_curly = this.get_closing_curly(opening);
					}
				}

				// Parse the type def pre modifiers.
				const first_func_token = this.parse_pre_type_def_modifiers(token_for_parse_pre_type_def_modifiers, type_def_token, parents);

				// Assign as type def token to enable additional options.
				this.assign_token_as_type_def(type_def_token, {start_token: first_func_token});

				// Return the set token.
				return type_def_token;
			}

			// When the first character after the closing parentheses is not a "{" then the previous token is a "type".
			// Unless the token before the previous token is already a type, such as "String x()".
			else {

				// Skip when the `allow_header_type_defs` flag is disabled and the lookup is `;` because then it should be a variable name of a constructor instead of a func call.
				// But still a check is required for the token before it, it must either be a ">", "*", "&" or a type otherwise the default function calls will also not be highlighted.
				if (this.allow_header_type_defs === false && lookup === ";") {
					let prev_prev = this.get_prev_token_by_token(type_def_token, [" ", "\t", "\n"]);
					if (
						prev_prev !== null && 
						(
							prev_prev.token === "type" ||
							prev_prev.data === ">" ||
							prev_prev.data === "*" ||
							prev_prev.data === "&"
						)
					) {
						return null;
					}
				}

				// Check if the type_def_token token is a template closing.
				let prev_prev = this.get_prev_token_by_token(type_def_token, [" ", "\t", "\n", "*", "&"]);
				if (type_def_token.data === ">" && (prev_prev == null || prev_prev.data !== "-")) {
					const token = this.get_opening_template(type_def_token.index);
					if (token != null) {
						type_def_token = this.get_prev_token_by_token(token, [" ", "\t", "\n"]);
					}
				}

				// Small fix sometimes the ">" inside a `x->get();` does not get highlighted as an operator, use `prev_prev` because `type_def_token` is `get` in the example.
				else if (prev_prev != null && prev_prev.data === ">" && prev_prev.token !== "operator") {
					prev_prev.token = "operator"
				}

				// Assign type.
				prev_prev = this.get_prev_token_by_token(type_def_token, [" ", "\t", "\n", "*", "&"]);
				if (prev_prev == null || (prev_prev.token != "type")) {
					this.assign_token_as_type(type_def_token);
				}

				// Set inside func to make small correction but only when not already set otherwise it would overwrite the closing curly.
				if (this.inside_func !== true) {
					this.inside_func = true;
					this.inside_func_closing_curly = this.curly_depth;
				}
			}
		}
		*/
	}

	/* Set on parenth close callback.
	on_parenth_close({
		token_before_opening_parenth,
		after_parenth_index,
	}) {
		
		// Get the closing parentheses.
		const closing = this.index;
		if (after_parenth_index != null) {

			// Get previous token.
			let prev = this.get_prev_token(token_before_opening_parenth.index, [" ", "\t", "\n"]); // "*", "&"
			if (prev == null) {
				return null;
			}

			// Check exceptions.
			// When the previous token is a ">", "*" or "&" then it can not be a function declaration.
			// It likely is a function call not catched inside a function because the user specified code that was inside a function without passing the function header.
			if (prev.data === ">" || prev.data === "*" || prev.data === "&" || prev.data === "&&") {
				if (prev.data === "*") {
					prev.token = "operator";
				} else if (prev.token !== undefined) {
					delete prev.token;
				}

				// Check if the prev token is a template closing.
				// Except when used on pointers with "->"
				let prev_prev = this.get_prev_token_by_token(prev, [" ", "\t", "\n", "*", "&"]);
				if (prev.data === ">" && (prev_prev == null || prev_prev.data !== "-")) {
					const token = this.get_opening_template(prev.index);
					if (token != null) {
						prev = this.get_prev_token_by_token(token, [" ", "\t", "\n"]);
					}
				}

				// Assign type.
				prev_prev = this.get_prev_token_by_token(prev, [" ", "\t", "\n", "*", "&"]);
				if (prev_prev == null || prev_prev.token != "type") {
					prev.token = "type";
				}

				// Set inside func to make small correction but only when not already set otherwise it would overwrite the closing curly.
				if (this.inside_func !== true) {
					this.inside_func = true;
					this.inside_func_closing_curly = this.curly_depth;
				}

				// Stop.
				return null;
			}

			// Catch structurized initializations of attributes on constructors.
			// When the previous token is a ":" but not a "::" then it is not a function declaration but likely a constructor structurized initialization like `CLI() : m_attr(0) {}`
			// The ":" word boundaries are joined into "::" since it is not an operator.
			// These need to be catched separately since the attribute initialization can be followed by a "{".
			let prev_prev = this.get_prev_token_by_token(prev, [" ", "\t", "\n"]); // "*", "&"
			if (prev_prev != null && prev_prev.data === ":") {
				prev.token = "type";

				// Set inside func to make small correction but only when not already set otherwise it would overwrite the closing curly.
				if (this.inside_func !== true) {
					this.inside_func = true;
					this.inside_func_closing_curly = this.curly_depth;
				}

				// Stop.
				return null;
			}

			// Set default type def token so it can be edited by "Catch operator function" and optional future others.
			let type_def_token = prev;

			// Catch operator overload function with operator names, for instance `operator =()`.
			// However the type cast operator funcs will not be catched by this, for instance `operator const Type*()` will not be catched.
			let is_operator_overload = false;
			let overloaded_operator_tokens = [];
			if (
				type_def_token.token === "operator" ||
				type_def_token.data === "[" || type_def_token.data === "]" || // subscript operator overload.
				type_def_token.data === "(" || type_def_token.data === ")" // function call operator.
			) {
				let operator_keyword = type_def_token;
				while (true) {
					if (operator_keyword.token === "keyword" && operator_keyword.data === "operator") {
						type_def_token = operator_keyword;
						type_def_token.overloaded_operators = [];
						overloaded_operator_tokens.iterate_reversed((token) => {
							type_def_token.overloaded_operators.push(token);
						});
						is_operator_overload = true;
						break;
					} else if (
						operator_keyword.is_whitespace !== true &&
						operator_keyword.token !== "operator" && 
						operator_keyword.data !== "[" && operator_keyword.data !== "]" && // subscript operator overload.
						operator_keyword.data !== "(" && operator_keyword.data !== ")" // function call operator.
					) {
						break;
					} else {
						overloaded_operator_tokens.push(operator_keyword);
					}
					operator_keyword = this.get_prev_token_by_token(operator_keyword, ["\n"]); // must be as last so the first token will also be added to the `overloaded_operator_tokens`.
				}
			}

			// Edit the previous token when the token is not already assigned, for example skip the keywords in "if () {".
			// And skip lambda functions with a "]" before the "(".
			// @todo also need to catch functions like `operator const Type*(){}` and `auto& operator=(){}`.
			if (
				is_operator_overload ||
				(type_def_token.token === undefined && type_def_token.data !== "]") || // when no token is specified and exclude lambda funcs.
				(type_def_token.token === "type") // when the previous token is a type.
			) {

				// When the first character after the closing parentheses is a "{", the previous non word boundary token is a type def.
				// Unless the previous non word boundary token is a keyword such as "if () {".
				const lookup = this.code.charAt(after_parenth_index); 
				if (
					(this.allow_header_type_defs && lookup === ";" && !this.inside_func) || // from semicolon when not inside a function body.
					lookup === "{" || // from opening curly.
					lookup === ":" || // from a colon of structured initialization from constructors.
					this.first_char_matches_function_modifier(lookup) // from function modifier.
				) {
					type_def_token.token = "type_def";
					let token_for_parse_pre_type_def_modifiers = type_def_token;

					// When the token before the type def token a colon then also set the type_def token on the name tokens.
					// So the entire "mylib::mychapter::myfunc() {}" will be a token type def, not just "myfunc" but also "mylib" and "mychapter".
					const colon_token = this.get_prev_token_by_token(type_def_token, []);
					const parents = [];
					if (colon_token.data === "::") { // lookup === "}" && 

						// Parse parents.
						let parent = colon_token;
						while (true) {
							parent = this.get_prev_token_by_token(parent, []);
							if (parent == null) {
								break;
							}
							else if (parent.data === "::") {
								continue;
							}
							else if (this.str_includes_word_boundary(parent.data)) { // must be after dot check since dot is a word boundary ofc.
								break;
							}
							parent.token = "type_def";
							parent.is_duplicate = true; // indicate it is a duplicate, vdocs also depends on this.
							token_for_parse_pre_type_def_modifiers = parent; // since the `parse_pre_type_def_modifiers()` func needs the first type def token, so `mylib` in `mylib::mychapter::myfunc`.
							parents.push(parent);
						}
					}

					// Check before.
					// When the token before the type def token (or first token of column name tokens) is an operator such as "=" or a dot "." from something like "cli.myfunc();.
					// Then it is not a type definition but a function call in a scope where type defitions are also allowed.
					if (lookup === ";") {
						const check_before = this.get_prev_token_by_token(token_for_parse_pre_type_def_modifiers, [" ", "\t", "\n"]);
						if (
							check_before != null && 
							(
								(check_before.token === undefined && check_before.data === ".") ||
								(check_before.token === "operator" && check_before.data !== "*" && check_before.data !== "&")
							)
						) {
							type_def_token.token = "type";
							parents.iterate_reversed((parent) => {
								parent.token = "type";
							})
							return null;
						}
					}

					// Add the parents to the tokenizer so that when the user does something like `vweb.utils.myclass = class myclass{}` the functions from the class will also have the parent.
					// But after the "check before" check.
					// Must check if new parents length is higher than 0 otherwise it overwrites the function's parents and the parents will be empty, instead of filled where it was filled.
					if (parents.length > 0) {
						type_def_token.parents = [];
						parents.iterate_reversed((parent) => {
							type_def_token.parents.push(parent);
							this.add_parent(parent);
						})
					}

					// Set the inside func flag.
					// It is being set a little too early but that doesnt matter since ...
					// Semicolons (for header func detection) should not be used in the context between here and the opening curly.
					// Unless the func is a header definition, but then the forward lookup loop stops.
					if (this.inside_func !== true) {
						let opening = null;
						for (let i = closing; i < this.code.length; i++) {
							const c = this.code.charAt(i);
							if (c == ";") {
								break;
							}
							else if (c == "{") {
								opening = i;
								break;
							}
						}
						if (opening != null) {
							this.inside_func = true;
							this.inside_func_closing_curly = this.curly_depth;
							// this.inside_func_closing_curly = this.get_closing_curly(opening);
						}
					}

					// Parse the type def pre modifiers.
					const first_func_token = this.parse_pre_type_def_modifiers(token_for_parse_pre_type_def_modifiers, type_def_token, parents);

					// Assign as type def token to enable additional options.
					this.assign_token_as_type_def(type_def_token, {start_token: first_func_token});

					// Return the set token.
					return type_def_token;
				}

				// When the first character after the closing parentheses is not a "{" then the previous token is a "type".
				// Unless the token before the previous token is already a type, such as "String x()".
				else {

					// Skip when the `allow_header_type_defs` flag is disabled and the lookup is `;` because then it should be a variable name of a constructor instead of a func call.
					// But still a check is required for the token before it, it must either be a ">", "*", "&" or a type otherwise the default function calls will also not be highlighted.
					if (this.allow_header_type_defs === false && lookup === ";") {
						let prev_prev = this.get_prev_token_by_token(type_def_token, [" ", "\t", "\n"]);
						if (
							prev_prev !== null && 
							(
								prev_prev.token === "type" ||
								prev_prev.data === ">" ||
								prev_prev.data === "*" ||
								prev_prev.data === "&"
							)
						) {
							return null;
						}
					}

					// Check if the type_def_token token is a template closing.
					let prev_prev = this.get_prev_token_by_token(type_def_token, [" ", "\t", "\n", "*", "&"]);
					if (type_def_token.data === ">" && (prev_prev == null || prev_prev.data !== "-")) {
						const token = this.get_opening_template(type_def_token.index);
						if (token != null) {
							type_def_token = this.get_prev_token_by_token(token, [" ", "\t", "\n"]);
						}
					}

					// Small fix sometimes the ">" inside a `x->get();` does not get highlighted as an operator, use `prev_prev` because `type_def_token` is `get` in the example.
					else if (prev_prev != null && prev_prev.data === ">" && prev_prev.token !== "operator") {
						prev_prev.token = "operator"
					}

					// Assign type.
					prev_prev = this.get_prev_token_by_token(type_def_token, [" ", "\t", "\n", "*", "&"]);
					if (prev_prev == null || (prev_prev.token != "type")) {
						type_def_token.token = "type";
					}

					// Set inside func to make small correction but only when not already set otherwise it would overwrite the closing curly.
					if (this.inside_func !== true) {
						this.inside_func = true;
						this.inside_func_closing_curly = this.curly_depth;
					}
				}
			}
		}
	} */

	// The on post type def modifier callback.
	on_post_type_def_modifier_end(type_def_token, last_token) {

		// Also close the scope here when the current char is ";".
		// Since a function scope was added by `on_parenth_open` but the type def has no body.
		let scope;
		if (
			type_def_token.token === "type_def" &&
			this.code.charAt(this.index) === ";" &&
			(scope = this.cpp_scopes.last()) != null &&
			scope.depth.eq_values(this.curly_depth, this.bracket_depth, this.parenth_depth)
		) {
			this.cpp_scopes.pop();
		}

		// Vars.
		let parenth_depth = 0;			// the parenth depth.
		let closing_parenth_token;		// the token of the function's parameters closing parentheses.
		let templates_tokens = [];		// the templates clause tokens, even though it is not allowed still parse them.
		let requires_tokens = [];		// the requires clause tokens.
		let modifier_tokens = [];		// the modifier tokens.
		let is_requires = false; 		// tokens are inside a requires clause.
		let is_template = false; 		// tokens are inside a templates clause.

		// Iterate backwards to find the start token.
		this.tokens.iterate_tokens(type_def_token.line, null, (token) => {
			if (token.index === last_token.index) {
				if (token.token === undefined && token.data === ")") {
					--parenth_depth;
					if (parenth_depth === 0) {
						closing_parenth_token = token;
						return false;
					}
				}
				return false; // err.
			}

			// Set parenth depth and detect end.
			else if (token.index > type_def_token.index && token.token === undefined && token.data.length === 1) {
				if (token.data === "(") {
					++parenth_depth;
				} else if (token.data === ")") {
					--parenth_depth;
					if (parenth_depth === 0) {
						closing_parenth_token = token;
						return false;
					}
				}
			}
		})
		if (closing_parenth_token === undefined) {
			// return null;
			throw Error(`Unable to find the closing paremeter parentheses of function "${type_def_token.data}()" line ${type_def_token.line+1}.`);
		}

		// Iterate post modifier tokens forward.
		this.tokens.iterate_tokens(closing_parenth_token.line, last_token.line + 1, (token) => {
			if (token.index > closing_parenth_token.index && token.index <= last_token.index) {
				const is_keyword = token.token === "keyword";

				// Disable is template flag.
				// Skip whitespace since there may be whitespace between `template` and the first `<` where the `is_template` flag will be enabled.
				if (is_template && token.is_template !== true && token.is_whitespace !== true) {
					is_template = false;
				}

				// Resume with if statements after "Disable is template flag".
				
				// Is inside a template.
				if (is_template) {
					is_template = true;
					templates_tokens.push(token);
				}

				// Template modifier.
				else if (is_keyword && token.data === "template") {
					is_template = true;
					modifier_tokens.push(token);
				}

				// Requires modifier.
				else if (is_keyword && token.data === "requires") {
					is_requires = true;
					modifier_tokens.push(token);
				}

				// Is a modifier.
				// Also terminates the requires clause.
				else if (is_keyword && this.post_function_modifiers.includes(token.data)) {
					is_requires = false;
					modifier_tokens.push(token);
				}

				// Is inside a requires clause.
				// Must be after the "Is a modifier" statement.
				else if (is_requires) {
					requires_tokens.push(token);
				}
			}
		})
		
		// Assign the requires tokens.
		requires_tokens = this.trim_tokens(requires_tokens);
		if (requires_tokens.length > 0) {
			type_def_token.requires_tokens = requires_tokens
		}

		// Assign modifier tokens.
		if (modifier_tokens.length > 0) {
			type_def_token.post_modifiers = [];
			modifier_tokens.iterate((item) => {
				type_def_token.post_modifiers.push(item);
			})
		}
	}

	// Set the on type def keyword callback.
	// The parents always need to be set, but when a class is defined like "mylib.MyClass = class MyClass {}" the tokenizer will not add mylib as a parent.
	// Do not forget to set and update the parents since the tokenizer will not do this automatically when this callback is defined.
	on_type_def_keyword(token) {


		// ---------------------------------------------------------
		// In cpp the next data must either be a ":" from inheriting classes or an opening "{".
		// Because a type def keyword can also be used like this `pdfs = new struct pollfd[maxfds]`.

		// Get next non whitespace.
		let next_index = this.get_first_non_whitespace(this.index, false) // exclude linebreaks.

		// However a `template<> \n struct mytemplate<int> {}` can also be used.
		if (this.code.charAt(next_index) === "<") {
			next_index = this.get_closing_template(next_index);
			if (next_index == null) {
				next_index = this.code.length;
			}
			next_index = this.get_first_non_whitespace(next_index + 1, false) // exclude linebreaks.
		}

		// Check char.
		if (next_index == null) {
			next_index = this.code.length;
		}
		switch (this.code.charAt(next_index)) {

			// Always a type def.
			case ":":
			case "{":
				break;

			// Not a type def.
			// Do not add any scopes and treat as type.
			default:
				this.assign_token_as_type(token);
				return ;
		}


		// ---------------------------------------------------------

		// Get the previous non whitespace token.
		const prev = this.get_prev_token_by_token(token, [" ", "\t", "\n"]);

		// Set the is namespace flag for vdocs, vdocs depends on this behaviour.
		// Must be done before `add_parents()`.
		if (prev !== null && prev.token === "keyword" && prev.data === "namespace") {
			token.is_namespace = true;
		}

		// Assign parents.
		this.assign_parents(token);
		this.add_parent(token);

		// Parse the pre type def templates and requires.
		const first_func_token = this.parse_pre_type_def_modifiers(token, token);

		// Assign as type def token to enable additional options.
		if (!token.is_namespace) {
			this.assign_token_as_type_def(token, {start_token: first_func_token});
		}

		// Add scope.
		this.cpp_scopes.append({
			depth: new vhighlight.NestedDepth(this.curly_depth, this.bracket_depth, this.parenth_depth),
			scope: "class",
			is_open: false,
		})

		// Set the start token to capture inherited classes when the previous token is either struct or class.
		if (prev !== null && (prev.data === "struct" || prev.data === "class")) {
			this.capture_inherit_start_token = token;
		}
	}

	// Reset attributes that should be reset before each tokenize.
	derived_reset() {
		
		// The last line to detect types.
		this.last_line_type = null;

		// Scope 1: func or 2: class/none.
		this.cpp_scopes = [];

		// Flag for inside template.
		this.cpp_inside_template_keyword = 0;

		// Used to detect type def inheritance.
		this.capture_inherit_start_token = undefined;
	}

	// Derived retrieve state.
	derived_retrieve_state(data) {
		data.last_line_type = this.last_line_type;
		data.cpp_scopes = this.cpp_scopes;
		data.cpp_inside_template_keyword = this.cpp_inside_template_keyword;
		data.capture_inherit_start_token = this.capture_inherit_start_token;
	}
}

// Initialize.
vhighlight.cpp = new vhighlight.CPP();
