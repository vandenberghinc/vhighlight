/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// C++ highlighter.

vhighlight.CPP = class CPP {
	constructor() {

		// Initialize the tokenizer.
		this.tokenizer = new vhighlight.Tokenizer({
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
			type_keywords: [
				"const",
				"constexpr",
				"static",
				"volatile",
				"mutable",
				"namespace", // for the exclude_type_def_keywords_on_prev so that the using namespace xxx will make xxx as a token_type. 
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

			// Attributes for partial tokenizing.
			scope_separators: [
				"{", 
				"}", 
			],
			seperate_scope_by_type_def: true,
		});
		const tokenizer = this.tokenizer;

		// Assign attributes.
		this.reset();

		// ---------------------------------------------------------
		// On default callback.

		this.tokenizer.callback = (char) => {
			
			// Close is func.
			if (this.inside_func && tokenizer.index > this.inside_func_closing_curly) {
				this.inside_func = false;
			}

			// Detect types by the first x words on the line preceded by whitespace and another alphabetical character.
			// Must be first since other if statements in this func check if the token before x is not a type.
			if (
				(this.last_line_type != tokenizer.line && char != " " && char != "\t") || // types are allowed at the start of the line.
				(tokenizer.prev_char == "(" || (tokenizer.parenth_depth > 0 && tokenizer.prev_char == ",")) // types are allowed inside parentheses.
			) {
				this.last_line_type = tokenizer.line;

				// Append the batch because of the lookup.
				tokenizer.append_batch();

				// Do a lookup to check if there are two consecutive words without any word boundaries except for whitespace.
				let is_type = false;
				let hit_template = 0;
				let word = "";
				let words = 0;
				let append_to_batch = [];
				let last_index, last_append_index;
				for (let index = tokenizer.index; index < tokenizer.code.length; index++) {
					const c = tokenizer.code.charAt(index);

					// Hit template, treat different.
					// Iterate till end of template and then check if there is only whitespace and then a char.
					if (hit_template == 2) {

						// Allowed chars.
						if (c == " " || c == "\t" || c == "*" || c == "&" || c == "\n") {
							continue;
						}

						// Stop at first word char.
						else if (tokenizer.is_alphabetical(c)) {
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
								if (tokenizer.keywords.includes(word)) { // do not increment words on a keyword.
									// Stop when a type def keyword was encoutered.
									if (tokenizer.type_def_keywords.includes(word)) {
										return false;
									}
									append_to_batch.push(["token_keyword", word]);
								} else {
									if (c != ":" || tokenizer.code.charAt(index + 1) != ":") { // do not increment on colons like "vlib::String" since they should count as one word.
										++words;
									}
									append_to_batch.push(["token_type", word]);
								}
								last_index = index;
								last_append_index = append_to_batch.length - 1;
								word = "";
							}
							if (c == "*" || c == "&") {
								append_to_batch.push(["token_operator", c]);
							} else {
								append_to_batch.push([null, c]); // @todo changed jerre [false, c] to [null, c] still have to check but it should still highlight numerics in append_token called by append_forward_lookup_token
							}
						}

						// Allowed word chars.
						else if (tokenizer.is_alphabetical(c) || (word.length > 0 && tokenizer.is_numerical(c))) {
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
				// length - 1 since 
				if (is_type) {
					for (let i = 0; i <= last_append_index; i++) {
						tokenizer.append_forward_lookup_batch(append_to_batch[i][0], append_to_batch[i][1]);
					}
					tokenizer.resume_on_index(last_index - 1);
					return true;
				}

			}

			// Braced initialiatons, depends on a ">" from a template on not being an operator.
			else if (char == "{") {

				// Append current batch by word boundary separator.
				tokenizer.append_batch();

				// Edit the previous token when the token is not already assigned and when the data is not "(" for a func or "if", and skip operators etc.
				// Skip where the token before the previous is already type for example "String x {}".
				// Also skip the tokens between < and > when the initial prev and the prev prev token is a ">".
				let prev = tokenizer.get_prev_token(tokenizer.added_tokens - 1, [" ", "\t", "\n", "&", "*"]);
				if (prev == null) { return false; }
				if (prev.data == ">") {
					const token = tokenizer.get_opening_template(prev.index);
					if (token != null) {
						prev = tokenizer.get_prev_token(token.index - 1, []);
					}
				}
				let prev_prev = tokenizer.get_prev_token(prev.index - 1, [" ", "\t", "\n", "&", "*"]);
				if (prev_prev != null && prev_prev.data == ">") {
					const token = tokenizer.get_opening_template(prev_prev.index);
					if (token != null) {
						prev_prev = tokenizer.get_prev_token(token.index - 1, []);
					}
				}
				if ((prev_prev == null || prev_prev.token != "token_type") && prev.token === undefined && prev.data != ")") {
					prev.token = "token_type";
				}
			}

			// Types inside templates not only the keyword template but also for type or function templates.
			else if (char == "<") {

				// Append the batch because of the lookup.
				tokenizer.append_batch();

				// Do a forward lookup till the closing >, if there are any unallowed characters stop the lookup.
				// Since lines like "x < y;" are allowed, so not everything is a template.
				let is_template = false;
				let depth = 1;
				let word = "";
				let append_to_batch = [[false, char]];
				let index;
				let next_is_type = true;
				let c;
				const add_word = (is_word_boundary = false, set_seperator = false) => {
					if (word.length > 0) {
						if (tokenizer.keywords.includes(word)) {
							append_to_batch.push(["token_keyword", word]);
						} else if (next_is_type) {
							append_to_batch.push(["token_type", word]);
							next_is_type = false;
						} else {
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
				for (index = tokenizer.index + 1; index < tokenizer.code.length; index++) {
					c = tokenizer.code.charAt(index);

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
					else if (c == "(" || c == ")") {
						next_is_type = true;
						add_word(true);
						append_to_batch.push([false, c]);
					}
					else if (tokenizer.is_whitespace(c) || c == "," || c == ":" || c == "*" || c == "&" || c == "\n" || c == "(" || c == ")" || c == "{" || c == "}" || c == "[" || c == "]") {
						add_word(true);
						append_to_batch.push([false, c]);
					}

					// Allowed alpha and numeric
					else if (tokenizer.is_alphabetical(c) || tokenizer.is_numerical(c)) {
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
						tokenizer.append_forward_lookup_batch(append_to_batch[i][0], append_to_batch[i][1], {is_template: true});
					}
					tokenizer.resume_on_index(index);
					return true;
				}
			}

			// Double colon.
			else if (char == ":" && tokenizer.prev_char == ":") {

				// Append batch by separator.
				tokenizer.append_batch();

				// Append to new batch.
				tokenizer.batch += char;
				tokenizer.append_batch(false);

				// Set next token.
				tokenizer.next_token = "token_type";

				// Set prev token.
				// Skip the tokens between < and > when the initial prev token is a ">".
				let prev = tokenizer.get_prev_token(tokenizer.added_tokens - 1, [":"]);
				if (prev == null) {
					return false;
				}
				if (prev.data == ">") {
					prev = tokenizer.get_opening_template(prev.index);
					if (prev !== null) {
						prev = tokenizer.get_prev_token(prev.index - 1, [])
					}
				}
				if (prev == null) {
					return false;
				}
				if (
					(prev.token === undefined || prev.token == "token_type_def") // when token is null or prev token from like "using namespace a::b::c;"
					&& !tokenizer.str_includes_word_boundary(prev.data)) {
					prev.token = "token_type";
				}
				return true;
			}

			// Set the inherited classes when the flag is enabled.
			else if (char === "}" && this.capture_inherit_start_token !== undefined) {

				// Append current batch by word boundary separator.
				tokenizer.append_batch();

				// Vars.
				const start_token = this.capture_inherit_start_token;
				let success = false;
				let inherited_types = [];
				let inherit_privacy_type = null;
				let post_colon = false;

				// Iterate backwards till the extends token is found, capture the types found in between.
				tokenizer.tokens.iterate_tokens(start_token.line, null, (token) => {
					if (token.index > start_token.index) {
						if (post_colon) {
							if (token.token === "token_keyword") {
								inherit_privacy_type = token.data;
							} else if (inherit_privacy_type != null) {
								if (token.is_whitespace) {
									return null;
								}
								else if (token.is_word_boundary) {
									inherit_privacy_type = null;
								} else {
									token.token = "token_type";
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

			// Not appended.
			return false;
		}

		// ---------------------------------------------------------
		// Parsing type definitions, functions, function modifiers, function requires clause, function templates clause and function types.

		// Function modifiers.
		this.function_modifiers = ["static", "virtual", "volatile", "inline", "friend", "extern", "explicit", "noexcept", "const", "constexpr", "mutable", "decltype", "override", "final", "requires", "template"];

		// Check if a character matches the first char of one of the function modifiers.
		const first_char_matches_function_modifier = (char) => {
			for (let i = 0; i < this.function_modifiers.length; i++) {
				if (this.function_modifiers[i].charAt(0) === char) {
					return true;
				}
			}
			return false;
		}

		// Trim the an array of reversed tokens, returns the array in the correct order, so not reversed.
		const trim_tokens = (tokens, reversed = false) => {
			if (tokens.length === 0) { return []; }
			for (let i = tokens.length - 1; i >= 0; i--) {
				const token = tokens[i];
				if (token.is_whitespace === true) {
					--tokens.length;
				} else {
					break;
				}
			}
			let clean = [];
			let first = true;
			if (reversed) {
				tokens.iterate_reversed((token) => {
					if (first && token.is_whitespace === true) {
						return null; // skip whitespace at the end.
					} else {
						first = false;
						clean.push(token)
					}
				})
			} else {
				tokens.iterate((token) => {
					if (first && token.is_whitespace === true) {
						return null; // skip whitespace at the end.
					} else {
						first = false;
						clean.push(token)
					}
				})
			}
			return clean;	
		}

		// Parse the pre modifiers, requires clause, template clause and the function type on a type def token match from inside the `on_parent_close()` callback.
		const parse_pre_func_tokens = (type_def_token) => {

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
			let on_lower_than_index = type_def_token.index; // only check tokens with a lower index than this index.
			let lookback_requires_tokens = [];				// the lookback potential requires clause token for `check_end_of_modifiers()`.

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
				tokenizer.tokens.iterate_tokens_reversed(0, token.line + 1, (lookback) => {
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

						// Inside parenth or curly depth is allowed.
						else if (lookback_curly_depth !== 0 || lookback_parenth_depth !== 0) {
							lookback_requires_tokens.push(lookback);
						}

						// Inisde a template is allowed.
						else if (lookback.is_template === true) {
							lookback_requires_tokens.push(lookback);
						}

						// Check termination by the lookback is the "requires" keyword.
						else if (lookback.token === "token_keyword" && lookback.data === "requires") {
							ends_with_requires = true;
							modifier_tokens.push(lookback)
							on_lower_than_index = lookback.token; // set the on lower than index to this token's index for the parent iteration.
							return false;
						}

						// Operators are allowed.
						else if (lookback.token === "token_operator") {
							lookback_requires_tokens.push(lookback);	
						}

						// Stop termination by a word boundary that is not an operator or a single/double colon.
						else if (lookback.is_word_boundary === true && lookback.data !== ":" && lookback.data !== "::") {
							ends_with_requires = false;
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
			tokenizer.tokens.iterate_tokens_reversed(0, type_def_token.line + 1, (token) => {
				if (token.index < on_lower_than_index) {
					
					// First go back to the token before the type definition.
					// This means also skipping tokens with `is_template === true` and colon ":" tokens since these are allowed as part of the type.
					// Also the first keyword that appears when the func_type is undefined counts as a type.
					if (post_type === false) {

						// Whitespace.
						if (token.is_whitespace === true) {
							type_tokens.push(token);
							return null; // prevent fallthrough to "Check modifiers".	
						}

						// Inside a template.
						else if (token.is_template === true) {
							type_tokens.push(token);
							return null; // prevent fallthrough to "Check modifiers".
						}

						// Is a type token.
						else if (token.token === "token_type") {
							type_tokens.push(token);
							return null; // prevent fallthrough to "Check modifiers".
						}

						// End of types by a keyword.
						// Must be after the inside template check, cause keywords are allowed inside templates.
						// @todo keywords are also allowed for require clauses.
						else if (first_type_keyword && token.token === "token_keyword") {
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
						else if (token.token === "token_operator" && (token.data === "&" || token.data === "*")) {
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
						if (token.is_whitespace === true) {
							return null;
						}

						// Set parenth depth.
						// Do not set when inside templates since this would cause the templates not to be parsed.
						if (is_template === false) {
							if (token.token === undefined && token.data == "(") {
								if (parenth_depth === 0) {
									return false; // STOP ITERATION.
								}
								--parenth_depth;
								if (parenth_depth === 0) {
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
						// Must be after "Skip whitespace".
						if (is_template && parenth_depth === 0 && token.is_template !== true && (token.token !== "token_keyword" || token.data !== "template")) {
							lookback_requires_tokens = templates_tokens;
							templates_tokens = [];
							return check_end_of_modifiers(token);
						}

						// Rest the requires tokens when the token before the opening parenth is not "requires".
						// Must be after "Skip whitespace".
						else if (check_reset_requires_tokens === true && is_template === false && (token.token !== "token_keyword" || token.data !== "requires")) {
							lookback_requires_tokens = requires_tokens;
							requires_tokens = [];
							check_reset_requires_tokens = false;
							return check_end_of_modifiers(token);
						}

						// Is inside a parenth.
						// Must be before the "Inside templates" templates.
						else if (is_template === false && parenth_depth !== 0) {
							requires_tokens.push(token);
						}

						// Inside templates.
						// But not inside a template since then it should be appended to the template tokens.
						else if (parenth_depth === 0 && token.is_template === true) {
							templates_tokens.push(token);
							is_template = true;
						}

						// Is a modifier.
						else if ((token.token === undefined || token.token === "token_keyword") && this.function_modifiers.includes(token.data)) {
							modifier_tokens.push(token);
						}

						// Check the end of modiers.
						else {
							lookback_requires_tokens = [];
							return check_end_of_modifiers(token);
						}

					}
				}
			})

			// Assign the type, remove whitespace at the start and end and then concat the tokens to a type.
			if (type_tokens.length === 0) {
				console.error(`Unable to determine the function type of function "${tokenizer.line}:${type_def_token.data}()".`);
			} else {
				type_def_token.type = trim_tokens(type_tokens, true);	
			}

			// Assign the template tokens.
			templates_tokens = trim_tokens(templates_tokens, true);
			if (templates_tokens.length > 0) {
				type_def_token.templates = []
				templates_tokens.iterate((token) => {
					type_def_token.templates.push(token);
				})
			}

			// Assign the requires tokens.
			requires_tokens = trim_tokens(requires_tokens, true);
			if (requires_tokens.length > 0) {
				type_def_token.requires = []
				requires_tokens.iterate((token) => {
					type_def_token.requires.push(token);
				})
			}

			// Assign modifier tokens.
			if (modifier_tokens.length > 0) {
				type_def_token.pre_modifiers = [];
				modifier_tokens.iterate_reversed((item) => {
					type_def_token.pre_modifiers.push(item);
				})
			}
		}

		// Set on parenth close callback.
		this.tokenizer.on_parenth_close = ({
			token_before_opening_parenth = token_before_opening_parenth,
			after_parenth_index = after_parenth_index,
		}) => {

			// Get the closing parentheses.
			const closing = tokenizer.index;
			if (after_parenth_index != null) {

				// Edit the previous token when the token is not already assigned, for example skip the keywords in "if () {".
				// And skip lambda functions with a "]" before the "(".
				let prev = tokenizer.get_prev_token(token_before_opening_parenth.index, [" ", "\t", "\n", "*", "&"]);
				if (prev == null) {
					return null;
				}
				const prev_prev = tokenizer.get_prev_token(prev.index - 1);
				const prev_prev_is_colon = prev_prev != null && prev_prev.data == ":";
				if (
					(prev.token === undefined && prev.data != "]") || // when no token is specified and exclude lambda funcs.
					(prev.token == "token_type" && prev_prev_is_colon === true) // when the previous token is token_type by a double colon.
				) {

					// When the first character after the closing parentheses is a "{", the previous non word boundary token is a type def.
					// Unless the previous non word boundary token is a keyword such as "if () {".
					const lookup = tokenizer.code.charAt(after_parenth_index); 
					if (
						(lookup == ";" && !this.inside_func) || // from semicolon when not inside a function body.
						lookup == "{" || // from opening curly.
						first_char_matches_function_modifier(lookup) // from function modifier.
					) {
						prev.token = "token_type_def";
						let token_for_parse_pre_func_tokens = prev;


						// When the prev prev token is a colon, also set the "token_type" assigned by double colon to "token_type_def".
						// So the entire "mylib::mychapter::myfunc() {}" will be a token type def, not just "myfunc" but also "mylib" and "mychapter".
						let token = prev;
						while (true) {
							token = tokenizer.get_prev_token(token.index - 1, [":"]);
							if (token == null || tokenizer.str_includes_word_boundary(token.data)) {
								break;
							}
							token.token = "token_type_def";
							token.is_duplicate = true; // assign is duplicate and not the original token type def for vdocs.
							token_for_parse_pre_func_tokens = token;
						}

						// Set the inside func flag.
						// It is being set a little too early but that doesnt matter since ...
						// Semicolons (for header func detection) should not be used in the context between here and the opening curly.
						// Unless the func is a header definition, but then the forward lookup loop stops.
						let opening = null;
						for (let i = closing; i < tokenizer.code.length; i++) {
							const c = tokenizer.code.charAt(i);
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
							this.inside_func_closing_curly = tokenizer.get_closing_curly(opening);
						}

						// Parse the type def pre modifiers.
						parse_pre_func_tokens(token_for_parse_pre_func_tokens)

						// Return the set token.
						return prev;
					}

					// When the first character after the closing parentheses is not a "{" then the previous token is a "token_type".
					// Unless the token before the previous token is already a type, such as "String x()".
					else {

						// Check if the prev token is a template closing.
						while (prev.data === ">") {
							const token = tokenizer.get_opening_template(prev.index);
							if (token != null) {
								prev = tokenizer.get_prev_token(token.index - 1, [" ", "\t", "\n"]);
							} else {
								break;
							}
						}

						// Make sure the token before the prev is not a keyword such as "if ()".
						let prev_prev = tokenizer.get_prev_token(prev.index - 1, [" ", "\t", "\n", "*", "&"]);
						if (prev_prev == null || (prev_prev.token != "token_type")) {
							prev.token = "token_type";
						}
					}
				}
			}
		}

		// The on post type def modifier callback.
		this.tokenizer.on_post_type_def_modifier_end = (type_def_token, last_token) => {

			// Vars.
			let parenth_depth = 0;			// the parenth depth.
			let closing_parenth_token;		// the token of the function's parameters closing parentheses.
			let templates_tokens = [];		// the templates clause tokens, even though it is not allowed still parse them.
			let requires_tokens = [];		// the requires clause tokens.
			let modifier_tokens = [];		// the modifier tokens.
			let is_requires = false; 		// tokens are inside a requires clause.
			let is_template = false; 		// tokens are inside a templates clause.

			// Iterate backwards to find the start token.
			tokenizer.tokens.iterate_tokens(type_def_token.line, null, (token) => {
				if (token.index === last_token.index) {
					return false; // err.
				}
				else if (token.index > type_def_token.index) {

					// Set parenth depth and detect end.
					if (token.token === undefined && token.data.length === 1) {
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
				}
			})
			if (closing_parenth_token === undefined) {
				console.error(`Unable to find the closing paremeter parentheses of function "${tokenizer.line}:${type_def_token.data}()".`);
				return null;
			}

			// Iterate post modifier tokens forward.
			tokenizer.tokens.iterate_tokens(closing_parenth_token.line, last_token.line + 1, (token) => {
				if (token.index > closing_parenth_token.index && token.index <= last_token.index) {
					const is_keyword = token.token === "token_keyword";

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
					else if (is_keyword && this.function_modifiers.includes(token.data)) {
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
			
			// Assign the template tokens.
			templates_tokens = trim_tokens(templates_tokens);
			if (templates_tokens.length > 0) {
				if (type_def_token.templates === undefined) {
					type_def_token.templates = []
				}
				templates_tokens.iterate((token) => {
					type_def_token.templates.push(token);
				})
			}

			// Assign the requires tokens.
			requires_tokens = trim_tokens(requires_tokens);
			if (requires_tokens.length > 0) {
				if (type_def_token.requires === undefined) {
					type_def_token.requires = []
				}
				requires_tokens.iterate((token) => {
					type_def_token.requires.push(token);
				})
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
		this.tokenizer.on_type_def_keyword = (token) => {
			
			// Assign parents.
			tokenizer.assign_parents(token);
			tokenizer.add_parent(token);

			// Set the start token to capture inherited classes when the previous token is either struct or class.
			const prev = tokenizer.get_prev_token(token.index - 1, [" ", "\t", "\n"]);
			if (prev !== null && (prev.data === "struct" || prev.data === "class")) {
				this.capture_inherit_start_token = token;
			}
		}
	}

	// Reset attributes that should be reset before each tokenize.
	reset() {
		
		// The last line to detect types.
		this.last_line_type = null;

		// Whether the iteration is inside a function.
		// Used to distinct a function header definition from a constructor, so it wont work when ...
		// The user defines a function definition header inside a function but that is fine.
		this.inside_func = false;
		this.inside_func_closing_curly = null;

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
vhighlight.cpp = new vhighlight.CPP();
