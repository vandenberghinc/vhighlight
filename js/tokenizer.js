/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// Iterate.
if (Array.prototype.iterate === undefined) {
	Array.prototype.iterate = function(start, end, handler) {
	    if (typeof start === "function") {
	        handler = start;
	        start = null;
	    }
	    if (start == null) {
	        start = 0;
	    }
	    if (end == null) {
	        end = this.length;
	    }
	    for (let i = start; i < end; i++) {    
	        const res = handler(this[i]);
	        if (res != null) {
	            return res;
	        }
	    }
	    return null;
	};
}

// Iterate reversed.
if (Array.prototype.iterate_reversed === undefined) {
	Array.prototype.iterate_reversed = function(start, end, handler) {
	    if (handler == null && start != null) {
	        handler = start;
	        start = null;
	    }
	    if (start == null) {
	        start = 0;
	    }
	    if (end == null) {
	        end = this.length;
	    }
	    for (let i = end - 1; i >= start; i--) {    
	        const res = handler(this[i]);
	        if (res != null) {
	            return res;
	        }
	    }
	    return null;
	};
}

// The tokens class.
vhighlight.Tokens = class Tokens extends Array {

	// Constructor.
	constructor() {
		super();
	}

	// Iterate tokens, the start and the end params are in lines.
	iterate_tokens(start, end, handler) {
	    if (typeof start === "function") {
	        handler = start;
	        start = null;
	    }
	    if (start == null) {
	        start = 0;
	    }
	    if (end == null) {
	        end = this.length;
	    }
	    for (let i = start; i < end; i++) {    
	    	const tokens = this[i];
	    	for (let i = 0; i < tokens.length; i++) {
	    		const res = handler(tokens[i]);
		        if (res != null) {
		            return res;
		        }
	    	}
	    }
	    return null;
	};

	// Iterate tokens reversed, the start and the end params are in lines
	iterate_tokens_reversed(start, end, handler) {
	    if (handler == null && start != null) {
	        handler = start;
	        start = null;
	    }
	    if (start == null) {
	        start = 0;
	    }
	    if (end == null) {
	        end = this.length;
	    }
	    for (let i = end - 1; i >= start; i--) {    
	    	const tokens = this[i];
	    	for (let i = tokens.length - 1; i >= 0; i--) {
	    		const res = handler(tokens[i]);
		        if (res != null) {
		            return res;
		        }
	    	}
	    }
	    return null;
	};

}

