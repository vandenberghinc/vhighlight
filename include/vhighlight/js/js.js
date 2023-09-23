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
						const prev = this.tokenizer.get_prev_token(this.tokenizer.added_tokens - 1, [" ", "\t", "\n"]);
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
					const prev = this.tokenizer.get_prev_token(this.tokenizer.added_tokens - 1, [" ", "\t", "\n", "=", ":"]);
					prev.token = "token_type_def";
					this.tokenizer.append_batch("token_keyword");
					this.tokenizer.batch += char;
					this.tokenizer.append_batch(false);
					this.func_def_parenth_depth = this.tokenizer.parenth_depth;
					this.func_def_curly_depth = this.tokenizer.curly_depth;
					return true;
				}
				
				// Fetch previous batch.
				const prev = this.tokenizer.get_prev_token(this.tokenizer.added_tokens - 1, [" ", "\t", "\n"]);

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
					this.tokenizer.code.charAt(this.tokenizer.index + 1) != '>'
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
					const prev = this.tokenizer.get_prev_token(this.tokenizer.added_tokens - 1, [" ", "\t", "\n"]);
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
			@name: data
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
		@parameter: {
			@name: update_offsets
			@type: boolean
			@description: Update the offsets of the new tokens.
		}
	} */
	partial_highlight({
		code = null,
		edits_start = null,
		edits_end = null,
		line_deletions = 0,
		line_additions = 0,
		tokens = [],
		update_offsets = true,
	}) {

		// Assign code when not assigned.
		// So the user can also assign it to the tokenizer without cause two copies.
		if (code !== null) {
			this.tokenizer.code = code;
		}

		// Reset.
		this.reset();

		// Partial tokenize.
		return this.tokenizer.partial_tokenize({
			edits_start: edits_start,
			edits_end: edits_end,
			line_deletions: line_deletions,
			line_additions: line_additions,
			tokens: tokens,
			update_offsets: update_offsets,
		})
	}
}

// Initialize.
vhighlight.js = new vhighlight.JS();
