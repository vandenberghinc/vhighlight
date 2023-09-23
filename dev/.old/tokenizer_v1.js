/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// The tokens class.
vhighlight.Tokens = class Tokens extends Array {

	// Constructor.
	constructor() {
		super();
	}

	// Iterate.
	iterate(start, end, handler) {
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

	// Iterate reversed.
	iterate_reversed(start, end, handler) {
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
// @todo highlight "@\\s+" patterns inside comments, but do not highlight escaped @ chars, but do create a "allow_at" parameter. Dont forget to assign the comment id to these inserted tokens though.
// @todo highlight "@\\s+" patterns outside comments as token_type.
// @todo highlight `` inside comments with a codeblock background in every language.  Dont forget to assign the comment id to these inserted tokens though.
// @todo when the last line is a comment and there is no \n at the end of the section then the section is not recognized as a comment.
// @todo preprocessor after comment is highlighted as comment.
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
		// Attributes for partial tokenizing.
		scope_seperators = [
			";", 
			"{", 
			"}", 
		],
		allow_string_scope_seperator = false,
		allow_comment_scope_seperator = false,
		allow_regex_scope_seperator = false,
		allow_preprocessor_scope_seperator = false,
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
		this.scope_seperators = scope_seperators;							// scope seperators for partial tokenize.
		this.allow_string_scope_seperator = allow_string_scope_seperator;				// allow strings to seperate scopes for partial tokenize.
		this.allow_comment_scope_seperator = allow_comment_scope_seperator;				// allow comments to seperate scopes for partial tokenize.
		this.allow_regex_scope_seperator = allow_regex_scope_seperator;					// allow regexes to seperate scopes for partial tokenize.
		this.allow_preprocessor_scope_seperator = allow_preprocessor_scope_seperator;	// allow preprocessors to seperate scopes for partial tokenize.

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
		this.excluded_word_boundary_joinings = ["{", "}", "[", "]", "(", ")"].concat(this.scope_seperators); // always exclude default {}[]() for vide.
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
		this.added_tokens = 0;			// the currently added tokens.
		this.index = null;				// the current index in the iteration, so it may be edited in case of forward lookup.
		this.prev_char = null;			// the previous char in the iteration.
		this.next_char = null;			// the next char in the iteration.
		this.batch  = "";				// current batch.
		this.line = 0;					// current line number.
		this.is_comment = false;		// is currently a comment.
		this.is_str = false;			// is currently a string.
		this.is_regex = false;			// is currently a regex string "/hello/".
		this.is_preprocessor = false;	// is currently a preprocessor statement.
		this.parenth_depth = 0;			// parentheses depth "( )".
		this.bracket_depth = 0;			// bracket depth "[ ]".
		this.curly_depth = 0;			// curly brackets depth "{ }".
		// this.template_depth = 0;		// template depth "< >".
		this.next_token = null;			// the next token, defined by the previous token such ass "class" or "extends".
		this.str_id = 0;				// id given to each string, used to detect with string tokens are part of one string, since they may be in seperate tokens if there are any line breaks in the sttring,
		this.comment_id = 0;			// id given to each string, used to detect with string tokens are part of one string, since they may be in seperate tokens if there are any line breaks in the sttring,
		this.regex_id = 0;				// id given to each string, used to detect with string tokens are part of one string, since they may be in seperate tokens if there are any line breaks in the sttring,
		this.preprocessor_id = 0;		// id given to each string, used to detect with string tokens are part of one string, since they may be in seperate tokens if there are any line breaks in the sttring,
		this.offset = 0;				// the offset of the previously appended tokens.

		// Attributes for JS.
		this.class_depth = null;		// @TODO js does not allow class definitions inside a class, but it does allow it insice a functio which is a member of a class.
										// something with an array of class depths could be done, if a new class opens add one if it closes remove one, and return the last one to use.
	}

	// Fetch the first non whitespace token going backwards from the specified index.
	// So it also tests the specified index. If the previous token data is excluded it checks one further back.
	get_prev_token(index, exclude = [" ", "\t", "\n"], exclude_comments = false) {
		return this.tokens.iterate_reversed((token) => {
			if (token.index <= index) {
				if (exclude_comments && token.token === "token_comment") {
					return null;
				}
				if (!exclude.includes(token.data)) {
					return token;
				}
			}
		})
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
	// - Returns "null" when it has not been found.
	get_closing_parentheses(index) {
		return this.get_closing_template(index, "(", ")");
	}
	get_closing_curly(index) {
		return this.get_closing_template(index, "{", "}");
	}
	get_closing_bracket(index) {
		return this.get_closing_template(index, "[", "]");
	}
	get_closing_template(index, open, close) {
		let depth = 1;
		const info_obj = {index: null, str_id: 0, comment_id: null, regex_id: null, preprocessor_id: 0};
		return this.iterate_code(info_obj, index + 1, null, (char, is_str, is_comment, is_multi_line_comment, is_regex) => {
			if (!is_str && !is_comment && !is_multi_line_comment && !is_regex) {
				if (char == open) {
					++depth;
				} else if (char == close) {
					--depth;
					if (depth == 0) {
						return info_obj.index;
					}
				}
			}
		});
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
				++this.line;
				this.batch = "\n";
				this.append_batch("token_line");
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

	// Append a token.
	// Do not join null tokens since that would clash with the prev batch function lookup and comparing it with data.
	// For example when exlcuding whitespace in the prev token, it can still contain whitespace.
	append_token(token = null, is_word_boundary = null) {

		// When the current line is 1 and there are no tokens appened yet then this means that first char on the file is a newline so append en empty line token first.
		if (this.tokens.length === 0 && this.line === 1) {
			this.tokens[0] = [];
			// this.tokens[0] = [{
			// 	token: null, 
			// 	data: "", 
			// 	index: 0, 
			// 	line: 0,
			// 	offset: 0,
			// }];
		}

		// Create default object.
		const obj = {
			token: token, 
			data: this.batch, 
			index: this.added_tokens, 
			line: this.line,
			offset: this.offset,
		};

		// Set is word boundary.
		// if (
		// 	(is_word_boundary === true) ||
		// 	(
		// 		this.batch.length === 1 && 
		// 		(token === null || token === "token_operator") && // token is null or is token operator in case the language class appends the token as token_operator without the is_word_boundary param.
		// 		this.word_boundaries.includes(this.batch)
		// 	)
		// ) {
		// 	obj.is_word_boundary = true;
		// }

		// Update offset.
		this.offset += this.batch.length;

		// Concat to previous token.
		// Do this after the update offset.
		// Exclude certain scope characters
		if (token === null && obj.is_word_boundary === true) {
			const line_tokens = this.tokens[this.line];
			if (line_tokens !== undefined) {
				const last = line_tokens.last();
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

		// Set comment, string, regex or preprocessor ids.
		switch(token) {
			case "token_string":
				obj.str_id = this.str_id;
				break;
			case "token_comment":
				obj.comment_id = this.comment_id;
				break;
			case "token_regex":
				obj.regex_id = this.regex_id;
				break;
			case "token_preprocessor":
				obj.preprocessor_id = this.preprocessor_id;
				break;
			case "token_line":
				obj.is_line_break = true;
				if (this.is_str) {
					obj.str_id = this.str_id;
				}
				else if (this.is_comment) {
					obj.comment_id = this.comment_id;
				}
				else if (this.is_regex) {
					obj.regex_id = this.regex_id;
				}
				else if (this.is_preprocessor) {
					obj.preprocessor_id = this.preprocessor_id;
				}
				break;
			default:
				break;
		}

		// Append token.
		if (this.tokens[this.line] === undefined) {
			this.tokens[this.line] = [obj];
		} else {
			this.tokens[this.line].push(obj);
		}
	}
	
	// Append batch.
	// - Batches should only be a single word, unless it is a string or comment
	// - When the token param is false, no spans will be added, when the token ...
	//   Is not null the assigned token will be added as span. And when the token param ...
	//   Is null the batch will be checked against keywords, numerics etc.
	append_batch(token = null, is_word_boundary = null) {
		if (this.batch.length == 0) {
			return ;
		}
		
		// Do not parse tokens.
		if (token == false) {
			this.append_token(null, is_word_boundary);
		}
		
		// By assigned token.
		else if (token != null) {
			this.append_token(token, is_word_boundary);
		}
		
		// By next token.
		// Skip whitespace.
		else if (this.next_token != null) {

			// Skip next token but do not reset on whitespace batch.
			if (this.is_linebreak_whitespace_char()) {
				this.append_token(null, is_word_boundary);
			}

			// Reset next token when the batch is a word boundary for example in "struct { ... } X".
			else if (this.word_boundaries.includes(this.batch)) {
				this.append_token(null, is_word_boundary);
				this.next_token = null;
			}

			// Reset next token when the batch is a keyword for example in "constexpr inline X".
			else if (this.keywords.includes(this.batch)) {
				this.append_token("token_keyword");
				this.next_token = null;
			}

			// Append as next token.
			else {
				this.append_token(this.next_token, is_word_boundary);
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
				this.append_token("token_operator", true);
			}
			
			// Numeric.
			else if (this.allow_numerics && /^-?\d+(\.\d+)?$/.test(this.batch)) {
				this.append_token("token_numeric");
			}
			
			// Just a code batch without highlighting.
			else {
				this.append_token(null, is_word_boundary);
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
			if (this.allow_preprocessors && !is_preprocessor && prev_non_whitespace_char == "\n" && char == "#") {
				++info_obj.preprocessor_id;
				is_preprocessor = true;
				const res = callback(char, false, is_comment, is_multi_line_comment, is_regex, is_escaped, is_preprocessor);
				if (res != null) { return res; }
				continue;
			}

			// End of preprocessors.
			else if (
				is_preprocessor && 
				(
					(char == "\n" && prev_non_whitespace_char != "\\") ||
					info_obj.index == this.code.length - 1
				)
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
				++info_obj.str_id;
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
				if (comment_start.length === 1 && char === comment_start) {
					++info_obj.comment_id;
					is_comment = true;
					const res = callback(char, false, is_comment, is_multi_line_comment, is_regex, is_escaped, is_preprocessor);
					if (res != null) { return res; }
					continue;
				}
				// else if (comment_start.length == 2 && char + info_obj.next_char == comment_start) {
				else if (comment_start.length !== 1 && eq_first(comment_start, info_obj.index)) {
					++info_obj.comment_id;
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
					++info_obj.comment_id;
					is_multi_line_comment = true;
					const res = callback(char, false, is_comment, is_multi_line_comment, is_regex, is_escaped, is_preprocessor);
					if (res != null) { return res; }
					continue;
				}
				
			}
			
			// End single line comments.
			else if (
				is_comment &&
				(
					(!is_escaped && char == "\n") || 
					info_obj.index == this.code.length - 1
				)
			) {
				is_comment = false;
				const res = callback(char, false, true, is_multi_line_comment, is_regex, is_escaped, is_preprocessor);
				if (res != null) { return res; }
				continue;
			}
			
			// End multi line comments.
			else if (
				is_multi_line_comment &&
				!is_escaped
			) {
				const mcomment_end = this.multi_line_comment_end;
				if (mcomment_end.length == 2 && info_obj.prev_char + char == mcomment_end) {
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
					++info_obj.regex_id;
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
	tokenize(return_tokens = false) {

		// Reset.
		this.reset();

		// Append previous batch when switching comment, string, regex, to something else.
		const auto_append_batch_switch = () => {
			if (this.is_comment) {
				this.append_batch("token_comment");
			} else if (this.is_str) {
				this.append_batch("token_string");
			} else if (this.is_regex) {
				this.append_batch("token_string");
			} else if (this.is_preprocessor) {
				this.append_batch("token_preprocessor");
			} else {
				this.append_batch();
			}
		}

		// Iterate code.
		this.iterate_code(this, null, null, (char, local_is_str, local_is_comment, is_multi_line_comment, local_is_regex, is_escaped, is_preprocessor) => {

			// New line.
			if (!is_escaped && char == "\n") {
			
				// Append previous batch, but snce newlines may be present in regexes, strings and comments, handle them correctly.
				auto_append_batch_switch();

				// Terminate preprocessor, comments, and strings when active.
				if (!local_is_str) {
					this.is_str = false;
				}
				if (!local_is_comment && !is_multi_line_comment) {
					this.is_comment = false;
				}
				if (!local_is_regex) {
					this.is_regex = false;
				}
				if (this.is_preprocessor && !is_preprocessor) {
					this.is_preprocessor = false;
					this.is_str = false; // also disable string in case of an unterminated < inside the #include preprocessor, since the flag is turned on inside the is preprocessor check.
				}
				
				// Increment line after appending the prev batch.
				// For VIDE the "\n" token "token_line" should have the line number of the next line.
				// Not the previous line. Which also makes better sense.
				++this.line;
				this.batch += char;
				this.append_batch("token_line");
			}
			
			// Start of and during comment.
			else if (local_is_comment || is_multi_line_comment) {
				if (!this.is_comment) {
					auto_append_batch_switch();
					this.is_comment = true;
				}
				this.batch += char;
			}
			
			// Start of and during string.
			else if (local_is_str) {
				if (!this.is_str) {

					// Check for special prefix chars.
					if (this.is_comment) {
						this.append_batch("token_comment");
					} else if (this.is_str) {
						this.append_batch("token_string");
					} else if (this.is_regex) {
						this.append_batch("token_string");
					} else if (this.is_preprocessor) {
						this.append_batch("token_preprocessor");
					} else {
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

					// Reset class depth for javascript.
					if (this.class_depth != null && this.curly_depth < this.class_depth) {
						this.class_depth = null;
					}
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
				if (this.is_comment) {
					this.append_batch("token_comment");
					this.is_comment = false;
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
				//

				// Call the handler.
				// And append the character when not already appended by the handler.
				if (!this.callback(char, is_escaped, this.is_preprocessor)) {

					// Is word boundary.
					// Append old batch and word boundary char.
					if (this.word_boundaries.includes(char)) {
						this.append_batch();
						this.batch += char;
						this.append_batch(null, true); // do not use "false" as parameter "token" since the word boundary may be an operator.
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
	// @todo this fucks with the str_id etc if the users just created a new string.
	/*	@docs: {
		@title Partial tokenize
		@description: Partially tokenize text based on edited lines.
		@parameter: {
			@name: data
			@type: string
			@description: The new code data.
		}
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

		// console.log("edits_start:",edits_start);
		// console.log("edits_end:",edits_end);

		// Iterate backwards to find the scope start line.
		// Do not stop if another string, comment, regex or preprocessor has just ended on the line that the start scope has been detected.
		if (edits_start !== 0) {
			let is_id = null;
			let is_string = false;
			let is_comment = false;
			let is_regex = false;
			let is_preprocessor = false;
			let stop_on_line = null;
			tokens.iterate_tokens_reversed(0, edits_start + 1, (token) => {
				if (token.line === stop_on_line) {
					scope_start_offset = token.offset + token.data.length;
					return false;
				}
				else if (is_string) {
					if (token.str_id !== is_id) {
						is_string = false;
						if (this.allow_string_scope_seperator) {
							scope_start = token.line;
							stop_on_line = token.line - 1;
						}
					}
				}
				else if (is_comment) {
					if (token.comment_id !== is_id) {
						is_comment = false;
						if (this.allow_comment_scope_seperator) {
							scope_start = token.line;
							stop_on_line = token.line - 1;
						}
					}
				}
				else if (is_regex) {
					if (token.regex_id !== is_id) {
						is_regex = false;
						if (this.allow_regex_scope_seperator) {
							scope_start = token.line;
							stop_on_line = token.line - 1;
						}
					}
				}
				else if (is_preprocessor) {
					if (token.preprocessor_id !== is_id) {
						is_preprocessor = false;
						if (this.allow_preprocessor_scope_seperator) {
							scope_start = token.line;
							stop_on_line = token.line - 1;
						}
					}
				}
				else {
					switch (token.token) {
						case "token_string":
							is_string = true;
							is_id = token.str_id;
							stop_on_line = null;
							break;
						case "token_comment":
							is_comment = true;
							is_id = token.comment_id;
							stop_on_line = null;
							break;
						case "token_regex":
							is_regex = true;
							is_id = token.regex_id;
							stop_on_line = null;
							break;
						case "token_preprocessor":
							is_preprocessor = true;
							is_id = token.preprocessor_id;
							stop_on_line = null;
							break;
						case null:
							if (token.data.length == 1 && this.scope_seperators.includes(token.data)) {
								scope_start = token.line;
								stop_on_line = token.line - 1;
								scope_start_offset = token.offset;
							}
							break;
						default:
							break;
					}
				}
			})
		}

		// console.log("scope_start_offset:",scope_start_offset);
		// console.log("scope_start:",scope_start);
		// console.log("Find the scope start:", Date.now() - now, "ms.");

		// ---------------------------------------------------------
		// Find the scope end.
		// now = Date.now();

		const get_scope_end_by_old_tokens = () => {
			let scope_end = null; 		// the line where the scope around the new edits ends.
			let scope_end_offset = 0;   // the index offset of the scope end from the new code.

			// First use the old data to find the end scope cause for example when a unterminated string was previously covering the entire document.
			// And the user terminates the string, then the scope from the new data would for example end at the termianted string and all other tokens are still left as a string.
			const max_end = edits_end;
			let is_id = null;
			let is_string = false;
			let is_comment = false;
			let is_regex = false;
			let is_preprocessor = false;
			let stop_on_line = null;
			tokens.iterate_tokens(edits_start, null, (token) => {
				if (token.line === stop_on_line) {
					return false;
				}
				else if (is_string) {
					if (token.str_id !== is_id) {
						is_string = false;
						if (this.allow_string_scope_seperator && token.line > max_end) {
							scope_end = token.line;
							stop_on_line = token.line + 1;
						}
					}
				}
				else if (is_comment) {
					if (token.comment_id !== is_id) {
						is_comment = false;
						if (this.allow_comment_scope_seperator && token.line > max_end) {
							scope_end = token.line;
							stop_on_line = token.line + 1;
						}
					}
				}
				else if (is_regex) {
					if (token.regex_id !== is_id) {
						is_regex = false;
						if (this.allow_regex_scope_seperator && token.line > max_end) {
							scope_end = token.line;
							stop_on_line = token.line + 1;
						}
					}
				}
				else if (is_preprocessor) {
					if (token.preprocessor_id !== is_id) {
						is_preprocessor = false;
						if (this.allow_preprocessor_scope_seperator && token.line > max_end) {
							scope_end = token.line;
							stop_on_line = token.line + 1;
						}
					}
				}
				else {
					switch (token.token) {
						case "token_string":
							is_string = true;
							is_id = token.str_id;
							stop_on_line = null;
							break;
						case "token_comment":
							is_comment = true;
							is_id = token.comment_id;
							stop_on_line = null;
							break;
						case "token_regex":
							is_regex = true;
							is_id = token.regex_id;
							stop_on_line = null;
							break;
						case "token_preprocessor":
							is_preprocessor = true;
							is_id = token.preprocessor_id;
							stop_on_line = null;
							break;
						case null:
							if (token.line > max_end && token.data.length == 1 && this.scope_seperators.includes(token.data)) {
								scope_end = token.line;
								stop_on_line = token.line + 1;
							}
							break;
						default:
							break;
					}
				}
			})
			console.log("old scope_end:",scope_end);

			// Get the offset of the line after the scope end line from the new code data.
			let line = scope_start > 0 ? scope_start - 1 : scope_start; // since a line break is the start of a new line.
			this.iterate_code(this, scope_start_offset, null, (char, l_is_str, l_is_comment, l_is_multi_line_comment, l_is_regex, is_escaped, l_is_preprocessor) => {

				// Count lines.
				if (char == "\n" && !is_escaped) {
					++line;

					// Check stop on line.
					if (line == scope_end + 1) { // get offset of the end of the line.
						scope_end_offset = this.index - 1;
						return false;
					}
				}
			})
			console.log("old scope_end_offset:",scope_end_offset);

			return {line:scope_end, offset:scope_end_offset};
		}

		const get_scope_end_by_new_code = () => {
			let scope_end = null; 		// the line where the scope around the new edits ends.
			let scope_end_offset = 0;   // the index offset of the scope end from the new code.

			// Iterate forwards to find the scope end line.
			// Do not stop if another string, comment, regex or preprocessor has started ended on the line that the start scope has been detected.
			let line = scope_start > 0 ? scope_start - 1 : scope_start; // since a line break is the start of a new line.
			let is_string = false;
			let is_comment = false;
			let is_regex = false;
			let is_preprocessor = false;
			let stop_on_line = null;
			this.iterate_code(this, scope_start_offset, null, (char, l_is_str, l_is_comment, l_is_multi_line_comment, l_is_regex, is_escaped, l_is_preprocessor) => {

				// Count lines.
				let line_break = false;
				if (char == "\n" && !is_escaped) {
					line_break = true;
					++line;
				}

				// Check stop on line.
				if (line_break && line == stop_on_line) {
					scope_end_offset = this.index - 1;
					return false;
				}

				// Stop by last index.
				if (this.index == this.code.length - 1) {
					scope_end_offset = this.index;
					scope_end = line;
					return false;
				}

				// Combine single and multi line comments.
				l_is_comment = l_is_comment || l_is_multi_line_comment;


				// Check if the line has passed the end line.
				if (line > edits_end) {

					// End of string, comment, regex and preprocessor.
					if (is_string) {
						if (!l_is_str) {
							is_string = false;
							if (this.allow_string_scope_seperator) {
								scope_end = line;
								stop_on_line = line + 1;
							}
						}
					} else if (is_comment) {
						if (!l_is_comment) {
							is_comment = false;
							if (this.allow_comment_scope_seperator) {
								scope_end = line;
								stop_on_line = line + 1;
							}
						}
					} else if (is_regex) {
						if (!l_is_regex) {
							is_regex = false;
							if (this.allow_regex_scope_seperator) {
								scope_end = line;
								stop_on_line = line + 1;
							}
						}
					} else if (is_preprocessor) {
						if (!l_is_preprocessor) {
							is_preprocessor = false;
							if (this.allow_preprocessor_scope_seperator) {
								scope_end = line;
								stop_on_line = line + 1;
							}
						}
					}

					// Start of string, comment, regex and preprocessor.
					else if (l_is_str) {
						is_string = true;
						stop_on_line = null;
					}
					else if (l_is_comment) {
						is_comment = true;
						stop_on_line = null;
					}
					else if (l_is_regex) {
						is_regex = true;
						stop_on_line = null;
					}
					else if (l_is_preprocessor) {
						is_preprocessor = true;
						stop_on_line = null;
					}

					// Search for seperator chars.
					else if (this.scope_seperators.includes(char)) {
						scope_end = line;
						stop_on_line = line + 1;
					}
				}

				// Set string, comment and regex flags otherwise is might cause undefined behaviour if a comment etc is open while reaching the edits_end line.
				else {

					// End of string, comment, regex and preprocessor.
					if (is_string && !l_is_str) {
						is_string = false;
					}
					else if (is_comment && !l_is_comment) {
						is_comment = false;
					}
					else if (is_regex && !l_is_regex) {
						is_regex = false;
					}
					else if (is_preprocessor && !l_is_preprocessor) {
						is_preprocessor = false;
					}

					// Start of string, comment, regex and preprocessor.
					else if (l_is_str) {
						is_string = true;
					}
					else if (l_is_comment) {
						is_comment = true;
					}
					else if (l_is_regex) {
						is_regex = true;
					}
					else if (l_is_preprocessor) {
						is_preprocessor = true;
					}
				}

				// 
			})
			// console.log("new scope_end:",scope_end);
			// console.log("new scope_end_offset:",scope_end_offset);

			return {line:scope_end, offset:scope_end_offset};
		}

		const old_scope_end = get_scope_end_by_old_tokens();
		const new_scope_end = get_scope_end_by_new_code();

		// When the last lines have been deleted.
		if (new_scope_end.line == edits_end && edits_start == edits_end && line_additions < 0) {
			scope_end = new_scope_end.line;
			scope_end_offset = new_scope_end.offset;
		}

		// Use new scope end.
		else if (new_scope_end.line >= old_scope_end.line) {
			scope_end = new_scope_end.line;
			scope_end_offset = new_scope_end.offset;
		}

		// Use old scope end.
		else {
			scope_end = old_scope_end.line;
			scope_end_offset = old_scope_end.offset;
		}

		// console.log("Find the scope end:", Date.now() - now, "ms.");
		// ---------------------------------------------------------
		// Highlight and insert the edits.
		// now = Date.now();

		// Slice the data edits.
		// console.log("scope_end:",scope_end);
		// console.log("scope_end_offset:",scope_end_offset);
		// console.log("code length:",this.code.length);
		this.code = this.code.substr(scope_start_offset, (scope_end_offset - scope_start_offset) + 1);
		// console.log("scope:",this.code);

		// Highlight the edits.
		const results = this.tokenize(true);
		const insert_tokens = results.tokens;
		// console.log("insert_tokens:",insert_tokens)

		// console.log("Highlight the edits:", Date.now() - now, ".");
		// now = Date.now();

		// Combine the tokens.
		let combined_tokens = new vhighlight.Tokens();
		let insert = true;
		let line_count = 0, token_index = 0, offset = 0;;
		let insert_end = scope_end - line_additions;
		// console.log("insert_end:",insert_end);
		// console.log("line_additions:",line_additions);
		for (let line = 0; line < tokens.length; line++) {
			if (insert && line == scope_start) {
				insert = false;
				insert_tokens.iterate((new_tokens) => {
					new_tokens.iterate((new_token) => {
							if (new_token.is_line_break) {
							++line_count;
						}
						new_token.line = line_count;
						new_token.index = token_index;
						new_token.offset = offset;
						offset += new_token.data.length;
						++token_index;
					});
					combined_tokens.push(new_tokens);
				})
			}
			else if (line < scope_start || line > insert_end) {
				const line_tokens = tokens[i];
				line_tokens.iterate((token) => {
						if (token.is_line_break) {
						++line_count;
					}
					token.line = line_count;
					new_token.index = token_index;
					new_token.offset = offset;
					offset += new_token.data.length;
					++token_index;
				});
				combined_tokens.push(line_tokens);
			}
		}
		// console.log("line_count:",line_count);
		// console.log("combined_tokens:",combined_tokens);

		// console.log("Combine the tokens:", Date.now() - now, "ms.");
		// now = Date.now();

		// console.log("Update all tokens.", Date.now() - now, "ms/");

		// Handler.
		return combined_tokens;
	}
	/*
	partial_tokenize({
		edits_start = null,
		edits_end = null,
		insert_start = null,
		insert_end = null,
		tokens = [],
		update_offsets = true,
	}) {

		// Vars.
		let scope_start = 0; 		// the line where the scope around the new edits starts.
		let scope_start_offset = 0; // the index offset of the scope start from the new code.
		let scope_end = null; 		// the line where the scope around the new edits ends.
		let scope_end_offset = 0;   // the index offset of the scope end from the new code.

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
					return false;
				}
			})
			if (token_start === null) {
				throw Error(`Unable to find the token of start line ${min_start}.`);
			}
		}
		console.log("edits_start:",edits_start);
		console.log("edits_end:",edits_end);
		console.log("insert_start:",insert_start);
		console.log("insert_end:",insert_end);
		console.log("min_start: ", min_start);

		// Iterate backwards to find the scope start line.
		// Do not stop if another string, comment, regex or preprocessor has just ended on the line that the start scope has been detected.
		if (token_start !== 0) {
			let is_id = null;
			let is_string = false;
			let is_comment = false;
			let is_regex = false;
			let is_preprocessor = false;
			let stop_on_line = null;
			tokens.iterate_reversed(0, token_start, (token) => {
				if (token.line === stop_on_line) {
					scope_start_offset = token.offset + token.data.length;
					return false;
				}
				else if (is_string) {
					if (token.str_id !== is_id) {
						is_string = false;
						if (this.allow_string_scope_seperator) {
							scope_start = token.line;
							stop_on_line = token.line - 1;
						}
					}
				}
				else if (is_comment) {
					if (token.comment_id !== is_id) {
						is_comment = false;
						if (this.allow_comment_scope_seperator) {
							scope_start = token.line;
							stop_on_line = token.line - 1;
						}
					}
				}
				else if (is_regex) {
					if (token.regex_id !== is_id) {
						is_regex = false;
						if (this.allow_regex_scope_seperator) {
							scope_start = token.line;
							stop_on_line = token.line - 1;
						}
					}
				}
				else if (is_preprocessor) {
					if (token.preprocessor_id !== is_id) {
						is_preprocessor = false;
						if (this.allow_preprocessor_scope_seperator) {
							scope_start = token.line;
							stop_on_line = token.line - 1;
						}
					}
				}
				else {
					switch (token.token) {
						case "token_string":
							is_string = true;
							is_id = token.str_id;
							stop_on_line = null;
							break;
						case "token_comment":
							is_comment = true;
							is_id = token.comment_id;
							stop_on_line = null;
							break;
						case "token_regex":
							is_regex = true;
							is_id = token.regex_id;
							stop_on_line = null;
							break;
						case "token_preprocessor":
							is_preprocessor = true;
							is_id = token.preprocessor_id;
							stop_on_line = null;
							break;
						case null:
							if (token.data.length == 1 && this.scope_seperators.includes(token.data)) {
								scope_start = token.line;
								stop_on_line = token.line - 1;
								scope_start_offset = token.offset;
							}
							break;
						default:
							break;
					}
				}
			})
		}

		console.log("token_start:",token_start);
		console.log("scope_start_offset:",scope_start_offset);
		console.log("scope_start:",scope_start);

		// Get the end line of the sope by the previous tokens.
		const max_end = insert_end > edits_end ? insert_end : edits_end;
		let is_id = null;
		let is_string = false;
		let is_comment = false;
		let is_regex = false;
		let is_preprocessor = false;
		let stop_on_line = null;
		tokens.iterate(token_start, null, (token) => {
			if (token.line === stop_on_line) {
				return false;
			}
			else if (is_string) {
				if (token.str_id !== is_id) {
					is_string = false;
					if (this.allow_string_scope_seperator && token.line > max_end) {
						scope_end = token.line;
						stop_on_line = token.line + 1;
					}
				}
			}
			else if (is_comment) {
				if (token.comment_id !== is_id) {
					is_comment = false;
					if (this.allow_comment_scope_seperator && token.line > max_end) {
						scope_end = token.line;
						stop_on_line = token.line + 1;
					}
				}
			}
			else if (is_regex) {
				if (token.regex_id !== is_id) {
					is_regex = false;
					if (this.allow_regex_scope_seperator && token.line > max_end) {
						scope_end = token.line;
						stop_on_line = token.line + 1;
					}
				}
			}
			else if (is_preprocessor) {
				if (token.preprocessor_id !== is_id) {
					is_preprocessor = false;
					if (this.allow_preprocessor_scope_seperator && token.line > max_end) {
						scope_end = token.line;
						stop_on_line = token.line + 1;
					}
				}
			}
			else {
				switch (token.token) {
					case "token_string":
						is_string = true;
						is_id = token.str_id;
						stop_on_line = null;
						break;
					case "token_comment":
						is_comment = true;
						is_id = token.comment_id;
						stop_on_line = null;
						break;
					case "token_regex":
						is_regex = true;
						is_id = token.regex_id;
						stop_on_line = null;
						break;
					case "token_preprocessor":
						is_preprocessor = true;
						is_id = token.preprocessor_id;
						stop_on_line = null;
						break;
					case null:
						if (token.line > max_end && token.data.length == 1 && this.scope_seperators.includes(token.data)) {
							scope_end = token.line;
							stop_on_line = token.line + 1;
						}
						break;
					default:
						break;
				}
			}
		})
		console.log("scope_end:",scope_end);

		// Get the offset of the line after the scope end line from the new code data.
		let line = scope_start > 0 ? scope_start - 1 : scope_start; // since a line break is the start of a new line.
		this.iterate_code(this, scope_start_offset, null, (char, l_is_str, l_is_comment, l_is_multi_line_comment, l_is_regex, is_escaped, l_is_preprocessor) => {

			// Count lines.
			if (char == "\n" && !is_escaped) {
				++line;

				// Check stop on line.
				if (line == scope_end + 1) { // get offset of the end of the line.
					scope_end_offset = this.index - 1;
					return false;
				}
			}
		})
		console.log("scope_end_offset:",scope_end_offset);

		// Slice the data edits.
		this.code = this.code.substr(scope_start_offset, (scope_end_offset - scope_start_offset) + 1);
		console.log("scope:",this.code);

		// Highlight the edits.
		const results = this.tokenize(true);
		const new_tokens = results.tokens;
		let incr_lines = scope_start == 0 ? scope_start : scope_start - 1;
		console.log(new_tokens);
		let e = "";
		const insert_tokens = [];
		new_tokens.iterate((token) => {
			const line = token.line + incr_lines;
			if (line >= scope_start && line <= scope_end) {
				insert_tokens.push(token);
				e += token.data;
			}
		})
		console.log("insert:",{e:e});
		console.log("insert_tokens:",insert_tokens)

		// Combine the tokens.
		let combined_tokens = [];
		let insert = true;
		let line_count = 0;
		for (let i = 0; i < tokens.length; i++) {
			const token = tokens[i];
			if (insert && token.line == scope_start) {
				insert = false;
				insert_tokens.iterate((new_token) => {
					if (new_token.token === "token_line") {
						++line_count;
					}
					new_token.line = line_count;
					combined_tokens.push(new_token);
				})
			}
			else if (token.line < scope_start || token.line > scope_end) {
				if (token.token === "token_line") {
					++line_count;
				}
				token.line = line_count;
				combined_tokens.push(token);
			}
		}
		console.log("combined_tokens:",combined_tokens);

		// Update all token offsets.
		if (update_offsets) {
			let offset = 0;
			combined_tokens.iterate((token) => {
				token.offset = offset;
				offset += token.data.length;
			})
		}

		// Handler.
		return {
			tokens: combined_tokens,
			line_count: line_count
		};

		// // Iterate forwards to find the scope end line.
		// // Do not stop if another string, comment, regex or preprocessor has started ended on the line that the start scope has been detected.
		// let line = scope_start > 0 ? scope_start - 1 : scope_start; // since a line break is the start of a new line.
		// let is_string = false;
		// let is_comment = false;
		// let is_regex = false;
		// let is_preprocessor = false;
		// let stop_on_line = null;
		// this.iterate_code(this, scope_start_offset, null, (char, l_is_str, l_is_comment, l_is_multi_line_comment, l_is_regex, is_escaped, l_is_preprocessor) => {

		// 	// Count lines.
		// 	let line_break = false;
		// 	if (char == "\n" && !is_escaped) {
		// 		line_break = true;
		// 		++line;
		// 	}

		// 	// Check stop on line.
		// 	if (line_break && line == stop_on_line) {
		// 		scope_end_offset = this.index - 1;
		// 		return false;
		// 	}

		// 	// Combine single and multi line comments.
		// 	l_is_comment = l_is_comment || l_is_multi_line_comment;


		// 	// Check if the line has passed the end line.
		// 	if (line > edits_end) {

		// 		// End of string, comment, regex and preprocessor.
		// 		if (is_string) {
		// 			if (!l_is_str) {
		// 				is_string = false;
		// 				if (this.allow_string_scope_seperator) {
		// 					scope_end = line;
		// 					stop_on_line = line + 1;
		// 				}
		// 			}
		// 		} else if (is_comment) {
		// 			if (!l_is_comment) {
		// 				is_comment = false;
		// 				if (this.allow_comment_scope_seperator) {
		// 					scope_end = line;
		// 					stop_on_line = line + 1;
		// 				}
		// 			}
		// 		} else if (is_regex) {
		// 			if (!l_is_regex) {
		// 				is_regex = false;
		// 				if (this.allow_regex_scope_seperator) {
		// 					scope_end = line;
		// 					stop_on_line = line + 1;
		// 				}
		// 			}
		// 		} else if (is_preprocessor) {
		// 			if (!l_is_preprocessor) {
		// 				is_preprocessor = false;
		// 				if (this.allow_preprocessor_scope_seperator) {
		// 					scope_end = line;
		// 					stop_on_line = line + 1;
		// 				}
		// 			}
		// 		}

		// 		// Start of string, comment, regex and preprocessor.
		// 		else if (l_is_str) {
		// 			is_string = true;
		// 		}
		// 		else if (l_is_comment) {
		// 			is_comment = true;
		// 		}
		// 		else if (l_is_regex) {
		// 			is_regex = true;
		// 		}
		// 		else if (l_is_preprocessor) {
		// 			is_preprocessor = true;
		// 		}

		// 		// Search for seperator chars.
		// 		else if (this.scope_seperators.includes(char)) {
		// 			scope_end = line;
		// 			stop_on_line = line + 1;
		// 		}
		// 	}

		// 	// Set string, comment and regex flags otherwise is might cause undefined behaviour if a comment etc is open while reaching the edits_end line.
		// 	else {

		// 		// End of string, comment, regex and preprocessor.
		// 		if (is_string && !l_is_str) {
		// 			is_string = false;
		// 		}
		// 		else if (is_comment && !l_is_comment) {
		// 			is_comment = false;
		// 		}
		// 		else if (is_regex && !l_is_regex) {
		// 			is_regex = false;
		// 		}
		// 		else if (is_preprocessor && !l_is_preprocessor) {
		// 			is_preprocessor = false;
		// 		}

		// 		// Start of string, comment, regex and preprocessor.
		// 		else if (l_is_str) {
		// 			is_string = true;
		// 		}
		// 		else if (l_is_comment) {
		// 			is_comment = true;
		// 		}
		// 		else if (l_is_regex) {
		// 			is_regex = true;
		// 		}
		// 		else if (l_is_preprocessor) {
		// 			is_preprocessor = true;
		// 		}
		// 	}

		// 	// 
		// })
		// console.log("scope_end_offset:",scope_end_offset);
		// console.log("scope_end:",scope_end);

		// // Slice the data edits.
		// this.code = this.code.substr(scope_start_offset, (scope_end_offset - scope_start_offset) + 1);
		// console.log("scope:",this.code);

		// // Highlight the edits.
		// const results = this.tokenize(true);
		// const new_tokens = results.tokens;
		// let incr_lines = scope_start == 0 ? scope_start : scope_start - 1;
		// console.log(new_tokens);
		// let e = "";
		// const insert_tokens = [];
		// new_tokens.iterate((token) => {
		// 	const line = token.line + incr_lines;
		// 	if (line >= edits_start && line <= edits_end) {
		// 		insert_tokens.push(token);
		// 		e += token.data;
		// 	}
		// })
		// console.log("insert:",{e:e});
		// console.log("insert_tokens:",insert_tokens)

		// // Combine the tokens.
		// let combined_tokens = [];
		// let insert = true;
		// line = 0;
		// for (let i = 0; i < tokens.length; i++) {
		// 	const token = tokens[i];
		// 	if (insert && token.line == insert_start) {
		// 		insert = false;
		// 		insert_tokens.iterate((new_token) => {
		// 			if (new_token.token === "token_line") {
		// 				++line;
		// 			}
		// 			new_token.line = line;
		// 			combined_tokens.push(new_token);
		// 		})
		// 	}
		// 	else if (token.line < insert_start || token.line > insert_end) {
		// 		if (token.token === "token_line") {
		// 			++line;
		// 		}
		// 		token.line = line;
		// 		combined_tokens.push(token);
		// 	}
		// }
		// console.log("combined_tokens:",combined_tokens);

		// // Update all token offsets.
		// if (update_offsets) {
		// 	let offset = 0;
		// 	combined_tokens.iterate((token) => {
		// 		token.offset = offset;
		// 		offset += token.data.length;
		// 	})
		// }

		// // Handler.
		// return combined_tokens;
	}
	*/

	// Build the html from tokens.
	// - Every "{", "}" and "\n" character should be appended as a single token.
	//   Otherwise foldable spans and newline spans will fail.
	// - New lines will be added inside a span so you can iterate the html children from line till line.
	build_tokens(reformat = true) {

		// Vars.
		let html = "";
		
		// Iterate an array with token objects.
		tokens.iterate((line_tokens) => {
			line_tokens.iterate((token) => {
				if (token.token == null) {
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
