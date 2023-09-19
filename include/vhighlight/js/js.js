/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Javascript highlighter.

vhighlight.JS = class JS {
	constructor() {

		// Initialize the this.tokenizer.
		this.tokenizer = new vhighlight.Tokenizer({
			keywords: [
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
			],
			type_def_keywords: [
				"class"
			], 
			type_keywords: [
				"extends",
			],
			operators: [
				"+", "-", "*", "/", "%", "**", "=", "+=", "-=", "*=", "/=", "%=", "**=",
				"==", "!=", "===", "!==", ">", "<", ">=", "<=", "&&", "||", "!", "&", "|",
				"^", "~", "<<", ">>", ">>>", "++", "--", "?",
			],
			single_line_comment_start: "//",
			multi_line_comment_start: "/*",
			multi_line_comment_end: "*/",
			allow_slash_regexes: true,
		});

		// Assign attributes.
		this.reset();

		// Set callback.
		this.tokenizer.callback = (char) => {
			
			// Opening parentheses.
			if (char == "(") {

				// V2.
				// Uses a lookup.

				// Append current batch by word seperator.
				this.tokenizer.append_batch();

				// Get the previous token.
				const prev = this.tokenizer.get_prev_token(this.tokenizer.tokens.length - 1, [" ", "\t", "\n"]);

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
				} else if (prev.token != null && prev.token != "token_operator") {
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

				// Finished.
				return false;

				
				/*
				// V1.
				// Uses a lookback.

				// Assign the curly depth of the first opening parenthes ...
				// This can be used to tokenize parameters while skipping ...
				// Function bodies of a function as parameter.
				if (this.tokenizer.parenth_depth == 1) {
					this.opening_parenth_curly_depth = this.tokenizer.curly_depth;
					this.last_param_was_assignment = false;
				}
				
				// Class function definition.
				// - When a line contains a opening parentheses at the curly depth of the class ...
				//   It is always a function definition, since attributes are always assigned ...
				//   In the constructor or other funcs ...
				// - Parentheses depth should be 1 though, otherwise it will also match a parameter with a function call.
				if (this.tokenizer.class_depth == this.tokenizer.curly_depth && this.tokenizer.parenth_depth == 1) {
					if (this.tokenizer.is_linebreak_whitespace_char(this.tokenizer.prev_char) || this.tokenizer.is_linebreak_whitespace_char()) {
						const prev = this.tokenizer.get_prev_token(this.tokenizer.tokens.length - 1, [" ", "\t", "\n"]);
						prev.token = "token_type_def";
						this.tokenizer.append_batch(false)
					} else {
						this.tokenizer.append_batch("token_type_def")
					}
					this.tokenizer.batch += char;
					this.tokenizer.append_batch(false);
					return true;
				}
			
			
				// When the current batch is keyword "function" it means
				// The function was assigned to a variable.
				if (this.tokenizer.batch == "function") {
					const prev = this.tokenizer.get_prev_token(this.tokenizer.tokens.length - 1, [" ", "\t", "\n", "=", ":"]);
					prev.token = "token_type_def";
					this.tokenizer.append_batch("token_keyword");
					this.tokenizer.batch += char;
					this.tokenizer.append_batch(false);
					this.func_def_parenth_depth = this.tokenizer.parenth_depth;
					this.func_def_curly_depth = this.tokenizer.curly_depth;
					return true;
				}
				
				// Fetch previous batch.
				const prev = this.tokenizer.get_prev_token(this.tokenizer.tokens.length - 1, [" ", "\t", "\n"]);

				// No previous token.
				if (prev === null) {
					return false;
				}
				
				// Function definition.
				if (prev.data == "function") {
					this.tokenizer.append_batch("token_type_def");
					this.tokenizer.batch += char;
					this.tokenizer.append_batch(false);
					this.func_def_parenth_depth = this.tokenizer.parenth_depth;
					this.func_def_curly_depth = this.tokenizer.curly_depth;
					return true;
				}
				
				// Treat as word boundary but test the prev prev for keyword "function" or the ":".
				const prev_prev = this.tokenizer.get_prev_token(prev.index - 1, [" ", "\t", "\n"])
				
				// Anonymous function definition assigned to a property.
				// Such as "{ myfunc: () => {} }"
				// Batch should be empty otherwise it will also assign to "width = me()".
				if (prev_prev != null && this.tokenizer.batch.length == 0 && (prev.data == "=" || prev.data == ":")) {
					prev_prev.token = "token_type_def";
					this.func_def_parenth_depth = this.tokenizer.parenth_depth;
					this.func_def_curly_depth = this.tokenizer.curly_depth;
				}
				
				// When there is whitespace between the func name and the ( ...
				// The function keyword is one past the previous batch.
				else if (prev_prev != null && prev_prev.data == "function") {
					prev.token = "token_type_def"
					this.func_def_parenth_depth = this.tokenizer.parenth_depth;
					this.func_def_curly_depth = this.tokenizer.curly_depth;
				}
				
				// Treat as function call.
				// Still except keywords.
				else {
				
					// Function call with whitespace in between the func name and the "(".
					// The prev data should not include a word boundary otherwise it ...
					// Will also match the first "(" in something like "((foi,foi)=>{...})".
					if (this.tokenizer.is_linebreak_whitespace_char(this.tokenizer.prev_char) || this.tokenizer.is_linebreak_whitespace_char()) {
						if (prev.token == null && !this.tokenizer.str_includes_word_boundary(prev.data)) {
							prev.token = "token_type";
						}
						this.tokenizer.append_batch(false);
					}
					
					// No whitespace.
					else {
						if (this.tokenizer.keywords.includes(this.tokenizer.batch)) {
							this.tokenizer.append_batch("token_keyword");
							this.opening_parenth_curly_depth = null; // reset otherwise the "if (x==0)" x will be highlighted because it thinks it is an assignment keyword.
						} else {
							this.tokenizer.append_batch("token_type");
						}
					}
				}
				
				// Treat ( char as word boundary.
				this.tokenizer.batch += char;
				this.tokenizer.append_batch(false);
				return true;
				*/
			}
			
			// Function parameter.
			else if (
				// Inside a class.
				(this.tokenizer.class_depth == this.tokenizer.curly_depth &&
				(
					(this.tokenizer.parenth_depth == 1 && ((char == ',' && !this.last_param_was_assignment) || (char == '=' && this.tokenizer.next_char != '>'))) ||
					(this.tokenizer.parenth_depth == 0 && char == ')')
				)) ||
				// Inside a func def.
				(
					this.func_def_curly_depth == this.tokenizer.curly_depth && // match only the curly depth of the func def opening.
					(
						(this.tokenizer.parenth_depth == this.func_def_parenth_depth && ((char == ',' && !this.last_param_was_assignment) || (char == '=' && this.tokenizer.next_char != '>'))) ||
						(this.tokenizer.parenth_depth == this.func_def_parenth_depth - 1 && char == ')')
					)
				) ||
				// Inside a func call.
				(
					this.opening_parenth_curly_depth == this.tokenizer.curly_depth && // do not match code inside a func body of a nested parameter.
					this.tokenizer.parenth_depth > 0 && // can be >0 since the last ')' does not need to be catched, only assignment parameters are highlighted.
					char == '=' &&
					code.charAt(this.tokenizer.index + 1) != '>'
				)
			) {
			
				// When char is ")".
				if (char == ')') {
			
					// End of func parenth depth.
					// Needs to be disabled here otherwise "this.func_def_parenth_depth == parenth_depth" no longer matches.
					if (this.func_def_parenth_depth != null && this.tokenizer.parenth_depth < this.func_def_parenth_depth) {
						this.func_def_parenth_depth = null;
					}
			
					// Otherwise the last func param assignment is never disabled.
					// So it proceeds when the last param did not use assignment, so it can highlight the last param.
					if (this.last_param_was_assignment) {
						this.last_param_was_assignment = false;
						this.tokenizer.append_batch();
						this.tokenizer.batch += char;
						this.tokenizer.append_batch();
						return true;
					}
				}
			
				// Set last func was assignment.
				if (char == '=') {
					this.last_param_was_assignment = true;
				} else {
					this.last_param_was_assignment = false;
				}
			
				// Tokenize.
				if (this.tokenizer.is_linebreak_whitespace_char(this.tokenizer.prev_char)) {
					const prev = this.tokenizer.get_prev_token(this.tokenizer.tokens.length - 1, [" ", "\t", "\n"]);
					prev.token = "token_parameter";
					this.tokenizer.append_batch();
				} else {
					this.tokenizer.append_batch("token_parameter");
				}
				this.tokenizer.batch += char;
				this.tokenizer.append_batch();
				return true;
			}
			

			// Not appended.
			return false;
		}
	}

	// Reset attributes that should be reset before each tokenize.
	reset() {
		this.opening_parenth_curly_depth = 0;	// the curly depth of the first parenth depth when opened.
		this.func_def_parenth_depth = null; 	// parenth depth inside the parentheses of a function definition.
		this.func_def_curly_depth = null; 		// curly depth inside the parentheses of a function definition, since functions can also be passed as parameters etc.
		this.last_param_was_assignment = false; // used to check if the last tokenized param used an assignemnt operator, if so do not highlight last on closing ")".
	}

	// Highlight.
	highlight(code, return_tokens = false) {
		this.reset();
		this.tokenizer.code = code;
		return this.tokenizer.tokenize(return_tokens);
	}

	// Partial highlight.
	/*	@docs: {
		@title Partial highlight.
		@description: Partially highlight text based on edited lines.
		@parameter: {
			@name: code
			@type: string
			@description: The new code.
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
	} */
	partial_highlight(
		code, 
		edits_start = null,
		edits_end = null,
		insert_start = null,
		insert_end = null,
		tokens [],
	) {

		// Vars.
		let scope_start = 0; 		// the line where the scope around the new edits starts.
		let scope_end = null; 		// the line where the scope around the new edits ends.
		const scope_seperators = [ 	// scope seperators.
			";", 
			"(", 
			")", 
			"{", 
			"}", 
			"[", 
			"]"
		]; 	

		// Get the token index of the minimum line.
		let min_start = edits_start < insert_start ? edits_start : insert_start;
		let token_start;
		if (min_start === 0) {
			token_start = 0;
		} else {
			--min_start;
			token_start = null;
			tokens.iterate((token) => {
				if (token.line == min_start) {
					token_start = token.index;
					break;
				}
			})
			if (token_start === null) {
				throw Error(`Unable to find the token of start line ${min_start}.`);
			}
		}

		// Iterate backwards to find the scope start line.
		if (token_start !== 0) {
			let is_id = null;
			let is_string = false;
			let is_comment = false;
			let is_regex = false;
			let is_preprocessor = false;
			tokens.iterate_reversed(0, token_start.index, (token) => {
				if (is_string) {
					if (token.str_id !== is_id) {
						start_scope = token.line; // @todo there may still end another string etc on this line so this is not correct.
					}
				} else if (is_comment) {

				} else if (is_regex) {

				} else if (is_preprocessor)
				switch (token.token) {
					case "token_string":
						is_string = true;
						is_id = token.str_id;
						break;
					case "token_comment":
						is_comment = true;
						is_id = token.comment_id;
						break;
					case "token_regex":
						is_regex = true;
						is_id = token.regex_id;
						break;
					case "token_preprocessor":
						is_preprocessor = true;
						is_id = token.preprocessor_id;
						break;
					case null:
						if (token.data.length == 0 && scope_seperators.includes(token.data)) {

						}
						break;
					default:
						break;
				}
			})
		}

		/*
		// ---------------------------------------------------------
		// First expand the scope of the new edits, so no context is missing.

		// Vars.
		const tokenizer = this.tokenizer;
		let line = 0; 													// current line number.
		const scope_seperators = [";", "(", ")", "{", "}", "[", "]"]; 	// scope seperators.
		let is_str = false; 											// is inside a string.
		let is_comment = false; 										// is inside a comment.
		let is_regex = false; 											// is inside a regex.
		let is_preprocessor = false; 									// is inside a preprocessor.
		let last_scope_line = null; 									// the last scope changing line.
		let last_scope_end_line = null; 								// the last scope end line, only used for string, comment, regex and preprocessor to avoid a scope end and start on one line.

		// Determine the scope start.
		tokenizer.code = code;
		tokenizer.iterate_code(this, null, null, (char, l_is_str, l_is_comment, l_is_multi_line_comment, l_is_regex, is_escaped, l_is_preprocessor) => {

			// Increment line.
			if (char == "\n" && !is_escaped) {
				++line;
			}

			// Combine single and multi line comments.
			if (l_is_comment && l_is_multi_line_comment) {
				l_is_comment = true;
			}

			// New scope by a new string, comment, regex or preprocessor.
			// Prevent setting the new scope if another string, comment, regex or preprocessor has ended on the new scope line.
			if (!is_str && l_is_str) {
				is_str = true;
				if (last_scope_end_line != line) { 
					last_scope_line = line;
				}
			} else if (!is_comment && l_is_comment) {
				is_comment = true;
				if (last_scope_end_line != line) {
					last_scope_line = line;
				}
			} else if (!is_regex && l_is_regex) {
				is_regex = true;
				if (last_scope_end_line != line) {
					last_scope_line = line;
				}
			} else if (!is_preprocessor && l_is_preprocessor) {
				is_preprocessor = true;
				if (last_scope_end_line != line) {
					last_scope_line = line;
				}
			}

			// Scope by scope seperator.
			else if (!is_str && !is_comment && !is_regex && !is_preprocessor && scope_seperators.includes(char)) {
				last_scope_line = line;
			}

			// Close string, comment, regex or pattern.
			if (is_str && !l_is_str) {
				is_str = false;
				last_scope_end_line = line;
			} else if (is_comment && !l_is_comment) {
				is_comment = false;
				last_scope_end_line = line;
			} else if (is_regex && !l_is_regex) {
				is_regex = false;
				last_scope_end_line = line;
			} else if (is_preprocessor && !l_is_preprocessor) {
				is_preprocessor = false;
				last_scope_end_line = line;
			}

			// Set last scope.

		})

		// Add a few lines since some coders code like "const myfunc = function () \n {}".


		// ---------------------------------------------------------
		// Highlight the new edits.

		// ---------------------------------------------------------
		// Insert the new edits from the original edited lines into the existing tokens.
		*/
	}
}

// Initialize.
vhighlight.js = new vhighlight.JS();
