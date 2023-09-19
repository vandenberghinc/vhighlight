/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Javascript highlighter.

vhighlight.js = {};

// the tokenizer options.
vhighlight.js.tokenizer_opts = {
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
};

// Highlight.
vhighlight.js.highlight = function(code, return_tokens = false) {

	// Initialize the tokenizer.
	const tokenizer = new Tokenizer(vhighlight.js.tokenizer_opts);

	// Assign the code.
	tokenizer.code = code;

	// Variables.
	let opening_parenth_curly_depth = 0;	// the curly depth of the first parenth depth when opened.
	let func_def_parenth_depth = null; 		// parenth depth inside the parentheses of a function definition.
	let func_def_curly_depth = null; 		// curly depth inside the parentheses of a function definition, since functions can also be passed as parameters etc.
	let last_param_was_assignment = false; 	// used to check if the last tokenized param used an assignemnt operator,
											// if so do not highlight last on closing ")".

	// Start.
	tokenizer.callback = function(char) {
		
		// Opening parentheses.
		if (char == "(") {

			// V2.
			// Uses a lookup.

			// Append current batch by word seperator.
			this.append_batch();

			// Get the previous token.
			const prev = this.get_prev_token(this.tokens.length - 1, [" ", "\t", "\n"]);

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
			const closing_parentheses = this.get_closing_parentheses(this.index);
			if (closing_parentheses == null) {
				return false;
			}

			// Check character after closing parentheses.
			const after_parenth = this.get_first_non_whitespace(closing_parentheses + 1, true);

			// Valid characters for a function declaration.
			const c = this.code.charAt(after_parenth);
			if (c == "{") {

				console.log(this.line, c, prev.data);

				// Get the function name when the previous token is a keyword or when it is a "() => {}" function..
				if (prev_token_is_function_keyword) {
					const token = this.get_prev_token(prev.index - 1, [" ", "\t", "\n", "=", ":", "async"]);
					if (this.str_includes_word_boundary(token.data)) {
						return false;
					}
					token.token = "token_type_def";
				}

				// Assign the token type def to the current token.
				else if (!this.str_includes_word_boundary(prev.data)) {
					prev.token = "token_type_def";
				}
			}

			// Functions declared as "() => {}".
			else if (c == "=" && this.code.charAt(after_parenth + 1) == ">") {
				const token = this.get_prev_token(prev.index - 1, [" ", "\t", "\n", "=", ":", "async"]);
				if (this.str_includes_word_boundary(token.data)) {
					return false;
				}
				token.token = "token_type_def";
			}

			// Otherwise it is a function call.
			else if (!this.str_includes_word_boundary(prev.data)) {
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
			if (this.parenth_depth == 1) {
				opening_parenth_curly_depth = this.curly_depth;
				last_param_was_assignment = false;
			}
			
			// Class function definition.
			// - When a line contains a opening parentheses at the curly depth of the class ...
			//   It is always a function definition, since attributes are always assigned ...
			//   In the constructor or other funcs ...
			// - Parentheses depth should be 1 though, otherwise it will also match a parameter with a function call.
			if (this.class_depth == this.curly_depth && this.parenth_depth == 1) {
				if (this.is_linebreak_whitespace_char(this.prev_char) || this.is_linebreak_whitespace_char()) {
					const prev = this.get_prev_token(this.tokens.length - 1, [" ", "\t", "\n"]);
					prev.token = "token_type_def";
					this.append_batch(false)
				} else {
					this.append_batch("token_type_def")
				}
				this.batch += char;
				this.append_batch(false);
				return true;
			}
		
		
			// When the current batch is keyword "function" it means
			// The function was assigned to a variable.
			if (this.batch == "function") {
				const prev = this.get_prev_token(this.tokens.length - 1, [" ", "\t", "\n", "=", ":"]);
				prev.token = "token_type_def";
				this.append_batch("token_keyword");
				this.batch += char;
				this.append_batch(false);
				func_def_parenth_depth = this.parenth_depth;
				func_def_curly_depth = this.curly_depth;
				return true;
			}
			
			// Fetch previous batch.
			const prev = this.get_prev_token(this.tokens.length - 1, [" ", "\t", "\n"]);

			// No previous token.
			if (prev === null) {
				return false;
			}
			
			// Function definition.
			if (prev.data == "function") {
				this.append_batch("token_type_def");
				this.batch += char;
				this.append_batch(false);
				func_def_parenth_depth = this.parenth_depth;
				func_def_curly_depth = this.curly_depth;
				return true;
			}
			
			// Treat as word boundary but test the prev prev for keyword "function" or the ":".
			const prev_prev = this.get_prev_token(prev.index - 1, [" ", "\t", "\n"])
			
			// Anonymous function definition assigned to a property.
			// Such as "{ myfunc: () => {} }"
			// Batch should be empty otherwise it will also assign to "width = me()".
			if (prev_prev != null && this.batch.length == 0 && (prev.data == "=" || prev.data == ":")) {
				prev_prev.token = "token_type_def";
				func_def_parenth_depth = this.parenth_depth;
				func_def_curly_depth = this.curly_depth;
			}
			
			// When there is whitespace between the func name and the ( ...
			// The function keyword is one past the previous batch.
			else if (prev_prev != null && prev_prev.data == "function") {
				prev.token = "token_type_def"
				func_def_parenth_depth = this.parenth_depth;
				func_def_curly_depth = this.curly_depth;
			}
			
			// Treat as function call.
			// Still except keywords.
			else {
			
				// Function call with whitespace in between the func name and the "(".
				// The prev data should not include a word boundary otherwise it ...
				// Will also match the first "(" in something like "((foi,foi)=>{...})".
				if (this.is_linebreak_whitespace_char(this.prev_char) || this.is_linebreak_whitespace_char()) {
					if (prev.token == null && !this.str_includes_word_boundary(prev.data)) {
						prev.token = "token_type";
					}
					this.append_batch(false);
				}
				
				// No whitespace.
				else {
					if (this.keywords.includes(this.batch)) {
						this.append_batch("token_keyword");
						opening_parenth_curly_depth = null; // reset otherwise the "if (x==0)" x will be highlighted because it thinks it is an assignment keyword.
					} else {
						this.append_batch("token_type");
					}
				}
			}
			
			// Treat ( char as word boundary.
			this.batch += char;
			this.append_batch(false);
			return true;
			*/
		}
		
		// Function parameter.
		else if (
			// Inside a class.
			(this.class_depth == this.curly_depth &&
			(
				(this.parenth_depth == 1 && ((char == ',' && !last_param_was_assignment) || (char == '=' && this.next_char != '>'))) ||
				(this.parenth_depth == 0 && char == ')')
			)) ||
			// Inside a func def.
			(
				func_def_curly_depth == this.curly_depth && // match only the curly depth of the func def opening.
				(
					(this.parenth_depth == func_def_parenth_depth && ((char == ',' && !last_param_was_assignment) || (char == '=' && this.next_char != '>'))) ||
					(this.parenth_depth == func_def_parenth_depth - 1 && char == ')')
				)
			) ||
			// Inside a func call.
			(
				opening_parenth_curly_depth == this.curly_depth && // do not match code inside a func body of a nested parameter.
				this.parenth_depth > 0 && // can be >0 since the last ')' does not need to be catched, only assignment parameters are highlighted.
				char == '=' &&
				code.charAt(this.index + 1) != '>'
			)
		) {
		
			// When char is ")".
			if (char == ')') {
		
				// End of func parenth depth.
				// Needs to be disabled here otherwise "func_def_parenth_depth == parenth_depth" no longer matches.
				if (func_def_parenth_depth != null && this.parenth_depth < func_def_parenth_depth) {
					func_def_parenth_depth = null;
				}
		
				// Otherwise the last func param assignment is never disabled.
				// So it proceeds when the last param did not use assignment, so it can highlight the last param.
				if (last_param_was_assignment) {
					last_param_was_assignment = false;
					this.append_batch();
					this.batch += char;
					this.append_batch();
					return true;
				}
			}
		
			// Set last func was assignment.
			if (char == '=') {
				last_param_was_assignment = true;
			} else {
				last_param_was_assignment = false;
			}
		
			// Tokenize.
			if (this.is_linebreak_whitespace_char(this.prev_char)) {
				const prev = this.get_prev_token(this.tokens.length - 1, [" ", "\t", "\n"]);
				prev.token = "token_parameter";
				this.append_batch();
			} else {
				this.append_batch("token_parameter");
			}
			this.batch += char;
			this.append_batch();
			return true;
		}
		

		// Not appended.
		return false;
	}

	// Tokenize.
	return tokenizer.tokenize(return_tokens);

	/*
	
		// Variables.
		let tokens = [];						// use an array with tokens since some tokens need to be edited after they have been appended.
		let batch  = "";						// current batch.
		let line = 0;							// current line number.
		let is_comment = false;					// is currently a comment.
		let is_str = false;						// is currently a string.
		let is_regex = false;					// is currently a regex string "/hello/".
		let curly_depth = 0;					// curly brackets depth.
		let parenth_depth = 0;					// parentheses depth.
		let opening_parenth_curly_depth = 0;	// the curly depth of the first parenth depth when opened.
		let class_depth = null; 				// the curly depth of the active class, it is assigned when the keyword "class" is matched ...
												// Ao not on the opening curly bracket. And since a class definition ...
												// Inside a class is not valid js, it can be done using a depth counter.
		let func_def_parenth_depth = null; 		// parenth depth inside the parentheses of a function definition.
		let func_def_curly_depth = null; 		// curly depth inside the parentheses of a function definition, since functions can also be passed as parameters etc.
		let next_token = null;					// the next token, defined by the previous token such ass "class" or "extends".
		let last_param_was_assignment = false; 	// used to check if the last tokenized param used an assignemnt operator,
												// if so do not highlight last on closing ")".
		
		// Arrays references.
		const word_boundaries = vhighlight.utils.word_boundaries;
		const keywords = vhighlight.js.keywords;
		const operators = vhighlight.utils.operators;
		
		// Fetch the first non whitespace item going backwards from the specified index.
		// So it also tests the specified index. If the previous one is indeed whitespace ...
		// It looks one index further back.
		function prev_batch(index, exclude = [" ", "\t", "\n"]) {
			for (let i = index; i >= 0; i--) {
				const item = tokens[i];
				if (!exclude.includes(item.data)) {
					return item;
				}
			}
			return null;
		}
		
		// Check if a string contains a word boundary character.
		function str_includes_word_boundary(str) {
			for (let i = 0; i < word_boundaries.length; i++) {
				if (str.includes(word_boundaries[i])) {
					return true;
				}
			}
			return false;
		}
		
		// Append a token.
		// Do not join null tokens since that would clash with the prev batch function lookup and comparing it with data.
		// For example when exlcuding whitespace in the prev token, it can still contain whitespace.
		function append_token(token = null) {
			tokens.push({token: token, data: batch, index: tokens.length, line: line});
		}
		
		// Append batch.
		// - Batches should only be a single word, unless it is a string or comment
		// - When the token param is false, no spans will be added, when the token ...
		//   Is not null the assigned token will be added as span. And when the token param ...
		//   Is null the batch will be checked against keywords, numerics etc.
		function append_batch(token) {
			if (batch.length == 0) {
				return ;
			}
			
			// Do not parse tokens.
			if (token == false) {
				append_token();
			}
			
			// By assigned token.
			else if (token != null) {
				append_token(token);
			}
			
			// By next token.
			// Skip whitespace.
			else if (next_token != null) {
				if (batch == " " || batch == "\t" || batch == "\n") {
					append_token();
				} else {
					append_token(next_token);
					next_token = null;
				}
			}
			
			// Parse batch.
			else {
				
				// Keyword.
				if (keywords.includes(batch)) {
					
					// Set class depth.
					if (batch == "class") {
						next_token = "token_type_def"
						class_depth = curly_depth + 1;
					}
					
					// Next tokens.
					else if (batch == "extends") {
						next_token = "token_type";
					}
					
					// Append.
					append_token("token_keyword");
				}
				
				// Operator.
				else if (operators.includes(batch)) {
					append_token("token_operator");
				}
				
				// Numeric.
				else if (/^-?\d+(\.\d+)?$/.test(batch)) {
					append_token("token_numeric");
				}
				
				// Just a code batch without highlighting.
				else {
					append_token(null);
				}
				
			}
			
			// Reset batch.
			batch = "";
			
		}
		
		// Iterate.
		vhighlight.utils.iterate_code({
			code: code,
			language: "js",
			callback: (index, char, local_is_str, local_is_comment, is_multi_line_comment, local_is_regex, is_escaped) => {
				
				// New line.
				if (!is_escaped && char == "\n") {
				
					// Append previous batch, but snce newlines may be present in regexes, strings and comments, handle them correctly.
					if (is_comment) {
						append_batch("token_comment");
					} else if (is_str) {
						append_batch("token_string");
					} else if (is_regex) {
						append_batch("token_string");
					} else {
						append_batch();
					}
					
					// Increment line after appending the prev batch.
					// For VIDE the "\n" token "token_line" should have the line number of the next line.
					// Not the previous line. Which also makes better sense.
					++line;
					batch += char;
					append_batch("token_line");
				}
				
				// Start of comment.
				else if (local_is_comment || is_multi_line_comment) {
					if (!is_comment) {
						append_batch();
						is_comment = true;
					}
					batch += char;
				}
				
				// Start of string.
				else if (local_is_str) {
					if (!is_str) {
						append_batch();
						is_str = true;
					}
					batch += char;
				}
				
				// Start of regex.
				else if (local_is_regex) {
					if (!is_regex) {
						append_batch();
						is_regex = true;
					}
					batch += char;
				}
				
				// Is code.
				else {
				
					// Curly depth.
					if (char == "{") {
						++curly_depth;
					} else if (char == "}") {
						--curly_depth;
						if (class_depth != null && curly_depth < class_depth) {
							class_depth = null;
						}
					}
					
					// Parentheses depth.
					if (char == "(") {
						++parenth_depth;
					} else if (char == ")") {
						--parenth_depth;
					}
					
					// End of comment.
					// Should proceed with the callback since the next character needs to be parsed.
					if (is_comment) {
						append_batch("token_comment");
						is_comment = false;
					}
					
					// End of string.
					// Should proceed with the callback since the next character needs to be parsed.
					else if (is_str) {
						append_batch("token_string");
						is_str = false;
					}
					
					// End of regex.
					// Should proceed with the callback since the next character needs to be parsed.
					else if (is_regex) {
						append_batch("token_string");
						is_regex = false;
					}
					
					//
					// Stop the else if loop after here since the end of string / comment should be parsed as a new char.
					//
					
					// Opening parentheses.
					if (char == "(") {
						const prev_char = code.charAt(index - 1);
						
						// Assign the curly depth of the first opening parenthes ...
						// This can be used to tokenize parameters while skipping ...
						// Function bodies of a function as parameter.
						if (parenth_depth == 1) {
							opening_parenth_curly_depth = curly_depth;
							last_param_was_assignment = false;
						}
						
						// Class function definition.
						// - When a line contains a opening parentheses at the curly depth of the class ...
						//   It is always a function definition, since attributes are always assigned ...
						//   In the constructor or other funcs ...
						// - Parentheses depth should be 1 though, otherwise it will also match a parameter with a function call.
						if (class_depth == curly_depth && parenth_depth == 1) {
							if (prev_char == " " || prev_char == "\t" || prev_char == "\n" || batch == " " || batch == "\t" || batch == "\n") {
								const prev = prev_batch(tokens.length - 1, [" ", "\t", "\n"]);
								prev.token = "token_type_def";
								append_batch(false)
							} else {
								append_batch("token_type_def")
							}
							batch += char;
							append_batch(false);
							return null;
						}
					
					
						// When the current batch is keyword "function" it means
						// The function was assigned to a variable.
						if (batch == "function") {
							const prev = prev_batch(tokens.length - 1, [" ", "\t", "\n", "=", ":"]);
							prev.token = "token_type_def";
							append_batch("token_keyword");
							batch += char;
							append_batch(false);
							func_def_parenth_depth = parenth_depth;
							func_def_curly_depth = curly_depth;
							return null;
						}
						
						// Fetch previous batch.
						const prev = prev_batch(tokens.length - 1, [" ", "\t", "\n"]);
						
						// Function definition.
						if (prev.data == "function") {
							append_batch("token_type_def");
							batch += char;
							append_batch(false);
							func_def_parenth_depth = parenth_depth;
							func_def_curly_depth = curly_depth;
							return null;
						}
						
						// Treat as word boundary but test the prev prev for keyword "function" or the ":".
						const prev_prev = prev_batch(prev.index - 1, [" ", "\t", "\n"])
						
						// Anonymous function definition assigned to a property.
						// Such as "{ myfunc: () => {} }"
						// Batch should be empty otherwise it will also assign to "width = me()".
						if (prev_prev != null && batch.length == 0 && (prev.data == "=" || prev.data == ":")) {
							prev_prev.token = "token_type_def";
							func_def_parenth_depth = parenth_depth;
							func_def_curly_depth = curly_depth;
						}
						
						// When there is whitespace between the func name and the ( ...
						// The function keyword is one past the previous batch.
						else if (prev_prev != null && prev_prev.data == "function") {
							prev.token = "token_type_def"
							func_def_parenth_depth = parenth_depth;
							func_def_curly_depth = curly_depth;
						}
						
						// Treat as function call.
						// Still except keywords.
						else {
						
							// Function call with whitespace in between the func name and the "(".
							// The prev data should not include a word boundary otherwise it ...
							// Will also match the first "(" in something like "((foi,foi)=>{...})".
							if (prev_char == " " || prev_char == "\t" || prev_char == "\n" || batch == " " || batch == "\t" || batch == "\n") {
								if (prev.token == null && !str_includes_word_boundary(prev.data)) {
									prev.token = "token_type";
								}
								append_batch(false);
							}
							
							// No whitespace.
							else {
								if (keywords.includes(batch)) {
									append_batch("token_keyword");
									opening_parenth_curly_depth = null; // reset otherwise the "if (x==0)" x will be highlighted because it thinks it is an assignment keyword.
								} else {
									append_batch("token_type");
								}
							}
						}
						
						// Treat as word boundary.
						batch += char;
						append_batch(false);
					}
					
					// Function parameter inside a class.
					else if (
						// Inside a class.
						(class_depth == curly_depth &&
						(
							(parenth_depth == 1 && ((char == ',' && !last_param_was_assignment) || (char == '=' && code.charAt(index + 1) != '>'))) ||
							(parenth_depth == 0 && char == ')')
						)) ||
						// Inside a func def.
						(
							func_def_curly_depth == curly_depth && // match only the curly depth of the func def opening.
							(
								(parenth_depth == func_def_parenth_depth && ((char == ',' && !last_param_was_assignment) || (char == '=' && code.charAt(index + 1) != '>'))) ||
								(parenth_depth == func_def_parenth_depth - 1 && char == ')')
							)
						) ||
						// Inside a func call.
						(
							opening_parenth_curly_depth == curly_depth && // do not match code inside a func body of a nested parameter.
							parenth_depth > 0 && // can be >0 since the last ')' does not need to be catched, only assignment parameters are highlighted.
							char == '=' &&
							code.charAt(index + 1) != '>'
						)
					) {
					
						// When char is ")".
						if (char == ')') {
					
							// End of func parenth depth.
							// Needs to be disabled here otherwise "func_def_parenth_depth == parenth_depth" no longer matches.
							if (func_def_parenth_depth != null && parenth_depth < func_def_parenth_depth) {
								func_def_parenth_depth = null;
							}
					
							// Otherwise the last func param assignment is never disabled.
							// So it proceeds when the last param did not use assignment, so it can highlight the last param.
							if (last_param_was_assignment) {
								last_param_was_assignment = false;
								append_batch();
								batch += char;
								append_batch();
								return null;
							}
						}
					
						// Set last func was assignment.
						if (char == '=') {
							last_param_was_assignment = true;
						} else {
							last_param_was_assignment = false;
						}
					
						// Tokenize.
						const prev_char = code.charAt(index - 1);
						if (prev_char == " " || prev_char == "\t" || prev_char == "\n") {
							const prev = prev_batch(tokens.length - 1, [" ", "\t", "\n"]);
							prev.token = "token_parameter";
							append_batch();
						} else {
							append_batch("token_parameter");
						}
						batch += char;
						append_batch();
					
					}
					
					// Is word boundary.
					// Append old batch and word boundary char.
					else if (word_boundaries.includes(char)) {
						append_batch();
						batch += char;
						append_batch();
					}
					
					// Add to batch till a word boundary is reached.
					else {
						batch += char;
					}
						
				}
				
			},
		});
		
		// Append last batch.
		append_batch();
		
		// VIDE option.
		if (options.vide) {
			
			// Handler.
			return {
				tokens: tokens,
				line_count: line,
			}
		}
		
		// Default.
		else {
			return vhighlight.utils.build_tokens(tokens);
		}
	*/
	
}

/*
REGEX VERSION IS TOO SLOW.

// Keywords.
vhighlight.js.keywords = [
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
	"=>",
]

// Type definition keywords.
vhighlight.js.type_def_keywords = [
	"class",
	"extends",
];

// Function definition keywords.
vhighlight.js.func_def_keywords = [
	'function',
	'static',
	'async',
	'get',
	'set',
	'constructor',
];

// Type keywords.
vhighlight.js.type_keywords = [
	"extends",
];

// Regexes helpers.
vhighlight.js.exclude_span = "(?!(?:[^<]|<(?!/?span[^>]*>))*?<\\/span>)"; // exclude contents inside a "<span>HERE</span>"
vhighlight.js.html_open = "(?<!<[^>]*)"; // exclude inside a opening < html tag.
vhighlight.js.html_close = "(?![^<]*>)"; // exclude inside a closing > html tag.

// Regexes.
vhighlight.js.comment_regex = /(\/\/.*|\/\*[\s\S]*?\*\/)(?!\S)/g;
vhighlight.js.keyword_regex = new RegExp(`${vhighlight.js.exclude_span}\\b(${vhighlight.js.keywords.join('|')})\\b`, 'gm');
vhighlight.js.string_regex = new RegExp(`(${vhighlight.js.exclude_span}${vhighlight.js.html_open})(['"\`/]{1})(.*?)\\2${vhighlight.js.html_close}`, 'gms');
vhighlight.js.numeric_regex = new RegExp(`${vhighlight.js.exclude_span}\\b-?\\d+(?:\\.\\d+)?\\b`, 'g');
vhighlight.js.type_def_regex = new RegExp(`${vhighlight.js.exclude_span}\\b(${vhighlight.js.type_def_keywords.join('|')})(\\s+[A-Za-z_][A-Za-z0-9_]+)(\\s*[\\(|{|\\s+])`, 'gm');

vhighlight.js.prototype_type_def_regex = new RegExp(`${vhighlight.js.exclude_span}\\b([A-Za-z_][A-Za-z0-9_]+)(?:\\s*=\\s*function\\s*\\()`, 'gm');
// vhighlight.js.anonymous_prototype_type_def_regex = new RegExp(`${vhighlight.js.exclude_span}\\b([A-Za-z_][A-Za-z0-9_]+)(\\s*=\\s*\\([^\\)]*\\s*=)`, 'gm');
vhighlight.js.anonymous_prototype_type_def_regex = new RegExp(`${vhighlight.js.exclude_span}\\b([A-Za-z_][A-Za-z0-9_]+)(?:\\s*=\\s*\\([^()]*\\))`, 'gm')

vhighlight.js.type_def_body_regex = new RegExp(`${vhighlight.js.exclude_span}(\\b${vhighlight.js.type_def_keywords.join('|')}\\b)([^{]+)\\s*\\{`, 'gm');

// vhighlight.js.outside_class_func_def_regex = new RegExp(`${vhighlight.js.exclude_span}\\b(${vhighlight.js.func_def_keywords.join('\\s+|')}\\s+)(\\s*[A-Za-z_][A-Za-z0-9_]+)(\\s*\\([^\\)]*\\))\\s*{`, 'gm');
vhighlight.js.outside_class_func_def_regex = new RegExp(`${vhighlight.js.exclude_span}${vhighlight.js.html_open}\\b(${vhighlight.js.func_def_keywords.join('\\s+|')}\\s+)(\\s*[A-Za-z_][A-Za-z0-9_]+)(\\s*\\([^{}]*{)${vhighlight.js.html_close}`, 'gm');

// vhighlight.js.inside_class_func_def_regex = new RegExp(`${vhighlight.js.exclude_span}\\b(${vhighlight.js.func_def_keywords.join('\\s+|')}\\s+)*(\\s*[A-Za-z_][A-Za-z0-9_]+)(\\s*\\([^\\)]*\\))\\s*{`, 'gm');
// vhighlight.js.inside_class_func_def_regex = new RegExp(`${vhighlight.js.exclude_span}\\b(${vhighlight.js.func_def_keywords.join('\\s+|')}\\s+)*(\\s*[A-Za-z_][A-Za-z0-9_]+)([^\\}]*{)`, 'gm');

// vhighlight.js.inside_class_func_def_regex = new RegExp(`${vhighlight.js.exclude_span}([\\s*\\b]+)(${vhighlight.js.func_def_keywords.join('\\s+|')}\\s+)*(\\s*[A-Za-z_][A-Za-z0-9_]+)(\\s*\\([^{]*{)`, 'gm');
// vhighlight.js.inside_class_func_def_regex = new RegExp(`${vhighlight.js.exclude_span}\\b(${vhighlight.js.func_def_keywords.join('\\s+|')}\\s+)*(\\s*[A-Za-z_][A-Za-z0-9_]+)(\\s*\\([^{]*{)`, 'gm');

// vhighlight.js.inside_class_func_def_regex = new RegExp(`${vhighlight.js.exclude_span}(${vhighlight.js.func_def_keywords.join('\\s+|')}\\s+)*(\\s*[A-Za-z_][A-Za-z0-9_]+)(\\s*\\([^{}"\`]*{)`, 'gm');
// vhighlight.js.inside_class_func_def_regex = new RegExp(`${vhighlight.js.exclude_span}(${vhighlight.js.func_def_keywords.join('\\s+|')}\\s+)*(\\s*[A-Za-z_][A-Za-z0-9_]+)(\\s*\\([^{}"'\/\`]+{)`, 'gm');
// vhighlight.js.inside_class_func_def_regex = new RegExp(`${vhighlight.js.exclude_span}(${vhighlight.js.func_def_keywords.join('\\s+|')}\\s+)*(\\s*[A-Za-z_][A-Za-z0-9_]+)(\\s*\\([^{}]*{)`, 'gm');
// vhighlight.js.inside_class_func_def_regex = new RegExp(`${vhighlight.js.exclude_span}(${vhighlight.js.func_def_keywords.join('\\s+|')}\\s+)*(\\s*[A-Za-z_][A-Za-z0-9_]+)(\\s*\\((?!{|})*{)`, 'gm');
// vhighlight.js.inside_class_func_def_regex = new RegExp(`${vhighlight.js.exclude_span}(${vhighlight.js.func_def_keywords.join('\\s+|')}\\s+)*(\\s*[A-Za-z_][A-Za-z0-9_]+)\\s*\\(([^{}]*)\\{`, 'gm');
// vhighlight.js.inside_class_func_def_regex = new RegExp(`${vhighlight.js.exclude_span}(${vhighlight.js.func_def_keywords.join('\\s+|')}\\s+)*(\\s*[A-Za-z_][A-Za-z0-9_]+)(\\s*\\([^{}<]*{)`, 'gm');

vhighlight.js.inside_class_func_def_regex = new RegExp(`${vhighlight.js.exclude_span}(^|${vhighlight.js.func_def_keywords.join('\\s+|')}\\s+)(\\s*[A-Za-z_][A-Za-z0-9_]+)(\\s*\\([^{}]*{)`, 'gm');






vhighlight.js.nameless_func_def_regex = new RegExp(`${vhighlight.js.exclude_span}\\b(function\\s*)(\\([^\\)]*\\))\\s*{`, 'gm');
vhighlight.js.nameless_func_def_regex_2 = new RegExp(`${vhighlight.js.exclude_span}\\b(function\\s*)(\\()`, 'gm');
// vhighlight.js.anonymous_func_def_regex = new RegExp(`${vhighlight.js.exclude_span}\\b(\\([^\\)]*\\)\\s*=>)\\s*{`, 'gm');
// vhighlight.js.anonymous_func_def_regex = new RegExp(`${vhighlight.js.exclude_span}\\b(\\([^\\)]*\\))\\s*=&gt;\\s*{`, 'gm');

vhighlight.js.anonymous_func_def_regex = new RegExp(`${vhighlight.js.exclude_span}(\\([^\\(\\)]*\\)\\s*=&gt;\\s*{)`, 'gm');


vhighlight.js.call_regex = new RegExp(`${vhighlight.js.exclude_span}\\b([A-Za-z0-9_]+)(\\s*\\()`, 'gm');

vhighlight.js.parentheses_regex = new RegExp(`${vhighlight.js.exclude_span}(\\b[A-Za-z0-9_]+\\s*\\()`, 'g');
vhighlight.js.parameter_regex = new RegExp(`${vhighlight.js.exclude_span}(^|,)(\\s*[A-Za-z0-9_]+\\b)(?=\\s*[=,$]*)`, 'gm');

// Highlight.
vhighlight.js.highlight = function(code, is_class = false, reformat = true) {

	// Replace < and >.
	// Need to be replaced again, they should also be replaced before assigning the initial pre data.
	// But because of the rendering they may need to be replaced again.
	if (reformat) {
		code = code.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
	}

	// Pre argument regex replacements.
	if (!is_class) {
		code = code.replace(vhighlight.js.comment_regex, '<span class="token_comment">$&</span>');
		code = code.replace(vhighlight.js.string_regex, '<span class="token_string">$&</span>');
		// code = code.replace(vhighlight.js.prototype_type_def_regex, '<span class="token_type_def">$1</span>'); // should be before nameless func def regex 2 and keyword regex.
		// code = code.replace(vhighlight.js.anonymous_prototype_type_def_regex, '<span class="token_type_def">$1</span>'); // should be before nameless func def regex 2 and keyword regex.
	}

	// Parameter replacements before class body highlighting.
	function replace_parameters(regex, replacement = null) {
		return true;
		let match;
		while ((match = regex.exec(code)) !== null) {
			const head = vhighlight.utils.slice_parentheses({code: code, start_index: match.index, language: "js"});
			if (head != null) {
				code = vhighlight.utils.replace_by_index(code, head.start, head.end, head.data.replace(vhighlight.js.parameter_regex, "$1<span class='token_parameter'>$2</span>"));
				regex.lastIndex = head.end + 1;
			}
		}
	}
	replace_parameters(vhighlight.js.anonymous_func_def_regex);
	replace_parameters(vhighlight.js.nameless_func_def_regex);
	// code = code.replace(vhighlight.js.nameless_func_def_regex_2, '<span class="token_keyword">$1</span>$2'); // to prevent function () from being highlighted as a type def.

	// Highlight class body, since functions inside a class may be declared without a function prefix.
	if (!is_class) {
		let match;
		const regex = vhighlight.js.type_def_body_regex;
		while ((match = regex.exec(code)) !== null) {
			const body = vhighlight.utils.slice_curly_brackets({code: code, start_index:match.index, language: "js"});
			if (body != null) {
				code = vhighlight.utils.replace_by_index(code, body.start, body.end, vhighlight.js.highlight(body.data, true, false));
				regex.lastIndex = body.end + 1;
			}
		}
	}

	// Replace parameters.
	if (is_class) {
		replace_parameters(vhighlight.js.inside_class_func_def_regex);
	} else {
		replace_parameters(vhighlight.js.outside_class_func_def_regex);
	}

	// Post argument regex replacements.
	// code = code.replace(vhighlight.js.type_def_regex, '<span class="token_keyword">$1</span><span class="token_type_def">$2</span>$3'); // should be before keyword.
	// if (is_class) {
	// 	code = code.replace(vhighlight.js.inside_class_func_def_regex, '<span class="token_keyword">$1</span><span class="token_type_def">$2</span>$3'); // should be before keyword.
	// } else {
	// 	code = code.replace(vhighlight.js.outside_class_func_def_regex, '<span class="token_keyword">$1</span><span class="token_type_def">$2</span>$3'); // should be before keyword.
	// }
	// code = code.replace(vhighlight.js.keyword_regex, '<span class="token_keyword">$&</span>'); // should be before call regex.
	// code = code.replace(vhighlight.js.call_regex, '<span class="token_type">$1</span>$2');
	// code = code.replace(vhighlight.js.numeric_regex, '<span class="token_numeric">$&</span>');
	
	const replacements = [
		[vhighlight.js.type_def_regex, '<span class="token_keyword">$1</span><span class="token_type_def">$2</span>$3'], // should be before keyword.
		(is_class
			? [vhighlight.js.inside_class_func_def_regex, '<span class="token_keyword">$1</span><span class="token_type_def">$2</span>$3'] // should be before keyword.
			: [vhighlight.js.outside_class_func_def_regex, '<span class="token_keyword">$1</span><span class="token_type_def">$2</span>$3'] // should be before keyword.
		),
		[vhighlight.js.keyword_regex, '<span class="token_keyword">$&</span>'], // should be before call regex.
		[vhighlight.js.call_regex, '<span class="token_type">$1</span>$2'],
		[vhighlight.js.numeric_regex, '<span class="token_numeric">$&</span>'],
	];
	
	function make_replacements(replacements, type = "gm") {
		
		// Combine all the patterns into a single regular expression
		let pattern = "";
		for (let i = 0; i < replacements.length; i++) {
			pattern += `(${replacements[i][0].source})`;
			if (i + 1 < replacements.length) {
				pattern += '|';
			}
		}
		console.log(pattern);
		const regex = new RegExp(pattern, type);
		
		// Helper function for replacement
		function replace(match, ...groups) {
			for (let i = 1; i < groups.length; i++) {
				if (groups[i]) {
					console.log(i);
					console.log(replacements.length);
					return replacements[i - 1][1];
				}
			}
			return match; // No match found, return the original string
		}
		
		// Replace the matched patterns with the corresponding spans
		return code.replace(regex, replace);
		
	}
	
	// Replace the matched patterns with the corresponding spans
	code = make_replacements(replacements);

	// Handler.
	return code;
}

*/