// The tokenizer class.
// - Do not forget to assign attribute "code" after initializing the Tokenizer, used to avoid double copy of the code string.
// - Parsing behaviour depends on that every word is seperated as a token, so each word boundary is a seperate token.
// @todo highlight "@\\s+" patterns outside comments as token_type.
// @todo add support for each language to get parameters, so that vdocs can use this.
vhighlight.Tokenizer = class Tokenizer {
	constructor({
		// Attributes for tokenizing.
		keywords = [], 
		type_def_keywords = [], 
		type_keywords = [],
		operators = [],
		special_string_prefixes = [],
		single_line_comment_start = false,
		multi_line_comment_start = false,
		multi_line_comment_end = false,
		allow_strings = true,
		allow_numerics = true,
		allow_preprocessors = false,
		allow_slash_regexes = false,
		allow_comment_keyword = true,
		allow_comment_codeblock = true,
		allow_parameters = true,
		allow_decorators = false,
		excluded_word_boundary_joinings = [],
		// Attributes for partial tokenizing.
		scope_separators = [
			"{", 
			"}", 
			// do not use ; and : etc since they can be used inside a {} scope for cpp, js etc.
		],
	}) {

		// Parameter attributes.
		this.code = null;													// the code to tokenize.
		this.keywords = keywords;											// the languages default keywords.
		this.type_def_keywords = type_def_keywords;							// the keywords on wich the next token will always be a type def.
		this.type_keywords = type_keywords;									// the keywords on wich the next token will always be a type.
		this.operators = operators;											// language operators.
		this.special_string_prefixes = special_string_prefixes;				// special characters preceding a string to indicate a special string, such as the "f" in python for "f'{}'".
		this.single_line_comment_start = single_line_comment_start;			// the language's single line comment start characters, use "false" when the language does not support this.
		this.multi_line_comment_start = multi_line_comment_start;			// the language's multi line comment start characters, use "false" when the language does not support this.
		this.multi_line_comment_end = multi_line_comment_end;				// the language's multi line comment end characters, use "false" when the language does not support this.
		this.allow_strings = allow_strings;									// if the language supports strings.
		this.allow_numerics = allow_numerics;								// if the language supports numerics.
		this.allow_preprocessors = allow_preprocessors;						// if the language has "#..." based preprocessor statements.
		this.allow_slash_regexes = allow_slash_regexes;						// if the language has "/.../" based regex statements.
		this.allow_comment_keyword = allow_comment_keyword;					// allow comment keywords.
		this.allow_comment_codeblock = allow_comment_codeblock;				// allow comment codeblocks.
		this.allow_parameters = allow_parameters;							// allow parameters.
		this.allow_decorators = allow_decorators;							// allow decorators.
		this.scope_separators = scope_separators;							// scope separators for partial tokenize.

		// Word boundaries.
		this.word_boundaries = [
			' ',
		    '\t',
		    '\n',
		    '\r',
		    '.',
		    ',',
		    '!',
		    '?',
		    ';',
		    ':',
		    '-',
		    // '_', // do NOT add as word boundary since that will break a lot by "this.str_includes_word_boundary()" since it used to check if a word is a word, and a "_" is allowed in a variable name.
		    '/',
		    '\\',
		    '|',
		    '(',
		    ')',
		    '[',
		    ']',
		    '{',
		    '}',
		    '<',
		    '>',
		    '=',
		    '+',
		    '*',
		    '&',
		    '%',
		    '$',
		    '#',
		    '@',
		    '`',
		    '~',
		    '"',
		    "'",
		    '\u2019', // Right single quotation mark
		    '\u2018', // Left single quotation mark
		    '\u201d', // Right double quotation mark
		    '\u201c', // Left double quotation mark
		];

		// Alphabet.
		this.alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
		this.numerics = "0123456789";

		// Word boundaries that will not be joined to the previous word boundary token.
		this.excluded_word_boundary_joinings = [
			"{", "}", "[", "]", "(", ")", "<", ">", // default scopes, never remove any items from this since a lot of other files / libs depend on this.
			",", "=", // required for parsing parameters.
		]
		.concat(this.scope_separators) // always exclude default {}[]() for vide.
		.concat(excluded_word_boundary_joinings)
		this.excluded_word_boundary_joinings = this.excluded_word_boundary_joinings.reduce((accumulator, val) => { // drop duplicates.
			if (!accumulator.includes(val)) {
				accumulator.push(val);
			}
			return accumulator;
		}, []);

		// The default callback.
		this.callback = function() { return false; }

		// Init vars that should be reset before each tokenize.
		this.reset();

	}

	// Attributes that should be reset before each tokenize.
	reset() {
		this.tokens = new vhighlight.Tokens();		// use an array with tokens since some tokens need to be edited after they have been appended.
		this.added_tokens = 0;				// the currently added tokens.
		this.index = null;					// the current index in the iteration, so it may be edited in case of forward lookup.
		this.prev_char = null;				// the previous char in the iteration.
		this.next_char = null;				// the next char in the iteration.
		this.batch  = "";					// current batch.
		this.line = 0;						// current line number.
		this.is_comment = false;			// is currently a comment.
		this.is_str = false;				// is currently a string.
		this.is_regex = false;				// is currently a regex string "/hello/".
		this.is_preprocessor = false;		// is currently a preprocessor statement.
		this.is_comment_keyword = false;	// is currently a "@keyword" inside a comment.
		this.is_comment_codeblock = false;	// is currently a "`somefunc()`" codeblock inside a comment.
		this.parenth_depth = 0;				// parentheses depth "( )".
		this.bracket_depth = 0;				// bracket depth "[ ]".
		this.curly_depth = 0;				// curly brackets depth "{ }".
		// this.template_depth = 0;			// template depth "< >".
		this.next_token = null;				// the next token type, defined by the previous token such ass "class" or "extends".
		this.offset = 0;					// the offset of the previously appended tokens.

		// Performance.
		// this.get_prev_token_time = 0;
		// this.append_token_time = 0;
	}

	// Fetch the first non whitespace token going backwards from the specified index.
	// So it also tests the specified index. If the previous token data is excluded it checks one further back.
	get_prev_token(index, exclude = [" ", "\t", "\n"], exclude_comments = false) {
		// const now = Date.now();
		return this.tokens.iterate_tokens_reversed((token) => {
			if (token.index <= index) {
				if (exclude_comments && token.token === "token_comment") {
					return null;
				}
				if (!exclude.includes(token.data)) {
					return token;
				}
			}
		})
		// this.get_prev_token_time += Date.now() - now;
		// return res;
	}
	
	// Check if a string contains a word boundary character.
	str_includes_word_boundary(str) {
		for (let i = 0; i < this.word_boundaries.length; i++) {
			if (str.includes(this.word_boundaries[i])) {
				return true;
			}
		}
		return false;
	}

	// Check if a char is a whitespace or newline.
	// When the parameter is null it checks against the current batch.
	is_linebreak_whitespace_char(x = null) {
		if (x != null) {
			return x == " " || x == "\t" || x == "\n";
		} else {
			return this.batch == " " || this.batch == "\t" || this.batch == "\n";
		}
	}

	// Get the index of the closing parentheses / curly from the opening's index.
	// - This uses the code data, not the tokens.
	// - Parameter `index` should be the index of the closing ">" token.
	// - Returns "null" when it has not been found.
	get_closing_parentheses(index) {
		return this.get_closing_wrapper(index, "(", ")");
	}
	get_closing_curly(index) {
		return this.get_closing_wrapper(index, "{", "}");
	}
	get_closing_bracket(index) {
		return this.get_closing_wrapper(index, "[", "]");
	}
	get_closing_template(index) {
		return this.get_closing_wrapper(index, "<", ">");
	}
	get_closing_wrapper(index, opener, closer) {
		let depth = 0;
		let start_index = index;
		if (this.code.charAt(index) === closer) {
			depth = 1;
			start_index = index + 1;
		}
		const info_obj = {index: null};
		return this.iterate_code(info_obj, start_index, null, (char, is_str, is_comment, is_multi_line_comment, is_regex) => {
			if (!is_str && !is_comment && !is_multi_line_comment && !is_regex) {
				if (char == opener) {
					++depth;
				} else if (char == closer) {
					--depth;
					if (depth == 0) {
						return info_obj.index;
					}
				}
			}
		});
	}

	// Get the token of the opening parentheses / curly / bracket.
	// - Returns "null" when it has not been found.
	get_opening_parentheses(index) {
		return this.get_opening_wrapper(index, "(", ")");
	}
	get_opening_curly(index) {
		return this.get_opening_wrapper(index, "{", "}");
	}
	get_opening_bracket(index) {
		return this.get_opening_wrapper(index, "[", "]");
	}
	get_opening_template(index) {
		return this.get_opening_wrapper(index, "<", ">");
	}
	get_opening_wrapper = (index, opener, closer) => {
		let depth = 0;
		let start_index = index;
		if (this.code.charAt(index) === closer) {
			depth = 1;
			start_index = index - 1;
		}
		let result = null;
		this.tokens.iterate_reversed((line_tokens) => {
			if (line_tokens.length > 0) {
				line_tokens.iterate_reversed((token) => {
					if (token.offset <= start_index) {
						if (token.data == opener) {
							--depth;
							if (depth == 0) {
								result = token;
								return false;
							}
						} else if (token.data == closer) {
							++depth;
						}
					}
				})
				if (result !== null) {
					return false;
				}
			}
		})
		return result;
	}

	// Get the first non whitespace character from a given index.
	// - Returns the index of the found char.
	// - Returns "null" when the index is "null" to limit the if else statements.
	get_first_non_whitespace(index, skip_line_breaks = false) {
		if (index == null) {
			return null;
		}
		let end;
		for (end = index; end < this.code.length; end++) {
			const c = this.code.charAt(end);
			if (c != " " && c != "\t" && (skip_line_breaks || c != "\n")) {
				return end;
			}
		}
		return null;
	}

	// Get first word boundary index.
	get_first_word_boundary(index) {
		if (index == null) {
			return null;
		}
		for (let i = index; i < this.code.length; i++) {
			if (this.word_boundaries.includes(this.code.charAt(i))) {
				return i;
			}
		}
		return this.code.length;
	}

	// Is a whitespace character.
	is_whitespace(char) {
		return char == " " || char == "\t";
	}

	// Is an alphabetical character.
	is_alphabetical(char) {
		return this.alphabet.includes(char);
	}

	// Is a numeric character.
	is_numerical(char) {
		return this.numerics.includes(char);
	}

	// Check if an a character is escaped by index.
	is_escaped(index, str = null) {
		if (str == null) {
			if (this.code.charAt(index - 1) == "\\") {
				if (this.code.charAt(index - 2) == "\\") {
					return this.is_escaped(index - 2);
				}
				return true;
			}
		} else {
			if (str.charAt(index - 1) == "\\") {
				if (str.charAt(index - 2) == "\\") {
					return this.is_escaped(index - 2, str);
				}
				return true;
			}
		}
		return false;
	}

	// Append lookup token.
	// This function must be used when appending new tokens by a forward lookup.
	// Since every line break should be a seperate line break token for VIDE.
	append_forward_lookup_batch(token, data) {
		if (this.batch.length > 0) {
			this.append_batch();
		}
		this.batch = "";
		for (let i = 0; i < data.length; i++) {
			const c = data.charAt(i);
			if (c == "\n" && !this.is_escaped(i, data)) {
				this.append_batch(token);
				this.batch = "\n";
				this.append_batch("token_line");
				++this.line;
			} else {
				this.batch += c;
			}
		}
		this.append_batch(token);
	}

	// Resume the iteration at a certain index.
	// So do not assign directly to this.index but use this function instead.
	// Otherwise the line numbers may be counted incorrectly.
	resume_on_index(index) {
		
		// Increment line count.
		// Became obsolete by "append_forward_lookup_batch()".
		// const info_obj = {index: null, prev_char: null, next_char: null};
		// this.iterate_code(info_obj, this.index, index + 1, (char, is_str, is_comment, is_multi_line_comment, is_regex, is_escaped) => {
		// 	if (!is_escaped && char == "\n") {
		// 		++this.line;
		// 	}
		// })

		// Set index.
		this.index = index;
	}

	// Concat tokens to the end of the current tokens.
	concat_tokens(tokens) {
		const start_line = this.line;
		const start_offset = this.offset;
		tokens.iterate_tokens((token) => {
			token.line += start_line;
			if (token.is_line_break) {
				++this.line;
			}
			token.offset += start_offset;
			this.offset += token.data.length;
			token.index = this.added_tokens;
			++this.added_tokens;
			if (this.tokens[token.line] === undefined) {
				this.tokens[token.line] = [token];
			} else {
				this.tokens[token.line].push(token);
			}
		})
	}

	// Append a token.
	// Do not join null tokens since that would clash with the prev batch function lookup and comparing it with data.
	// For example when exlcuding whitespace in the prev token, it can still contain whitespace.
	append_token(token = null, extended = {}) {
		// const now = Date.now();

		// Create default object.
		const obj = extended;
		obj.data = this.batch;
		obj.index = this.added_tokens;
		obj.line = this.line;
		obj.offset = this.offset;
		if (token != null) {
			obj.token = token;
		}

		// Set is word boundary.
		if (
			(extended.is_word_boundary === true) ||
			(
				this.batch.length === 1 && 
				(token === null || token === "token_operator") && // token is null or is token operator in case the language class appends the token as token_operator without the is_word_boundary param.
				this.word_boundaries.includes(this.batch)
			)
		) {
			obj.is_word_boundary = true;
		}

		// Set inside comment, string, regex or preprocessor.
		if (token === "token_line") {
			if (this.is_comment) {
				obj.is_comment = true;
			} else if (this.is_str) {
				obj.is_str = true;
			} else if (this.is_regex) {
				obj.is_regex = true;
			} else if (this.is_preprocessor) {
				obj.is_preprocessor = true;
			}
		}

		// Update offset.
		this.offset += this.batch.length;

		// Concat to previous token.
		// Do this after the update offset.
		// Exclude certain scope characters
		if (token === null && obj.is_word_boundary === true) {
			const line_tokens = this.tokens[this.line];
			if (line_tokens !== undefined) {
				const last = line_tokens[line_tokens.length - 1];
				if (
					last !== undefined &&
					last.is_word_boundary === true && 
					(last.data.length > 1 || !this.excluded_word_boundary_joinings.includes(last.data)) &&
					!this.excluded_word_boundary_joinings.includes(obj.data)
				) {
					last.data += obj.data;
					return null; // STOP.
				}
			}
		}

		// Increment added tokens after concat to previous tokens.
		++this.added_tokens;

		// Set is line break.
		if (token === "token_line") {
			obj.is_line_break = true;
		}

		// Append token.
		if (this.tokens[this.line] === undefined) {
			this.tokens[this.line] = [obj];
		} else {
			this.tokens[this.line].push(obj);
		}

		// Performance.
		// this.append_time += Date.now() - now;
	}
	
	// Append batch.
	// - Batches should only be a single word, unless it is a string or comment
	// - When the token param is false, no spans will be added, when the token ...
	//   Is not null the assigned token will be added as span. And when the token param ...
	//   Is null the batch will be checked against keywords, numerics etc.
	append_batch(token = null, extended = {}) {
		if (this.batch.length == 0) {
			return ;
		}
		
		// Do not parse tokens.
		if (token == false) {
			this.append_token(null, extended);
		}
		
		// By assigned token.
		else if (token != null) {
			this.append_token(token, extended);
		}
		
		// By next token.
		// Skip whitespace.
		else if (this.next_token != null) {

			// Skip next token but do not reset on whitespace batch.
			if (this.is_linebreak_whitespace_char()) {
				this.append_token(null, extended);
			}

			// Reset next token when the batch is a word boundary for example in "struct { ... } X".
			else if (extended.is_word_boundary === true || this.word_boundaries.includes(this.batch)) {
				this.append_token(null, {is_word_boundary: true});
				this.next_token = null;
			}

			// Reset next token when the batch is a keyword for example in "constexpr inline X".
			else if (this.keywords.includes(this.batch)) {
				this.append_token("token_keyword");
				this.next_token = null;
			}

			// Append as next token.
			else {
				this.append_token(this.next_token, extended);
				this.next_token = null;
			}
		}
		
		// Parse batch.
		else {
			
			// Keyword.
			if (this.keywords.includes(this.batch)) {
				
				// Set class depth.
				if (this.type_def_keywords.includes(this.batch)) {
					this.next_token = "token_type_def"
					this.class_depth = this.curly_depth + 1; // for the js parser, since js does not allow class definitions inside a class.
				}
				
				// Next tokens.
				else if (this.type_keywords.includes(this.batch)) {
					this.next_token = "token_type";
				}
				
				// Append.
				this.append_token("token_keyword");
			}
			
			// Operator.
			else if (this.operators.includes(this.batch)) {
				this.append_token("token_operator", {is_word_boundary: true});
			}
			
			// Numeric.
			else if (this.allow_numerics && /^-?\d+(\.\d+)?$/.test(this.batch)) {
				this.append_token("token_numeric");
			}
			
			// Just a code batch without highlighting.
			else {
				this.append_token(null, extended);
			}
			
		}
		
		// Reset batch.
		this.batch = "";
		
	}

	// Iterate code function.
	// The callback can take params (index, char, is_str, is_comment, is_multi_line_comment, is_regex, is_escaped).
	// When the callback returns a non null value the iteration will stop and that value will be returned.
	iterate_code(info_obj = {index: 0, prev_char: null, next_char: null}, start = null, end = null, callback) {
		//
		// DO NOT ASSIGN ANY "this" ATTRIBUTES IN THIS FUNC SINCE IT IS ALSO CALLED BY OTHER FUNCS THAN "tokenize()".
		//
		
		// Default start and end.
		if (start == null) {
			start = 0;
		}
		if (end == null) {
			end = this.code.length;
		}

		// Vars.
		let is_comment = false;
		let is_multi_line_comment = false;
		let string_char = null;
		let is_regex = false; 					// only used for langauges that can define a regex as /hello/ such as js.
		let is_preprocessor = false; 			// only used for languages that have preprocessor statements such as cpp.
		let prev_non_whitespace_char = null; 	// the previous non whitespace character, EXCLUDING newlines, used to check at start of line.

		// Check if the first chars of the main string equals a substring, optionally with start index.
		const eq_first = (substr, start_index = 0) => {
		    if (start_index + substr.length > this.code.length) {
		        return false;
		    }
		    const end = start_index + substr.length;
		    let y = 0;
		    for (let x = start_index; x < end; x++) {
		        if (this.code.charAt(x) != substr.charAt(y)) {
		            return false;
		        }
		        ++y;
		    }
		    return true;
		}

		// Iterate.
		for (info_obj.index = start; info_obj.index < end; info_obj.index++) {
			//
			// DO NOT ASSIGN ANY "this" ATTRIBUTES IN THIS FUNC SINCE IT IS ALSO CALLED BY OTHER FUNCS THAN "tokenize()".
			//

			// Get char.
			const char = this.code.charAt(info_obj.index);

			// Set next and previous.
			info_obj.prev_char = this.code.charAt(info_obj.index - 1);
			info_obj.next_char = this.code.charAt(info_obj.index + 1);

			// Set prev non whitespace char.
			if (info_obj.prev_char != " " && info_obj.prev_char != "\t") {
				prev_non_whitespace_char = info_obj.prev_char;
			}

			// Set is escaped.
			const is_escaped = this.is_escaped(info_obj.index);

			// Start of preprocessors.
			if (
				this.allow_preprocessors && 
				!is_preprocessor && 
				(prev_non_whitespace_char == "\n" || info_obj.index === 0) && 
				char == "#"
			) {
				is_preprocessor = true;
				const res = callback(char, false, is_comment, is_multi_line_comment, is_regex, is_escaped, is_preprocessor);
				if (res != null) { return res; }
				continue;
			}

			// End of preprocessors.
			else if (
				is_preprocessor && 
				(char == "\n" && prev_non_whitespace_char != "\\") 
			) {
				is_preprocessor = false;
				const res = callback(char, false, is_comment, is_multi_line_comment, is_regex, is_escaped, is_preprocessor);
				if (res != null) { return res; }
				continue;
			}
			
			// Open strings.
			if (
				this.allow_strings &&
				!is_escaped &&
				!is_comment &&
				!is_multi_line_comment &&
				!is_regex &&
				string_char == null &&
				(
					char == '"' || 
					char == "'" || 
					char == '`'
				)
			) {
				string_char = char;
				const res = callback(char, true, is_comment, is_multi_line_comment, is_regex, is_escaped, is_preprocessor);
				if (res != null) { return res; }
				continue;
			}

			// Close strings.
			else if (
				!is_escaped &&
				string_char != null &&
				char == string_char
			) {
				string_char = null;
				const res = callback(char, true, is_comment, is_multi_line_comment, is_regex, is_escaped, is_preprocessor);
				if (res != null) { return res; }
				continue;
			}

			// Inside strings.
			else if (string_char != null) {
				const res = callback(char, true, is_comment, is_multi_line_comment, is_regex, is_escaped, is_preprocessor);
				if (res != null) { return res; }
				continue;
			}
			
			// Open comments.
			if (
				!is_escaped &&
				!is_comment &&
				!is_multi_line_comment &&
				!is_regex
				// && string_char == null
			) {
				
				// Single line comments.
				const comment_start = this.single_line_comment_start;
				if (comment_start !== false && comment_start.length === 1 && char === comment_start) {
					is_comment = true;
					const res = callback(char, false, is_comment, is_multi_line_comment, is_regex, is_escaped, is_preprocessor);
					if (res != null) { return res; }
					continue;
				}
				// else if (comment_start.length == 2 && char + info_obj.next_char == comment_start) {
				else if (comment_start !== false && comment_start.length !== 1 && eq_first(comment_start, info_obj.index)) {
					is_comment = true;
					const res = callback(char, false, is_comment, is_multi_line_comment, is_regex, is_escaped, is_preprocessor);
					if (res != null) { return res; }
					continue;
				}
				
				// Multi line comments.
				const mcomment_start = this.multi_line_comment_start;
				if (mcomment_start === false) {
					// skip but do not use continue since the "No string or comment" should be checked.
				}
				else if (mcomment_start.length !== 1 && eq_first(mcomment_start, info_obj.index)) {
					is_multi_line_comment = true;
					const res = callback(char, false, is_comment, is_multi_line_comment, is_regex, is_escaped, is_preprocessor);
					if (res != null) { return res; }
					continue;
				}
				
			}
			
			// End single line comments.
			else if (
				is_comment &&
				!is_escaped && char == "\n"
			) {
				is_comment = false;
				const res = callback(char, false, is_comment, is_multi_line_comment, is_regex, is_escaped, is_preprocessor);
				if (res != null) { return res; }
				continue;
			}
			
			// End multi line comments.
			else if (
				is_multi_line_comment &&
				!is_escaped
			) {
				const mcomment_end = this.multi_line_comment_end;
				if (
					(mcomment_end.length == 2 && info_obj.prev_char + char == mcomment_end) ||
					(mcomment_end.length > 2 && this.code.substr(info_obj.index - mcomment_end.length, mcomment_end.length) == mcomment_end)
				) {
					is_multi_line_comment = false;
					const res = callback(char, false, is_comment, true, is_regex, is_escaped, is_preprocessor);
					if (res != null) { return res; }
					continue;
				}
			}
			
			// Inside comments.
			else if (is_comment || is_multi_line_comment) {
				const res = callback(char, false, is_comment, is_multi_line_comment, is_regex, is_escaped, is_preprocessor);
				if (res != null) { return res; }
				continue;
			}
			
			// Statements should reuse the "if" not "else if" after the start of the comment check.
			// Since that does not always match in the first if statement.
			// End of comment checks can still use "else if".
			
			// Check the start of a regex definition "/hello/", must check the previous char.
			if (this.allow_slash_regexes && !is_escaped && !is_regex && char == "/") {
				let prev = null;
				for (let p = info_obj.index - 1; p >= 0; p--) {
					const c = this.code.charAt(p);
					if (c != " " && c != "\t") {
						prev = c;
						break;
					}
				}
				if (
					prev != null &&
					(
						prev == "\n" || prev == "," || prev == "(" ||
						prev == "[" || prev == "{" || prev == ":" ||
						this.operators.includes(prev)
					)
				) {
					is_regex = true;
					const res = callback(char, false, is_comment, is_multi_line_comment, is_regex, is_escaped, is_preprocessor);
					if (res != null) { return res; }
					continue;
				}
			}
			
			// Inside / end of regex.
			else if (is_regex) {
				if (char == '/' && !is_escaped) {
					is_regex = false;
				}
				const res = callback(char, false, is_comment, is_multi_line_comment, true, is_escaped, is_preprocessor); // always use true for is_regex to make sure the closing / is still treated as a regex.
				if (res != null) { return res; }
				continue;
			}
			
			// Statements should reuse the "if" not "else if" after the start of the regex check.
			// Since that does not always match in the first if statement.
			// End of regex checks can still use "else if".
			
			// No string, comment or regex.
			const res = callback(char, false, is_comment, is_multi_line_comment, is_regex, is_escaped, is_preprocessor);
			if (res != null) { return res; }
			
		}
		return null;
	};

	// Start the tokenizing.
	// - The comment, strings and regexes are already handled so the callback is only called on code characters.
	// - The "this.callback" should return "true" to indicate the character has been appended to the batch, and "false" if not.
	// - Each word boundary seperates a token. The callback is required to respect this, since this ignoring this behaviour may cause undefined behaviour.
	// - When performing a forward lookup and editing this.index afterwards, dont forget to incrrement the this.line var on line breaks.
	tokenize(return_tokens = false, stop_callback = undefined) {

		// Reset.
		this.reset();

		// Check seperate batch append token comment codeblock for the first " * " in languages with /* */ multi line comment style
		const append_comment_codeblock_batch = () => {
			if (this.multi_line_comment_start === "/*") {
				let i, separate = false;
				for (i = 0; i < this.batch.length; i++) {
					const c = this.batch.charAt(i);
					if (c === "*") {
						separate = true;
						const next = this.batch.charAt(i + 1);
						if (next === " " || next === "\t") {
							i += 2;
						}
						break;
					}
					else if (c === " " || c === "\t") {
						continue;
					}
					else {
						break;
					}
				}
				if (separate) {
					const after = this.batch.substr(i);
					this.batch = this.batch.substr(0, i);
					this.append_batch("token_comment", {is_comment: true});
					this.batch = after;
				}
			}
			this.append_batch("token_comment_codeblock", {is_comment: true});
		}

		// Append previous batch when switching comment, string, regex, to something else.
		const auto_append_batch_switch = (default_append = true) => {
			if (this.is_comment_keyword) {
				this.append_batch("token_comment_keyword", {is_comment: true});
			} else if (this.is_comment_codeblock) {
				append_comment_codeblock_batch();
			} else if (this.is_comment) {
				this.append_batch("token_comment", {is_comment: true});
			} else if (this.is_str) {
				this.append_batch("token_string");
			} else if (this.is_regex) {
				this.append_batch("token_string");
			} else if (this.is_preprocessor) {
				this.append_batch("token_preprocessor");
			} else {
				if (default_append) {
					this.append_batch();
				} else {
					return false;
				}
			}
			return true;
		}

		// Iterate code.
		const stopped = this.iterate_code(this, null, null, (char, local_is_str, local_is_comment, is_multi_line_comment, local_is_regex, is_escaped, is_preprocessor) => {

			// New line.
			if (!is_escaped && char == "\n") {

				// Append previous batch, but snce newlines may be present in regexes, strings and comments, handle them correctly.
				auto_append_batch_switch();
				
				// Append line token.
				this.batch += char;
				this.append_batch("token_line");

				// Terminate preprocessor, comments, and strings when active.
				// This must happen after appending the line break batch since `append_token()` still uses the comment string etc flags for the line token.
				if (!local_is_str) {
					this.is_str = false;
				}
				if (!local_is_comment && !is_multi_line_comment) {
					this.is_comment = false;
					this.is_comment_keyword = false;
					// this.is_comment_codeblock = false; // may be multi line.
				}
				if (!local_is_regex) {
					this.is_regex = false;
				}
				if (this.is_preprocessor && !is_preprocessor) {
					this.is_preprocessor = false;
					this.is_str = false; // also disable string in case of an unterminated < inside the #include preprocessor, since the flag is turned on inside the is preprocessor check.
				}

				// Check if a stop callback is defined for the partial tokenize.
				if (stop_callback !== undefined) {
					const stop = stop_callback(this.line, this.tokens[this.line]);
					if (stop) {
						return true;
					}
				}

				// Increment the line.
				++this.line;
			}
			
			// Start of and during comment.
			else if (local_is_comment || is_multi_line_comment) {

				// Start of comment.
				if (!this.is_comment) {
					auto_append_batch_switch();
					this.is_comment = true;
					this.batch += char;
				}

				// During comment.
				else {

					// End of comment codeblock.
					if (this.is_comment_codeblock && char === "`" && this.next_char !== "`") {
						this.batch += char;
						auto_append_batch_switch();
						this.is_comment_codeblock = false;
					}

					// Start of comment codeblock.
					else if (this.allow_comment_codeblock && !this.is_comment_codeblock && char === "`") {
						auto_append_batch_switch();
						this.is_comment_codeblock = true;
						this.batch += char;
					}

					// Check for @ keywords.
					else if (this.allow_comment_keyword && !this.is_comment_codeblock && char === "@" && !is_escaped) {
						auto_append_batch_switch();
						this.is_comment_keyword = true;
						this.batch += char;
					}

					// Check for end of @ keywords.
					else if (this.is_comment_keyword && this.word_boundaries.includes(char)) {
						auto_append_batch_switch();
						this.is_comment_keyword = false;	
						this.batch += char;
					}

					// Append to batch.
					else {
						this.batch += char;
					}
				}
			}
			
			// Start of and during string.
			else if (local_is_str) {
				if (!this.is_str) {

					// Check for special prefix chars.
					if (auto_append_batch_switch(false) === false) {
						if (this.special_string_prefixes.includes(this.batch)) {
							this.append_batch("token_keyword");
						} else {
							this.append_batch();
						}
					}
					this.is_str = true;
				}
				this.batch += char;
			}
			
			// Start of and during regex.
			else if (local_is_regex) {
				if (!this.is_regex) {
					auto_append_batch_switch();
					this.is_regex = true;
				}
				this.batch += char;
			}

			// Start of and during preprocessor.
			else if (is_preprocessor) {

				// Append previous batch.
				if (!this.is_preprocessor) {
					auto_append_batch_switch();
					this.is_preprocessor = true;
				}

				// Encountered a < > inside a preprocessor.
				if (char == "<" && this.batch.replaceAll(" ", "").replaceAll("\t", "") == "#include") {
					auto_append_batch_switch();
					this.is_str = true;
					this.batch += char;
				} else if (char == ">" && this.is_str) {
					this.batch += char;
					auto_append_batch_switch();
					this.is_str = false;
				}

				// Append to batch when no < > match.
				else {
					this.batch += char;
				}

			}
			
			// Is code.
			else {

				// Bracket depth.
				if (char == "[") {
					++this.bracket_depth;
				} else if (char == "]") {
					--this.bracket_depth;
				}

				// Curly depth.
				if (char == "{") {
					++this.curly_depth;
				} else if (char == "}") {
					--this.curly_depth;
				}
				
				// Parentheses depth.
				if (char == "(") {
					++this.parenth_depth;
				} else if (char == ")") {
					--this.parenth_depth;
				}

				// Template depth.
				// Cant be used since "x < y" is allowed etc.
				// if (char == "<") {
				// 	++this.template_depth;
				// } else if (char == ">") {
				// 	--this.template_depth;
				// }
				
				// End of comment.
				// Should proceed with the callback since the next character needs to be parsed.
				if (this.is_comment_keyword) {
					this.append_batch("token_comment_keyword", {is_comment: true});
					this.is_comment_keyword = false;
				}
				else if (this.is_comment_codeblock) {
					append_comment_codeblock_batch();
					this.is_comment_codeblock = false;
				}
				else if (this.is_comment) {
					this.append_batch("token_comment", {is_comment: true});
					this.is_comment = false;
					this.is_comment_keyword = false;
					this.is_comment_codeblock = false;
				}
				
				// End of string.
				// Should proceed with the callback since the next character needs to be parsed.
				else if (this.is_str) {
					this.append_batch("token_string");
					this.is_str = false;
				}
				
				// End of regex.
				// Should proceed with the callback since the next character needs to be parsed.
				else if (this.is_regex) {
					this.append_batch("token_string");
					this.is_regex = false;
				}

				// End of preprocessor.
				// Should proceed with the callback since the next character needs to be parsed.
				else if (this.is_preprocessor) {
					this.append_batch("token_preprocessor");
					this.is_preprocessor = false;
				}

				//
				// Stop the else if loop after here since the end of string / comment should be parsed as a new char.
				// Also `auto_append_batch()` is no longer required after here.
				//

				// Parse decorators.
				if (this.allow_decorators && char == "@") {

					// Append previous batch.
					this.append_batch();

					// Do a forward lookup to find the first word boundary.
					let batch = "@";
					for (let i = this.index + 1; i < this.code.length; i++) {
						const c = this.code.charAt(i);
						if (this.word_boundaries.includes(c)) {
							break;
						}
						batch += c;
					}

					// When there is at least one char used in the decorator then parse it as a decorator.
					if (batch.length > 1) {
						this.batch = batch;
						this.append_batch("token_type", {is_decorator: true, parameters: []});
						this.index += batch.length - 1;
						return null;
					}

					// fallthrough.
				}

				// Highlight parameters.
				// @todo check if there are any post keywords between the ")" and "{" for c like langauges. Assign them to the type def token as "post_tags".
				// @todo check if there are any pre keywords between before the "funcname(", ofc exclude "function" etc, cant rely on the type def tokens. Assign them to the type def token as "tags".
				else if (this.allow_parameters && char == ")") {

					// Append batch by word boundary.
					this.append_batch();

					// Get the tokens inside the parentheses at the correct pareth depth and skip all word boundaries except ",".
					let type_token, parenth_depth = 0, curly_depth = 0, bracket_depth = 0, parenth_tokens = [];
					let is_assignment_parameters = false, first_token = true;
					this.tokens.iterate_tokens_reversed((token) => {
						if (token.token === undefined && token.data.length === 1) {
							if (token.data === ")") {
								++parenth_depth;
							} else if (token.data === "(") {
								if (parenth_depth === 0) {
									type_token = this.get_prev_token(token.index - 1, [" ", "\t", "\n", "=", ":"]);
									return false;
								}
								--parenth_depth;
							} else if (token.data === "}") {
								++curly_depth;
							} else if (token.data === "{") {
								--curly_depth;
							} else if (token.data === "]") {
								++bracket_depth;
							} else if (token.data === "[") {
								--bracket_depth;
							}

						}
						if (first_token && (token.data.length > 0 || (token.data != " " && token.data != "\t" && token.data != "\n"))) {
							is_assignment_parameters = token.data.length === 1 && token.data == "{";
							first_token = false;
						}
						token.at_correct_depth = parenth_depth === 0 && curly_depth === 0 && bracket_depth === 0;
						parenth_tokens.push(token);
					});

					// Check if the preceding token is a type def.
					let is_type_def = type_token.token === "token_type_def";
					const is_type = type_token.token === "token_type";
					const is_decorator = is_type && type_token.is_decorator === true;
					let is_anonymous_type_def = false;

					// When the preceding token is not a type def and not a token type and the language is js then check if there is a => after the ).
					if (!is_type && !is_type_def) {
						for (let i = this.index + 1; i < this.code.length; i++) {
							const c = this.code.charAt(i);
							if (c == " " || c == "\t" || c == "\n") {
								continue;
							} else if (c === "=" && this.code.charAt(i+1) === ">") {
								is_anonymous_type_def = true;
								is_type_def = true;
							} else {
								break;
							}
						}
					}

					// Stop when the preceding is not a token_type or token_type_def.
					if (!is_anonymous_type_def && !is_type_def && !is_type) {

						// Delete the custom attribute.
						parenth_tokens.iterate((token) => {
							delete token.at_correct_depth;
						})
						
						// Append word boundary to tokens.
						this.batch += char;
						this.append_batch(null, {is_word_boundary: true}); // do not use "false" as parameter "token" since the word boundary may be an operator.

						// Stop.
						return null;
					}

					// Create the array with parameters and assign the token_param to the tokens.
					let mode = 1; // 1 for key 2 for value.
					const params = [];

					// Initialize a parameter object.
					const init_param = (param) => {
						return {
							name: null, 	// the parameter name.
							index: null, 	// the parameter index.
							value: null, 	// the default value.
							tags: [], 		// the type tags.
							type: null, 	// the type.
						};
					}

					// Append a parameter object.
					const append_param = (param) => {
						if (param !== undefined) {
							if (param.value != null) {
								param.value = param.value.trim();
							}
							param.index = params.length;
							params.push(param);
						};
					}

					// Check if the next parenth token is a assignment operator.
					// Returns `null` when the there is no next assignment operator directly after the provided index.
					const get_next_assignment_operator = (parenth_index) => {
						let next_i = parenth_index - 1, next;
						while ((next = parenth_tokens[next_i]) != null) {
							if (next.data.length === 1 && next.data === "=") {
								return next;
								return true;
							} else if (next.data.length !== 1 || (next.data !== " " && next.data !== "\t" && next.data === "\n")) {
								return null;
							}
							--next_i;
						}
						return null;
					}

					// Iterate the parenth tokens.
					let param;
					let i = parenth_tokens.length;
					parenth_tokens.iterate_reversed((token) => {
						--i;
						const at_correct_depth = token.at_correct_depth;
						delete token.at_correct_depth;

						// Set key and value flags.
						if (at_correct_depth && token.is_word_boundary === true && token.data === ",") {
							append_param(param);
							param = init_param();
							mode = 1;
						}
						else if (at_correct_depth && token.is_word_boundary === true && token.data === "=") {
							mode = 2;
						}

						// When key.
						else if (mode === 1) {

							// Init param.
							if (param === undefined) {
								param = init_param();
							}

							// Skip tokens.
							if (
								at_correct_depth === false ||
								token.is_word_boundary === true ||
								token.is_line_break === true
							) {
								return null;
							}

							// Assign to parameter.
							if (token.token === "token_keyword") {
								param.tags.push(token.data.trim());
							} else if (token.token === "token_type") {
								param.type = token.data.trim();
							} else {

								// On a type definition always assign to parameter.
								// Check for token undefined since decorators should still assign the param.value when it is not an assignment operator.
								if (is_type_def && token.token === undefined) {
									param.name = token.data.trim();
									token.token = "token_parameter";
								}

								// When the token is a type there must be a "=" after this tokens.
								// Check for token undefined since decorators should still assign the param.value when it is not an assignment operator.
								else if (!is_type_def) {
									const next = get_next_assignment_operator(i);
									if (next !== null && token.token === undefined) {
										param.name = token.data.trim();
										token.token = "token_parameter";
									} else if (next === null && is_decorator) {
										if (param.value === null) {
											param.value = token.data;
										} else {
											param.value += token.data;
										}
									}
								}
							}
						}

						// When value.
						else if (mode === 2 && (is_type_def || is_decorator)) {
							if (param.value === null) {
								param.value = token.data;
							} else {
								param.value += token.data;
							}
						}
					})

					// Add last param.
					append_param(param);

					// Assign params to the type def token.
					if ((is_type_def || is_decorator) && !is_anonymous_type_def) {
						type_token.parameters = params;
						if (is_assignment_parameters === true) {
							type_token.is_assignment_parameters = true;
						}
					}

					// Append word boundary to tokens.
					this.batch += char;
					this.append_batch(null, {is_word_boundary: true}); // do not use "false" as parameter "token" since the word boundary may be an operator.
					return null
				}

				// Call the handler.
				// And append the character when not already appended by the handler.
				// Always use if so previous if statements can use a fallthrough.
				if (!this.callback(char, is_escaped, this.is_preprocessor)) {

					// Is word boundary.
					// Append old batch and word boundary char.
					if (this.word_boundaries.includes(char)) {
						this.append_batch();
						this.batch += char;
						this.append_batch(null, {is_word_boundary: true}); // do not use "false" as parameter "token" since the word boundary may be an operator.
					}
					
					// Add to batch till a word boundary is reached.
					else {
						this.batch += char;
					}

				}
			}
			return null;
		});

		// Append last batch.
		auto_append_batch_switch();

		// When the last line has no content then append an enmpty line token array since there actually is a line there.
		// But only when no stop callback has been defined.
		const last_line = this.tokens[this.tokens.length - 1];
		if (
			stop_callback == null &&
			(last_line === undefined || (last_line.length > 0 && last_line[last_line.length - 1].is_line_break))
		) {
			this.tokens.push([]);
		}

		// console.log(`append_token time: ${this.append_token_time}ms.`);
		// console.log(`get_prev_token time: ${this.get_prev_token_time}ms.`);

		// Return tokens.
		if (return_tokens) {
			return this.tokens;
		}

		// Build html.
		else {
			return this.build_tokens();
		}
	}

	// Partial tokenize.
	/*	@docs: {
		@title Partial tokenize
		@description: Partially tokenize text based on edited lines.
		@parameter: {
			@name: edits_start
			@type: string
			@description: The start line from where the edits took place.
		}
		@parameter: {
			@name: edits_end
			@type: string
			@description: The end line till where the edits took place.
		}
		@parameter: {
			@name: line_additions.
			@type: string
			@description: The number of line additions (positive) or the number of line deletions (negative).
		}
		@parameter: {
			@name: tokens
			@type: array[object]
			@description: The old tokens.
		}
	} */
	partial_tokenize({
		edits_start = null,
		edits_end = null,
		line_additions = 0,
		tokens = [],
	}) {

		// Args.
		if (line_additions === undefined || isNaN(line_additions)) {
			line_additions = 0;
		}

		// Vars.
		let scope_start = 0; 		// the line where the scope around the new edits starts.
		let scope_start_offset = 0; // the index offset of the scope start from the new code.
		let scope_end = null; 		// the line where the scope around the new edits ends.
		let scope_end_offset = 0;   // the index offset of the scope end from the new code.
		let now;

		// ---------------------------------------------------------
		// Find the scope start.
		// now = Date.now();

		// console.log("code:",this.code);
		// console.log("edits_start:",edits_start);
		// console.log("edits_end:",edits_end);

		// Iterate backwards to find the scope start line.
		// Do not stop if another string, comment, regex or preprocessor has just ended on the line that the start scope has been detected.
		if (edits_start != 0) {
			tokens.iterate_reversed(0, edits_start + 1, (line_tokens) => {

				// Skip on empty line tokens.
				if (line_tokens.length === 0) {
					return null;
				}

				// Vars.
				let found_separator = null;

				// Check if the line contains a scope separator.
				line_tokens.iterate_reversed((token) => {
					if (
						(token.token === undefined || token.token === "token_operator") &&
						token.data.length === 1 &&
						this.scope_separators.includes(token.data)
					) {
						found_separator = token.line;
						return true;
					}	
				})

				// Do not stop when the first token is a comment, string etc because it may resume on the next line.
				const first_token = line_tokens[0];
				if (
					found_separator !== null &&
					first_token.token !== "token_comment" &&
					first_token.token !== "token_string" &&
					first_token.token !== "token_regex" &&
					first_token.token !== "token_preprocessor"
				) {
					scope_start = first_token.line;
					scope_start_offset = first_token.offset;
					return true;
				}
			})
		}
		
		// console.log("scope_start_offset:",scope_start_offset);
		// console.log("scope_start:",scope_start);
		// console.log("Find the scope start:", Date.now() - now, "ms.");

		// ---------------------------------------------------------
		// Start the tokenizer with a stop callback
		// now = Date.now();

		// Chech if the line tokens of two lines match for the stop callback.
		const match_lines = (x, y) => {
			if (x.length !== y.length) {
				return false;
			}
			if (x.length <= 1) { // prevent line break lines.
				return false;
			}
			for (let i = 0; i < x.length; i++) {
				const x_token = x[i];
				const y_token = y[i];
				if (
					x_token.token !== y_token.token ||
					x_token.data !== y_token.data 
				) {
					return false;
				}
			}
			return true;
		}

		// The stop callback to check if the just tokenized line is the same as the original line.
		// This works correctly when first typing an unfinished string etc and then later terminating it.
		let insert_start_line = scope_start;
		let insert_end_line = null;
		const stop_callback = (line, line_tokens) => {
			const og_line = line + scope_start + line_additions;
			if (line + scope_start > edits_end && match_lines(tokens[og_line], line_tokens)) {
				insert_end_line = og_line;
				// console.log("MATCH:",line)
				return true;
			}
			return false;
		};

		// Tokenize.
		this.code = this.code.substr(scope_start_offset, this.code.length - scope_start_offset);
		const insert_tokens = this.tokenize(true, stop_callback);

		// console.log("SCOPE:", this.code);
		// console.log("Tokenized lines:",insert_tokens.length);
		// console.log("insert_tokens:",insert_tokens)
		// console.log("Highlight the edits:", Date.now() - now, "ms.");

		// ---------------------------------------------------------
		// Insert tokens
		// now = Date.now();

		// console.log("insert_start_line:",insert_start_line);
		// console.log("insert_end_line:",insert_end_line);
		// console.log("line_additions:",line_additions);

		// Insert tokens into the current tokens from start line till end line.
		// So the new tokens will old start till end lines will be removed and the new tokens will be inserted in its place.
		// The start line will be removed, and the end line will be removed as well.
		let combined_tokens = new vhighlight.Tokens();
		let insert = true;
		let line_count = 0, token_index = 0, offset = 0;;
		for (let line = 0; line < tokens.length; line++) {
			if (insert && line == insert_start_line) {
				insert = false;
				insert_tokens.iterate((line_tokens) => {
					line_tokens.iterate((token) => {
						token.line = line_count;
						token.index = token_index;
						token.offset = offset;
						offset += token.data.length;
						++token_index;
					});
					++line_count;
					combined_tokens.push(line_tokens);
				})
			}
			else if (line < insert_start_line || (insert_end_line !== null && line > insert_end_line)) {
				const line_tokens = tokens[line];
				line_tokens.iterate((token) => {
					token.line = line_count;
					token.index = token_index;
					token.offset = offset;
					offset += token.data.length;
					++token_index;
				});
				++line_count;
				combined_tokens.push(line_tokens);
			}
		}
		
		// When the last line has no content then append an enmpty line token array since there actually is a line there.
		const last_line = combined_tokens[combined_tokens.length - 1];
		if (last_line === undefined || (last_line.length > 0 && last_line[last_line.length - 1].is_line_break)) {
			combined_tokens.push([]);
		}

		// console.log("line_count:",line_count);
		// console.log("combined_tokens:",combined_tokens);
		// console.log("Combine the tokens:", Date.now() - now, "ms.");

		// Handler.
		return combined_tokens;
	}

	// Build the html from tokens.
	build_tokens(reformat = true) {

		// Vars.
		let html = "";
		
		// Iterate an array with token objects.
		this.tokens.iterate((line_tokens) => {
			line_tokens.iterate((token) => {
				if (token.token === undefined) {
					if (reformat) {
						html += token.data.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
					} else {
						html += token.data;
					}
				} else {
					if (reformat) {
						html += `<span class='${token.token}'>${token.data.replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</span>`
					} else {
						html += `<span class='${token.token}'>${token.data}</span>`
					}
					
				}
			})
		})
		
		// Handler.
		return html;
	}
}
