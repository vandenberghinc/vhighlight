// Code iterator.
vhighlight.IteratorState = class {
	constructor() {
		this.index = 0;
		this.prev_char = 0;
		this.next_char = 0;
		this.char = undefined;
		this.start_of_line = true;
		this.line = 0;
		this.column = 0;
		this.string_char = null;
		this.is_str = false;
		this.is_template_literal = false;
		this.is_comment = false;
		this.is_multi_line_comment = false;
		this.is_regex = false;
		this.is_escaped = false;
		this.is_preprocessor = false;
		this.is_whitespace = false;
		this.is_first_non_whitespace = false;
		this.is_line_break = false;
		this.prev_non_whitespace_char = null;
		this.line_indent = 0;
		this.curly_depth = 0;
		this.bracket_depth = 0;
		this.parenth_depth = 0;
		this.line_offset = 0;
		this._sys_line_offset = 0;

		// sys.
		this.multi_line_comment_check_close_from_index = null;	// the start index of the multi line comment because when a user does something like /*// my comment */ the comment would originally immediately terminate because of the /*/.
		this.inside_template_curly_depth = 0;					// the {} depth when inside a js template string.
		this.inside_template_curly_end = [];						// the array of end depths when currently inside a template string.
		this.forced_multi_line_comment_end = null;				// the end comment match for langs like python which can hold both """ and ''' for multi line comments.
	}
	clone() {
		const state = new vhighlight.IteratorState();
		state.index = this.index;
		state.prev_char = this.prev_char;
		state.next_char = this.next_char;
		state.char = this.char;
		state.start_of_line = this.start_of_line;
		state.line = this.line;
		state.column = this.column;
		state.string_char = this.string_char;
		state.is_str = this.is_str;
		state.is_template_literal = this.is_template_literal;
		state.is_comment = this.is_comment;
		state.is_multi_line_comment = this.is_multi_line_comment;
		state.is_regex = this.is_regex;
		state.is_escaped = this.is_escaped;
		state.is_preprocessor = this.is_preprocessor;
		state.is_whitespace = this.is_whitespace;
		state.is_first_non_whitespace = this.is_first_non_whitespace;
		state.is_line_break = this.is_line_break;
		state.prev_non_whitespace_char = this.prev_non_whitespace_char;
		state.line_indent = this.line_indent;
		state.curly_depth = this.curly_depth;
		state.bracket_depth = this.bracket_depth;
		state.parenth_depth = this.parenth_depth;
		state.line_offset = this.line_offset;
		state._sys_line_offset = this._sys_line_offset;
		state.multi_line_comment_check_close_from_index = this.multi_line_comment_check_close_from_index;
		state.inside_template_curly_depth = this.inside_template_curly_depth;
		state.inside_template_curly_end = this.inside_template_curly_end;
		state.forced_multi_line_comment_end = this.forced_multi_line_comment_end;
		return state;
	}
};
vhighlight.Iterator = class {

	static word_boundaries = [
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

	// Constructor.
	constructor({
		code = null,
		language = null,
		tab_size = 4,
		start = null,
		end = null,
		callback = (state) => {},
		single_line_comment_start = null,
		multi_line_comment_start = null,
		multi_line_comment_end = null,
		multi_line_comment_only_at_start = null,
		allow_strings = null,
		allow_strings_double_quote = null,
		allow_preprocessors = null,
		allow_slash_regexes = null,
	}) {

		// Parameter attributes.
		this.code = code;																// the code to tokenize.
		this.tab_size = tab_size;
		this.start = start ?? 0;
		this.end = end ?? code?.length;
		this.callback = callback;
		this.single_line_comment_start = single_line_comment_start;						// the language's single line comment start characters, use "false" when the language does not support this.
		this.multi_line_comment_start = multi_line_comment_start;						// the language's multi line comment start characters, use "false" when the language does not support this.
		this.multi_line_comment_end = multi_line_comment_end;							// the language's multi line comment end characters, use "false" when the language does not support this.
		this.multi_line_comment_only_at_start = multi_line_comment_only_at_start;		// should be enabled if the multi line comments can only be defined at the start of the line (such as in python).
		this.allow_strings = allow_strings;												// if the language supports strings.
		this.allow_strings_double_quote = allow_strings_double_quote;					// allow strings by double qoute.
		this.allow_preprocessors = allow_preprocessors;									// if the language has "#..." based preprocessor statements.
		this.allow_slash_regexes = allow_slash_regexes;									// if the language has "/.../" based regex statements.
		this.language = language === "ts" ? "js" : language.toLowerCase();

		// States.
		this.state = new vhighlight.IteratorState();
		this.states = [];

		// Check language.
		const tokenizer = vhighlight.get_tokenizer(this.language);
		if (tokenizer == null) {
			throw new Error(`Invalid language "${this.language}".`)
		}
		this.language = tokenizer.language;

		// Some alias attributes.
		this.is_js = tokenizer.language === "JS";
		this.is_ts = tokenizer.language === "TypeScript";
		this.is_py = tokenizer.language === "Python";
		this.is_cpp = tokenizer.language === "C++";

		// Set defaults by language.
		this.single_line_comment_start ??= tokenizer.single_line_comment_start;
		this.multi_line_comment_start ??= tokenizer.multi_line_comment_start;
		this.multi_line_comment_end ??= tokenizer.multi_line_comment_end;
		this.multi_line_comment_only_at_start ??= tokenizer.multi_line_comment_only_at_start;
		this.allow_strings ??= tokenizer.allow_strings;
		this.allow_strings_double_quote ??= tokenizer.allow_strings_double_quote;
		this.allow_preprocessors ??= tokenizer.allow_preprocessors;
		this.allow_slash_regexes ??= tokenizer.allow_slash_regexes;

		// Set array.
		this.multi_line_comment_start_is_array = Array.isArray(this.multi_line_comment_start);

		// Preceding chars that allow the follow of a regex.
		this.preceding_regex_chars = [
            '(', '[', '{', '=', ':', ';', ',', '!', '?', '+', '-', '*', '%', '&', '|', '^', '~', '<', '>', '\n',
        ]

		// 
	}

	// Check if an a character is escaped by index.
	is_escaped(index) {
		if (this.code.charAt(index - 1) == "\\") {
			if (this.code.charAt(index - 2) == "\\") {
				return this.is_escaped(index - 2);
			}
			return true;
		}
		return false;
	}

	// Eq first of.
	eq_first_of(substrs, offset = 0) {
		for (let i = 0; i < substrs.length; i++) {
			if (this.code.startsWith(substrs[i], offset)) {
				return true;
			}
		}
		return false;
	}

	// Iterate code function.
	// When the callback returns a non null value the iteration will stop and that value will be returned.
	iterate() {

		// Vars.
		const state = this.state;

		// Add state wrapper.
		const add_state = () => {
			const clone = state.clone();
			if (this.states.length > 0) {
				clone.prev = this.states.last();
				this.states[this.states.length - 1].next = clone;
			}
			this.states.push(clone);
			return clone;
		}

		// Iterate.
		for (state.index = this.start; state.index < this.end; state.index++) {

			// Get char.
			const char = this.code.charAt(state.index);
			state.char = char;

			// Set next and previous.
			if (state.index > 0) { // to make prev char compatible with TokenizerState.
				state.prev_char = this.code.charAt(state.index - 1);
			}
			state.next_char = this.code.charAt(state.index + 1);

			// Set prev non whitespace char.
			state.is_whitespace = state.char === " " || state.char === "\t";
			if (state.prev_char !== " " && state.prev_char !== "\t") {
				state.prev_non_whitespace_char = state.prev_char;
			}

			// Set is escaped.
			state.is_escaped = this.is_escaped(state.index);

			// Increment line and column.
			state.is_line_break = char === "\n";
			if (state.is_line_break && !state.is_escaped) {
				++state.line;
				state.is_first_non_whitespace = false;
				state.column = 0;
				state.line_indent = 0;
				state.line_offset = state._sys_line_offset;
				state._sys_line_offset = state.index + 1;
			} else {
				if (state.column === 0) {
					state.start_of_line = true;
				}
				++state.column;
			}

			// Set start of line.
			if (state.is_first_non_whitespace) {
				state.is_first_non_whitespace = false;
			}
			if (state.start_of_line && state.is_whitespace) {
				if (char === " ") {
					++state.line_indent;
				} else {
					state.line_indent += this.tab_size - (state.line_indent % this.tab_size);
				}
			}
			else {
				state.is_first_non_whitespace = true;
				state.start_of_line = false;
			}

			// Check depths.
			if (
				state.string_char == null &&
				!state.is_comment &&
				!state.is_multi_line_comment &&
				// !state.is_preprocessor && // inside preprocessors depths should be counted
				!state.is_regex
			) {
				switch (char) {
					case "{": state.curly_depth += 1; break;
					case "}": state.curly_depth -= 1; break;
					case "[": state.bracket_depth += 1; break;
					case "]": state.bracket_depth -= 1; break;
					case "(": state.parenth_depth += 1; break;
					case ")": state.parenth_depth -= 1; break;
					default: break;
				}
			}

			// Start of preprocessors.
			if (
				this.allow_preprocessors && 
				!state.is_preprocessor && 
				(state.prev_non_whitespace_char == "\n" || state.index === 0) && 
				char == "#"
			) {
				state.is_preprocessor = true;
				const res = this.callback(add_state());
				if (res != null) {
					state.index++
					return res;
				}
				continue;
			}

			// End of preprocessors.
			else if (
				state.is_preprocessor && 
				(char == "\n" && state.prev_non_whitespace_char != "\\") 
			) {
				state.is_preprocessor = false;
				const res = this.callback(add_state());
				if (res != null) {
					state.index++
					return res;
				}
				continue;
			}

			// Open comments.
			// Comments must be checked before string, due to the multi line comment `"""` from python.
			if (
				!state.is_escaped &&
				!state.is_comment &&
				!state.is_multi_line_comment &&
				!state.is_regex &&
				state.string_char == null
			) {
				
				// Single line comments.
				if (
					this.single_line_comment_start !== false && 
					(
						(this.single_line_comment_start.length === 1 && char === this.single_line_comment_start) ||
						(this.single_line_comment_start.length !== 1 && this.code.startsWith(this.single_line_comment_start, state.index))
					)
				) {
					state.is_preprocessor = false; // a single line comment in the preprocessor line terminates the preprocessor statement.
					state.is_comment = true;
					const res = this.callback(add_state());
					if (res != null) {
						state.index++
						return res;
					}
					continue;
				}
				
				
				// Multi line comments.
				let is_array_index;
				if (
					this.multi_line_comment_start !== false &&
					(this.multi_line_comment_only_at_start === false || state.prev_non_whitespace_char === "\n" || state.prev_non_whitespace_char === "") &&
					(
						(!this.multi_line_comment_start_is_array && this.multi_line_comment_start.length === 1 && char === this.multi_line_comment_start) ||
						(!this.multi_line_comment_start_is_array && this.multi_line_comment_start.length !== 1 && this.code.startsWith(this.multi_line_comment_start, state.index)) ||
						(this.multi_line_comment_start_is_array && (is_array_index = this.eq_first_of(this.multi_line_comment_start, state.index)) !== null)
					)
				) {
					if (this.multi_line_comment_start_is_array) {
						state.forced_multi_line_comment_end = this.multi_line_comment_start[is_array_index];
						state.multi_line_comment_check_close_from_index = state.index + state.forced_multi_line_comment_end.length * 2; // also add mlcomment end length since the mlc close looks backwards.
					} else {
						state.multi_line_comment_check_close_from_index = state.index + this.multi_line_comment_start.length + this.multi_line_comment_end.length; // also add mlcomment end length since the mlc close looks backwards.
					}
					state.is_multi_line_comment = true;
					const res = this.callback(add_state());
					if (res != null) {
						state.index++
						return res;
					}
					continue;
				}
				
			}
			
			// End single line comments.
			else if (
				state.is_comment &&
				!state.is_escaped && char == "\n"
			) {
				state.is_comment = false;
				const res = this.callback(add_state());
				if (res != null) {
					state.index++
					return res;
				}
				continue;
			}
			
			// End multi line comments.
			else if (
				state.is_multi_line_comment &&
				!state.is_escaped &&
				state.index >= state.multi_line_comment_check_close_from_index &&
				(
					(!this.multi_line_comment_start_is_array && this.multi_line_comment_end.length === 1 && char == this.multi_line_comment_end) ||
					(!this.multi_line_comment_start_is_array && this.multi_line_comment_end.length !== 1 && this.code.startsWith(this.multi_line_comment_end, state.index - (this.multi_line_comment_end.length - 1))) ||
					(this.multi_line_comment_start_is_array && state.forced_multi_line_comment_end !== null && this.code.startsWith(state.forced_multi_line_comment_end, state.index - (state.forced_multi_line_comment_end.length - 1)))
				)
			) {
				const res = this.callback(add_state());
				state.forced_multi_line_comment_end = null;
				state.is_multi_line_comment = false;
				if (res != null) {
					state.index++
					return res;
				}
				continue;
			}
			
			
			// Open strings.
			if (
				(this.allow_strings || (this.allow_strings_double_quote && char === '"')) &&
				!state.is_escaped &&
				!state.is_comment &&
				!state.is_multi_line_comment &&
				!state.is_regex &&
				state.string_char === null &&
				(
					char == '"' || 
					char == "'" || 
					char == '`'
				)
			) {
				state.string_char = char;
				state.is_str = true;
				const res = this.callback(add_state());
				if (res != null) {
					state.index++
					return res;
				}
				continue;
			}

			// Close strings.
			else if (
				!state.is_escaped &&
				state.string_char !== null &&
				char === state.string_char
			) {
				const res = this.callback(add_state());
				state.string_char = null;
				state.is_str = false;
				if (res != null) {
					state.index++
					return res;
				}
				continue;
			}

			// Inside strings.
			else if (state.string_char !== null) {

				// Close string by js ${} template string.
				if (state.string_char === "`" && this.is_js && char === "$" && state.next_char === "{") {
					if (state.inside_template_curly_end.length === 0) {
						state.inside_template_curly_depth = 0;
					}
					state.inside_template_curly_end.push(state.inside_template_curly_depth);
					state.string_char = null;
					state.is_str = false;
					state.is_template_literal = true;
					const res = this.callback(add_state());
					if (res != null) {
						state.index++
						return res;
					}
					continue;
				}

				// Inside string.
				const res = this.callback(add_state());
				if (res != null) {
					state.index++
					return res;
				}
				continue;
			}

			// The end of js ${} code inside a template string.
			if (state.inside_template_curly_end.length !== 0) {
				if (state.string_char === null && char === "{") {
					++state.inside_template_curly_depth;
				} else if (state.string_char === null && char === "}") {
					--state.inside_template_curly_depth;

					// Re-open the string.
					if (state.inside_template_curly_end[state.inside_template_curly_end.length - 1] === state.inside_template_curly_depth) {
						--state.inside_template_curly_end.length;
						const res = this.callback(add_state());
						state.string_char = "`";
						state.is_str = true;
						state.is_template_literal = false;
						if (res != null) {
							state.index++
							return res;
						}
						continue;			
					}
				}
			}
			
			// Inside comments.
			else if (state.is_comment || state.is_multi_line_comment) {
				const res = this.callback(add_state());
				if (res != null) {
					state.index++
					return res;
				}
				continue;
			}
			
			// Statements should reuse the "if" not "else if" after the start of the comment check.
			// Since that does not always match in the first if statement.
			// End of comment checks can still use "else if".

			// Handle regex detection
			if (
			    this.allow_slash_regexes &&
			    !state.is_escaped &&
			    !state.is_comment &&
			    !state.is_multi_line_comment &&
			    state.string_char === null
			) {
			    if (state.is_regex) {
			        const res = this.callback(add_state());
			        if (char === '/' && !state.is_escaped) {
			            state.is_regex = false; // Exiting regex
			        }
			        if (res != null) {
			            state.index++;
			            return res;
			        }
			        continue;
			    }

			    // Start of a regex literal
			    else if (
			    	char === '/' && (
			    		state.prev_non_whitespace_char == null ||
			        	this.preceding_regex_chars.includes(state.prev_non_whitespace_char)
			    	)
			    ) {     
		            state.is_regex = true;
		            const res = this.callback(add_state());
		            if (res != null) {
		                state.index++;
		                return res;
		            }
		            continue;
			    }
			}
			/*
			// Check the start of a regex definition "/hello/", must check the previous char.
			if (this.allow_slash_regexes && !state.is_escaped && !state.is_regex && char == "/") {
				let prev = null;
				for (let p = state.index - 1; p >= 0; p--) {
					const c = this.code.charAt(p);
					if (c != " " && c != "\t") {
						prev = c;
						break;
					}
				}
				if (
					prev != null &&
					prev !== "<" && // for JSX 
					this.code.charAt(state.index + 1) !== ">" && // for JSX
					vhighlight.Iterator.word_boundaries.includes(prev)
				) {
					state.is_regex = true;
					const res = this.callback(add_state());
					if (res != null) {
						state.index++
						return res;
					}
					continue;
				}
			}
			
			// Inside / end of regex.
			else if (state.is_regex) {
				const res = this.callback(add_state()); // always use true for is_regex to make sure the closing / is still treated as a regex.
				if (char == '/' && !state.is_escaped) {
					state.is_regex = false;
				}
				if (res != null) {
					state.index++
					return res;
				}
				continue;
			}
			*/
			
			// Statements should reuse the "if" not "else if" after the start of the regex check.
			// Since that does not always match in the first if statement.
			// End of regex checks can still use "else if".
			
			// No string, comment or regex.
			const res = this.callback(add_state());
			if (res != null) {
				state.index++
				return res;
			}
		}
		return null;
	};
}