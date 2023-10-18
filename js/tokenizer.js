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
	    	if (tokens === undefined) { return null; }
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
// - @warning: the `parents`, `pre_modifiers`, `post_modifiers`, `templates` and `requires` attributes on the type def tokens will not be correct when using `partial_tokenize()`.
// - Do not forget to assign attribute "code" after initializing the Tokenizer, used to avoid double copy of the code string.
// - Parsing behaviour depends on that every word is seperated as a token, so each word boundary is a seperate token.
// @todo highlight "@\\s+" patterns outside comments as type.
// @todo add support for each language to get parameters, so that vdocs can use this.
vhighlight.Tokenizer = class Tokenizer {

	// Static variables.
	static alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	static uppercase_alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	static numerics = "0123456789";

	// Constructor.
	constructor({
		// Attributes for tokenizing.
		keywords = [], 
		type_keywords = [],
		type_def_keywords = [], 
		exclude_type_def_keywords_on_prev = [],
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
		allowed_keywords_before_type_defs = [],
		excluded_word_boundary_joinings = [],
		indent_language = false,
		// Attributes for partial tokenizing.
		scope_separators = [
			"{", 
			"}", 
			// do not use ; and : etc since they can be used inside a {} scope for cpp, js etc.
		],
		seperate_scope_by_type_def = false,
	}) {

		// Parameter attributes.
		this.code = null;																// the code to tokenize.
		this.keywords = keywords;														// the languages default keywords.
		this.type_keywords = type_keywords;												// the keywords on wich the next token will always be a type.
		this.type_def_keywords = type_def_keywords;										// the keywords on wich the next token will always be a type def.
		this.exclude_type_def_keywords_on_prev = exclude_type_def_keywords_on_prev;		// exclude the type def keywords match when the previous non whitespace was one of these words.
		this.operators = operators;														// language operators.
		this.special_string_prefixes = special_string_prefixes;							// special characters preceding a string to indicate a special string, such as the "f" in python for "f'{}'".
		this.single_line_comment_start = single_line_comment_start;						// the language's single line comment start characters, use "false" when the language does not support this.
		this.multi_line_comment_start = multi_line_comment_start;						// the language's multi line comment start characters, use "false" when the language does not support this.
		this.multi_line_comment_end = multi_line_comment_end;							// the language's multi line comment end characters, use "false" when the language does not support this.
		this.allow_strings = allow_strings;												// if the language supports strings.
		this.allow_numerics = allow_numerics;											// if the language supports numerics.
		this.allow_preprocessors = allow_preprocessors;									// if the language has "#..." based preprocessor statements.
		this.allow_slash_regexes = allow_slash_regexes;									// if the language has "/.../" based regex statements.
		this.allow_comment_keyword = allow_comment_keyword;								// allow comment keywords.
		this.allow_comment_codeblock = allow_comment_codeblock;							// allow comment codeblocks.
		this.allow_parameters = allow_parameters;										// allow parameters.
		this.allow_decorators = allow_decorators;										// allow decorators.
		this.allowed_keywords_before_type_defs = allowed_keywords_before_type_defs; 	// the allowed keywords before the name of a type definition, such as "async" and "static" for js, but they need to be directly before the type def token, so no types in between in for example c++.
		this.indent_language = indent_language;											// whether the language specifies scope's with indent, such as python.
		this.scope_separators = scope_separators;										// scope separators for partial tokenize.
		this.seperate_scope_by_type_def = seperate_scope_by_type_def;					// only seperate a scope by token type def's for example required in cpp.

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
		// this.callback = function(char, is_escaped, is_preprocessor) { return false; }

		// The on parenth callback.
		// - The on parenth close will not be called when the token before the parenth opening is a keyword.
		// - The on parenth close callback should return the type or type def token when it has assigned one, so the parsed parameters can be assigned to that token.
		// this.on_parenth_close = function({token_before_opening_parenth: token_before_opening_parenth, after_parenth_index: after_parenth_index}) {return token};

		// The on type def keyword callback.
		// - @warning When this callback is defined the tokenizer will not add the type def tokens parents to the tokenizer when the event is fired, so the event needs to take care of this.
		// - Will be called if one of the type def keywords is matched.
		// - When on_parenth_close is defined and has not yet called `assigned_parents()` on the returned type token the parents will be added automatically, also when on_parenth_close is not defined / not called.
		// - The parameter token, is the type def token after the matched keyword.
		// this.on_type_def_keyword = function(token) {};

		// The on post type def modifier end callback.
		// - The parameter token, is the token where the post type def modifier range ended so the token before either a "{" or ";".
		// - The return value of the callback will not be used and may be anything.
		// this.on_post_type_def_modifier_end = (token) => {};
 
		// Init vars that should be reset before each tokenize.
		this.reset();

	}

	// Attributes that should be reset before each tokenize.
	reset() {
		this.tokens = new vhighlight.Tokens();				// use an array with tokens since some tokens need to be edited after they have been appended.
		this.added_tokens = 0;								// the currently added tokens.
		this.index = null;									// the current index in the iteration, so it may be edited in case of forward lookup.
		this.prev_char = null;								// the previous char in the iteration.
		this.next_char = null;								// the next char in the iteration.
		this.batch  = "";									// current batch.
		this.line = 0;										// current line number.
		this.is_comment = false;							// is currently a comment.
		this.is_str = false;								// is currently a string.
		this.is_regex = false;								// is currently a regex string "/hello/".
		this.is_preprocessor = false;						// is currently a preprocessor statement.
		this.is_comment_keyword = false;					// is currently a "@keyword" inside a comment.
		this.is_comment_codeblock = false;					// is currently a "`somefunc()`" codeblock inside a comment.
		this.parenth_depth = 0;								// parentheses depth "( )".
		this.bracket_depth = 0;								// bracket depth "[ ]".
		this.curly_depth = 0;								// curly brackets depth "{ }".
		// this.template_depth = 0;							// template depth "< >".
		this.next_token = null;								// the next token type, defined by the previous token such ass "class" or "extends".
		this.offset = 0;									// the offset of the previously appended tokens.
		this.parents = [];									// array with parents, a parent looks like [<parent-name>, <close-id>] the close id is either the opening curly depth or the opening indent on a indent language. when the close-id is matched the last parent is removed.
															// @warning: The token type def on non indent languages must be assigned before the curly depth increase otherwise it will cause undefined behaviour.
		this.line_indent = 0;								// the indent of the current line, a space and tab both count for 1 indent.
		this.start_of_line = true;							// is at the start of the line, whitespace at the start of the line does not disable the flag.
		this.do_on_type_def_keyword = false;				// do the next on type def keyword callback.
		this.prev_nw_token_data = null;						// the previous non whitespace or linebreak token data.
		this.is_post_type_def_modifier = false;				// is between the closing parentheses and the opening curly or semicolon.
		this.post_type_def_modifier_type_def_token = null;	// the type def token from that for the on post type def modifier end callback.

		// Performance.
		// this.get_prev_token_time = 0;
		// this.append_token_time = 0;
	}

	// Add a parent.
	add_parent(token) {
		if (this.indent_language) {
			this.parents.push([token, this.line_indent]);
		} else {
			this.parents.push([token, this.curly_depth]);
		}
	}

	// Assign parent to token.
	assign_parents(token) {
		token.parents = [];
		this.parents.iterate((item) => {
			token.parents.push(item[0]);
		})
	}

	// Copy the parents without any reference.
	copy_parents() {
		let copy = [];
		this.parents.iterate((item) => {
			copy.push([item[0], item[1]]);
		})
		return copy;
	}

	// Get the last token.
	// Returns null when there is no last token.
	get_last_token() {
		return this.tokens.iterate_tokens_reversed((token) => {
			return token;
		})
	}

	// Fetch the first non whitespace token going backwards from the specified index.
	// So it also tests the specified index. If the previous token data is excluded it checks one further back.
	get_prev_token(index, exclude = [" ", "\t", "\n"], exclude_comments = false) {
		// const now = Date.now();
		return this.tokens.iterate_tokens_reversed((token) => {
			if (token.index <= index) {
				if (exclude_comments && token.token === "comment") {
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
	is_linebreak_whitespace_batch(x = null) {
		if (x !== null) {
			for (let i = 0; i < x.length; i++) {
				const c = x.charAt(i);
				if (c !== " " && c !== "\t" && c !== "\n") {
					return false;
				}
			}
			return true;
		} else {
			for (let i = 0; i < this.batch.length; i++) {
				const c = this.batch.charAt(i);
				if (c !== " " && c !== "\t" && c !== "\n") {
					return false;
				}
			}
			return true;
		}
	}

	// Check if the first chars of the main string equals a substring, optionally with start index.
	eq_first(substr, start_index = 0) {
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

	// Do a forward lookup by iterating the code from a start index.
	// Supports a single string query or an array with "or" queries.
	lookup({query, index = 0, exclude_str = true, exclude_comment = true, exclude_regex = true, exclude_preprocessor = true, exclude_escaped = true}) {
		if (typeof query === "string") {
			query = [query];
		}
		const info_obj = {index: null};
		const query_match = () => {
			for (let i = 0; i < query.length; i++) {
				if (this.eq_first(query[i], info_obj.index)) {
					return true;
				}
			}
			return false;
		}
		return this.iterate_code(info_obj, index, null, (char, is_str, is_comment, is_multi_line_comment, is_regex, is_escaped, is_preprocessor) => {
			if (
				(exclude_str === false || is_str === false) &&
				(exclude_comment === false || (is_comment === false && is_multi_line_comment === false)) &&
				(exclude_regex === false || is_regex === false) &&
				(exclude_preprocessor === false || is_preprocessor === false) &&
				(exclude_escaped === false || is_escaped === false) &&
				query_match()
			) {
				return info_obj.index;
			}
		});
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
		return Tokenizer.alphabet.includes(char);
	}

	// Is an uppercase alphabetical character.
	is_uppercase(char) {
		return Tokenizer.uppercase_alphabet.includes(char);
	}
	is_full_uppercase(str) {
		for (let i = 0; i < str.length; i++) {
			if (Tokenizer.uppercase_alphabet.includes(str.charAt(i)) === false) {
				return false;
			}
		}
		return true;
	}

	// Is a numeric character.
	is_numerical(char) {
		return Tokenizer.numerics.includes(char);
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

	// Concat tokens to the end of the current tokens.
	concat_tokens(tokens) {
		tokens.iterate_tokens((token) => {
			token.line = this.line;
			if (token.is_line_break) {
				++this.line;
			}
			token.offset = this.offset;
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

	// Trim an array of (reversed) tokens.
	// Removes the whitespace tokens at the start and the end.
	trim_tokens(tokens, reversed = false) {
		if (tokens.length === 0) { return []; }
		for (let i = tokens.length - 1; i >= 0; i--) {
			const token = tokens[i];
			if (token.is_whitespace === true) {
				--tokens.length;
			} else {
				break;
			}
		}
		let clean = [], first = true;
		for (let i = 0; i < tokens.length; i++) {
			const token = tokens[i];
			if (first && token.is_whitespace === true) {
				continue;
			} else {
				first = false;
				clean.push(token)
			}
		}
		if (reversed) {
			tokens = [];
			clean.iterate_reversed((token) => {
				tokens.push(token)
			})
			return tokens;
		} else {
			return clean;
		}
		return clean;	
	}

	// Append a token.
	// Do not join null tokens since that would clash with the prev batch function lookup and comparing it with data.
	// For example when exlcuding whitespace in the prev token, it can still contain whitespace.
	append_token(token = null, extended = {}) {
		// const now = Date.now();

		// Create default object.
		const obj = {...extended};
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
				(token === null || token === "operator") && // token is null or is token operator in case the language class appends the token as operator without the is_word_boundary param.
				this.word_boundaries.includes(this.batch)
			)
		) {
			obj.is_word_boundary = true;
		}

		// Set is whitespace.
		if (obj.data.length === 1 && (obj.data === " " || obj.data === "\t" || obj.data === "\n")) {
			obj.is_whitespace = true;
		}

		// Set inside comment, string, regex or preprocessor.
		if (token === "line") {
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

		// Set parents.
		else if (this.do_on_type_def_keyword !== true && token === "type_def") {
			this.assign_parents(obj);
			this.add_parent(obj);
		}

		// Update offset.
		this.offset += this.batch.length;

		// Set previous non whitespace + line break token data.
		if (obj.is_line_break !== true && this.batch !== " " && this.batch !== "\t" && this.batch !== "\n") {
			this.prev_nw_token_data = obj.data;
		}

		// Concat to previous token.
		// - Do this after the update offset.
		// - The concated tokens must not be excluded and either both be a word boundary or both be whitespace.
		// - Whitespace tokens must remain all whitespace since certain checks require a check if a token is whitespace only.
		// - Never concat tokens when the token is defined, even when the last and current tokens are the same. Since certain checks require a check for a specific operator, such as `parse_pre_func_tokens()` in `vhighlight.cpp`.
		if (token === null && (obj.is_word_boundary === true || obj.is_whitespace === true)) {
			const line_tokens = this.tokens[this.line];
			if (line_tokens !== undefined) {
				const last = line_tokens[line_tokens.length - 1];
				if (
					last !== undefined &&
					last.is_word_boundary === obj.is_word_boundary && 
					last.is_whitespace === obj.is_whitespace && 
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
		if (token === "line") {
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

		// Return the token.
		return obj;
	}
	
	// Append batch.
	// - Batches should only be a single word, unless it is a string or comment
	// - When the token param is false, no spans will be added, when the token ...
	//   Is not null the assigned token will be added as span. And when the token param ...
	//   Is null the batch will be checked against keywords, numerics etc.
	append_batch(token = null, extended = {}) {
		if (this.batch.length == 0) {
			return null;
		}
		let appended_token;

		// Do not parse tokens.
		if (token == false) {
			appended_token = this.append_token(null, extended);
		}
		
		// By assigned token.
		else if (token != null) {
			appended_token = this.append_token(token, extended);
		}
		
		// By next token.
		// Skip whitespace.
		else if (this.next_token != null) {

			// Skip next token but do not reset on whitespace batch.
			if (this.is_linebreak_whitespace_batch()) {
				appended_token = this.append_token(null, extended);
			}

			// Reset next token when the batch is a word boundary for example in "struct { ... } X".
			else if (extended.is_word_boundary === true || this.word_boundaries.includes(this.batch)) {
				appended_token = this.append_token(null, {is_word_boundary: true});
				this.next_token = null;
				this.do_on_type_def_keyword = false;
			}

			// Reset next token when the batch is a keyword for example in "constexpr inline X".
			else if (this.keywords.includes(this.batch)) {
				appended_token = this.append_token("keyword");
				this.next_token = null;
				this.do_on_type_def_keyword = false;
			}

			// Append as next token.
			else {
				appended_token = this.append_token(this.next_token, extended);
				this.next_token = null;
				if (this.do_on_type_def_keyword === true && this.on_type_def_keyword !== undefined) {
					this.on_type_def_keyword(appended_token);
				}
				this.do_on_type_def_keyword = false;
			}
		}
		
		// Parse batch.
		else {
			
			// Keyword.
			if (this.keywords.includes(this.batch)) {
				
				// Set class depth.
				if (
					this.type_def_keywords.includes(this.batch) && 
					(this.prev_nw_token_data == null || this.exclude_type_def_keywords_on_prev.length === 0 || this.exclude_type_def_keywords_on_prev.includes(this.prev_nw_token_data) == false)
				) {
					this.next_token = "type_def"
					this.do_on_type_def_keyword = this.on_type_def_keyword !== undefined;
				}
				
				// Next tokens.
				else if (this.type_keywords.includes(this.batch)) {
					this.next_token = "type";
				}
				
				// Append.
				appended_token = this.append_token("keyword");
			}
			
			// Operator.
			else if (this.operators.includes(this.batch)) {
				appended_token = this.append_token("operator", {is_word_boundary: true});
			}
			
			// Numeric.
			else if (this.allow_numerics && /^-?\d+(\.\d+)?$/.test(this.batch)) {
				appended_token = this.append_token("numeric");
			}
			
			// Just a code batch without highlighting.
			else {
				appended_token = this.append_token(null, extended);
			}
			
		}
		
		// Reset batch.
		this.batch = "";

		// Return the appended token.
		return appended_token;		
	}

	// Append lookup token.
	// This function must be used when appending new tokens by a forward lookup.
	// Since every line break should be a seperate line break token for VIDE.
	append_forward_lookup_batch(token, data, extended = {}) {

		// Vars.
		let appended_token, appended_tokens = [];

		// Add current batch.
		if (this.batch.length > 0) {
			appended_token = this.append_batch();
			if (appended_token != null) {
				appended_tokens.push(appended_token);
			}
		}
		this.batch = "";

		// Reset the next token attribute since this will not be reset by the current append batch behaviour.
		this.next_token = null;

		// Seperate the line tokens.
		for (let i = 0; i < data.length; i++) {
			let c = data.charAt(i);
			if (c == "\n" && !this.is_escaped(i, data)) {
				appended_token = this.append_batch(token, extended);
				if (appended_token != null) {
					appended_tokens.push(appended_token);
				}
				this.batch = "\n";
				const appended_line_token = this.append_batch("line", extended);
				if (appended_token != null) {
					appended_tokens.push(appended_token);
				}
				++this.line;
			} else {
				this.batch += c;
			}
		}

		// Last batch.
		appended_token = this.append_batch(token, extended);
		if (appended_token != null) {
			appended_tokens.push(appended_token);
		}

		// Handler.
		return appended_tokens;
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
		let is_regex = false; 									// only used for langauges that can define a regex as /hello/ such as js.
		let is_preprocessor = false; 							// only used for languages that have preprocessor statements such as cpp.
		let prev_non_whitespace_char = null; 					// the previous non whitespace character, EXCLUDING newlines, used to check at start of line.
		let multi_line_comment_check_close_from_index = null;	// the start index of the multi line comment because when a user does something like /*// my comment */ the comment would originally immediately terminate because of the /*/.

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
				if (
					this.single_line_comment_start !== false && 
					(
						(this.single_line_comment_start.length === 1 && char === this.single_line_comment_start) ||
						(this.single_line_comment_start.length !== 1 && this.eq_first(this.single_line_comment_start, info_obj.index))
					)
				) {
					is_comment = true;
					const res = callback(char, false, is_comment, is_multi_line_comment, is_regex, is_escaped, is_preprocessor);
					if (res != null) { return res; }
					continue;
				}
				
				
				// Multi line comments.
				if (
					this.multi_line_comment_start !== false &&
					(
						(this.multi_line_comment_start.length === 1 && char === this.multi_line_comment_start) ||
						(this.multi_line_comment_start.length !== 1 && this.eq_first(this.multi_line_comment_start, info_obj.index))
					)
				) {
					multi_line_comment_check_close_from_index = info_obj.index + this.multi_line_comment_start.length + this.multi_line_comment_end.length; // also add mlcomment end length since the mlc close looks backwards.
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
				!is_escaped &&
				info_obj.index >= multi_line_comment_check_close_from_index &&
				(
					(this.multi_line_comment_end.length === 1 && char == this.multi_line_comment_end) ||
					(this.multi_line_comment_end.length !== 1 && this.eq_first(this.multi_line_comment_end, info_obj.index - (this.multi_line_comment_end.length - 1)))
				)
			) {
				is_multi_line_comment = false;
				const res = callback(char, false, is_comment, true, is_regex, is_escaped, is_preprocessor);
				if (res != null) { return res; }
				continue;
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
	tokenize({
		code = null,
		stop_callback = undefined,
		build_html = false,
		is_insert_tokens = false,
	} = {}) {

		// Reset.
		this.reset();

		// Derived reset.
		if (this.derived_reset !== undefined) {
			this.derived_reset();
		}

		// Assign code when not already assigned.
		if (code !== null) {
			this.code = code;
		}

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
					this.append_batch("comment", {is_comment: true});
					this.batch = after;
				}
			}
			this.append_batch("comment_codeblock", {is_comment: true});
		}

		// Append previous batch when switching comment, string, regex, to something else.
		const auto_append_batch_switch = (default_append = true) => {
			if (this.is_comment_keyword) {
				this.append_batch("comment_keyword", {is_comment: true});
			} else if (this.is_comment_codeblock) {
				append_comment_codeblock_batch();
			} else if (this.is_comment) {
				this.append_batch("comment", {is_comment: true});
			} else if (this.is_str) {
				this.append_batch("string");
			} else if (this.is_regex) {
				this.append_batch("string");
			} else if (this.is_preprocessor) {
				this.append_batch("preprocessor");
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
		let shebang_allowed = true;
		let disable_start_of_line = false;
		let start_of_line_last_line = null;
		const stopped = this.iterate_code(this, null, null, (char, local_is_str, local_is_comment, is_multi_line_comment, local_is_regex, is_escaped, is_preprocessor) => {

			// Start of line.
			// Set start of line flag and line indent for parent closings on indent languages.
			// The start of line flag must still be true for the first non whitespace character.
			if (disable_start_of_line === false && (this.start_of_line || start_of_line_last_line != this.line)) {

				// Allow whitespace at the line start.
				if (char === " " || char === "\t") {
					++this.line_indent;
				}

				// Set the last line disabling the start_of_line flag for next characters.
				else {

					// Close parent, exclude whitespace only lines.
					if (this.indent_language === true && char !== "\n") {
						while (this.parents.length > 0 && this.parents[this.parents.length - 1][1] === this.line_indent) {
							--this.parents.length;
						}
					}

					// Set disable start of line flag for the next char.
					disable_start_of_line = true;
					start_of_line_last_line = this.line;
				}
			} else if (disable_start_of_line) {
				this.start_of_line = false;
			}

			//
			// Resume with if after "Start of line".
			//

			// Shebang.
			if (this.line === 0 && this.start_of_line && char === "#" && this.next_char === "!") {

				// Append previous batch.
				this.append_batch();

				// Do a lookup for the shebang.
				let shebang = "";
				let resume_index;
				for (resume_index = this.index; resume_index < this.code.length; resume_index++) {
					const c = this.code.charAt(resume_index);
					if (c === "\n") {
						break;
					}
					shebang += c;
				}

				// Get the last word boundary for the interpreter.
				let last_word_boundary;
				for (last_word_boundary = shebang.length - 1; last_word_boundary > 0; last_word_boundary--) {
					if (this.word_boundaries.includes(shebang.charAt(last_word_boundary))) {
						break;
					}
				}

				// Append tokens.
				if (last_word_boundary === 0) {
					this.batch = shebang;
					this.append_batch("comment");
				} else {
					++last_word_boundary;
					this.batch = shebang.substr(0, last_word_boundary);
					this.append_batch("comment");
					this.batch = shebang.substr(last_word_boundary); // interpreter.
					this.append_batch("keyword");
				}

				// Set resume on index.
				this.resume_on_index(resume_index - 1);
				return null;
			}

			// New line.
			else if (!is_escaped && char == "\n") {

				// Append previous batch, but snce newlines may be present in regexes, strings and comments, handle them correctly.
				auto_append_batch_switch();
				
				// Append line token.
				// this.batch += char;
				// this.append_batch("line");

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

				// Append line token.
				// Testing with after disabling the flags otherwise the newlines after a multi line comment will still count as a comment which it is not.
				this.batch += char;
				this.append_batch("line");

				// Check if a stop callback is defined for the partial tokenize.
				if (stop_callback !== undefined) {
					const stop = stop_callback(this.line, this.tokens[this.line]);
					if (stop) {
						return true;
					}
				}

				// Update vars.
				this.start_of_line = true;
				this.line_indent = 0;
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
							this.append_batch("keyword");
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

					// Disable the is post type def modifier.
					if (this.is_post_type_def_modifier) {
						this.is_post_type_def_modifier = false;
						if (this.on_post_type_def_modifier_end !== undefined) {
							const last_token = this.get_last_token();
							if (last_token != null) {
								this.on_post_type_def_modifier_end(this.post_type_def_modifier_type_def_token, last_token);
							}
						}
					}

					// Remove parent.
					if (this.indent_language === false) {
						while (this.parents.length > 0 && this.parents[this.parents.length - 1][1] === this.curly_depth) {
							--this.parents.length;
						}
					}
				}
				
				// Parentheses depth.
				if (char == "(") {
					++this.parenth_depth;

					//
					// @todo when an indent languages does not always define type def tokens with a keyword then the opening parenth indent should be set here but for now it is not required.
					//

				} else if (char == ")") {
					--this.parenth_depth;
				}

				// Template depth.
				// Cant be used since "x < y" is allowed.
				// if (char == "<") {
				// 	++this.template_depth;
				// } else if (char == ">") {
				// 	--this.template_depth;
				// }

				// Disable the is post type def modifier.
				if (this.is_post_type_def_modifier && char === ";") {
					this.is_post_type_def_modifier = false;
					if (this.on_post_type_def_modifier_end !== undefined) {
						const last_token = this.get_last_token();
						if (last_token != null) {
							this.on_post_type_def_modifier_end(this.post_type_def_modifier_type_def_token, last_token);
						}
					}
				}
				
				// End of comment.
				// Should proceed with the callback since the next character needs to be parsed.
				if (this.is_comment_keyword) {
					this.append_batch("comment_keyword", {is_comment: true});
					this.is_comment_keyword = false;
				}
				else if (this.is_comment_codeblock) {
					append_comment_codeblock_batch();
					this.is_comment_codeblock = false;
				}
				else if (this.is_comment) {
					this.append_batch("comment", {is_comment: true});
					this.is_comment = false;
					this.is_comment_keyword = false;
					this.is_comment_codeblock = false;
				}
				
				// End of string.
				// Should proceed with the callback since the next character needs to be parsed.
				else if (this.is_str) {
					this.append_batch("string");
					this.is_str = false;
				}
				
				// End of regex.
				// Should proceed with the callback since the next character needs to be parsed.
				else if (this.is_regex) {
					this.append_batch("string");
					this.is_regex = false;
				}

				// End of preprocessor.
				// Should proceed with the callback since the next character needs to be parsed.
				else if (this.is_preprocessor) {
					this.append_batch("preprocessor");
					this.is_preprocessor = false;
				}

				//
				// Stop the else if loop after here since the end of string / comment should be parsed as a new char.
				// Also `auto_append_batch()` is no longer required after here.
				//

				// Parse decorators.
				if (this.allow_decorators && char === "@") {

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
						this.append_batch("type", {is_decorator: true, parameters: []});
						this.index += batch.length - 1;
						return null;
					}

					// fallthrough.
				}

				// Highlight parameters.
				// @todo check if there are any post keywords between the ")" and "{" for c like langauges. Assign them to the type def token as "post_modifiers".
				// @todo check if there are any pre keywords between before the "funcname(", ofc exclude "function" etc, cant rely on the type def tokens. Assign them to the type def token as "pre_modifiers".
				// @todo when using a lot of tuple like functions `(() => {})()` which are often used in typescript, this becomes waaaaayy to slow.
				else if (this.allow_parameters && char === ")") {

					// ---------------------------------------------------------

					// Append batch by word boundary.
					this.append_batch();

					// Vars.
					let opening_parenth_token;
					let after_parenth_index;

					// Append word boundary.
					const finalize = () => {
						this.batch += char;
						this.append_batch(null, {is_word_boundary: true}); // do not use "false" as parameter "token" since the word boundary may be an operator.
						return null;
					}

					// ---------------------------------------------------------
					// Get the opening parentheses.

					// Check character after closing parentheses.
					after_parenth_index = this.get_first_non_whitespace(this.index + 1, true);

					// Get the tokens inside the parentheses at the correct pareth depth and skip all word boundaries except ",".
					let parenth_depth = 0, curly_depth = 0, bracket_depth = 0, parenth_tokens = [];
					let is_assignment_parameters = false, first_token = true;
					const found = this.tokens.iterate_tokens_reversed((token) => {

						// Set depths.
						if (token.token === undefined && token.data.length === 1) {
							if (token.data === ")") {
								++parenth_depth;
							} else if (token.data === "(") {
								if (parenth_depth === 0) {
									opening_parenth_token = token;
									return true;
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

						// Check if are js assignment params defined like `myfunc({param = ...})`.
						if (first_token && (token.data.length > 1 || (token.data != " " && token.data != "\t" && token.data != "\n"))) {
							is_assignment_parameters = token.data.length === 1 && token.data === "}";
							first_token = false;
						}

						// Append token.
						token.at_correct_depth = parenth_depth === 0 && bracket_depth === 0 && ((is_assignment_parameters && curly_depth <= 1) || curly_depth <= 0);
						parenth_tokens.push(token);
					});

					// Opening parenth not found.
					if (opening_parenth_token == null) {
						return finalize();
					}

					// ---------------------------------------------------------
					// Parse the paramaters.


					// The target type token to which the parameters will be assigned to.
					let type_token;

					// Get token before the opening parenth.
					const token_before_opening_parenth = this.get_prev_token(opening_parenth_token.index - 1, [" ", "\t", "\n"]);
					if (token_before_opening_parenth == null) {
						return finalize();
					}

					// Do not continue when the token before the parent is a keyword, for statements like "if ()".
					// Since that will never be a type or type def so also do not highlight the params etc.
					// Except for certain keywords that are allowed in some languages.
					const is_keyword = token_before_opening_parenth.token === "keyword";
					if (is_keyword && this.allowed_keywords_before_type_defs.includes(token_before_opening_parenth.data) === false) {
						return finalize();
					}

					// When the token before the opening parenth token already is a decorator, type or type_def there is no need to call on parenth close.
					// When type def keywords are used this is possible, and with decorators ofcourse.
					if (
						token_before_opening_parenth != null && 
						(
							token_before_opening_parenth.is_decorator === true ||
							token_before_opening_parenth.token === "type" ||
							token_before_opening_parenth.token === "type_def"
						)
					) {
						type_token = token_before_opening_parenth;
					}
					
					// Call the on parenth close.
					else if (this.on_parenth_close !== undefined) {
						type_token = this.on_parenth_close({
							token_before_opening_parenth: token_before_opening_parenth,
							after_parenth_index: after_parenth_index,
						})
					}

					// Set flags for type def tokens.
					if (type_token != null && type_token.token === "type_def") {

						// Enable the is post type def modifier flag.
						this.is_post_type_def_modifier = true;
						this.post_type_def_modifier_type_def_token = type_token;

						// Assign parents to the type token.
						// But only when the callback has not already assigned parents.
						if (type_token.parents === undefined && type_token.is_decorator !== true && (this.parents.length === 0 || this.parents.last()[0] !== type_token)) {
							this.assign_parents(type_token)	;
						}

					}

					// Create the array with parameters and assign the token_param to the tokens.
					let mode = 1; // 1 for key 2 for value.
					const params = [];

					// Initialize a parameter object.
					const init_param = () => {
						return {
							name: null, 	// the parameter name.
							index: null, 	// the parameter index.
							value: [], 		// the default value tokens.
							type: [], 		// the type tokens.
						};
					}

					// Append a parameter object.
					const append_param = (param) => {
						if (param !== undefined) {
							param.type = this.trim_tokens(param.type);
							param.value = this.trim_tokens(param.value);
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
								if (parenth_tokens[next_i + 1] != null && parenth_tokens[next_i + 1].token === "operator") {
									return null;
								}
								return next;
							} else if (next.data.length !== 1 || (next.data !== " " && next.data !== "\t" && next.data === "\n")) {
								return null;
							}
							--next_i;
						}
						return null;
					}

					// Iterate the parenth tokens.
					const is_type_def = type_token != null && type_token.token === "type_def";
					const is_decorator = type_token != null && type_token.is_decorator === true;

					let param;
					let is_type = true;
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
							is_type = true;
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
								at_correct_depth === false
							) {
								return null;
							}

							// Assign to parameter.
							if (is_type && (token.token === "keyword" || token.token === "type" || token.is_whitespace === true || token.token === "operator" || token.data.includes("."))) {
								param.type.push(token);
							} else {
								is_type = false;
								const allow_assignment = token.token === "type_def" || (token.token === undefined && token.data !== "{" && token.data !== "}" && token.data !== "(" && token.data !== ")" && token.data !== "[" && token.data !== "]");

								// On a type definition always assign to parameter.
								// Check for token undefined since decorators should still assign the param.value when it is not an assignment operator.
								// Also allow type def token null to assign params since this can be the case in annoumys js funcs like `iterate((item) => {})`;
								if ((is_type_def || type_token === null) && allow_assignment) {
									if (token.is_whitespace === true || token.is_word_boundary === true) {
										return null; // skip inside here since word boundaries and whitespace are allowed inside decorator values.
									}
									param.name = token.data.trim();
									token.token = "parameter";
								}

								// When the token is a type there must be a "=" after this tokens.
								// Check for token undefined since decorators should still assign the param.value when it is not an assignment operator.
								else if (!is_type_def) {
									const next = get_next_assignment_operator(i);
									if (next !== null && allow_assignment) {
										if (token.is_whitespace === true || token.is_word_boundary === true) {
											return null; // skip inside here since word boundaries and whitespace are allowed inside decorator values.
										}
										param.name = token.data.trim();
										token.token = "parameter";
									}
									else if (next === null && is_decorator) {
										param.value.push(token);
									}
								}
							}
						}

						// When value.
						else if (mode === 2 && (is_type_def || is_decorator)) {
							param.value.push(token);
						}
					})

					// Add last param.
					append_param(param);

					// Assign params to the type def token.
					if (is_type_def || is_decorator) {
						type_token.parameters = params;
						if (is_assignment_parameters === true) {
							type_token.is_assignment_parameters = true;
						}
						type_token.parameter_tokens = [];
						parenth_tokens.iterate_reversed((token) => {
							type_token.parameter_tokens.push(token);
						})
					}
					
					// ---------------------------------------------------------
					// Append to batch.

					// Append word boundary to tokens.
					return finalize();
				}

				// Call the handler.
				// And append the character when not already appended by the handler.
				// Always use if so previous if statements can use a fallthrough.
				if (this.callback === undefined || this.callback(char, is_escaped, this.is_preprocessor) !== true) {

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
			is_insert_tokens === false &&
			stop_callback == null &&
			(last_line === undefined || (last_line.length > 0 && last_line[last_line.length - 1].is_line_break))
		) {
			this.tokens.push([]);
		}

		// console.log(`append_token time: ${this.append_token_time}ms.`);
		// console.log(`get_prev_token time: ${this.get_prev_token_time}ms.`);

		// Build html.
		if (build_html) {
			return this.build_html();
		}

		// Return tokens.
		else  {
			return this.tokens;
		}
	}

	// Partial tokenize.
	/*	@docs: {
		@title Partial tokenize
		@description: Partially tokenize text based on edited lines.
		@warning: the `parents`, `pre_modifiers`, `post_modifiers`, `templates` and `requires` attributes on the type def tokens will not be correct when using `partial_tokenize()`.
		@parameter: {
			@name: code
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
		code = null,
		edits_start = null,
		edits_end = null,
		line_additions = 0,
		tokens = [],
		build_html = false,
	}) {

		// Assign code when not assigned.
		// So the user can also assign it to the tokenizer without cause two copies.
		if (code !== null) {
			this.code = code;
		}

		// Reset.
		this.reset();

		// Derived reset.
		if (this.derived_reset !== undefined) {
			this.derived_reset();
		}

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
		// Start one line before the edits_start since a "{" or "}" may already be on that line which can cause issues when editing a func def.
		if (edits_start != 0) {

			// Find start scope by type def tokens.
			if (this.seperate_scope_by_type_def === true) {
				let parenth_depth = 0, bracket_depth = 0;
				tokens.iterate_reversed(0, edits_start, (line_tokens) => {

					// Skip on empty line tokens.
					if (line_tokens.length === 0) {
						return null;
					}

					// Vars.
					let found_separator = null;

					// Check if the line contains a scope separator.
					line_tokens.iterate_reversed((token) => {

						// Depths.
						if (token.token === undefined && token.data === "(") {
							--parenth_depth;
						}
						else if (token.token === undefined && token.data === ")") {
							++parenth_depth;
						}
						else if (token.token === undefined && token.data === "[") {
							--bracket_depth;
						}
						else if (token.token === undefined && token.data === "]") {
							++bracket_depth;
						}

						// Found type def at zero depth.
						else if (token.token === "type_def" && depth === 0) {
							found_separator = token.line;
							return true;
						}
					})

					// Do not stop when the first token is a comment, string etc because it may resume on the next line.
					const first_token = line_tokens[0];
					if (
						found_separator !== null &&
						first_token.token !== "comment" &&
						first_token.token !== "string" &&
						first_token.token !== "token_regex" &&
						first_token.token !== "preprocessor"
					) {
						scope_start = first_token.line;
						scope_start_offset = first_token.offset;
						return true;
					}
				})
			}

			// Find start scope by scope seperators.
			else {
				let use_curly = false;
				let curly_depth = 0;
				const scope_separators = [];
				this.scope_separators.iterate((item) => {
					if (item == "{" && item == "}") { use_curly = true; }
					else { scope_separators.push(item); }
				})
				tokens.iterate_reversed(0, edits_start, (line_tokens) => {

					// Skip on empty line tokens.
					if (line_tokens.length === 0) {
						return null;
					}

					// Vars.
					let found_separator = null;

					// Check if the line contains a scope separator.
					line_tokens.iterate_reversed((token) => {

						// Opening curly.
						if (use_curly && token.token === undefined && token.data === "{") {
							if (curly_depth === 0) {
								found_separator = token.line;
								return true;
							}
							--curly_depth;
						}

						// Closing curly.
						else if (use_curly && token.token === undefined && token.data === "}") {
							++curly_depth;
						}

						// Any other scope seperators.
						else if (
							(token.token === undefined || token.token === "operator") &&
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
						first_token.token !== "comment" &&
						first_token.token !== "string" &&
						first_token.token !== "token_regex" &&
						first_token.token !== "preprocessor"
					) {
						scope_start = first_token.line;
						scope_start_offset = first_token.offset;
						// console.log(scope_start);
						return true;
					}
				})
			}
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
		// Also resume when the original line tokens at the adjusted line does not exist since then multiple new lines have been added.
		let insert_start_line = scope_start;
		let insert_end_line = null;
		let curly_depth = 0, bracket_depth = 0, parenth_depth = 0;
		const stop_callback = (line, line_tokens) => {

			// The bracket, curly and parentheses depth must all be zero to capture the full scope.
			line_tokens.iterate((token) => {
				if (token.token === undefined && token.data.length === 1) {
					if (token.data === "{") { ++curly_depth; }
					else if (token.data === "}") { --curly_depth; }
					else if (token.data === "(") { ++parenth_depth; }
					else if (token.data === ")") { --parenth_depth; }
					else if (token.data === "[") { ++bracket_depth; }
					else if (token.data === "]") { --bracket_depth; }
				}
			})

			// Stop when not all depths are zero.
			if (curly_depth !== 0 || bracket_depth !== 0 || parenth_depth !== 0) {
				return false;
			}

			// Check if the lines match.
			line += scope_start;
			const adjusted_line = line - line_additions;
			if (line > edits_end && tokens[adjusted_line] !== undefined && match_lines(tokens[adjusted_line], line_tokens)) {
				insert_end_line = adjusted_line;
				return true;
			}
			return false;
		};

		// Tokenize.
		this.code = this.code.substr(scope_start_offset, this.code.length - scope_start_offset);
		const insert_tokens = this.tokenize({stop_callback: stop_callback});

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

		// Initialize combined tokens.
		let combined_tokens = new vhighlight.Tokens();

		// Insert tokens into the current tokens from start line till end line.
		// So the new tokens will old start till end lines will be removed and the new tokens will be inserted in its place.
		// The start line will be removed, and the end line will be removed as well.
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

		// Assign to tokens.
		this.tokens = combined_tokens;

		// Build html.
		if (build_html) {
			return this.build_html();
		}

		// Return tokens.
		else  {
			return this.tokens;
		}
	}

	// Build the html from tokens.
	build_html({tokens = null, token_prefix = "token_", reformat = true, lt = "<", gt = ">"} = {}) {

		// Vars.
		if (tokens == null) {
			tokens = this.tokens;
		}
		let html = "";

		// Build a token's html.
		const build_token = (token) => {
			if (token.token === undefined) {
				if (reformat) {
					html += token.data.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
				} else {
					html += token.data;
				}
			} else {
				let class_ = "";
				if (token.token !== undefined) {
					class_ = `class="${token_prefix}${token.token}"`;
				}
				if (reformat) {
					html += `${lt}span ${class_}${gt}${token.data.replaceAll("<", "&lt;").replaceAll(">", "&gt;")}${lt}/span${gt}`
				} else {
					html += `${lt}span ${class_}${gt}${token.data}${lt}/span${gt}`
				}
			}
		}
		
		// Iterate an array with token objects.
		// console.log("TOKENS:", tokens);
		if (tokens.length > 0) {
			if (Array.isArray(tokens[0])) {
				tokens.iterate((line_tokens) => {
					line_tokens.iterate(build_token);
				});
			} else {
				tokens.iterate(build_token);
			}
		}
		
		// Handler.
		return html;
	}
}
