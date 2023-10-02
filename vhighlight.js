/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */
// ---------------------------------------------------------
// Module vhighlight.

const vhighlight = {};

// Get the general tokenizer object by language.
// Returns `null` when the language is not supported.
vhighlight.get_tokenizer = function(language) {
	if (language == "cpp" || language == "c++" || language == "c") {
		return vhighlight.cpp;
	} else if (language == "markdown" || language == "md") {
		return vhighlight.md;
	} else if (language == "js" || language == "javascript") {
		return vhighlight.js;
	} else if (language == "json") {
		return vhighlight.json;
	} else if (language == "python") {
		return vhighlight.python;
	} else if (language == "css") {
		return vhighlight.css;
	} else if (language == "html") {
		return vhighlight.html;
	} else if (language == "bash" || language == "sh" || language == "zsh" || language == "shell") {
		return vhighlight.bash;
	} else {
		return null;
	}
}
	
// Highlight
// - Returns "null" when the language is not supported.
// - Make sure to replace < with &lt; and > with &gt; before assigning the code to the <code> element.
vhighlight.highlight = function({
	element = null,			// the html code element.
	code = null,			// when the code is assigned the highlighted code will be returned.
	language = null,		// code language, precedes element attribute "language".
	line_numbers = null,	// show line numbers, precedes element attribute "line_numbers".
	animate = false,		// animate code writing.
	delay = 25,				// animation delay in milliseconds, only used when providing parameter "element".
	// is_func = false,	 	// enable when cpp code is inside a function.
	return_tokens = false,	// return the tokens instead of the parsed html code.
}) {

	// Get language.
	if (language == null && element != null) {
		language = element.getAttribute("language");
	}
	
	// Line numbers.
	if (line_numbers == null && element != null) {
		line_numbers = element.getAttribute('line_numbers') == "true";
	}
	
	// Delay.
	if (delay == null) {
		delay = 25;
	}

	// Get tokenizer.
	const tokenizer = vhighlight.get_tokenizer(language);
	if (tokenizer == null) {
		return null;
	}
	
	// When the code is assigned just highlight the code and return the highlighted code/
	if (code != null) {
		return tokenizer.highlight(code, return_tokens);
	}

	// When the element is a <pre> just highlight it.
	else if (element.tagName == "PRE") {
		return_tokens = false;
		code = element.innerText.replaceAll(">", "&gt;").replaceAll("<", "&lt;");
		element.innerHTML = tokenizer.highlight(code);
		return ;
	}

	// When the element is a <code> more options become available.
	
	// Stop when no language is defined.
	if (language == "" || language == null) {
		return ;
	}
	
	// Create children.
	let loader;
	let line_numbers_div;
	let line_numbers_divider;
	let code_pre;
	if (element.children.length <= 1) {
		
		// Set style.
		element.style.display = 'flex';
		element.style.height = "auto";
		if (element.style.fontFamily == "") {
			element.style.fontFamily = "'Menlo', 'Consolas', monospace";
		}
		
		// Get code.
		code = element.textContent;
		element.innerHTML = "";
		
		// Loader.
		loader = document.createElement("div");
		loader.style.display = "flex";
		loader.className = "vhighlight_loader";
		for (let i = 0; i < 4; i++) {
			let child = document.createElement("div");
			child.style.border = "4px solid " + element.style.color;
			child.style.borderColor = element.style.color + " transparent transparent transparent";
			loader.appendChild(child);
		}
		element.appendChild(loader);
		
		// Line numbers.
		line_numbers_div = document.createElement("pre");
		line_numbers_div.style.padding = '0px';
		line_numbers_div.style.margin = '0px';
		element.appendChild(line_numbers_div);
		
		// Line numbers divider.
		line_numbers_divider = document.createElement("div");
		line_numbers_divider.className = "token_line_number_divider";
		line_numbers_divider.style.minWidth = "0.5px";
		line_numbers_divider.style.width = "0.5px";
		line_numbers_divider.style.padding = '0px';
		line_numbers_divider.style.margin = "0px 10px 0px 10px";
		element.appendChild(line_numbers_divider);
		
		// Code.
		code_pre = document.createElement("pre");
		code_pre.style.padding = "0px";
		code_pre.style.margin = "0px";
		code_pre.style.whiteSpace = "pre";
		code_pre.style.overflowX = "auto";
		element.appendChild(code_pre);
	}
	
	// Get elements.
	else {
		loader = element.children[0];
		line_numbers_div = element.children[1];
		line_numbers_divider = element.children[2];
		code_pre = element.children[3];
		code = code_pre.textContent;
	}

	// Functions.
	function show_loader() {
		element.style.justifyContent = "center";
		element.style.alignItems = "center";
		loader.style.display = "flex";
		line_numbers_div.style.display = "none";
		line_numbers_divider.style.display = "none";
		code_pre.style.display = "none";
	}
	function hide_loader() {
		element.style.justifyContent = "start";
		element.style.alignItems = "stretch";
		loader.style.display = "none";
		if (line_numbers) {
			line_numbers_div.style.display = "block";
			line_numbers_divider.style.display = "block";
		}
		code_pre.style.display = "block";
	}
	function animate_writing(highlighted_code) {
		code_pre.innerHTML = "";
		
		// Add char.
		function add_char(index) {
			if (index < highlighted_code.length) {
				
				// Span opening.
				if (highlighted_code[index] == '<') {
					
					// Fins span open, close and code.
					let span_index;
					let span_open = "";
					let span_close = "";
					let span_code = "";
					let open = true;
					let first = true;
					for (span_index = index; span_index < highlighted_code.length; span_index++) {
						const char = highlighted_code[span_index];
						if (char == '<' || open) {
							open = true;
							if (first) {
								span_open += char;
							} else {
								span_close += char;
							}
							if (char == '>') {
								open = false;
								if (first) {
									first = false;
									continue;
								}
									
								// Animate span code writing.
								let before = code_pre.innerHTML;
								let added_span_code = "";
								function add_span_code(index) {
									if (index < span_code.length) {
										added_span_code += span_code[index]
										let add = before;
										add += span_open;
										add += added_span_code;
										add += span_close;
										code_pre.innerHTML = add;
										setTimeout(() => add_span_code(index + 1), delay);
									} else {
										setTimeout(() => add_char(span_index + 1), delay);
									}
								}
								add_span_code(0)
								
								// Stop.
								break;
							}
						}
						
						// Add non span code.
						else {
							span_code += char;
						}
						
					}
				}
				
				// Non span code.
				else {
					code_pre.innerHTML += highlighted_code.charAt(index);
					setTimeout(() => add_char(index + 1), delay);
				}
			}
			
			// Non span code.
			else {
				code_pre.innerHTML = highlighted_code;
			}
			
		}
		
		// Start animation.
		add_char(0);
	}
	
	// Show loader.
	show_loader();

	// Delay the syntax highlighting process.
	// Otherwise the loader does not show and the unhighlted code is shown instead.
	setTimeout(() => {

		// Highlight.
		return_tokens = false;
		let highlighted_code = tokenizer.highlight(code);

		// No line numbers.
		// So add code directly.
		if (line_numbers == false) {
			hide_loader();
			if (animate == true) {
				animate_writing(highlighted_code);
			} else {
				code_pre.innerHTML = highlighted_code;
			}
			return ;
		}
		
		// Set style for line numbers.
		element.style.justifyContent = "start";
		element.style.alignItems = 'stretch';
		if (element.style.height === 'undefined' || element.style.height == "100%") {
			element.style.height = 'auto';
		}
		if (element.style.tabSize === 'undefined') {
			element.style.tabSize = '4';
		}
		if (element.style.lineHeight == "") {
			element.style.lineHeight = '16px'; // must be assigned for the show codelines optoin.
		}

		// Get linecount.
		// Cant be done with split() since that also counts the wrapped lined.
        const pre = document.createElement('pre');
        pre.textContent = code;
        pre.style.whiteSpace = 'pre';
        pre.style.overflow = 'visible';
        pre.style.lineHeight = element.style.lineHeight;
        document.body.appendChild(pre);
        const pre_height = pre.clientHeight;
        const line_height = parseFloat(element.style.lineHeight);
        document.body.removeChild(pre);
        const lines = Math.floor(pre_height / line_height);

		// Set line numbers.
        line_numbers_div.innerHTML = "";
		for (var i = 0; i < lines; i++) {
			let span = document.createElement("span");
			span.className = "token_line_number";
			span.textContent = (i + 1) + "\n";
			line_numbers_div.appendChild(span);
		}

		// Set code.
		hide_loader();
		if (animate == true) {
			animate_writing(highlighted_code);
		} else {
			code_pre.innerHTML = highlighted_code;
		}
		
		
	}, 50);
}// Iterate.
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
		allowed_keywords_before_type_defs = [],
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
		this.allowed_keywords_before_type_defs = allowed_keywords_before_type_defs; 	// the allowed keywords before the name of a type definition, such as "async" and "static" for js, but they need to be directly before the type def token, so no types in between in for example c++.
		this.scope_separators = scope_separators;										// scope separators for partial tokenize.

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
		// this.callback = function(char, is_escaped, is_preprocessor) { return false; }

		// The on parenth callback.
		// - The on parenth close will not be called when the token before the parenth opening is a keyword.
		// - The on parenth close callback should return the type or type def token when it has assigned one, so the parsed parameters can be assigned to that token.
		// this.on_parenth_close = function({token_before_opening_parenth: token_before_opening_parenth, after_parenth_index: after_parenth_index}) {return token};

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

		// Iterate.
		// let last_p = 0, last_rounded_p = "0.00", max_i = 0;
		for (info_obj.index = start; info_obj.index < end; info_obj.index++) {
			//
			// DO NOT ASSIGN ANY "this" ATTRIBUTES IN THIS FUNC SINCE IT IS ALSO CALLED BY OTHER FUNCS THAN "tokenize()".
			//

			// if (info_obj === this) {
			// 	const p = info_obj.index / end;
			// 	if (info_obj.index > max_i) {
			// 		max_i = info_obj.index;
			// 	} else if (max_i < info_obj.index) {
			// 		console.error("Last p was higher.");
			// 		process.exit(1);
			// 	}
			// 	if (last_p > p) {
			// 		console.error("Last p was higher.");
			// 		process.exit(1);
			// 	}
			// 	if (last_rounded_p !== p.toFixed(2)) {
			// 		last_rounded_p = p.toFixed(2);
			// 		console.log(last_rounded_p);
			// 	}
			// 	// console.log(p);
			// }

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
				(
					(this.multi_line_comment_end.length === 1 && char == this.multi_line_comment_end) ||
					(this.multi_line_comment_end.length !== 1 && this.eq_first(this.multi_line_comment_end, info_obj.index - this.multi_line_comment_end.length))
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
		let shebang_allowed = true;
		const stopped = this.iterate_code(this, null, null, (char, local_is_str, local_is_comment, is_multi_line_comment, local_is_regex, is_escaped, is_preprocessor) => {

			// Shebang.
			if (this.line === 0 && shebang_allowed && char === "#" && this.next_char === "!") {

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
					this.append_batch("token_comment");
				} else {
					++last_word_boundary;
					this.batch = shebang.substr(0, last_word_boundary);
					this.append_batch("token_comment");
					this.batch = shebang.substr(last_word_boundary); // interpreter.
					this.append_batch("token_keyword");
				}

				// Set resume on index.
				this.resume_on_index(resume_index - 1);
				return null;
			}
			else if (this.line === 0 && shebang_allowed && (char !== " " && char !== "\t")) {
				shebang_allowed = false;
			}

			// New line.
			// Resume with if from here since detection for disabling the `shebang_allowed` flag should resume with processing the char when it is flagged as false.
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
						this.append_batch("token_type", {is_decorator: true, parameters: []});
						this.index += batch.length - 1;
						return null;
					}

					// fallthrough.
				}

				// Highlight parameters.
				// @todo check if there are any post keywords between the ")" and "{" for c like langauges. Assign them to the type def token as "post_tags".
				// @todo check if there are any pre keywords between before the "funcname(", ofc exclude "function" etc, cant rely on the type def tokens. Assign them to the type def token as "tags".
				// @todo when using a lot of tuple like functions `(() => {})()` which are often used in typescript, this becomes waaaaayy to slow.
				else if (this.on_parenth_close !== undefined && this.allow_parameters && char === ")") {

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
					const is_keyword = token_before_opening_parenth.token === "token_keyword";
					if (is_keyword && this.allowed_keywords_before_type_defs.includes(token_before_opening_parenth.data) === false) {
						return finalize();
					}

					// When the token before the opening parenth token is a decorator there is no need to call on parenth close.
					if (token_before_opening_parenth != null && token_before_opening_parenth.is_decorator === true) {
						type_token = token_before_opening_parenth;
					}
					
					// Call the on parenth close.
					else {
						type_token = this.on_parenth_close({
							token_before_opening_parenth: token_before_opening_parenth,
							after_parenth_index: after_parenth_index,
						})
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
							} else if (next.data.length !== 1 || (next.data !== " " && next.data !== "\t" && next.data === "\n")) {
								return null;
							}
							--next_i;
						}
						return null;
					}

					// Iterate the parenth tokens.
					const is_type_def = type_token != null && type_token.token === "token_type_def";
					const is_decorator = type_token != null && type_token.is_decorator === true;

					// let log = false;
					// if (type_token != null && type_token.data === "iterate_packages") {
					// 	console.log(type_token.data, {is_type_def:is_type_def, is_decorator:is_decorator, is_assignment_parameters:is_assignment_parameters})
					// 	console.log(parenth_tokens)
					// 	log = true;
					// }

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
								const allow_assignment = (token.token === undefined || token.token === "token_type_def");

								// On a type definition always assign to parameter.
								// Check for token undefined since decorators should still assign the param.value when it is not an assignment operator.
								if (is_type_def && allow_assignment) {
									param.name = token.data.trim();
									token.token = "token_parameter";
								}

								// When the token is a type there must be a "=" after this tokens.
								// Check for token undefined since decorators should still assign the param.value when it is not an assignment operator.
								else if (!is_type_def) {
									const next = get_next_assignment_operator(i);
									if (next !== null && allow_assignment) {
										param.name = token.data.trim();
										token.token = "token_parameter";
									}
									else if (next === null && is_decorator) {
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
					if (is_type_def || is_decorator) {
						type_token.parameters = params;
						if (is_assignment_parameters === true) {
							type_token.is_assignment_parameters = true;
						}
					}
					

					// ---------------------------------------------------------
					// Append to batch.

					// Append word boundary to tokens.
					return finalize();













					/*// Append batch by word boundary.
					this.append_batch();

					// Get the tokens inside the parentheses at the correct pareth depth and skip all word boundaries except ",".
					let token_before_opening;
					let type_token, parenth_depth = 0, curly_depth = 0, bracket_depth = 0, parenth_tokens = [];
					let is_assignment_parameters = false, first_token = true;
					const found = this.tokens.iterate_tokens_reversed((token) => {

						// Set depths.
						if (token.token === undefined && token.data.length === 1) {
							if (token.data === ")") {
								++parenth_depth;
							} else if (token.data === "(") {
								if (parenth_depth === 0) {
									type_token = this.get_prev_token(token.index - 1, [" ", "\t", "\n", "=", ":"]);
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

						// Check if there are any unallowed word boundaries at all zero depth.
						// if (token.is_word_boundary === true && parenth_depth === 0 && curly_depth === 0 && bracket_depth === 0) {
						// 	console.log("STOP");
						// 	return false;
						// }

						// Check if are js assignment params defined like `myfunc({param = ...})`.
						if (first_token && (token.data.length > 0 || (token.data != " " && token.data != "\t" && token.data != "\n"))) {
							is_assignment_parameters = token.data.length === 1 && token.data == "{";
							first_token = false;
						}

						// Append token.
						token.at_correct_depth = parenth_depth === 0 && curly_depth === 0 && bracket_depth === 0;
						parenth_tokens.push(token);
					});
					// if (found !== true) {
					// 	console.log("NOT FOUND", this.line, this.index);
					// 	console.log(this.tokens);
					// 	process.exit(1);
					// }
					// return null;

					// Check if the preceding token is a type def.
					let is_type_def = type_token != null && type_token.token === "token_type_def";
					const is_type = type_token == null || type_token.token === "token_type";
					const is_decorator = type_token != null && is_type && type_token.is_decorator === true;
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
					return null*/
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
		// Start one line before the edits_start since a "{" or "}" may already be on that line which can cause issues when editing a func def.
		if (edits_start != 0) {
			const use_curly = this.scope_separators.includes("{") || this.scope_separators.includes("}");
			let curly_depth = 0;
			const scope_separators = [];
			this.scope_separators.iterate((item) => {
				if (item != "{" && item != "}") { scope_separators.push(item); }
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
					if (use_curly && token.data === "{") {
						if (curly_depth === 0) {
							found_separator = token.line;
							return true;
						}
						--curly_depth;
					}

					// Closing curly.
					else if (use_curly && token.data === "}") {
						++curly_depth;
					}

					// Any other scope seperators.
					else if (
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
		console.log(scope_start);
		
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
			line += scope_start;
			const adjusted_line = line - line_additions;
			if (tokens[adjusted_line] === undefined) { 
				return true; // may be at a line past the previous max line, keep `insert_end_line` as null.
			}
			if (line > edits_end && match_lines(tokens[adjusted_line], line_tokens)) {
				insert_end_line = adjusted_line;
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
}// ---------------------------------------------------------
// Bash highlighter.

vhighlight.Bash = class Bash {
	constructor() {

		// Initialize the this.tokenizer.
		this.tokenizer = new vhighlight.Tokenizer({
			keywords: [
				"if",
				"then",
				"else",
				"elif",
				"fi",
				"case",
				"esac",
				"while",
				"do",
				"done",
				"for",
				"select",
				"until",
				"function",
				"in",
				"return",
				"continue",
				"break",
				// "shift",
				// "eval",
				// "exec",
				// "set",
				// "unset",
				"readonly",
				"declare",
				"local",
				// "export",
				"typeset",
				// "trap",
				"true",
				"false",
				// "test",
			],
			type_def_keywords: [
				"function",
			], 
			operators: [
				'+', '-', '*', '/', '%', 					// arithmetic operators.
				'=', '!=',             						// string operators.
				'!', '-o', '-a',       						// logical operators.
				'-eq', '-ne', '-lt', '-le', '-gt', '-ge', 	// comparison operators.
				'-e', '-f', '-d', '-s', '-r', '-w', '-x', 	// file test operators.
				'&', '|', '^', '~', '<<', '>>',				// bitwise operators.
				'$',
			],
			single_line_comment_start: "#",

			// Attributes for partial tokenizing.
			scope_separators: [
				"{", 
				"}", 
			],
		});

		// Assign attributes.
		this.reset();

		// Set callback.
		this.tokenizer.callback = (char, is_escaped) => {
			const tokenizer = this.tokenizer;
			
			// Is whitespace.
			const is_whitespace = tokenizer.is_whitespace(char);

			// Start of line excluding whitespace.
			let start_of_line = false;
			if (this.current_line != tokenizer.line && !is_whitespace) {
				start_of_line = true;
				this.current_line = tokenizer.line;
			}

			// Special operators preceded by a "-" such as "-eq".
			if (char == "-") {
				let batch = null;
				if (tokenizer.operators.includes(char + tokenizer.next_char)) {
					batch = char + tokenizer.next_char;
				} else if (tokenizer.operators.includes(char + tokenizer.next_char + tokenizer.code.charAt(tokenizer.index + 2))) {
					batch = char + tokenizer.next_char + tokenizer.code.charAt(tokenizer.index + 2);
				}
				if (batch != null) {
					tokenizer.append_batch();
					tokenizer.append_forward_lookup_batch("token_operator", batch);
					tokenizer.resume_on_index(tokenizer.index + batch.length - 1);
					return true;
				}
			}

			// Special keywords preceded by a "$" such as "$1".
			else if (char == "$") {
				let batch = "$";
				let index = tokenizer.index + 1;
				while (true) {
					const c = tokenizer.code.charAt(index);
					if (tokenizer.is_numerical(c)) {
						batch += c;
					} else {
						break;
					}
					++index;
				}
				if (batch.length == 1 && (tokenizer.next_char == "#" || tokenizer.next_char == "@" || tokenizer.next_char == "?")) {
					batch += tokenizer.next_char
				}
				if (batch.length > 1) {
					tokenizer.append_batch();
					tokenizer.append_forward_lookup_batch("token_keyword", batch);
					tokenizer.resume_on_index(tokenizer.index + batch.length - 1);
					return true;
				}
			}

			// Function declaration.
			else if (char == "(") {

				// Append batch by word boundary.
				tokenizer.append_batch();

				// Do a forward lookup to look for a "() {" pattern with optional whitespace and linebreaks in between.
				let is_func_def = false;
				for (let i = tokenizer.index + 1; i < tokenizer.code.length; i++) {
					const c = tokenizer.code.charAt(i);
					if (c == "{") {
						is_func_def = true;
					}
					else if (c != ")" && c != "\n" && c != "\t" && c != " ") {
						break;
					}
				}

				// Edit prev token.
				if (is_func_def) {
					const prev = tokenizer.get_prev_token(tokenizer.added_tokens - 1, [" ", "\t", "\n"]);
					if (prev != null) {
						prev.token = "token_type_def";
					}
				}
			}

			// Function / command call.
			else if (start_of_line && tokenizer.is_alphabetical(char)) {

				// Do a forward lookup for a "AAA A" pattern, two consecutive words with only whitespace in between.
				let finished = false;
				let passed_whitespace = false;
				let word = "";
				let end_index = null;
				for (let i = tokenizer.index; i < tokenizer.code.length; i++) {
					const c = tokenizer.code.charAt(i);
					if (c == " " || c == "\t") {
						passed_whitespace = true;
					} else if (!passed_whitespace && (tokenizer.is_alphabetical(c) || tokenizer.is_numerical(c))) {
						word += c;
						end_index = i;
					} else if (passed_whitespace && (char == "\\" || !tokenizer.operators.includes(char))) {
						finished = true;
						break;
					} else {
						break;
					}
				}
				if (finished && !tokenizer.keywords.includes(word)) {
					tokenizer.append_batch();
					tokenizer.append_forward_lookup_batch("token_type", word);
					tokenizer.resume_on_index(end_index);
					return true;
				}
			}

			// Multi line comments.
			else if (start_of_line && char == ":") {

				// Do a forward lookup to determine the style.
				let style = null;
				let start_index = null; // the start after the ": <<" or the start after the ": '"
				let end_index = null;
				for (let i = tokenizer.index + 1; i < tokenizer.code.length; i++) {
					const c = tokenizer.code.charAt(i);
					if (c == " " || c == "\t") {
						continue;
					} else if (c == "<") {
						if (tokenizer.code.charAt(i + 1) == "<") {
							start_index = i + 2;
							style = 1;
						}
						break;
					} else if (c == "'" || c == '"') {
						start_index = i + 1;
						style = 2;
					} else {
						break;
					}
				}

				// Style 1, ": << X ... X" or ": << 'X' ... X" or ": << "X" ... X".
				if (style == 1) {

					// Vars.
					let close_sequence = "";
					let found_close_sequence = false;

					// Eq first.
					const eq_first = (start_index) => {
						if (start_index + close_sequence.length > tokenizer.code.length) {
					        return false;
					    }
					    const end = start_index + close_sequence.length;
					    let y = 0;
					    for (let x = start_index; x < end; x++) {
					        if (tokenizer.code.charAt(x) != close_sequence.charAt(y)) {
					            return false;
					        }
					        ++y;
					    }
					    return true;
					}

					// Get the closing sequence.
					for (let i = start_index; i < tokenizer.code.length; i++) {
						const c = tokenizer.code.charAt(i);
						if (!found_close_sequence) {
							if (tokenizer.is_whitespace(c)) {
								continue;
							} else if (
								c == '"' || 
								c == "'" || 
								c == "_" || 
								c == "-" || 
								tokenizer.is_numerical(c) || 
								tokenizer.is_alphabetical(c)
							) {
								close_sequence += c;
							} else {
								found_close_sequence = true;
								if (close_sequence != '"' && close_sequence != '""' && close_sequence != "'" && close_sequence != "''") {
									const start_char = close_sequence.charAt(0);
									if (start_char == "'" || start_char == '"') {
										close_sequence = close_sequence.substr(1);
									}
									const end_char = close_sequence.charAt(close_sequence.length - 1);
									if (end_char == "'" || end_char == '"') {
										close_sequence = close_sequence.substr(0, close_sequence.length - 1);
									}
								}
							}
						} else {
							if (eq_first(i)) {
								end_index = i + close_sequence.length - 1;
								break;
							}
						}
					}
				}


				// Style 2, ": ' ' " or ': " " '.
				else if (style == 2) {
					const closing_char = tokenizer.code.charAt(start_index - 1);
					for (let i = start_index; i < tokenizer.code.length; i++) {
						const c = tokenizer.code.charAt(i);
						if (!is_escaped && c == closing_char) {
							end_index = i;
							break;
						}
					}
				}

				// Append tokens.
				if (end_index != null) {
					tokenizer.append_batch();
					tokenizer.append_forward_lookup_batch("token_comment", tokenizer.code.substr(tokenizer.index, end_index - tokenizer.index + 1));
					tokenizer.resume_on_index(end_index);
					return true;
				}
			}

			// Nothing done.
			return false;
		}
	}

	// Reset attributes that should be reset before each tokenize.
	reset() {
		this.current_line = null; // curent line to detect start of the line.
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
vhighlight.bash = new vhighlight.Bash();// ---------------------------------------------------------
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
			type_keywords: [
				"const",
				"constexpr",
				"static",
				"volatile",
				"mutable",
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

			// Attributes for partial tokenizing.
			scope_separators: [
				"{", 
				"}", 
			],
		});
		const tokenizer = this.tokenizer;

		// Assign attributes.
		this.reset();

		// Set callback.
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

			// Opening parentheses.
			// else if (char == "(") {

			// 	// Append current batch by word boundary separator.
			// 	tokenizer.append_batch();

			// 	// Get the closing parentheses.
			// 	const closing = tokenizer.get_closing_parentheses(tokenizer.index);
			// 	const non_whitespace_after = tokenizer.get_first_non_whitespace(closing + 1);
			// 	if (closing != null && non_whitespace_after != null) {

			// 		// Edit the previous token when the token is not already assigned, for example skip the keywords in "if () {".
			// 		// And skip lambda functions with a "]" before the "(".
			// 		let prev = tokenizer.get_prev_token(tokenizer.added_tokens - 1, [" ", "\t", "\n", "*", "&"]);
			// 		if (prev == null) {
			// 			return false;
			// 		}
			// 		const prev_prev = tokenizer.get_prev_token(prev.index - 1);
			// 		const prev_prev_is_colon = prev_prev != null && prev_prev.data == ":";
			// 		if (
			// 			(prev.token === undefined && prev.data != "]") || // when no token is specified and exclude lambda funcs.
			// 			(prev.token == "token_type" && prev_prev_is_colon === true) // when the previous token is token_type by a double colon.
			// 		) {

			// 			// When the first character after the closing parentheses is a "{", the previous non word boundary token is a type def.
			// 			// Unless the previous non word boundary token is a keyword such as "if () {".
			// 			const lookup = tokenizer.code.charAt(non_whitespace_after); 
			// 			if (
			// 				(lookup == ";" && !this.inside_func) || // from semicolon when not inside a function body.
			// 				lookup == "{" || // from opening curly.
			// 				lookup == "c" || // from "const".
			// 				lookup == "v" || // from "volatile".
			// 				lookup == "n" || // from "noexcept".
			// 				lookup == "o" || // from "override".
			// 				lookup == "f" || // from "final".
			// 				lookup == "r" // from "requires".
			// 			) {
			// 				prev.token = "token_type_def";

			// 				// When the prev prev token is a colon, also set the "token_type" assigned by double colon to "token_type_def".
			// 				let token = prev;
			// 				while (true) {
			// 					token = tokenizer.get_prev_token(token.index - 1, [":"]);
			// 					if (token == null || tokenizer.str_includes_word_boundary(token.data)) {
			// 						break;
			// 					}
			// 					token.token = "token_type_def";
			// 				}


			// 				// Set the inside func flag.
			// 				// It is being set a little too early but that doesnt matter since ...
			// 				// Semicolons should not be used in the context between here and the opening curly.
			// 				// Unless the func is a header definition, but then the forward lookup loop stops.
			// 				let opening = null;
			// 				for (let i = closing; i < tokenizer.code.length; i++) {
			// 					const c = tokenizer.code.charAt(i);
			// 					if (c == ";") {
			// 						break;
			// 					}
			// 					else if (c == "{") {
			// 						opening = i;
			// 						break;
			// 					}
			// 				}
			// 				if (opening != null) {
			// 					this.inside_func = true;
			// 					this.inside_func_closing_curly = tokenizer.get_closing_curly(opening);
			// 				}
			// 			}

			// 			// When the first character after the closing parentheses is not a "{" then the previous token is a "token_type".
			// 			// Unless the token before the previous token is already a type, such as "String x()".
			// 			else {

			// 				// Check if the prev token is a template closing.
			// 				if (prev.data == ">") {
			// 					const token = tokenizer.get_opening_template(prev.index);
			// 					if (token != null) {
			// 						prev = tokenizer.get_prev_token(token.index - 1, [" ", "\t", "\n"]);
			// 					}
			// 				}

			// 				// Make sure the token before the prev is not a keyword such as "if ()".
			// 				let prev_prev = tokenizer.get_prev_token(prev.index - 1, [" ", "\t", "\n", "*", "&"]);
			// 				if (prev_prev != null && prev_prev.data == ">") {
			// 					const token = tokenizer.get_opening_template(prev_prev.index);
			// 					if (token != null) {
			// 						prev_prev = tokenizer.get_prev_token(token.index - 1, [" ", "\t", "\n"]);
			// 					}
			// 				}
			// 				if (prev_prev == null || prev_prev.token != "token_type") {
			// 					prev.token = "token_type";
			// 				}
			// 			}
			// 		}
			// 	}
			// }

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

			// Types inside templates.
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
				let first_word_in_separator = true;
				for (index = tokenizer.index + 1; index < tokenizer.code.length; index++) {
					const c = tokenizer.code.charAt(index);

					// Closing template.
					if (c == "<") {
						append_to_batch.push([false, c]);
						++depth;
					} else if (c == ">") {
						if (word.length > 0) {
							if (tokenizer.keywords.includes(word)) {
								append_to_batch.push(["token_keyword", word]);
							} else if (first_word_in_separator) {
								append_to_batch.push(["token_type", word]);
							} else {
								append_to_batch.push([false, word]);
							}
							word = "";
						}
						append_to_batch.push([false, c]);
						--depth;
						if (depth == 0) {
							is_template = true;
							break;
						}
					}

					// Allowed separator characters.
					else if (tokenizer.is_whitespace(c) || c == "," || c == ":" || c == "*" || c == "&" || c == "\n") {
						if (word.length > 0) {
							if (tokenizer.keywords.includes(word)) {
								append_to_batch.push(["token_keyword", word]);
							} else if (first_word_in_separator) {
								append_to_batch.push(["token_type", word]);
							} else {
								append_to_batch.push([false, word]);
							}
							word = "";
							if (c == " ") {
								first_word_in_separator = false;
							} else if (c == ",") {
								first_word_in_separator = true;
							}
						}
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
						tokenizer.append_forward_lookup_batch(append_to_batch[i][0], append_to_batch[i][1]);
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

			// Not appended.
			return false;
		}

		// Set on parenth close callback.
		this.tokenizer.on_parenth_close = ({
			token_before_opening_parenth = token_before_opening_parenth,
			after_parenth_index = after_parenth_index,
		}) => {

			// Get the closing parentheses.
			const closing = this.index;
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
						lookup == "c" || // from "const".
						lookup == "v" || // from "volatile".
						lookup == "n" || // from "noexcept".
						lookup == "o" || // from "override".
						lookup == "f" || // from "final".
						lookup == "r" // from "requires".
					) {
						prev.token = "token_type_def";

						// When the prev prev token is a colon, also set the "token_type" assigned by double colon to "token_type_def".
						// So the entire "mylib::mychapter::myfunc() {}" will be a token type def, not just "myfunc" but also "mylib" and "mychapter".
						let token = prev;
						while (true) {
							token = tokenizer.get_prev_token(token.index - 1, [":"]);
							if (token == null || tokenizer.str_includes_word_boundary(token.data)) {
								break;
							}
							token.token = "token_type_def";
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
						if (prev_prev == null || prev_prev.token != "token_type") {
							prev.token = "token_type";
						}
					}
				}
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
vhighlight.cpp = new vhighlight.CPP();// ---------------------------------------------------------
// CSS highlighter.

vhighlight.CSS = class CSS {
	constructor() {

		// Initialize the this.tokenizer.
		this.tokenizer = new vhighlight.Tokenizer({
			keywords: [
				// Transition Timing Functions
				'ease',
				'ease-in',
				'ease-out',
				'ease-in-out',
				'linear',
				'step-start',
				'step-end',

				// Animation Timing Functions
				'ease-in-quad',
				'ease-in-cubic',
				'ease-in-quart',
				'ease-in-quint',
				'ease-in-sine',
				'ease-in-expo',
				'ease-in-circ',
				'ease-in-back',
				'ease-out-quad',
				'ease-out-cubic',
				'ease-out-quart',
				'ease-out-quint',
				'ease-out-sine',
				'ease-out-expo',
				'ease-out-circ',
				'ease-out-back',
				'ease-in-out-quad',
				'ease-in-out-cubic',
				'ease-in-out-quart',
				'ease-in-out-quint',
				'ease-in-out-sine',
				'ease-in-out-expo',
				'ease-in-out-circ',
				'ease-in-out-back',

				// Animation Fill Modes
				'none',
				'forwards',
				'backwards',
				'both',

				// Animation Play State
				'paused',
				'running',

				// CSS Gradient Types
				'linear-gradient',
				'radial-gradient',
				'conic-gradient',

				// CSS Function Notations
				'rgb',
				'rgba',
				'hsl',
				'hsla',
				'url',

				// CSS Keyframe Properties
				'from',
				'to',

				// CSS Animations Properties
				'infinite',
				'alternate',
				'alternate-reverse',

				// Style keywords.
				// Not reliable, using manual implementation.
				// 'auto',
				// 'normal',
				// 'none',
				// 'hidden',
				// 'visible',
				// 'solid',
				// 'dotted',
				// 'dashed',
				// 'double',
				// 'groove',
				// 'ridge',
				// 'inset',
				// 'outset',
				// 'inherit',
				// 'initial',
				// 'unset',
				// 'center',
				// 'move',
				// 'pointer',
				// 'not-allowed',
				// 'crosshair',
				// 'grab',
				// 'grabbing',
				// 'zoom-in',
				// 'zoom-out',
				// 'text',
				// 'all-scroll',
				// 'col-resize',
				// 'row-resize',
				// 'n-resize',
				// 's-resize',
				// 'e-resize',
				// 'w-resize',
				// 'ne-resize',
				// 'nw-resize',
				// 'se-resize',
				// 'sw-resize',
				// 'ew-resize',
				// 'ns-resize',
				// 'nwse-resize',
				// 'nesw-resize',
				// 'start',
				// 'end',
				// 'italic',
				// 'bold',
				// 'underline',
				// 'overline',
				// 'line-through',
				// 'solid',
				// 'dotted',
				// 'dashed',
				// 'double',
				// 'groove',
				// 'ridge',
				// 'inset',
				// 'outset',
				// 'capitalize',
				// 'uppercase',
				// 'lowercase',
				// 'break-all',
				// 'break-word',
				// 'nowrap',
				// 'pre',
				// 'pre-line',
				// 'pre-wrap',
				// 'normal',
				// 'bold',
				// 'bolder',
				// 'lighter',
				// 'initial',
				// 'inherit',
				// 'unset',

				// Measurement keywords.
				// Not possible since the numerics are append to them so neither the numerics or the suffixes will match, so manual implementation is required.
				// 'px',
				// 'em',
				// 'rem',
				// 'ex',
				// 'ch',
				// 'vw',
				// 'vh',
				// 'vmin',
				// 'vmax',
				// '%',
				// 'in',
				// 'cm',
				// 'mm',
				// 'pt',
				// 'pc',
				// 'fr',
				// 'deg',
				// 'grad',
				// 'rad',
				// 'turn',
				// 'ms',
				// 's',
				// 'Hz',
				// 'kHz',
				// 'dpi',
				// 'dpcm',
				// 'dppx',
				// 'x',

				// Pseudo keywords.
				// Not usable because of the including word boundary ":".
				// '::after',
				// '::before',
				// '::first-letter',
				// '::first-line',
				// '::selection',
				// '::backdrop',
				// '::placeholder',
				// '::marker',
				// '::spelling-error',
				// '::grammar-error',
				// ':active',
				// ':checked',
				// ':default',
				// ':dir',
				// ':disabled',
				// ':empty',
				// ':enabled',
				// ':first',
				// ':first-child',
				// ':first-of-type',
				// ':focus',
				// ':focus-within',
				// ':fullscreen',
				// ':hover',
				// ':indeterminate',
				// ':in-range',
				// ':invalid',
				// ':last-child',
				// ':last-of-type',
				// ':left',
				// ':link',
				// ':not',
				// ':nth-child',
				// ':nth-last-child',
				// ':nth-last-of-type',
				// ':nth-of-type',
				// ':only-child',
				// ':only-of-type',
				// ':optional',
				// ':out-of-range',
				// ':read-only',
				// ':read-write',
				// ':required',
				// ':right',
				// ':root',
				// ':scope',
				// ':target',
				// ':valid',
				// ':visited',
			],
			multi_line_comment_start: "/*",
			multi_line_comment_end: "*/",

			// Attributes for partial tokenizing.
			scope_separators: [
				"{", 
				"}", 
			],
		});

		// Assign attributes.
		this.reset();

		// Numerics regex.
		const numeric_suffixes = [
			'px',
			'em',
			'rem',
			'ex',
			'ch',
			'vw',
			'vh',
			'vmin',
			'vmax',
			'%',
			'in',
			'cm',
			'mm',
			'pt',
			'pc',
			'fr',
			'deg',
			'grad',
			'rad',
			'turn',
			'ms',
			's',
			'Hz',
			'kHz',
			'dpi',
			'dpcm',
			'dppx',
			'x'
		].join("|");
		this.numeric_regex = new RegExp(`^-?\\d+(\\.\\d+)?(${numeric_suffixes})*$`);

		// Set callback.
		this.tokenizer.callback = (char, is_escaped) => {
			const tokenizer = this.tokenizer;
			
			// At keywords such as "@keyframes".
			if (char == "@") {
				const end = tokenizer.get_first_word_boundary(tokenizer.index + 1);
				tokenizer.append_batch();
				tokenizer.append_forward_lookup_batch("token_keyword", tokenizer.code.substr(tokenizer.index, end - tokenizer.index));
				tokenizer.resume_on_index(end - 1);
				return true;
			}

			// Hex colors.
			if (tokenizer.batch == "" && char == "#") {
				const end = tokenizer.get_first_word_boundary(tokenizer.index + 1);
				tokenizer.append_batch();
				tokenizer.append_forward_lookup_batch("token_string", tokenizer.code.substr(tokenizer.index, end - tokenizer.index));
				tokenizer.resume_on_index(end - 1);
				return true;
			}

			// Css class definitions.
			else if (char == "{") {
				tokenizer.append_batch();
				let index = tokenizer.added_tokens - 1;
				while (true) {
					const prev = tokenizer.get_prev_token(index, [" ", ",", "\t", ":"]);
					if (prev == null || prev.data == "\n") {
						break;
					}
					else if (
						(prev.token == "token_string") || // for "#myid" which will otherwise be treated as hex strings.
						(prev.token == "token_keyword" && prev.data.charAt(0) != "@") ||
						(prev.token === undefined && 
							(
								prev.data == "#" || 
								prev.data == "." || 
								prev.data == "*" || 
								prev.data == "-" || 
								tokenizer.is_alphabetical(prev.data.charAt(0))
							)
						)
					) {
						const pprev = tokenizer.tokens[prev.index - 1];
						if (pprev != null && pprev.data == ":") {
							prev.token = "token_keyword";
							// pprev.token = "token_keyword";
							// const ppprev = tokenizer.tokens[pprev.index - 1];
							// if (ppprev != null && ppprev.data == ":") {
							// 	ppprev.token = "token_keyword";
							// }
						} else {
							prev.token = "token_type_def";
						}
					}
					index = prev.index - 1;
				}
			}

			// CSS function calls such as "translateX(...)"
			else if (char == "(") {
				tokenizer.append_batch();
				const prev = tokenizer.get_prev_token(tokenizer.added_tokens - 1, [" ", "\t", "\n"]);
				if (prev != null && prev.token === undefined) {
					prev.token = "token_type";
				}
			}

			// CSS style attribute, curly depth is higher then 1 with pattern "^\s*XXX:" or ";\s*XXX:".
			else if (tokenizer.curly_depth > 0 && char == ":") {
				tokenizer.append_batch();
				let index = tokenizer.added_tokens - 1;
				let edits = [];
				let finished = false;
				while (true) {
					const prev = tokenizer.get_prev_token(index, [" ", "\t"]);
					if (prev == null) {
						break;
					}
					else if (prev.data == "\n" || prev.data == ";") {
						finished = true;
						break;
					}
					else if (prev.token === undefined/* || prev.data == "-"*/) {
						edits.push(prev);
					}
					index = prev.index - 1;
					// console.log(edits);
				}
				if (finished) {
					for (let i = 0; i < edits.length; i++) {
						edits[i].token = "token_keyword";
					}
					
					// Set style start and end.
					this.style_start = tokenizer.index;
					for (let i = tokenizer.index + 1; i < tokenizer.code.length; i++) {
						const c = tokenizer.code.charAt(i);
						if (c == "\n") {
							this.style_start = null;
							break;
						} else if (c == ";") {
							this.style_end = i;
							break;
						}
					}
				}
			}

			// Numerics.
			else if (char == "%" && this.numeric_regex.test(tokenizer.batch + char)) {
				tokenizer.batch += char;
				tokenizer.append_batch("token_numeric");
				return true;
			}
			else if (tokenizer.word_boundaries.includes(char) && this.numeric_regex.test(tokenizer.batch)) {
				tokenizer.append_batch("token_numeric");
			}

			// Style attribute value keywords.
			// Basically every token that does not have an assigned token and does not contain a word boundary except for "-" between the style start and end.
			// Must be after numerics.
			else if (this.style_end != null && tokenizer.index >= this.style_end) {
				tokenizer.append_batch();
				let index = tokenizer.added_tokens - 1;
				let finished = false;
				const edits = [];
				while (true) {
					const prev = tokenizer.get_prev_token(index, [" ", "\t"]);
					if (prev == null || prev == "\n") {
						break;
					}
					else if (prev.data == ":") {
						finished = true;
						break;
					}
					else if (prev.token === undefined && !tokenizer.str_includes_word_boundary(prev.data)) {
						edits.push(prev);
					}
					index = prev.index - 1;
				}
				if (finished) {
					for (let i = 0; i < edits.length; i++) {
						edits[i].token = "token_keyword";
					}
				}
				this.style_end = null;
			}

			// Nothing done.
			return false;
		}
	}

	// Reset attributes that should be reset before each tokenize.
	reset() {

		// Start and end of css style attribute index, start begins after the ":" and the end is at the ";".
		this.style_start = null;
		this.style_end = null;
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
vhighlight.css = new vhighlight.CSS();// ---------------------------------------------------------
// Python highlighter.

vhighlight.HTML = class HTML {

	// Static attributes.
	static language_tags = [
		"script",
		"style",
	];
	static verbatim_tags = [
		'textarea',
		'pre',
		'xmp',
		'plaintext',
		'listing',
	];

	// Constructor.
	constructor({
		allow_entities = true, // when allow_entities is true an entity like &gt; will not be converted to &amp;gt;
	} = {}) {

		// Params.
		this.allow_entities = allow_entities;

		// Initialize the this.tokenizer.
		this.tokenizer = new vhighlight.Tokenizer({
			multi_line_comment_start: "<!--",
			multi_line_comment_end: "-->",
			allow_parameters: false,

			// Attributes for partial tokenizing.
			// @todo does not work yet since < and > are different because of <> and the scope_seperators currently supports only a single char per item.
			scope_separators: [
				"<div>", "</div>",
				"<body>", "</body>",
				"<script>", "</script>",
				"<head>", "</head>",
			],
		});

		// Set callback.
		this.tokenizer.callback = (char) => {
			const tokenizer = this.tokenizer;

			// Highlight entities.
			if (char === "&") {

				// Append batch by word boundary.
				tokenizer.append_batch();

				// Do a forward lookup to check if the entity ends with a ';' without encountering a space or tab or newline.
				let batch;
				if (this.allow_entities) {
					batch = "&";
				} else {
					batch = "&amp;";
				}
				let success = false;
				let index = 0;
				for (index = tokenizer.index + 1; index < tokenizer.code.length; index++) {
					const c = tokenizer.code.charAt(index);
					batch += c;
					if (c === " " || c === "\t" || c === "\n") {
						break;
					} else if (c === ";") {
						batch = batch.substr(0, batch.length - 1) + "\;"
						success = true;
						break;
					}
				}

				// On success.
				if (success) {
					tokenizer.batch = batch;
					tokenizer.append_batch("token_keyword");
					tokenizer.resume_on_index(index);
					return true;
				}
			}

			// Tag opener / closer.
			else if (char === "<") {

				// Lookup result.
				const lookup_tokens = [];
				let resume_on_index = null;

				// Get tag indexes.
				let tag_name_start = tokenizer.get_first_non_whitespace(tokenizer.index + 1, true);
				if (tag_name_start === null) { return false; }
				const is_tag_closer = tokenizer.code.charAt(tag_name_start) === "/";
				const tag_end_index = tokenizer.lookup({query: ">", index: tokenizer.index});
				if (tag_end_index === null) { return false; }

				// Append < token.
				lookup_tokens.push(["token_operator", "<"]);

				// Append whitespace tokens.
				const whitespace = tag_name_start - (tokenizer.index + 1);
				if (whitespace > 0) {
					lookup_tokens.push([false, tokenizer.code.substr(tokenizer.index + 1, whitespace)]);
				}

				// Add / or ! tokens at the tag name start.
				let skip = ["/", "!"];
				while (skip.includes(tokenizer.code.charAt(tag_name_start))) {

					lookup_tokens.push(["token_operator", tokenizer.code.charAt(tag_name_start)]);
					
					// Get real start of tag name.
					const real_tag_name_start = tokenizer.get_first_non_whitespace(tag_name_start + 1, true);
					if (real_tag_name_start === null) { return false; }

					// Append whitespace tokens.
					const whitespace = real_tag_name_start - (tag_name_start + 1);
					if (whitespace > 0) {
						lookup_tokens.push([false, tokenizer.code.substr(tag_name_start + 1, whitespace)]);
					}

					// Update tag name start.
					tag_name_start = real_tag_name_start;
				}

				// Append the tag name as keyword.
				const tag_name_end = tokenizer.get_first_word_boundary(tag_name_start);
				if (tag_name_end === null) { return false; }
				const tag_name = tokenizer.code.substr(tag_name_start, tag_name_end - tag_name_start);
				lookup_tokens.push(["token_keyword", tag_name]);

				// Parse the attributes.
				const info = {index: null};
				let was_str = false, str_start = 0;
				let was_comment = false, comment_start = 0;
				let last_index = tag_end_index - 1;
				let is_attr_type = false, attr_type = null;
				const err = tokenizer.iterate_code(info, tag_name_end, tag_end_index, (char, is_str, _, is_comment) => {
					const is_last_index = info.index === last_index;

					// String end.
					if (was_str && (is_str === false || is_last_index)) {
						let end;
						if (last_index === info.index) { end = info.index + 1; }
						else { end = info.index; }
						const data = tokenizer.code.substr(str_start, end - str_start);
						lookup_tokens.push(["token_string", data]);
						if (is_attr_type) {
							if ((data.startsWith('"') && data.endsWith('"')) || (data.startsWith("'") && data.endsWith("'"))) {
								attr_type = data.slice(1, -1);
							} else {
								attr_type = data;
							}
						}
						was_str = false;
					}

					// Comment end.
					else if (was_comment && (is_comment === false || is_last_index)) {
						let end;
						if (last_index === info.index) { end = info.index + 1; }
						else { end = info.index; }
						lookup_tokens.push(["token_comment", tokenizer.code.substr(comment_start, end - comment_start)]);
						was_comment = false;
					}

					//
					// Resume with if after here.
					//

					// String start.
					if (was_str === false && is_str) {
						was_str = true;
						str_start = info.index;
					}

					// Inside string.
					else if (was_str) {}

					// Comment start.
					else if (was_comment === false && is_comment) {
						was_comment = true;
						comment_start = info.index;
					}

					// Inside comment.
					else if (was_comment) {}

					// Whitespace.
					else if (char === " " || char === "\t" || char === "\n") {
						lookup_tokens.push([null, char]);
					}

					// Assignment operator.
					else if (char === "=") {
						lookup_tokens.push(["token_operator", char]);
					}

					// Attribute keyword.
					else {
						const end = tokenizer.get_first_word_boundary(info.index);
						if (end === info.index) { // current char is word boundary, prevent infinite loop.
							lookup_tokens.push([null, char]);
							return null;
						}
						if (end > tag_end_index) { return true; }
						const data = tokenizer.code.substr(info.index, end - info.index);
						lookup_tokens.push(["token_keyword", data]);
						info.index = end - 1;
						is_attr_type = data === "type";
					}
				});
				if (err === true) {
					return false;
				}

				// Add the closing > token.
				lookup_tokens.push(["token_operator", ">"]);

				// Set default resume on index.
				resume_on_index = tag_end_index;

				// Append the lookup tokens.
				for (let i = 0; i < lookup_tokens.length; i++) {
					tokenizer.append_forward_lookup_batch(lookup_tokens[i][0], lookup_tokens[i][1]);
				}
				tokenizer.resume_on_index(resume_on_index);

				// Parse the entire tag till closing tag on certain tags.
				let verbatim_tag = false;
				if (
					is_tag_closer === false && 
					(
						(verbatim_tag = vhighlight.HTML.verbatim_tags.includes(tag_name)) === true || 
						vhighlight.HTML.language_tags.includes(tag_name)
					)
				) {

					// Vars.
					const content_start = tag_end_index + 1;

					// Find the closing tag.
					const info = {index: null};
					let close_tag_start_index = null, close_tag_end_index = null;
					let close_tag = `/${tag_name}>`;
					tokenizer.iterate_code(info, tag_end_index, null, (char, is_str, _, is_comment) => {
						if (is_str === false && is_comment === false && char === "<") {
							close_tag_start_index = info.index;
							let tag_i = 0;
							for (let i = info.index + 1; i < tokenizer.code.length; i++) {
								const c = tokenizer.code.charAt(i);
								if (c === " " || c === "\t" || c === "\n") {
									continue;
								} else if (c !== close_tag.charAt(tag_i)) {
									break;
								}
								++tag_i;
								if (tag_i >= close_tag.length) {
									close_tag_end_index = info.index;
									return false;
								}
							}
						}
					})

					// When the close tag is not found then skip everything afterwards.
					if (close_tag_end_index === null) {
						tokenizer.append_forward_lookup_batch(false, tokenizer.code.substr(content_start));
						tokenizer.resume_on_index(tokenizer.code.length);
					}


					// For certain tags the highlighting needs to be skipped until the tag closes.
					else if (verbatim_tag) {
						tokenizer.append_forward_lookup_batch(false, tokenizer.code.substr(content_start, close_tag_start_index - content_start));
						tokenizer.resume_on_index(close_tag_start_index - 1);
					}

					// Parse css.
					else if (tag_name === "style") {
						const tokens = vhighlight.css.highlight(tokenizer.code.substr(content_start, close_tag_start_index - content_start), true)
						tokenizer.concat_tokens(tokens);
						tokenizer.resume_on_index(close_tag_start_index - 1);
					}

					// Parse javascript.
					else if (tag_name === "script" && (attr_type == null || attr_type === "text/javascript" || attr_type === "application/javascript")) {
						const tokens = vhighlight.js.highlight(tokenizer.code.substr(content_start, close_tag_start_index - content_start), true)
						tokenizer.concat_tokens(tokens);
						tokenizer.resume_on_index(close_tag_start_index - 1);
					}

					// Uncaucht so add as plain text.
					else {
						tokenizer.append_forward_lookup_batch(false, tokenizer.code.substr(content_start, close_tag_start_index - content_start));
						tokenizer.resume_on_index(close_tag_start_index - 1);
					}
				
				}

				// Success.
				return true;

			}

			// Not appended.
			return false;
		}
	}

	// Highlight.
	highlight(code = null, return_tokens = false) {
		if (code !== null) {
			this.tokenizer.code = code;
		}
		return this.tokenizer.tokenize(return_tokens);
	}
}

// Initialize.
vhighlight.html = new vhighlight.HTML();// ---------------------------------------------------------
// Javascript highlighter.

vhighlight.JS = class JS {
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
		allowed_keywords_before_type_defs = ["function", "async", "static", "get", "set", "*"], // also include function otherwise on_parent_close wont fire.
		excluded_word_boundary_joinings = [], // for js compiler.

		// Attributes for partial tokenizing.
		scope_separators = [
			"{", 
			"}", 
		],
	} = {}) {

		// Initialize the this.tokenizer.
		this.tokenizer = new vhighlight.Tokenizer({
			keywords: keywords,
			type_def_keywords: type_def_keywords, 
			type_keywords: type_keywords,
			operators: operators,
			single_line_comment_start: single_line_comment_start,
			multi_line_comment_start: multi_line_comment_start,
			multi_line_comment_end: multi_line_comment_end,
			allow_slash_regexes: allow_slash_regexes,
			allow_decorators: allow_decorators,
			allowed_keywords_before_type_defs: allowed_keywords_before_type_defs,
			excluded_word_boundary_joinings: excluded_word_boundary_joinings,
			scope_separators: scope_separators,
		});

		// Function tags.
		this.function_tags = ["async", "static", "get", "set", "*"];

		// Set on parenth close.
		// When a type or type def token is found it should return that token to assign the parameters to it, otherwise return `null` or `undefined`.
		const tokenizer = this.tokenizer;
		this.tokenizer.on_parenth_close = ({
			token_before_opening_parenth = token_before_opening_parenth,
			after_parenth_index = after_parenth_index,
		}) => {

			// Get the function tags.
			// If any keyword is encoutered that is not a tag or "function" then terminate.
			let type_def_tags = [];
			let prev_token_is_function_keyword = false;
			let iter_prev = token_before_opening_parenth;
			while (iter_prev.token === "token_keyword" || (iter_prev.token === "token_operator" && iter_prev.data === "*")) {
				console.log(iter_prev.data);
				if (this.function_tags.includes(iter_prev.data)) {
					type_def_tags.push(iter_prev.data);
				} else if (iter_prev.data === "function") {
					prev_token_is_function_keyword = true;
				}
				iter_prev = tokenizer.get_prev_token(iter_prev.index - 1, [" ", "\t", "\n"]);
				if (iter_prev == null) {
					return null;
				}
			}

			// Check if the token is a keyword.
			let prev = token_before_opening_parenth;
			if (prev.token === "token_keyword") {
				if (prev.data !== "function" && this.function_tags.includes(prev.data) === false) {
					return null;
				}
			} else if (prev.token !== undefined && prev.token !== "token_operator") {
				return null;
			}

			// Check character after closing parentheses.
			if (after_parenth_index == null) {
				return null;
			}
			const after_parenth = tokenizer.code.charAt(after_parenth_index);

			// Valid characters for a function declaration.
			if (after_parenth == "{") {

				// Get the function name when the previous token is a keyword or when it is a "() => {}" function..
				if (prev_token_is_function_keyword) {
					const token = tokenizer.get_prev_token(prev.index - 1, [" ", "\t", "\n", "=", ":", ...this.function_tags]);
					if (token == null || tokenizer.str_includes_word_boundary(token.data)) {
						return null;
					}
					token.token = "token_type_def";
					token.tags = type_def_tags;
					if (type_def_tags.length > 0) { console.log(token.data, type_def_tags); }
					return token;
				}

				// Assign the token type def to the current token.
				else if (!tokenizer.str_includes_word_boundary(prev.data)) {
					prev.token = "token_type_def";
					prev.tags = type_def_tags;
					if (type_def_tags.length > 0) { console.log(prev.data, type_def_tags); }
					return prev;
				}
			}

			// Functions declared as "() => {}".
			else if (after_parenth == "=" && tokenizer.code.charAt(after_parenth_index + 1) == ">") {
				const token = tokenizer.get_prev_token(prev.index - 1, [" ", "\t", "\n", "=", ":", ...this.function_tags]);
				if (token == null || tokenizer.str_includes_word_boundary(token.data)) {
					return null;
				}
				token.token = "token_type_def";
				token.tags = type_def_tags;
				if (type_def_tags.length > 0) { console.log(token.data, type_def_tags); }
				return token;
			}

			// Otherwise it is a function call.
			else if (!tokenizer.str_includes_word_boundary(prev.data)) {
				prev.token = "token_type";
				return prev;
			}
		}
	}

	// Highlight.
	highlight(code = null, return_tokens = false) {
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
vhighlight.js = new vhighlight.JS();// ---------------------------------------------------------
// Json highlighter.

vhighlight.Json = class Json {
	constructor() {

		// Initialize the this.tokenizer.
		this.tokenizer = new vhighlight.Tokenizer({
			keywords: [
				"true",
				"false",
				"null",
			],
			single_line_comment_start: "//",
			multi_line_comment_start: "/*",
			multi_line_comment_end: "*/",

			// Attributes for partial tokenizing.
			scope_separators: [
				"{", 
				"}", 
				",",
			],
		});
	}

	// Highlight.
	highlight(code = null, return_tokens = false) {
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
vhighlight.json = new vhighlight.Json();// ---------------------------------------------------------
// Markdown highlighter.

vhighlight.Markdown = class Markdown {
	constructor() {

		// Initialize the this.tokenizer.
		this.tokenizer = new vhighlight.Tokenizer({
			multi_line_comment_start: "<!--",
			multi_line_comment_end: "-->",
			allow_strings: false,
			allow_numerics: false,
			// Attributes for partial tokenizing.
			scope_separators: [],
		});

		// Assign attributes.
		this.reset();

		// Set callback.
		this.tokenizer.callback = (char) => {
			const tokenizer = this.tokenizer;
			
			// Start of line excluding whitespace.
			let start_of_line = false;
			if (this.current_line != tokenizer.line && !tokenizer.is_whitespace(char)) {
				start_of_line = true;
				this.current_line = tokenizer.line;
			}

			// Headings.
			if (start_of_line && char == "#") {

				// Append batch by word boundary.
				tokenizer.append_batch();

				// Do a forward lookup.
				const add = [];
				let last_index = null;
				let at_start = true;
				let word = "";
				for (let i = tokenizer.index; i < tokenizer.code.length; i++) {
					const c = tokenizer.code.charAt(i);

					// Stop at linebreak.
					if (c == "\n") {
						if (word.length > 0) {
							add.push(["token_bold", word]);
						}
						last_index = i - 1;
						break;
					}

					// Add whitespace seperately to not break "at_start".
					else if (c == " " || c == "\t") {
						if (word.length > 0) {
							add.push(["token_bold", word]);
							word = "";
						}
						add.push([false, c]);
					}

					// Add # as keyword.
					else if (at_start && c == "#") {
						add.push(["token_keyword", c]);
					}

					// Seperate words by a word boundary.
					else if (tokenizer.word_boundaries.includes(c)) {
						at_start = false;
						if (word.length > 0) {
							add.push(["token_bold", word]);
							word = "";
						}
						add.push([false, c]);
					}

					// Add everything else as bold.
					else {
						at_start = false;
						word += c;
					}

				}

				// Append.
				if (add.length > 0) {
					if (last_index == null) {
						last_index = tokenizer.code.length;
					}
					for (let i = 0; i < add.length; i++) {
						tokenizer.append_forward_lookup_batch(add[i][0], add[i][1]);
					}
					tokenizer.resume_on_index(last_index);
					return true;
				}
			}

			// Bold or italic text.
			// It may not have whitespace after the "*" or "_" in order to seperate it from an unordered list.
			else if (
				(
					(char == "*" && tokenizer.next_char == "*") ||
					(char == "_" && tokenizer.next_char == "_")
				) &&
				!tokenizer.is_whitespace(tokenizer.index + 2)
			) {

				// Find closing char.
				let closing_index = null;
				for (let i = tokenizer.index + 2; i < tokenizer.code.length; i++) {
					const c = tokenizer.code.charAt(i);
					if (c == char) {
						closing_index = i;
						break;
					}
				}
				if (closing_index == null) { return false; }

				// Append batch by separator.
				tokenizer.append_batch();

				// Add tokens.
				tokenizer.append_forward_lookup_batch("token_keyword", char + char);
				tokenizer.append_forward_lookup_batch("token_bold", tokenizer.code.substr(tokenizer.index + 2, closing_index - (tokenizer.index + 2)));
				tokenizer.append_forward_lookup_batch("token_keyword", char + char);

				// Set resume index.
				tokenizer.resume_on_index(closing_index + 1);
				return true;
			}

			// Bold or italic text.
			// It may not have whitespace after the "*" or "_" in order to seperate it from an unordered list.
			else if (
				(char == "*" || char == "_") &&
				!tokenizer.is_whitespace(tokenizer.next_char)
			) {

				// Find closing char.
				let closing_index = null;
				for (let i = tokenizer.index + 1; i < tokenizer.code.length; i++) {
					const c = tokenizer.code.charAt(i);
					if (c == char) {
						closing_index = i;
						break;
					}
				}
				if (closing_index == null) { return false; }

				// Append batch by separator.
				tokenizer.append_batch();

				// Add tokens.
				tokenizer.append_forward_lookup_batch("token_keyword", char);
				tokenizer.append_forward_lookup_batch("token_italic", tokenizer.code.substr(tokenizer.index + 1, closing_index - (tokenizer.index + 1)));
				tokenizer.append_forward_lookup_batch("token_keyword", char);

				// Set resume index.
				tokenizer.resume_on_index(closing_index);
				return true;
			}

			// Block quote.
			else if (start_of_line && char == ">") {
				tokenizer.append_batch();
				tokenizer.batch = char;
				tokenizer.append_batch("token_keyword");
				return true;
			}

			// Unordered list.
			// It must have whitespace after the "*" in order to seperate it from bold or italic text.
			else if (
				start_of_line && 
				(char == "-" || char == "*" || char == "+") && 
				tokenizer.is_whitespace(tokenizer.next_char)
			) {
				tokenizer.append_batch();
				tokenizer.batch = char;
				tokenizer.append_batch("token_keyword");
				return true;
			}

			// Ordered list.
			else if (start_of_line && tokenizer.is_numerical(char)) {

				// Do a forward lookup to check if there are only numerical chars and then a dot.
				let batch = char;
				let finished = false;
				let last_index = null;
				for (let i = tokenizer.index + 1; i < tokenizer.code.length; i++) {
					const c = tokenizer.code.charAt(i);
					if (c == "\n") {
						break;
					} else if (c == ".") {
						batch += c;
						finished = true;
						last_index = i;
						break;
					} else if (tokenizer.is_numerical(c)) {
						batch += c;
					} else {
						break;
					}
				}

				// Check if finished successfully.
				if (finished) {
					tokenizer.append_batch();
					tokenizer.append_forward_lookup_batch("token_keyword", batch);
					tokenizer.resume_on_index(last_index);
					return true;
				}
			}

			// Link or image.
			else if (char == "[") {

				// Append batch by word boundary.
				tokenizer.append_batch();

				// Get closing bracket.
				const opening_bracket = tokenizer.index;
				const closing_bracket = tokenizer.get_closing_bracket(opening_bracket);
				if (closing_bracket == null) { return false; }

				// Get opening and closing parentheses, but no chars except for whitespace may be between the closing barcket and opening parentheses.
				let opening_parentheses = null;
				for (let i = closing_bracket + 1; i < tokenizer.code.length; i++) {
					const c = tokenizer.code.charAt(i);
					if (c == " " || c == "\t") {
						continue;
					} else if (c == "(") {
						opening_parentheses = i;
						break;
					} else {
						break;
					}
				}
				if (opening_parentheses == null) { return false; }
				const closing_parentheses = tokenizer.get_closing_parentheses(opening_parentheses);
				if (closing_parentheses == null) { return false; }

				// Check if it is a link or an image by preceding "!".
				const prev = tokenizer.get_prev_token(tokenizer.added_tokens - 1, [" ", "\t"]);
				const is_image = prev != null && prev.data == "!";
				if (is_image) {
					prev.token = "token_keyword";
				}

				// Add text tokens.
				tokenizer.append_forward_lookup_batch("token_keyword", "[");
				tokenizer.append_forward_lookup_batch("token_string", tokenizer.code.substr(opening_bracket + 1, (closing_bracket - 1) - (opening_bracket + 1) + 1));
				tokenizer.append_forward_lookup_batch("token_keyword", "]");

				// Add url tokens.
				tokenizer.append_forward_lookup_batch("token_keyword", "(");
				tokenizer.append_forward_lookup_batch("token_string", tokenizer.code.substr(opening_parentheses + 1, (closing_parentheses - 1) - (opening_parentheses + 1) + 1));
				tokenizer.append_forward_lookup_batch("token_keyword", ")");

				// Set resume index.
				tokenizer.resume_on_index(closing_parentheses);
				return true;
			}

			// Single line code block.
			else if (char == "`" && tokenizer.next_char != "`" && tokenizer.prev_char != "`") {

				// Do a forward lookup till the next "`".
				let closing_index = null;
				for (let i = tokenizer.index + 1; i < tokenizer.code.length; i++) {
					const c = tokenizer.code.charAt(i);
					if (c == "`") {
						closing_index = i;
						break;
					}
				}
				if (closing_index == null) { return false; }

				// Add token.
				tokenizer.append_forward_lookup_batch("token_codeblock", tokenizer.code.substr(tokenizer.index, closing_index - tokenizer.index + 1));

				// Set resume index.
				tokenizer.resume_on_index(closing_index);
				return true;
			}

			// Multi line code block.
			else if (char == "`" && tokenizer.next_char == "`" && tokenizer.code.charAt(tokenizer.index + 2) == "`") {

				// Do a forward lookup till the next "`".
				let closing_index = null;
				let do_language = true;
				let language = "";
				for (let i = tokenizer.index + 3; i < tokenizer.code.length; i++) {
					const c = tokenizer.code.charAt(i);
					const is_whitespace = tokenizer.is_whitespace(c);
					if (c == "`" && tokenizer.code.charAt(i + 1) == '`' && tokenizer.code.charAt(i + 2) == "`") {
						closing_index = i + 2;
						break;
					} else if (do_language && language.length > 0 && (is_whitespace || c == "\n")) {
						do_language = false;
					} else if (do_language && language.length == 0 && !is_whitespace && !tokenizer.is_alphabetical(c)) {
						do_language = false;
					} else if (do_language && !is_whitespace && c != "\n") {
						language += c;
					}
				}
				if (closing_index == null) { return false; }

				// Highlight the code.
				const start = tokenizer.index + 3 + language.length;
				const code = tokenizer.code.substr(start, (closing_index - 3) - start + 1);
				let result = null;
				if (language != "") {
					result = vhighlight.highlight({
						language: language,
						code: code,
						return_tokens: true,
					})
				}

				// Add tokens.
				tokenizer.append_forward_lookup_batch("token_keyword", "```");
				if (result == null) {
					tokenizer.append_forward_lookup_batch("token_codeblock", language + code);
				} else {
					tokenizer.append_forward_lookup_batch("token_keyword", language);
					tokenizer.concat_tokens(result);
				}
				tokenizer.append_forward_lookup_batch("token_keyword", "```");

				// Set resume index.
				tokenizer.resume_on_index(closing_index);
				return true;
				
			}


			// Not appended.
			return false;
		}
	}

	// Reset attributes that should be reset before each tokenize.
	reset() {
		this.current_line = null; // curent line to detect start of the line.
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
vhighlight.md = new vhighlight.Markdown();// ---------------------------------------------------------
// Python highlighter.

vhighlight.Python = class Python {
	constructor() {

		// Initialize the this.tokenizer.
		this.tokenizer = new vhighlight.Tokenizer({
			keywords: [
				"and",
				"as",
				"assert",
				"break",
				"class",
				"continue",
				"def",
				"del",
				"elif",
				"else",
				"except",
				"finally",
				"for",
				"from",
				"global",
				"if",
				"import",
				"in",
				"is",
				"lambda",
				"not",
				"or",
				"pass",
				"raise",
				"return",
				"try",
				"while",
				"with",
				"yield",
				"self",
				"True",
				"False",
				"None",
			],
			type_def_keywords: [
				"def",
				"class",
			], 
			type_keywords: [],
			operators: [
				"==", "!=", "<", ">", "<=", ">=", "+", "-", "*", "/", "%", "**", "//", "=", "!", "?", "&", "|",
				"^", "~", "<<", ">>",
			],
			special_string_prefixes: [
				"f",
				"r",
				"u",
				"b",
			],
			single_line_comment_start: "#",

			// Attributes for partial tokenizing.
			scope_separators: [
				":", 
			],
		});

		// Set callback.
		this.tokenizer.callback = (char) => {
			const tokenizer = this.tokenizer;
			
			// Highlight function calls.
			if (char == "(") {

				// Append batch by word boundary.
				tokenizer.append_batch();

				// Get prev token.
				// Prev token must be null since "token_type_def" is already assigned.
				// And also skip tuples by checking if the prev contains a word boundary.
				const prev = tokenizer.get_prev_token(tokenizer.added_tokens - 1, [" ", "\t", "\n"]);
				if (prev != null && prev.token === undefined && !tokenizer.str_includes_word_boundary(prev.data)) {
					prev.token = "token_type";
				}

			}

			// Not appended.
			return false;
		}
	}

	// Highlight.
	highlight(code = null, return_tokens = false) {
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
vhighlight.python = new vhighlight.Python();// ---------------------------------------------------------
// Javascript parser when in node js.

if (typeof module !== "undefined" && typeof module.exports !== "undefined") {

	// Imports.
	const libfs = require("fs");

	// JS compiler class.
	vhighlight.JSCompiler = class JSCompiler {

		// Constructor.
		/*	@docs: {
			@title JSCompiler constructor.
			@description:
				Bundle or compile javascript files with additinonal syntax options.
				
				Code minimization:
					Minimize code by removing unnecessary characters.
				
				String concatenation:
					A sequence of the matching strings with nothing in between except whitespace (` `, `\t`, `\n`) will automatically be concatenated into one string.

				Numeric procentuals.
					Numerics followed by `%` will automatically be converted into a string.

				Decorators:
					Possible decorators are:
						- @constructor_wrapper(suffix = "Class"): Automatically creates a function wrapper for the class with the same name as the class minus the suffix. The suffix must be present at the end of the class name.
						- @vweb_register: Register the element as a custom HTML element. Requires the vweb client library to be included.

					One or multiple custom decorators can also be defined.
					However this requires the following rules.
					 	- The decorator function must return an anonymous function.
					 	- The decorator function must always contain the `callback` parameter, the callback function can never have any arguments.
					 	- The decorator function must always take assignment parameters `function my_decorator({my_arg = null, callback = () => {}}) {}`.
					 	- When calling the decorator function, any arguments must be passed in a python like keyword assignment way, e.g. `@my_decorator(my_arg = "Hello World!")`.
					 	- The decorator must always be followed by a function or class definition.

			@parameter: {
				@name: line_breaks
				@type: boolean
				@description: Allow single line breaks.
			}
			@parameter: {
				@name: double_line_breaks
				@type: boolean
				@description: Allow double line breaks.
			}
			@parameter: {
				@name: comments
				@type: boolean
				@description: Allow comments.
			}
			@parameter: {
				@name: white_space
				@type: boolean
				@description: Allow optional whitespace.
			}
		} */
		constructor({
			line_breaks = true,
			double_line_breaks = false,
			comments = false,
			white_space = false,
		} = {}) {

			// Parameters.
			this.line_breaks = line_breaks;
			this.double_line_breaks = double_line_breaks;
			this.comments = comments;
			this.white_space = white_space;

			// Attributes.
			this.str_chars = ["\"", "'", "`;"]
			this.tokenizer = new vhighlight.JS({
				excluded_word_boundary_joinings: [" ", "\t"],
			});
		}
		
		// Bundle.
		/*	@docs: {
			@title Bundle.
			@description: Bundle and parse javascript files into a single file.
			@parameter: {
				@name: export_path
				@type: string
				@description: The bundled export path.
			}
			@parameter: {
				@name: include
				@type: array[string]
				@description: The array with file paths, when a path is a directory the entire directory will be included.
			}
			@parameter: {
				@name: exclude
				@type: array[string]
				@description: The file paths that will be excluded.
			}
		} */
		bundle({
			export_path = null,
			includes = [],
			excludes = [],
		}) {
			
			// Vars.
			let code = "";

			// Include path wrapper.
			const include_path = (path) => {
				
				// Skip excluded.
				if (excludes.includes(path)) {
					return null;
				}

				// Check existance.
				if (!libfs.existsSync(path)) {
					throw Error(`Path "${path}" does not exist.`);
				}

				// When the path is a directory.
				if (libfs.statSync(path).isDirectory()) {
					const files = libfs.readdirSync(path);
					for (let i = 0; i < files.length; i++) {
						include_path(`${path}/${files[i]}`);
					}
				}

				// When the path is a file.
				else {
					code += this.compile(path);
				}
			}

			// Iterate includes.
			for (let i = 0; i < includes.length; i++) {
				include_path(includes[i]);
			}

			// Export.
			libfs.writeFileSync(export_path, code);
		}

		// Compile a single file.
		compile(path) {
			return this.compile_code(libfs.readFileSync(path).toString());
		}

		// Compile code data.
		compile_code(code_data) {

			// ---------------------------------------------------------
			// Tokenize.			

			// Parse tokens.
			this.tokens = this.tokenizer.highlight(code_data, true)

			// ---------------------------------------------------------
			// Compile.		

			// Code insertions.
			// { after_token: <number> (insert after this token index), data: <string> (the data to insert) }
			this.code_insertions = [];

			// Other vars
			let code = "";
			let prev_token;						// the direct previous token.
			let prev_nw_token;					// the previous non whitespace token (also counting line breaks).
			let prev_is_whitespace = false;		// if the direct previous token is whitespace (also counting line breaks).
			let prev_is_operator = false;		// if the direct previous token is an operator (also counting line breaks).
			let prev_is_colon = false;			// if the direct previous token ends with a colon.
			let resume_on = 0;					// the token index on which to continue parsing when the token index is lower than resume on, it will be skipped.
			let line_index = -1;
			let token_index = -1;

			// ---------------------------------------------------------
			// Wrapper functions.

			// Get the next token, returns `null` when there is no next token.
			// const get_next_token = (lookup = 1, exclude = [], exclude_count = null) => {
			// 	return this.tokens.iterate_tokens(line_index, null, (token) => {
			// 		const excluded = (exclude_count === null || exclude_count > 0) || exclude.includes(token.data);
			// 		if (token.index >= token_index + lookup && !excluded) {
			// 			return token;
			// 		}
			// 		if (excluded && exclude_count !== null) {
			// 			--exclude_count;
			// 		}
			// 	})
			// }
			const get_next_token = (lookup = 1, exclude = []) => {
				return this.tokens.iterate_tokens(line_index, null, (token) => {
					if (token.index >= token_index + lookup && !exclude.includes(token.data)) {
						return token;
					}
				})
			}

			// ---------------------------------------------------------
			// Iterate tokens.

			// Mimize and format code.
			this.tokens.iterate((line_tokens) => {
				++line_index;

				// Iterate tokens.
				let added_tokens = 0;
				let at_line_start = true;
				line_tokens.iterate((token) => {

					// ---------------------------------------------------------
					// Vars.

					++token_index;
					let add_to_code = true;
					const is_whitespace = token.is_word_boundary === true && token.data.length === 1 && (token.data === " " || token.data === "\t");
					const is_operator = token.token === "token_operator";
					const next_nw_token = get_next_token(1, [" ", "\t", "\n"]);
					const next_token = get_next_token(1);
					const next_is_operator = next_token !== null && next_token.token == "token_operator";
					const next_is_whitespace = next_token !== null && next_token.is_word_boundary === true && next_token.data.length === 1 && (next_token.data === " " || next_token.data === "\t");
					if (at_line_start && is_whitespace === false) {
						at_line_start = false;
					}

					// ---------------------------------------------------------
					// Apply decorators.

					if (token.is_decorator === true) {

						// Apply.
						resume_on = this.apply_decorator(path, token);

						// Stop.
						return null;
					}

					// ---------------------------------------------------------
					// Skip.
					// But only after applying the decorators.

					if (token.index < resume_on) {
						return null;
					}

					// ---------------------------------------------------------
					// Skip single/double newlines.
					// But insert whitespace when the direct previous token was a keyword.

					if (
						token.is_line_break && 
						(token.is_comment !== true && token.is_str !== true && token.is_regex !== true && token.is_preprocessor !== true) && // always allow line breaks inside comments, strings, regex and preprocessors.
						(
							this.line_breaks === false ||
							(this.double_line_breaks === false && added_tokens == 0)
						)
					) {
						if (prev_token !== undefined && prev_token.token === "token_keyword") {
							code += " ";
						}
						return null;
					}

					// ---------------------------------------------------------
					// Skip whitespace.
					// Except a single whitespace after and before keywords.
					if (
						this.white_space === false && 
						is_whitespace &&
						(
							at_line_start || 
							prev_is_operator ||
							prev_is_colon ||
							next_is_whitespace ||
							next_is_operator ||
							(
								(prev_nw_token == null || prev_nw_token.token !== "token_keyword") &&
								(next_token == null || next_token.token !== "token_keyword")
							)
						)
					) {
						return null;
					}

					// ---------------------------------------------------------
					// Skip comments.

					if (
						this.comments === false && 
						token.is_comment === true &&
						(token.is_line_break !== true || added_tokens === 0)
					) {
						return null;
					}

					// ---------------------------------------------------------
					// Concatenate strings in a sequence with only whitespace in between.

					if (
						prev_nw_token !== undefined &&
						prev_nw_token.token === "token_string" &&
						token.token === "token_string" &&
						this.str_chars.includes(prev_nw_token.data[prev_nw_token.data.length - 1]) &&
						this.str_chars.includes(token.data[0]) &&
						prev_nw_token.data[prev_nw_token.data.length - 1] === token.data[0]
					) {
						
						// Remove all previous chars till (including) the last string closer.
						const closer = prev_nw_token.data[prev_nw_token.data.length - 1];
						let success = false, close_index;
						for (close_index = code.length - 1; close_index >= 0; close_index--) {
							if (code.charAt(close_index) === closer) {
								success = true;
								break;
							}
						}
						if (success) {
							code = code.substr(0, close_index);
							token.data = token.data.substr(1);
						}
					}

					// ---------------------------------------------------------
					// Convert numeric tokens followed by a "%" to a string.

					if (token.token === "token_numeric") {
						if (next_nw_token != null && next_nw_token.is_word_boundary) {
							if (next_nw_token.data.length === 1 && next_nw_token.data === "%") {
								code += `"${token.data}%"`;
								resume_on = next_nw_token.index + 1;
								add_to_code = false;
							} else if (next_nw_token.data.length > 1 && next_nw_token.data.charAt(0) === "%") {
								code += `"${token.data}%"`;
								next_nw_token.data = next_nw_token.data.substr(1);
								add_to_code = false;
							}
						}
					}

					// ---------------------------------------------------------
					// Add to code.

					// Append token.
					if (add_to_code) {
						code += token.data;
					}

					// ---------------------------------------------------------
					// Check code insertions.

					if (this.code_insertions.length > 0) {
						const new_code_insertions = [];
						this.code_insertions.iterate((item) => {
							if (item.after_token === token.index) {
								code += item.data;
							} else {
								new_code_insertions.push(item);
							}
						})
						this.code_insertions = new_code_insertions;
					}

					// ---------------------------------------------------------
					// Post edits.

					// Update iteration vars.
					++added_tokens;
					prev_token = token;
					prev_is_whitespace = is_whitespace;
					prev_is_operator = is_operator;
					prev_is_colon = token.token === undefined && token.data.length > 0 && token.data.charAt(token.data.length - 1) === ":";
					if (
						token.token !== "token_line" &&
						(token.data.length > 1 || (token.data != " " && token.data != "\t"))
					) {
						prev_nw_token = token;
					}
				})
			})
	
			// Add last newline.
			if (this.line_breaks === true && code.charAt(code.length - 1) !== "\n") {
				code += "\n";
			}

			// Handler.
			return code;
		}

		// ---------------------------------------------------------
		// Utils.

		// Get the next `token_type_def` token from a start line and token index.
		// Returns `null` when no token is found.
		get_next_type_def(line, start_index) {
			return this.tokens.iterate_tokens(line, null, (token) => {
				if (token.index >= start_index && token.token === "token_type_def") {
					return token;
				}
			})
		}

		// Get closing depth token from a start token line and token index.
		// Can only be used for `()`, `[]` and `{}`.
		// The returned attributes will be null when the closing scope was not found.
		// Allow non whitespace only counts when the depth is 0.
		get_closing_token(line, start_index, opener = "(", closer = ")", allow_non_whitespace = true) {
			let depth = 0, open_token = null, close_token = null;
			const res = this.tokens.iterate_tokens(line, null, (token) => {
				if (token.index >= start_index) {
					if (token.token === undefined && token.data.length === 1 && token.data === opener) {
						if (depth === 0) {
							open_token = token;
						}
						++depth;
					} else if (token.token === undefined && token.data.length === 1 && token.data === closer) {
						--depth;
						if (depth === 0) {
							close_token = token;
							return true;
						}
					} else if (
						depth === 0 && 
						allow_non_whitespace === false && 
						(
							token.data.length > 1 ||
							(token.data != " " && token.data != "\t" && token.data != "\n")
						)
					) {
						return false;
					}
				}
			})
			return {close_token, open_token};
		}

		// @todo an async function that uses a decorator still does not work, need to check for async and if so then make the callback also async, not sure about await etc, perhaps do not await but throw error if the decorator is not async and the func is.
		/* 	Apply a decorator token.
		 * 	Returns the resume on token index.
		 * 	A code insertion object looks as follows:
		 * 	{
		 * 		after_token: <number>, // insert after this token index.	
		 * 		data: <string>, // the data to insert.
		 *	}
		 */
		apply_decorator(path, token) {

			// ---------------------------------------------------------
			// Preperation.

			// Vars
			const column = token.offset - this.tokens[token.line][0].offset;
			const decorator = token.data;
			let resume_on;
			const line_break = this.line_breaks ? "" : "\n";

			// Get a decorator parameter value by name (decorators must always use keyword assignment).
			const get_param_value = (name, def = null) => {
				let value = def;
				token.parameters.iterate((param) => {
					if (param.name === name) {
						value = param.value;
						return true;
					}
				})
				if (value === undefined) { value = def; }
				while (value.length >= 2 && this.str_chars.includes(value.charAt(0)) && this.str_chars.includes(value.charAt(value.length - 1))) {
					value = value.substr(1, value.length - 2);
				}
				return value;
			}

			// Check if the previous token is keyword class.
			const check_prev_is_keyword_class = (type_def_token) => {
				const class_keyword = this.tokenizer.tokenizer.get_prev_token(type_def_token.index - 1, [" ", "\t", "\n"]);
				if (class_keyword == null || class_keyword.data !== "class") {
					throw Error(`${path}:${token.line}:${column}: The target type definition "${type_def_token.data}" is not a class (${decorator}).`);
				}
				return class_keyword;
			}

			// Build params as a js string.
			const build_params = (params) => {
				let data = "(";
				let i = 0, last_i = params.lenth - 1;
				params.iterate((param) => {
					if (param.name != null) {
						data += `${param.name}=`;
					}
					data += param.value;
					if (i != last_i) {
						data += ",";
					}
					++i;
				})
				data += ")";
				return data;
			}

			// Get the value to which a type def was assigned to eg "mylib.myfunc = ..." to retrieve "mylib.myfunc".
			// When there was no assignment used then `null` is returned.
			const get_assignment_name = (from_token_index) => {
				const assignment = this.tokenizer.tokenizer.get_prev_token(from_token_index, [" ", "\t", "\n"]);
				let assignment_name = null;
				if (assignment != null && assignment.data === "=") {
					assignment_name = "";
					this.tokens.iterate_tokens_reversed(assignment.line, assignment.line + 1, (token) => {
						if (token.index < assignment.index) {
							if (assignment_name.length === 0 && token.is_word_boundary !== true) {
								assignment_name += token.data;
							} else if (assignment_name.length !== 0) {
								if (token.is_word_boundary && token.data !== ".") {
									return false;
								} else {
									assignment_name = token.data + assignment_name;
								}
							}
						}
					})
					if (assignment_name.length === 0) {
						assignment_name = null;
					}
				}
				return assignment_name;
			}

			// Find the resume token.
			const resume = this.get_closing_token(token.line, token.index + 1, "(", ")", false);
			if (resume.close_token == null) {
				resume_on = token.index + 1;
			} else {
				resume_on = resume.close_token.index + 1;
			}

			// Find the closing "}" token.
			const {open_token, close_token} = this.get_closing_token(token.line, resume_on - 1, "{", "}");
			if (open_token === null || close_token === null) {
				throw Error(`${path}:${token.line}:${column}: Unable to find the scope's open and close tokens.`);
			}

			// Find the next type def token.
			const type_def_token = this.get_next_type_def(token.line, resume_on - 1);
			if (type_def_token === null || type_def_token.index >= open_token.index) {
				throw Error(`${path}:${token.line}:${column}: There is no type definition before the scope opening.`);
			}

			// ---------------------------------------------------------
			// Constructor wrapper.

			if (decorator === "@constructor_wrapper") {

				// Check if the previous token is "class".
				const class_keyword = check_prev_is_keyword_class(type_def_token);
				
				// Check if the class was assigned to a module with like "mylib.myclass = class MyClass {}".
				const assignment_name = get_assignment_name(class_keyword.index - 1);
				
				// Args.
				const suffix = get_param_value("suffix", "Class");

				// Check if the suffix matches the end of the target type.
				if (
					type_def_token.data.length < suffix.length || 
					type_def_token.data.substr(type_def_token.data.length - suffix.length) != suffix
				) {
					throw Error(`${path}:${token.line}:${column}: The target type definition "${type_def_token.data}" does not contain suffix "${suffix}" (${decorator}).`);
				}

				// Create data.
				let data = ";";
				if (assignment_name !== null) {
					data += `${assignment_name}=`;
				}
				data += `${line_break}function ${type_def_token.data.substr(0, type_def_token.data.length - suffix.length)}(...args){return new ${type_def_token.data}(...args)};`;
				
				// Return code insertion.
				this.code_insertions.push({
					after_token: close_token.index,
					data: data,
				});
			}

			// ---------------------------------------------------------
			// Constructor wrapper.

			else if (decorator === "@vweb_register") {

				// Check if the previous token is "class".
				const class_keyword = check_prev_is_keyword_class(type_def_token);

				// Create data.
				const data = `;${line_break}vweb.elements.register(${type_def_token.data});`;
				
				// Return code insertion.
				this.code_insertions.push({
					after_token: close_token.index,
					data: data,
				});
			}

			// ---------------------------------------------------------
			// Custom decorators.

			else {

				// Put the entire function call inside a sub function named callback.
				if (type_def_token.custom_decorators === undefined) {
					this.code_insertions.push({
						after_token: open_token.index,
						data: `${line_break}let callback=()=>{`,
					})
					this.code_insertions.push({
						after_token: close_token.index - 1,
						data: `};${line_break}`,
					})
				}

				// When there are multiple custom decoratos then the decorators that were declared first should be called as last in order to keep the execute order right.
				// So remove this functions custom decorators from the code insertions and then add them in the correct order.
				let old_decorators = [];
				if (type_def_token.custom_decorators !== undefined) {
					const new_insertions = [];
					this.code_insertions.iterate((item) => {
						if (item.decorator !== type_def_token.offset) {
							new_insertions.push(item);
						}
						else if (item.end_decorator !== true) {
							old_decorators.push(item);
						}
					})
					this.code_insertions = new_insertions;
				}

				// Add the decorator.
				let data = `callback=${decorator.substr(1)}({callback:callback`;
				token.parameters.iterate((param) => {
					if (param.name == null) {
						throw Error(`${path}:${token.line}:${column}: Decorator parameters must always use keyword assignment "@decorator(my_param = 0)" (${decorator}).`);
					}
					data += `,${param.name}:${param.value}`
				})
				data += `});${line_break}`
				this.code_insertions.push({
					after_token: close_token.index - 1,
					data: data,
					decorator: type_def_token.offset, // use as id.
				})

				// Add the old decorators.
				old_decorators.iterate((item) => {
					this.code_insertions.push(item);
				})

				// Return the callback.
				this.code_insertions.push({
					after_token: close_token.index - 1,
					data: `return callback();${line_break}`,
					decorator: type_def_token.offset, // use as id.
					end_decorator: true,
				})

				// Assign token's custom decorators.
				if (type_def_token.custom_decorators === undefined) {
					type_def_token.custom_decorators = [decorator];
				} else {
					type_def_token.custom_decorators.push(decorator);
				}

			}

			// ---------------------------------------------------------
			// Finish.

			// Unknown decorator.
			// else {
			// 	throw Error(`${path}:${token.line}: Unknown decorator "${decorator}".`);
			// }

			// Handler.
			return resume_on;

		}
	}
}// Export vhighlight.
if (typeof module !== "undefined" && typeof module.exports !== "undefined") {

    // Set export file paths for web inclusions.
    // Remember this is bundled into vhighlight/vhighlight.js
    vhighlight.web_exports = {
        "css": `${__dirname}/css/vhighlight.css`,
        "js": `${__dirname}/vhighlight.js`,
    }

    // Export the library.
	module.exports = vhighlight;
}