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

// Last.
if (Array.prototype.last === undefined) {
	Array.prototype.last = function() {
	    return this[this.length - 1];
	};
}

// Nested curly/bracket/parenth depth.
vhighlight.NestedDepth = class NestedDepth {
	constructor(curly, bracket, parenth) {
		this.curly = curly;
		this.bracket = bracket;
		this.parenth = parenth;
	}
	assign(curly, bracket, parenth) {
		this.curly = curly;
		this.bracket = bracket;
		this.parenth = parenth;
	}
	eq(other) {
		return this.curly === other.curly && this.bracket === other.bracket && this.parenth === other.parenth;
	}
	gt(other) {
		return this.curly < other.curly && this.bracket < other.bracket && this.parenth < other.parenth;
	}
	gte(other) {
		return this.curly <= other.curly && this.bracket <= other.bracket && this.parenth <= other.parenth;
	}
	lt(other) {
		return this.curly > other.curly && this.bracket > other.bracket && this.parenth > other.parenth;
	}
	lte(other) {
		return this.curly >= other.curly && this.bracket >= other.bracket && this.parenth >= other.parenth;
	}
	eq_values(curly, bracket, parenth) {
		return this.curly === curly && this.bracket === bracket && this.parenth === parenth;
	}
	process_token(token) {
		if (token.token == null) {
			switch (token.data) {
				case "{": ++this.curly; break;
				case "}": --this.curly; break;
				case "[": ++this.bracket; break;
				case "]": --this.bracket; break;
				case "(": ++this.parenth; break;
				case ")": --this.parenth; break;
			}
		}
	}
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

// Copy of `vlib.internal.obj_eq` function.
vhighlight.internal.obj_eq = function(x, y) {
    if (typeof x !== typeof y) { return false; }
    else if (x instanceof vhighlight.TokenizerState) {
    	if (!(y instanceof vhighlight.TokenizerState)) {
    		return false;
    	}
		return x.equals(y);
	}
    else if (x instanceof String) {
        return x.toString() === y.toString();
    }
    else if (Array.isArray(x)) {
        if (!Array.isArray(y) || x.length !== y.length) { return false; }
        for (let i = 0; i < x.length; i++) {
            if (!vhighlight.internal.obj_eq(x[i], y[i])) {
                return false;
            }
        }
        return true;
    }
    else if (x != null && typeof x === "object") {
        const x_keys = Object.keys(x);
        const y_keys = Object.keys(y);
        if (x_keys.length !== y_keys.length) {
            return false;
        }
        for (const key of x_keys) {
            // if (!y.hasOwnProperty(key)) {
            if (!vhighlight.internal.obj_eq(x[key], y[key])) {
                return false
            }
            // }
        }
        return true;
    }
    else {
        return x === y;
    }
}

// Copy of `vweb.utils.deep_copy` function.
vhighlight.internal.deep_copy = function(obj) {
	if (obj instanceof vhighlight.TokenizerState) {
		return obj.clone();
	}
    else if (Array.isArray(obj)) {
        const copy = [];
        obj.iterate((item) => {
            copy.append(vhighlight.internal.deep_copy(item));
        })
        return copy;
    }
    else if (obj !== null && obj instanceof String) {
        return new String(obj.toString());
    }
    else if (obj !== null && typeof obj === "object") {
        const copy = {};
        const keys = Object.keys(obj);
        const values = Object.values(obj);
        for (let i = 0; i < keys.length; i++) {
            copy[keys[i]] = vhighlight.internal.deep_copy(values[i]);
        }
        return copy;
    }
    else {
        return obj;
    }
}

// State class for line by line highlighting style also used in the monaco editor.
vhighlight.TokenizerState = class TokenizerState {

	// Constructor.
	constructor(data = {}) {
		this.data = data;
	}

	// Equals other state.
	equals(other) {
		return vhighlight.internal.obj_eq(this.data, other.data);
	}

	// Clone state.
	clone() {
		return new TokenizerState(vhighlight.internal.deep_copy(this.data));
	}
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
		multi_line_comment_only_at_start = false,
		allow_strings = true,
		allow_strings_double_quote = true,
		allow_numerics = true,
		allow_preprocessors = false,
		allow_slash_regexes = false,
		allow_comment_keyword = true,
		allow_comment_codeblock = true,
		allow_parameters = true,
		allow_decorators = false,
		allowed_keywords_before_type_defs = [],
		excluded_word_boundary_joinings = [],
		is_indent_language = false,
		is_type_language = false,
		
		// Attributes for partial tokenizing.
		scope_separators = [
			"{", 
			"}", 
			// do not use ; and : etc since they can be used inside a {} scope for cpp, js etc.
		],
		seperate_scope_by_type_def = false,

		// Compiler options.
		compiler = false,

		// Language.
		language = null,
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
		this.multi_line_comment_start_is_array = Array.isArray(this.multi_line_comment_start);
		this.multi_line_comment_end = multi_line_comment_end;							// the language's multi line comment end characters, use "false" when the language does not support this.
		this.multi_line_comment_only_at_start = multi_line_comment_only_at_start;		// should be enabled if the multi line comments can only be defined at the start of the line (such as in python).
		this.allow_strings = allow_strings;												// if the language supports strings.
		this.allow_strings_double_quote = allow_strings_double_quote;					// allow strings by double qoute.
		this.allow_numerics = allow_numerics;											// if the language supports numerics.
		this.allow_preprocessors = allow_preprocessors;									// if the language has "#..." based preprocessor statements.
		this.allow_slash_regexes = allow_slash_regexes;									// if the language has "/.../" based regex statements.
		this.allow_comment_keyword = allow_comment_keyword;								// allow comment keywords.
		this.allow_comment_codeblock = allow_comment_codeblock;							// allow comment codeblocks.
		this.allow_parameters = allow_parameters;										// allow parameters.
		this.allow_decorators = allow_decorators;										// allow decorators.
		this.allowed_keywords_before_type_defs = allowed_keywords_before_type_defs; 	// the allowed keywords before the name of a type definition, such as "async" and "static" for js, but they need to be directly before the type def token, so no types in between in for example c++.
		this.is_indent_language = is_indent_language;									// whether the language specifies scope's with indent, such as python.
		this.is_type_language = is_type_language;										// is a type language for instance true for cpp and false for js.
		this.scope_separators = scope_separators;										// scope separators for partial tokenize.
		this.seperate_scope_by_type_def = seperate_scope_by_type_def;					// only seperate a scope by token type def's for example required in cpp.
		this.compiler = compiler;														// compiler options.
		this.language = language;

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

		// @deprecated this callback is DEPRECATED
		// The on parenth callback.
		// This callback is called when a parentheses closes and the token before the opening parenth is not a keyword unless it is a keyword that is allowed by the `allowed_keywords_before_type_defs` array.
		// - The on parenth close will not be called when the token before the parenth opening is a keyword.
		// - The on parenth close callback should return the type or type def token when it has assigned one, so the parsed parameters can be assigned to that token.
		// this.on_parenth_close = function({token_before_opening_parenth: token_before_opening_parenth, after_parenth_index: after_parenth_index}) {return token};

		// The on type def keyword callback.
		// This callback is called when a type def token is detected by the "type_def_keywords" array.
		// - @warning When this callback is defined the tokenizer will not add the type def tokens parents to the tokenizer when the event is fired, so the event needs to take care of this.
		// - Will be called if one of the type def keywords is matched.
		// - When on_parenth_close is defined and has not yet called `assigned_parents()` on the returned type token the parents will be added automatically, also when on_parenth_close is not defined / not called.
		// - The parameter token, is the type def token after the matched keyword.
		// this.on_type_def_keyword = function(token) {};

		// On parenth opening callback.
		// The callback can return a token that will be seen as the primary type(def) token, when nothing is returned the passed token will be used for checkings in type(defs).
		// The callback should not append the current char or token, the ")" will be appended after the callback,
		// The batch has already been appended before this, call making the last token the token before the "(", this token is also passed as parameter.
		// this.on_parenth_open = function (token_before_parenth) {};

		// The on post type def modifier end callback.
		// This callback is called when you can parse the post modifiers after a type definition, so for example when the "{" is reached after a type def.
		// However this callback is not called for a type def detected by "type_def_keywords", that should be handled with the "on_type_def_keyword" callback.
		// - The parameter token, is the token where the post type def modifier range ended so the token before either a "{" or ";".
		// - The return value of the callback will not be used and may be anything.
		// this.on_post_type_def_modifier_end = (token) => {};
 
		// Init vars that should be reset before each tokenize.
		this.reset();

		// Some alias attributes.
		this.is_js = this.language === "JS";
		this.is_py = this.language === "Python";
		this.is_cpp = this.language === "C++";

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
		this.is_comment_keyword_multi_line = false;			// is @keyword inside multi line.
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
		this.prev_nw_token_data = null;						// the previous non whitespace or linebreak token data.
		this.is_post_type_def_modifier = false;				// is between the closing parentheses and the opening curly or semicolon.
		this.post_type_def_modifier_type_def_token = null;	// the type def token from that for the on post type def modifier end callback.

		this.is_keyword_before_parentheses = false;			// is is keyword before parenth open token used not to highlight types inside parentheses of keywords before parentheses for languages with types.
															// @warning: only assigned when `is_type_language` is `true` and the keyword is not one of the `allowed_keywords_before_type_defs`.
		this.last_non_whiste_space_line_break_token = null;	// the last non whitespace non line break token that was appended.

		this.after_dot_is_type_js = false;					// used to assign type to the token after the . inside an extends so for like "MyClass" in "extends mylib.MyClass".
		this.func_end_queue = [];							// used to detect the end of a function, currently only in js.

		this.inside_parameters = [];						// flags for tokens currently inside parameters.
		this.preprocess_code = true;						// preprocess the code or only execute the callback and do nothing else.

		// Variables from the main loop iterate_code func().
		this.iter_code_is_comment = false;
		this.iter_code_is_multi_line_comment = false;
		this.iter_code_string_char = null;
		this.iter_code_is_regex = false; 								
		this.iter_code_is_preprocessor = false; 							
		this.iter_code_prev_non_whitespace_char = null; 					
		this.iter_code_multi_line_comment_check_close_from_index = null;	
		this.iter_code_inside_template_curly_depth = 0;					
		this.iter_code_inside_template_curly_end = [];					
		this.iter_code_forced_multi_line_comment_end = null;				

		// Performance.
		// this.get_prev_token_time = 0;
		// this.append_token_time = 0;
	}

	// Restore or set state for line by line highlighting method also used in the monaco editor.
	// This only supports a line-by-line basis, not anything else.
	// The retrieved and restored states will always be cloned without references to the original state.
	state(state = null) {

		// Retrieve state.
		if (state == null) {
			const data = {
				// tokens: this.tokens,
				// added_tokens: this.added_tokens,
				// index: this.index,
				prev_char: this.prev_char,
				next_char: this.next_char,
				// batch: this.batch,
				// line: this.line,
				is_comment: this.is_comment,
				is_str: this.is_str,
				is_regex: this.is_regex,
				is_preprocessor: this.is_preprocessor,
				is_comment_keyword: this.is_comment_keyword,
				is_comment_keyword_multi_line: this.is_comment_keyword_multi_line,
				is_comment_codeblock: this.is_comment_codeblock,
				parenth_depth: this.parenth_depth,
				bracket_depth: this.bracket_depth,
				curly_depth: this.curly_depth,
				// template_depth: this.template_depth,
				next_token: this.next_token,
				// offset: this.offset,
				parents: this.parents,
				// line_indent: this.line_indent,
				// start_of_line: this.start_of_line,
				prev_nw_token_data: this.prev_nw_token_data,
				is_post_type_def_modifier: this.is_post_type_def_modifier,
				post_type_def_modifier_type_def_token: this.post_type_def_modifier_type_def_token,
				is_keyword_before_parentheses: this.is_keyword_before_parentheses,
				last_non_whiste_space_line_break_token: this.last_non_whiste_space_line_break_token,
				after_dot_is_type_js: this.after_dot_is_type_js,
				func_end_queue: this.func_end_queue,
				inside_parameters: this.inside_parameters,
				preprocess_code: this.preprocess_code,

				iter_code_is_comment: this.iter_code_is_comment,
				iter_code_is_multi_line_comment: this.iter_code_is_multi_line_comment,
				iter_code_string_char: this.iter_code_string_char,
				iter_code_is_regex: this.iter_code_is_regex,
				iter_code_is_preprocessor: this.iter_code_is_preprocessor,
				iter_code_prev_non_whitespace_char: this.iter_code_prev_non_whitespace_char,
				// iter_code_multi_line_comment_check_close_from_index: this.iter_code_multi_line_comment_check_close_from_index,
				iter_code_inside_template_curly_depth: this.iter_code_inside_template_curly_depth,
				iter_code_inside_template_curly_end: this.iter_code_inside_template_curly_end,
				iter_code_forced_multi_line_comment_end: this.iter_code_forced_multi_line_comment_end,
			};
			if (this.derived_retrieve_state) {
				this.derived_retrieve_state(data);
			}
			return new vhighlight.TokenizerState(vhighlight.internal.deep_copy(data));
		}

		// Restore state.
		const keys = Object.keys(state.data);
		for (let i = 0; i < keys.length; i++) {
			if (typeof state.data[keys[i]] === "object" && state.data[keys[i]] != null) {
				this[keys[i]] = vhighlight.internal.deep_copy(state.data[keys[i]]);
			}
			else {
				this[keys[i]] = state.data[keys[i]];
			}
		}
	}

	// Generate a random string.
	_random = function(length = 32) {
	    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	    let result = "";
	    for (let i = 0; i < length; i++) {
	        result += chars.charAt(Math.floor(Math.random() * chars.length));
	    }
	    return result;
	}

	// Add a parent.
	add_parent(token, curly_depth = null, parenth_depth = null) {
		if (token.data.length > 0) {
			if (this.is_indent_language) {
				this.parents.push({token: token, indent: this.line_indent});
			} else {
				if (curly_depth == null) {
					curly_depth = this.curly_depth;
				}
				if (parenth_depth == null) {
					parenth_depth = this.parenth_depth;
				}
				this.parents.push({token: token, curly: curly_depth, parenth: parenth_depth}); // also add parenth for js in case of `class MyClass extends someFunc({}) { ... }`
			}
		}
	}

	// Assign parent to token.
	assign_parents(token) {
		token.parents = [];
		this.parents.iterate((item) => {
			token.parents.push(item.token);
		})
	}

	// Copy the parents without any reference.
	copy_parents() {
		let copy = [];
		this.parents.iterate((item) => {
			copy.push({...item});
		})
		return copy;
	}

	// Get the last token.
	// Returns null when there is no last token.
	get_last_token(exclude = []) {
		return this.tokens.iterate_tokens_reversed((token) => {
			if (token.data != "" && (exclude.length === 0 || !exclude.includes(token.data))) {
				return token;
			}
		})
	}

	// Fetch the previous token before another token.
	get_prev_token_by_token(token, exclude = [" ", "\t", "\n"], also_check_current_token = false, exclude_comments = false) {
		if (token === "last") {
			if (this.tokens[this.line] == null) {
				token = null;
			} else {
				token = this.tokens[this.line];
				if (token) { token = token.last() };
			}
		}
		if (token === null) {
			return null;
		}
		let line = token.line;
		let col = token.col;
		const get_prev = () => {
			if (line < 0) { return null; }
			else if (col === 0) {
				if (line === 0) { return null; }
				--line;
				col = this.tokens[line].length - 1;
				return this.tokens[line][col];
			}
			--col;
			return this.tokens[line][col];	
		}
		if (also_check_current_token) {
			do {
				if (exclude_comments && token.is_comment) {
					continue;
				}
				else if (
					token.data != "" && !exclude.includes(token.data)
				) {
					return token;
				}
			}
			while ((token = get_prev()) != null);
		} else {
			while ((token = get_prev()) != null) {
				if (exclude_comments && token.is_comment) {
					continue;
				}
				else if (
					token.data != "" && !exclude.includes(token.data)
				) {
					return token;
				}
			}
		}
		return null;
	}

	// Fetch the next token after another token.
	get_next_token_by_token(token, exclude = [" ", "\t", "\n"], exclude_comments = false) {
		if (token === null) { return null; }
		let line = token.line, col = token.col;
		const get_next = () => {
			if (line > this.line) { return null; }
			else if (col === this.tokens[line].length - 1) {
				if (line === this.line) { return null; }
				++line;
				col = 0;
				return this.tokens[line][col];
			}
			++col;
			return this.tokens[line][col];	
		}
		while ((token = get_next()) != null) {
			if (exclude_comments && token.is_comment) {
				continue;
			}
			else if (
				token.data != "" && !exclude.includes(token.data)
			) {
				return token;
			}
		}
		return null;
	}

	// Fetch the first non whitespace token going backwards from the specified index.
	// So it also tests the specified index. If the previous token data is excluded it checks one further back.
	// Also supports index as an {line, col} object.
	// @warning: When the index is an object with line col, then the line col is the current position whicg will be decreased and returned, so do not decrease already.
	get_prev_token(index, exclude = [" ", "\t", "\n"], exclude_comments = false) {
		// const now = Date.now();
		if (index === null) { return null; }
		else if (typeof index === "object") {
			const get_prev = () => {
				if (index.line < 0) { return null; }
				else if (index.col === 0) {
					if (index.line === 0) { return null; }
					--index.line;
					index.col = this.tokens[index.line].length - 1;
					return this.tokens[index.line][index.col];
				}
				--index.col;
				return this.tokens[index.line][index.col];	
			}
			let token;
			while ((token = get_prev()) != null) {
				if (exclude_comments && token.is_comment) {
					continue;
				}
				else if (
					token.data != "" && !exclude.includes(token.data)
				) {
					return token;
				}
			}
			return null;
		}
		else {
			return this.tokens.iterate_tokens_reversed((token) => {
				if (token.index <= index) {
					if (exclude_comments && token.is_comment) {
						return null;
					}
					if (token.data != "" && !exclude.includes(token.data)) {
						return token;
					}
				}
			})
		}
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
	eq_first_of(array, start_index = 0) {
	    for (let i = 0; i < array.length; i++) {
	    	if (this.eq_first(array[i], start_index)) {
	    		return i;
	    	}
	    }
	    return null;
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
				if (char === opener) {
					++depth;
				} else if (char === closer) {
					--depth;
					if (depth === 0) {
						return info_obj.index;
					}
				}
			}
		});
	}

	// Get the token of the opening parentheses / curly / bracket.
	// - The index parameter is the index of the token, not the offset of the token.
	// - The specified token index MUST be the closing token of the scope.
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
		let result = null;
		this.tokens.iterate_reversed((line_tokens) => {
			if (line_tokens.length > 0) {
				line_tokens.iterate_reversed((token) => {
					if (token.index <= start_index) {
						if (token.data === opener) {
							--depth;
							if (depth === 0) {
								result = token;
								return false;
							}
						} else if (token.data === closer) {
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
	get_first_non_whitespace(index, include_line_breaks = false) {
		if (index == null) {
			return null;
		}
		let end;
		for (end = index; end < this.code.length; end++) {
			const c = this.code.charAt(end);
			if (c !== " " && c !== "\t" && (include_line_breaks === false || c !== "\n")) {
				return end;
			}
		}
		return null;
	}

	// Get the first whitespace character from a given index.
	// - Returns the index of the found char.
	// - Returns "null" when the index is "null" to limit the if else statements.
	get_first_whitespace(index, include_line_breaks = false, def = null) {
		if (index == null) {
			return def;
		}
		let end;
		for (end = index; end < this.code.length; end++) {
			const c = this.code.charAt(end);
			if (c === " " || c === "\t" || (include_line_breaks && c === "\n")) {
				return end;
			}
		}
		return def;
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
		return char.length > 0 && Tokenizer.alphabet.includes(char);
	}

	// Is an uppercase alphabetical character.
	is_uppercase(char) {
		return char.length > 0 && Tokenizer.uppercase_alphabet.includes(char);
	}
	is_full_uppercase(str, other_allowed_chars = null) {
		if (str.length === 0) {
			return false;
		}
		for (let i = 0; i < str.length; i++) {
			if (
				Tokenizer.uppercase_alphabet.includes(str.charAt(i)) === false &&
				(other_allowed_chars === null || other_allowed_chars.includes(str.charAt(i)) === false)
			) {
				return false;
			}
		}
		return true;
	}

	// Is a numeric character.
	is_numerical(char) {
		return char.length > 0 && Tokenizer.numerics.includes(char);
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
				token.col = 0;
				this.tokens[token.line] = [token];
			} else {
				token.col = this.tokens[token.line].length;
				this.tokens[token.line].push(token);
			}
		})
	}

	// Assign new tokens to tokenizer.
	// Tokens with the attribute `remove = true` will not be assigned.
	assign_tokens(tokens) {
		this.tokens = new vhighlight.Tokens();
		this.line = 0;
		this.offset = 0;
		this.added_tokens = 0;
		tokens.iterate_tokens((token) => {
			if (token.remove === true) {
				return null;
			}
			token.line = this.line;
			if (token.is_line_break) {
				++this.line;
			}
			token.offset = this.offset;
			this.offset += token.data.length;
			token.index = this.added_tokens;
			++this.added_tokens;
			if (this.tokens[token.line] === undefined) {
				token.col = 0;
				this.tokens[token.line] = [token];
			} else {
				token.col = this.tokens[token.line].length;
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

	// Assign token as type or type_def.
	assign_token_as_type(token) {
		token.token = "type";

		// Add depths.
		// @warning not reliable since it might be assigned after a parenth etc.
		// @todo remove reliance on this from JSCompiler.
		// token.curly_depth = this.curly_depth;
		// token.parenth_depth = this.parenth_depth;
		// token.bracket_depth = this.bracket_depth;
	}
	assign_token_as_type_def(token, opts = {start_token: null}) {
		token.token = "type_def"

		// When the type def is a constructor, then assign a reference to the parent.
		// This is useful and libris depends on this.
		if (
			token.parents != null && token.parents.length > 0 &&
			((this.is_js && token.data === "constructor") || (this.is_py && token.data === "__init__"))
		) {
			const class_parent = token.parents[0];
			class_parent.constructor_index = token.index;
		}

		// Add depths.
		// @warning not reliable since it might be assigned after a parenth etc.
		// @todo remove reliance on this from Libris and JSCompiler.
		// token.curly_depth = this.curly_depth;
		// token.parenth_depth = this.parenth_depth;
		// token.bracket_depth = this.bracket_depth;

		// Compiler options.
		// Adds attributes: curly_depth parenth_depth bracket_depth
		if (this.compiler) {

			// Set start token.
			let start_token = token;
			if (opts.start_token != null) {
				start_token = opts.start_token;
			}

			// Try a little lookback to see if earlier tokens are also part of the function (only in js).
			else if (this.is_js) {
				let prev = token;
				let must_be_keyword = false;
				let allow_next = false;
				while ((prev = this.get_prev_token_by_token(prev, [" ", "\t", "\n"])) != null) {

					// Always allow next.
					if (allow_next) {
						start_token = prev;
						allow_next = false;
					}

					// Keywords before.
					else if (prev.token === "keyword") {
						must_be_keyword = true;
						start_token = prev;
					} else if (must_be_keyword) {
						break;
					}

					// Assignemtn using dot.
					else if (prev.data === ".") {
						start_token = prev;
						allow_next = true;
					}

					// Stop.
					else {
						break;
					}
				}
			}

			// Get indent before start token.
			let prev = start_token;
			let indent = "";
			while ((prev = this.get_prev_token_by_token(prev, [])) != null) {
				if (prev.is_whitespace && !prev.is_line_break) {
					indent += prev.data;
				} else {
					break;
				}
			}

			// Assign func id.
			const func_id = this._random(16);
			start_token.func_id = func_id;

			// Also assign to start token.
			start_token.curly_depth = this.curly_depth;
			start_token.parenth_depth = this.parenth_depth;
			start_token.bracket_depth = this.bracket_depth;

			// Assign indent.
			start_token.indent = indent;

			// Append.
			this.func_end_queue.push({
				func_id: func_id,
				curly_depth: this.curly_depth,
				parenth_depth: this.parenth_depth,
				bracket_depth: this.bracket_depth,
				token: start_token,
			});
		}
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
		// This should always be set for line breaks, but also for strings when preprocessor are enabled since they can be inside preprocessor and still be a string token.
		// Use if statements since a token can be both a preprocesesor and a string etc.
		if (token === "line" || (this.allow_preprocessors && token === "string")) {
			if (this.is_comment) {
				obj.is_comment = true;
			}
			if (this.is_str) {
				obj.is_str = true;
			}
			if (this.is_regex) {
				obj.is_regex = true;
			}
			if (this.is_preprocessor) {
				obj.is_preprocessor = true;
			}
		}

		// Update offset.
		this.offset += this.batch.length;

		// Set previous non whitespace + line break token data.
		if (obj.is_line_break !== true && this.batch !== " " && this.batch !== "\t" && this.batch !== "\n") {
			this.prev_nw_token_data = obj.data;
		}

		// Concat to previous token.
		// DEPRECATED THIS IS NO LONGER SUPPORTED SINCE WHITE SPACE AND OTHERS MUST BE DETECTED IN RETRIEVING PREV TOKENS.
		// - Do this after the update offset.
		// - The concated tokens must not be excluded and either both be a word boundary or both be whitespace.
		// - Whitespace tokens must remain all whitespace since certain checks require a check if a token is whitespace only.
		// - Never concat tokens when the token is defined, even when the last and current tokens are the same. Since certain checks require a check for a specific operator, such as `parse_pre_func_tokens()` in `vhighlight.cpp`.
		// if (token === null && (obj.is_word_boundary === true || obj.is_whitespace === true)) {
		// 	const line_tokens = this.tokens[this.line];
		// 	if (line_tokens !== undefined) {
		// 		const last = line_tokens[line_tokens.length - 1];
		// 		if (
		// 			last !== undefined &&
		// 			last.is_word_boundary === obj.is_word_boundary && 
		// 			last.is_whitespace === obj.is_whitespace && 
		// 			(last.data.length > 1 || !this.excluded_word_boundary_joinings.includes(last.data)) &&
		// 			!this.excluded_word_boundary_joinings.includes(obj.data)
		// 		) {
		// 			last.data += obj.data;
		// 			return null; // STOP.
		// 		}
		// 	}
		// }

		// Increment added tokens after concat to previous tokens.
		++this.added_tokens;

		// Set is line break.
		if (token === "line") {
			obj.is_line_break = true;
		}

		// Append token.
		if (this.tokens[this.line] === undefined) {
			obj.col = 0;
			this.tokens[this.line] = [obj];
		} else {
			obj.col = this.tokens[this.line].length;
			this.tokens[this.line].push(obj);
		}

		// Set the last non whitespace or linebreak token.
		if (obj.is_whitespace !== true && obj.is_line_break !== true) {
			this.last_non_whiste_space_line_break_token = obj;
		}

		// Set parents.
		if (token === "type_def") {
			this.assign_parents(obj);
			this.assign_token_as_type_def(obj);
			if (this.on_type_def_keyword === undefined) {
				this.add_parent(obj); // only when callback is undefined otherwise the parent might be added duplicate.
			}
		}

		// Assign depths on type and type defs and any of the depth word boundaries.
		// This is required for parsing the parameters, however for type tokens it is also required for the js compiler.
		if (token === "type" || token === "type_def") {
			// @warning not reliable since it might be assigned after a parenth etc.
			obj.curly_depth = this.curly_depth;
			obj.parenth_depth = this.parenth_depth;
			obj.bracket_depth = this.bracket_depth;
		} else {
			switch (obj.data) {
				case "[": case "]":
				case "{": case "}":
				case "(": case ")":
					obj.curly_depth = this.curly_depth;
					obj.parenth_depth = this.parenth_depth;
					obj.bracket_depth = this.bracket_depth;
					break;
				default:
					break;
			}
		}

		// Set curly depth when compiler is enabled.
		if (this.compiler) {

			// Check closing functions.
			if (obj.data === "}" && (this.is_js || this.is_cpp)) {
				let dropped = [];
				this.func_end_queue.iterate((item) => {
					if (
						obj.curly_depth === item.curly_depth && 
						obj.parenth_depth === item.parenth_depth && 
						obj.bracket_depth === item.bracket_depth 
					) {
						obj.func_id = item.func_id;
						item.token.func_end = {line: obj.line, col: obj.col}
						return false;
					}
					else {
						dropped.push(item);
					}
				})
				this.func_end_queue = dropped;
			}
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

		// After dot is type for js from extends, so for like "MyClass" in "extends mylib.MyClass".
		if (
			this.after_dot_is_type_js && 
			this.batch !== "extends" && 
			this.batch !== "." && 
			this.batch !== " " && 
			this.batch !== "\n" && 
			this.batch !== "\t" && 
			this.code.charAt(this.index) !== "."
		) {
			token = "type";
			this.after_dot_is_type_js = false;
		}

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
			}

			// Reset next token when the batch is a keyword for example in "constexpr inline X".
			else if (this.keywords.includes(this.batch)) {
				appended_token = this.append_token("keyword");
				this.next_token = null;
			}

			// Append as next token.
			else {
				appended_token = this.append_token(this.next_token, extended);
				if (this.next_token === "type_def" && this.on_type_def_keyword !== undefined) {
					this.on_type_def_keyword(appended_token);
				}
				this.next_token = null;
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

					// Some languages as c++ can also use certain type def keywords such as `struct` to initialize a variable, e.g. `struct passwd pass;`.
					// But those classes should handle that in the `on_type_def_keyword` callback. Do not handle it here.
					this.next_token = "type_def";
					
				}
				
				// Next tokens.
				else if (this.type_keywords.includes(this.batch)) {
					if (this.is_js && this.batch === "extends") {
						this.after_dot_is_type_js = true;
					} else {
						this.next_token = "type";
					}
				}
				
				// Append.
				appended_token = this.append_token("keyword");
			}
			
			// Operator.
			else if (
				this.operators.includes(this.batch) &&
				(this.language !== "Bash" || this.batch !== "/" || (this.is_alphabetical(this.next_char) === false && this.is_alphabetical(this.prev_char) === false)) // skip operators where the next char is alphabetical for example the slashes in "/path/to/"
			) {
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
		let inside_template_curly_depth = 0;					// the {} depth when inside a js template string.
		let inside_template_curly_end = [];						// the array of end depths when currently inside a template string.
		let forced_multi_line_comment_end = null;				// the end comment match for langs like python which can hold both """ and ''' for multi line comments.
		if (info_obj === this) {
			is_comment = this.iter_code_is_comment;
			is_multi_line_comment = this.iter_code_is_multi_line_comment;
			string_char = this.iter_code_string_char;
			is_regex = this.iter_code_is_regex;
			is_preprocessor = this.iter_code_is_preprocessor;
			prev_non_whitespace_char = this.iter_code_prev_non_whitespace_char;
			// multi_line_comment_check_close_from_index = this.iter_code_multi_line_comment_check_close_from_index;
			inside_template_curly_depth = this.iter_code_inside_template_curly_depth;
			inside_template_curly_end = this.iter_code_inside_template_curly_end;
			forced_multi_line_comment_end = this.iter_code_forced_multi_line_comment_end;
		}

		// Iterate.
		for (info_obj.index = start; info_obj.index < end; info_obj.index++) {
			//
			// DO NOT ASSIGN ANY "this" ATTRIBUTES IN THIS FUNC SINCE IT IS ALSO CALLED BY OTHER FUNCS THAN "tokenize()".
			//

			// Get char.
			const char = this.code.charAt(info_obj.index);

			// Set next and previous.
			if (info_obj.index > 0) { // to make prev char compatible with TokenizerState.
				info_obj.prev_char = this.code.charAt(info_obj.index - 1);
			}
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

			// Open comments.
			// Comments must be checked before string, due to the multi line comment `"""` from python.
			if (
				!is_escaped &&
				!is_comment &&
				!is_multi_line_comment &&
				!is_regex
				&& string_char == null
			) {
				
				// Single line comments.
				if (
					this.single_line_comment_start !== false && 
					(
						(this.single_line_comment_start.length === 1 && char === this.single_line_comment_start) ||
						(this.single_line_comment_start.length !== 1 && this.eq_first(this.single_line_comment_start, info_obj.index))
					)
				) {
					is_preprocessor = false; // a single line comment in the preprocessor line terminates the preprocessor statement.
					is_comment = true;
					const res = callback(char, false, is_comment, is_multi_line_comment, is_regex, is_escaped, is_preprocessor);
					if (res != null) { return res; }
					continue;
				}
				
				
				// Multi line comments.
				let is_array_index;
				if (
					this.multi_line_comment_start !== false &&
					(this.multi_line_comment_only_at_start === false || prev_non_whitespace_char === "\n" || prev_non_whitespace_char === "") &&
					(
						(!this.multi_line_comment_start_is_array && this.multi_line_comment_start.length === 1 && char === this.multi_line_comment_start) ||
						(!this.multi_line_comment_start_is_array && this.multi_line_comment_start.length !== 1 && this.eq_first(this.multi_line_comment_start, info_obj.index)) ||
						(this.multi_line_comment_start_is_array && (is_array_index = this.eq_first_of(this.multi_line_comment_start, info_obj.index)) !== null)
					)
				) {
					if (this.multi_line_comment_start_is_array) {
						forced_multi_line_comment_end = this.multi_line_comment_start[is_array_index];
						multi_line_comment_check_close_from_index = info_obj.index + forced_multi_line_comment_end.length * 2; // also add mlcomment end length since the mlc close looks backwards.
					} else {
						multi_line_comment_check_close_from_index = info_obj.index + this.multi_line_comment_start.length + this.multi_line_comment_end.length; // also add mlcomment end length since the mlc close looks backwards.
					}
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
					(!this.multi_line_comment_start_is_array && this.multi_line_comment_end.length === 1 && char == this.multi_line_comment_end) ||
					(!this.multi_line_comment_start_is_array && this.multi_line_comment_end.length !== 1 && this.eq_first(this.multi_line_comment_end, info_obj.index - (this.multi_line_comment_end.length - 1))) ||
					(this.multi_line_comment_start_is_array && forced_multi_line_comment_end !== null && this.eq_first(forced_multi_line_comment_end, info_obj.index - (forced_multi_line_comment_end.length - 1)))
				)
			) {
				forced_multi_line_comment_end = null;
				is_multi_line_comment = false;
				const res = callback(char, false, is_comment, true, is_regex, is_escaped, is_preprocessor);
				if (res != null) { return res; }
				continue;
			}
			
			
			// Open strings.
			if (
				(this.allow_strings || (this.allow_strings_double_quote && char === '"')) &&
				!is_escaped &&
				!is_comment &&
				!is_multi_line_comment &&
				!is_regex &&
				string_char === null &&
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
				string_char !== null &&
				char === string_char
			) {
				string_char = null;
				const res = callback(char, true, is_comment, is_multi_line_comment, is_regex, is_escaped, is_preprocessor);
				if (res != null) { return res; }
				continue;
			}

			// Inside strings.
			else if (string_char !== null) {

				// Close string by js ${} template string.
				if (string_char === "`" && this.is_js && char === "$" && info_obj.next_char === "{") {
					if (inside_template_curly_end.length === 0) {
						inside_template_curly_depth = 0;
					}
					inside_template_curly_end.push(inside_template_curly_depth);
					string_char = null;
					const res = callback(char, false, is_comment, is_multi_line_comment, is_regex, is_escaped, is_preprocessor);
					if (res != null) { return res; }
					continue;
				}

				// Inside string.
				const res = callback(char, true, is_comment, is_multi_line_comment, is_regex, is_escaped, is_preprocessor);
				if (res != null) { return res; }
				continue;
			}

			// The end of js ${} code inside a template string.
			if (inside_template_curly_end.length !== 0) {
				if (string_char === null && char === "{") {
					++inside_template_curly_depth;
				} else if (string_char === null && char === "}") {
					--inside_template_curly_depth;

					// Re-open the string.
					if (inside_template_curly_end[inside_template_curly_end.length - 1] === inside_template_curly_depth) {
						--inside_template_curly_end.length;
						string_char = "`";
						const res = callback(char, false, is_comment, is_multi_line_comment, is_regex, is_escaped, is_preprocessor);
						if (res != null) { return res; }
						continue;			
					}
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
					prev !== "<" && // for JSX 
					this.code.charAt(info_obj.index + 1) !== ">" && // for JSX
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

		// Cache variables when info_ob is this, for state control.
		if (info_obj === this) {
			this.iter_code_is_comment = is_comment;
			this.iter_code_is_multi_line_comment = is_multi_line_comment;
			this.iter_code_string_char = string_char;
			this.iter_code_is_regex = is_regex;
			this.iter_code_is_preprocessor = is_preprocessor;
			this.iter_code_prev_non_whitespace_char = prev_non_whitespace_char;
			// this.iter_code_multi_line_comment_check_close_from_index = multi_line_comment_check_close_from_index;
			this.iter_code_inside_template_curly_depth = inside_template_curly_depth;
			this.iter_code_inside_template_curly_end = inside_template_curly_end;
			this.iter_code_forced_multi_line_comment_end = forced_multi_line_comment_end;
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
		state = null,
	} = {}) {

		// Reset.
		this.reset();

		// Derived reset.
		if (this.derived_reset !== undefined) {
			this.derived_reset();
		}

		// Set state.
		if (state) {
			this.state(state);
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
				this.append_batch("comment_keyword", {is_comment: true, is_multi_line_comment: this.is_comment_keyword_multi_line});
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

			// The derived tokenizer can disable automatic processing of code for example
			// Inside a <script> tag in html.
			// If enabled only execute the callback and nothing more.
			if (!this.preprocess_code) {
				this.callback(char, is_escaped, this.is_preprocessor)
				return null;
			}

			// Set start of line flag.
			if (disable_start_of_line) {
				disable_start_of_line = false;
				this.start_of_line = false;
			}
			else if (this.start_of_line || start_of_line_last_line != this.line) {
				this.start_of_line = true;

				// Allow whitespace at the line start.
				if (char === " " || char === "\t") {
					++this.line_indent;
					disable_start_of_line = false;
				}	
				else if (char !== "\n") {
					disable_start_of_line = true;
					start_of_line_last_line = this.line;
				}
			}

			// Close parent, exclude whitespace only lines.
			if (
				this.start_of_line && 
				this.is_indent_language && 
				char !== " " && char !== "\t" && char !== "\n" &&
				char !== this.single_line_comment_start &&
				char !== this.multi_line_comment_start &&
				this.parents.length > 0 &&
				this.parents[this.parents.length - 1].indent >= this.line_indent
			) {
				let parents = [];
				this.parents.iterate((item) => {
					if (item.indent >= this.line_indent) {
						return null;
					}
					parents.push(item);
				})
				this.parents = parents;
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
					this.is_comment_keyword_multi_line = false;
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
					const is_not_ui_escaped = this.prev_char !== "\\"; // it not escaped when writed by text editor so any \\ before counts as escaped regardless of double.

					// End of comment codeblock.
					if (this.is_comment_codeblock && char === "`" && this.next_char !== "`") {
						this.batch += char;
						auto_append_batch_switch();
						this.is_comment_codeblock = false;
					}

					// Start of comment codeblock.
					else if (this.allow_comment_codeblock && is_not_ui_escaped && !this.is_comment_codeblock && char === "`") {
						auto_append_batch_switch();
						this.is_comment_codeblock = true;
						this.batch += char;
					}

					// Check for @ keywords.
					else if (this.allow_comment_keyword && !this.is_comment_codeblock && char === "@" && is_not_ui_escaped) {
						auto_append_batch_switch();
						this.is_comment_keyword = true;
						this.is_comment_keyword_multi_line = is_multi_line_comment;
						this.batch += char;
					}

					// Check for end of @ keywords.
					// Some word boundaries are allowed inside comment keywords, such as "-", "_", "/". This is required for Libris and it also makes sense.
					else if (this.is_comment_keyword && is_not_ui_escaped && (char !== "-" && char !== "_" && char !== "/" && this.word_boundaries.includes(char))) {
						auto_append_batch_switch();
						this.is_comment_keyword = false;	
						this.is_comment_keyword_multi_line = false;
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

					// Disable the is post type def modifier and call the callback when defined.
					if (this.is_post_type_def_modifier) {
						this.is_post_type_def_modifier = false;
						if (this.on_post_type_def_modifier_end !== undefined) {
							const last_token = this.get_last_token();
							if (last_token != null) {
								this.on_post_type_def_modifier_end(this.post_type_def_modifier_type_def_token, last_token);
							}
						}
					}

				} else if (char == "}") {
					--this.curly_depth;

					// Remove parent.
					if (this.is_indent_language === false) {
						let parents = [];
						this.parents.iterate((item) => {
							if (item.curly === this.curly_depth && item.parenth === this.parenth_depth) {
								return null;
							}
							parents.push(item);
						})
						this.parents = parents;
					}
				}
				
				// Parentheses depth.
				if (char == "(") {
					++this.parenth_depth;

					// Set the is keyword before parenth open token so it can be identifier by "callback()" in order not to highlight types inside parentheses of keywords before parentheses.
					if (this.is_type_language) {

						// Enable flag.
						if (
							this.last_non_whiste_space_line_break_token !== null && 
							this.last_non_whiste_space_line_break_token.token === "keyword" && 
							this.allowed_keywords_before_type_defs.includes(this.last_non_whiste_space_line_break_token.data) === false
						) {
							this.is_keyword_before_parentheses = true;
						}
							
						// Disable flag.
						else {
							this.is_keyword_before_parentheses = false;
						}
					}

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

				// Disable the is post type def modifier and call the callback when defined.
				// But only when the char is ';' of a type definition header, the type defs that include a body will be catched by the opening "{"
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
					this.is_comment_keyword_multi_line = false;
				}
				else if (this.is_comment_codeblock) {
					append_comment_codeblock_batch();
					this.is_comment_codeblock = false;
				}
				else if (this.is_comment) {
					this.append_batch("comment", {is_comment: true});
					this.is_comment = false;
					this.is_comment_keyword = false;
					this.is_comment_keyword_multi_line = false;
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

				// On opening parenth.
				// Also resume when callback is not defined to catch parameters from type defs detected by type def keywords when callback is not defined as in python.
				else if (char === "(") {

					// Get last token and execute callback.
					let token = this.append_batch();
					token = this.get_prev_token_by_token("last", [" ", "\t", "\n"], true, true); // also check current token and exclude comments.
					let added_inside_parameters = false;
					if (token) {

						// Check callback.
						if (token.token !== "type_def" && this.on_parenth_open !== undefined) { // skip when the token is already a type def, this can happen because of type def keywords such as "def" in python.
							const res = this.on_parenth_open(token);
							if (res) {
								token = res;
							}
						}

						// Check if the token is assigned as a type or type def.
						if (token != null && this.allow_parameters && (token.token === "type_def" || token.token === "type")) {
							if (this.is_js) {
								token.is_assignment_parameters = undefined;
							}
							token.parameters = [];
							this.inside_parameters.append({
								is_type_def: token.token === "type_def",
								curly_depth: this.curly_depth,
								bracket_depth: this.bracket_depth,
								parenth_depth: this.parenth_depth - 1, // minus one since +- is done before any callbacks, required to detect close.
								token: token,
								parenth_tokens: [],
								parenth_tokens_correct_depth: [],
							});
							added_inside_parameters = true;
						}
					}

					// Append word boundary.
					this.batch += char;
					const added_token = this.append_batch(false, {is_word_boundary: true});
					if (added_inside_parameters) {
						this.inside_parameters.last().opening_parenth_token = added_token;
					}
					return null;
				}

				// Check inside parameters from line-by-line mode.
				// Must be after on opening parenth since type(defs) can still be inside param values.
				// Must be before "Highlight parameters".
				else if (
					this.inside_parameters.length > 0 &&
					this.word_boundaries.includes(char)
				) {
					const inside_param = this.inside_parameters.last();
					const type_token = inside_param.token;

					// Detect assignment parameters.
					if (
						this.is_js &&
						inside_param.is_type_def &&
						type_token.is_assignment_parameters === undefined &&
						char === "{"
					) {
						const prev = this.get_last_token([" ", "\t", "\n"]);
						if (prev && prev === inside_param.opening_parenth_token) {
							type_token.is_assignment_parameters = true;
						}
					}

					// The at correct depth flag, to be a direct child of the type def params.
					// Nested parameter values using () {} etc will not be at correct depth to parse as params.
					

					// Check the last token to determine if the current batch is a parameter.
					let prev;

					if (
						inside_param.bracket_depth === this.bracket_depth &&
						(inside_param.curly_depth === this.curly_depth || (type_token.is_assignment_parameters && inside_param.curly_depth + 1 === this.curly_depth)) &&
						(this.parenth_depth === inside_param.parenth_depth + 1 || this.parenth_depth === inside_param.parenth_depth) && // also not +1 to catch the last param before the closing ) which has normal depth.
						(
							(prev = this.get_prev_token_by_token("last", [" ", "\t", "\n"], true, true)) == null || // also check current last token and exclude comments.
							prev.data === "(" ||
							prev.data === "," ||
							(type_token.is_assignment_parameters && prev.data === "{") ||
							(this.is_type_language && (prev.token === "keyword" || prev.token === "type" || prev.token === "operator" || prev.data === ">"))
						)
					) {
						const token = this.append_batch();
						if (inside_param.is_type_def && token != null && token.token == null && !token.is_word_boundary && !token.is_whitespace && !token.is_line_break) {
							if (!this.is_type_language || (
								this.is_type_language &&
								(prev.token === "keyword" || prev.token === "type" || prev.token === "operator" || prev.data === ">")
							)) {
								token.token = "parameter";
							} else if (this.is_type_language) {
								token.token = "type";
							}
						}
					}

					// Remove inside parameter flag.
					let is_end = false;
					if (
						char === ")" &&
						inside_param.parenth_depth === this.parenth_depth &&
						inside_param.bracket_depth === this.bracket_depth &&
						inside_param.curly_depth === this.curly_depth
					) {

						// Flag as end.
						is_end = true;

						// Append token.
						const token = this.append_batch();

						// Assign last param without value as parameter token.
						if (inside_param.is_type_def && token != null && token.token == null && !token.is_word_boundary && !token.is_whitespace && !token.is_line_break) {
							token.token = "parameter";
						}

						// Pop from inside parameters array.
						--this.inside_parameters.length;

						// Enable the is post type def modifier flag.
						this.is_post_type_def_modifier = true;
						this.post_type_def_modifier_type_def_token = type_token;

						// ---------------------------------------------------------
						// Parse parameters.

						// Variables.
						const at_correct_depth_flags = [];
						const parameter_tokens = [];

						// Slice the full parameter tokens, and the parameter tokens at correct depths for parameter parsing.
						const last_token = this.get_last_token();
						const correct_depth = new vhighlight.NestedDepth(type_token.is_assignment_parameters ? 1 : 0, 0, 1);
						const parameter_depth = new vhighlight.NestedDepth(0, 0, 1);
						const current_depth = new vhighlight.NestedDepth(0, 0, 0);
						
						let line = type_token.line, col = type_token.col;
						while (line < this.tokens.length) {
							++col;
							if (col >= this.tokens[line].length) {
								++line;
								col = 0;
							}
							const token = this.tokens[line][col];
							if (token != null) {
								current_depth.process_token(token);
								if (parameter_depth.gte(current_depth) && (parameter_tokens.length > 0 || token.data !== "(")) {
									parameter_tokens.append(token);
									at_correct_depth_flags.append(correct_depth.eq(current_depth) && (at_correct_depth_flags.length > 0 || (token.data !== "(" && token.data !== "{")));
								}
								if (token === last_token) {
									break;
								}
							} else { break; }
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
								if (param.name != null) {
									params.push(param);
								}
							};
						}

						// Check if the next parenth token is a assignment operator.
						// Returns `null` when the there is no next assignment operator directly after the provided index.
						const get_next_assignment_operator = (parenth_index) => {
							let next, next_i = parenth_index + 1;
							while ((next = parameter_tokens[next_i]) != null) {
								if (next.data.length === 1 && next.data === "=") {
									if (parameter_tokens[next_i - 1] != null && parameter_tokens[next_i - 1].token === "operator") {
										return null;
									}
									return next;
								} else if (next.data.length !== 1 || (next.data !== " " && next.data !== "\t" && next.data === "\n")) {
									return null;
								}
								++next_i;
							}
							return null;
						}

						// Iterate the parenth tokens.
						const is_type_def = type_token.token === "type_def";
						const is_decorator = type_token.is_decorator === true;

						let param;
						let is_type = true;
						let index = -1;
						parameter_tokens.iterate(token => {
							++index;
							const at_correct_depth = at_correct_depth_flags[index];

							// Skip on the closing assignment param tokens.
							// Already skipped by at correct depth.
							// if (type_token.is_assignment_parameters && token.index >= closing_assignment_parameter_curly_index) {
							// 	return null;
							// }

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

								// Assign as type.
								if (
									is_type &&
									(
										token.token === "keyword" ||
										token.token === "type" ||
										token.is_whitespace === true ||
										token.token === "operator" ||
										token.data === "." ||
										token.data === ":" ||
										token.data === "<" ||
										token.data === ">" ||
										token.data === "*" ||
										token.data === "&"
									)
								) {
									param.type.push(token);

									// Revert incorrect parameter token to "type" token.
									// For example in cpp func `myfunc(T t) {}`.
									// if (token.token === "parameter") {
									// 	token.token = "type";
									// }
								}

								// Assign as key.
								else {
									is_type = false;
									const allow_assignment = (
										token.token === "type_def" ||
										token.token === "parameter" ||
										(token.token === undefined && token.data !== "{" && token.data !== "}" && token.data !== "(" && token.data !== ")" && token.data !== "[" && token.data !== "]")
									);

									// On a type definition always assign to parameter.
									// Check for token undefined since decorators should still assign the param.value when it is not an assignment operator.
									// Also allow type def token null to assign params since this can be the case in annoumys js funcs like `iterate((item) => {})`;
									if (allow_assignment && (is_type_def || (this.is_js && type_token === null))) {
										if (token.is_whitespace === true || token.is_word_boundary === true) {
											return null; // skip inside here since word boundaries and whitespace are allowed inside decorator values.
										}
										param.name = token.data.trim();
									}

									// When the token is a type there must be a "=" after this tokens.
									// Check for token undefined since decorators should still assign the param.value when it is not an assignment operator.
									else if (!is_type_def && (allow_assignment || is_decorator)) {
										const next = get_next_assignment_operator(index);
										if (next != null && allow_assignment) {
											if (token.is_whitespace === true || token.is_word_boundary === true) {
												return null; // skip inside here since word boundaries and whitespace are allowed inside decorator values.
											}
											param.name = token.data.trim();
										}
										else if (next == null && is_decorator) {
											param.value.push(token);
										}
									}
								}
							}

							// When value.
							else if (
								mode === 2 && 
								(is_type_def || is_decorator)
							) {
								param.value.push(token);
							}
						})

						// Add last param.
						append_param(param);

						// Assign parsed parameters, the plain parameter tokens are also used in Libris.
						type_token.parameters = params; 
						type_token.parameter_tokens = parameter_tokens; 
					}

					// Do not append batch here so the user defined callback can still process the word boundary.

					// Append word boundary.
					// @deprecated.
					// this.append_batch();
					// this.batch += char;
					// this.append_batch(null, {is_word_boundary: true}); // do not use "false" as parameter "token" since the word boundary may be an operator or white space.
					// return null;
				}

				/*	V1 parameters.
				// Highlight parameters.
				// Only supported in one-time highlighting, not when using line-by-line mode.
				// @todo when using a lot of tuple like functions `(() => {})()` which are often used in typescript, this becomes waaaaayy to slow.
				else if (
					this.allow_parameters &&
					char === ")"
				) {

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
					let closing_assignment_parameter_curly_index = null;
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
								if (curly_depth === 0) {
									closing_assignment_parameter_curly_index = token.index; // so it will be set to he last closing } therefore it can also skip the tokens from like "} = {}".
								}
								++curly_depth;
							} else if (token.data === "{") {
								--curly_depth;
							} else if (token.data === "]") {
								++bracket_depth;
							} else if (token.data === "[") {
								--bracket_depth;
							}
						}

						// Set correct depth so only the tokens within the correct depth will be parsed.
						token.tmp_curly_depth = curly_depth;
						token.at_correct_depth = parenth_depth === 0 && bracket_depth === 0;
						// token.at_correct_depth = parenth_depth === 0 && bracket_depth === 0 && curly_depth <= 0;
						
						// Append token.
						parenth_tokens.push(token);
					});

					// Check if the params are js assignment params defined like `myfunc({param = ...})`.
					let is_assignment_parameters = false;
					parenth_tokens.iterate_reversed((token) => {
						if (token.data === "{") {
							is_assignment_parameters = true;
							return true;
						} else if (token.is_whitespace !== true) {
							return true;
						}
					})

					// Update the at correct depth attribute.
					if (is_assignment_parameters === false) {
						closing_assignment_parameter_curly_index = null;
						parenth_tokens.iterate((token) => {
							token.at_correct_depth = token.at_correct_depth && token.tmp_curly_depth <= 0;
						})
					} else {
						parenth_tokens.iterate((token) => {
							token.at_correct_depth = token.at_correct_depth && token.tmp_curly_depth <= 1;
						})
					}

					// Remove new attibutes.
					const clean_parent_tokens = () => {
						parenth_tokens.iterate_reversed((token) => {
							delete token.at_correct_depth;
							delete token.tmp_curly_depth;
						});
					}

					// Opening parenth not found.
					if (opening_parenth_token == null) {
						clean_parent_tokens();
						return finalize();
					}

					// ---------------------------------------------------------
					// Parse the paramaters.


					// The target type token to which the parameters will be assigned to.
					let type_token;

					// Get token before the opening parenth.
					const token_before_opening_parenth = this.get_prev_token_by_token(opening_parenth_token, [" ", "\t", "\n"]);
					if (token_before_opening_parenth == null) {
						clean_parent_tokens();
						return finalize();
					}

					// Do not continue when the token before the parent is a keyword, for statements like "if ()".
					// Since that will never be a type or type def so also do not highlight the params etc.
					// Except for certain keywords that are allowed in some languages.
					const is_keyword = token_before_opening_parenth.token === "keyword";
					if (is_keyword && this.allowed_keywords_before_type_defs.includes(token_before_opening_parenth.data) === false) {
						clean_parent_tokens();
						return finalize();
					}

					// When the token before the opening parenth token already is a decorator, type or type_def there is no need to call on parenth close.
					// When type def keywords are used this is possible, and with decorators ofcourse.
					if (
						token_before_opening_parenth != null && 
						(
							token_before_opening_parenth.is_decorator === true ||
							(token_before_opening_parenth.token === "type" && this.language !== "C++") || // except for c++ since type_keywords such as constexpr combined with a constructor can make the constructor name a type, since the constructor does not have a type.
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
						if (type_token.parents === undefined && type_token.is_decorator !== true && (this.parents.length === 0 || this.parents[this.parents.length - 1].token !== type_token)) {
							this.assign_parents(type_token);
							this.assign_token_as_type_def(type_token); // since this must be done after parents are assigned, and since they weren't assigned to this as well.
						};

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
							if (param.name != null) {
								params.push(param);
							}
						};
					}

					// Check if the next parenth token is a assignment operator.
					// Returns `null` when the there is no next assignment operator directly after the provided index.
					const get_next_assignment_operator = (parenth_index) => {
						let next_i = parenth_index - 1, next;
						while ((next = parenth_tokens[next_i]) != null) {
							if (next.data.length === 1 && next.data === "=") {
								if (parenth_tokens[next_i - 1] != null && parenth_tokens[next_i - 1].token === "operator") {
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
						delete token.tmp_curly_depth;

						// Skip on the closing assignment param tokens.
						if (is_assignment_parameters && token.index >= closing_assignment_parameter_curly_index) {
							return null;
						}

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
								if ((is_type_def || (this.is_js && type_token === null)) && allow_assignment) {
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
						else if (
							mode === 2 && 
							(is_type_def || is_decorator)
						) {
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
						type_token.parameter_tokens = []; // this must always be an array, even if it is empty and the first and last parentheses should not be added into this array, vdocs depends on this behaviour.
						parenth_tokens.iterate_reversed((token) => {
							type_token.parameter_tokens.push(token);
						})
					}
					
					// ---------------------------------------------------------
					// Append to batch.

					// Append word boundary to tokens.
					return finalize();
				}
				*/

				// Call the handler.
				// And append the character when not already appended by the handler.
				// Always use if so previous if statements can use a fallthrough.
				if (this.callback === undefined || this.callback(char, is_escaped, this.is_preprocessor) !== true) {

					// Is word boundary.
					// Append old batch and word boundary char.
					if (this.word_boundaries.includes(char)) {
						this.append_batch();
						this.batch += char;
						this.append_batch(null, {is_word_boundary: true}); // do not use "false" as parameter "token" since the word boundary may be an operator or white space.
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

		// Build html.
		if (build_html) {
			return this.build_html();
		}

		// Return tokens.
		else {
			return this.tokens;
		}
	}

	// Build the html from tokens.
	build_html({
		tokens = null, 
		token_prefix = "token_", 
		reformat = true, 
		lt = "<", 
		gt = ">",
		trim = false, // remove whitespace including newlines at the start and end.
		line_containers = false,
		line_break = "\n",
	} = {}) {

		// Vars.
		if (tokens == null) {
			tokens = this.tokens;
		}
		let html = "";
		let is_codeblock = false;

		// Build a token's html.
		const build_token = (token) => {
			if (token.token === undefined) {
				if (reformat) {
					html += token.data.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
				} else {
					html += token.data;
				}
			} else if (token.token === "line") {
				html += line_break;
			} else {

				// Insert codeblock start for markdown tokenizers.
				if (token.is_codeblock_start === true) {
					html += `${lt}span class='token_codeblock'${gt}`;
					is_codeblock = true;
				}

				// Add token.
				let class_ = "";
				if (token.token !== undefined) {
					class_ = `class="${token_prefix}${token.token}"`;
				}
				if (reformat) {
					html += `${lt}span ${class_}${gt}${token.data.replaceAll("<", "&lt;").replaceAll(">", "&gt;")}${lt}/span${gt}`
				} else {
					html += `${lt}span ${class_}${gt}${token.data}${lt}/span${gt}`
				}

				// Insert codeblock end for markdown tokenizers.
				if (token.is_codeblock_end === true) {
					html += `${lt}/span${gt}`;
					is_codeblock = false;
				}
			}
		}

		// Build tokens.
		const build_tokens = (tokens) => {
			if (line_containers) {
				html += `${lt}span class='token_line_container'${gt}`
			}
			if (is_codeblock) {
				html += `${lt}span class='token_codeblock'${gt}`;
			}
			let start = true;
			let end = null;
			if (trim) {
				for (let i = tokens.length - 1; i >= 0; i--) {
					const token = tokens[i];
					if (token.is_whitespace === true || token.is_line_break === true) {
						end = i;
					} else {
						break;
					}
				}
			}
			tokens.iterate(0, end, (token) => {
				if (trim) {
					if (start && (token.is_whitespace === true || token.is_line_break === true)) {
						return null;
					}
					start = false;
				}
				build_token(token);
			});
			if (is_codeblock) {
				html += `${lt}/span${gt}`
			}
			if (line_containers) {
				html += `${lt}/span${gt}`
			}
		}
		
		// Iterate an array with token objects.
		if (tokens.length > 0) {
			let start = true;
			if (Array.isArray(tokens[0])) {
				tokens.iterate(build_tokens);
			} else {
				build_tokens(tokens);
			}
		}
		
		// Handler.
		return html;
	}
}
