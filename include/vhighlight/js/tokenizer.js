/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// The tokenizer class.
// - Do not forget to assign attribute "code" after initializing the Tokenizer, used to avoid double copy of the code string.
// - Parsing behaviour depends on that every word is seperated as a token, so each word boundary is a seperate token.
class Tokenizer {
	constructor({
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
	}) {

		// Parameter attributes.
		this.code = null;											// the code to tokenize.
		this.keywords = keywords;									// the languages default keywords.
		this.type_def_keywords = type_def_keywords;					// the keywords on wich the next token will always be a type def.
		this.type_keywords = type_keywords;							// the keywords on wich the next token will always be a type.
		this.operators = operators;									// language operators.
		this.special_string_prefixes = special_string_prefixes;		// special characters preceding a string to indicate a special string, such as the "f" in python for "f'{}'".
		this.single_line_comment_start = single_line_comment_start;	// the language's single line comment start characters, use "false" when the language does not support this.
		this.multi_line_comment_start = multi_line_comment_start;	// the language's multi line comment start characters, use "false" when the language does not support this.
		this.multi_line_comment_end = multi_line_comment_end;		// the language's multi line comment end characters, use "false" when the language does not support this.
		this.allow_strings = allow_strings;							// if the language supports strings.
		this.allow_numerics = allow_numerics;						// if the language supports numerics.
		this.allow_preprocessors = allow_preprocessors;				// if the language has "#..." based preprocessor statements.
		this.allow_slash_regexes = allow_slash_regexes;				// if the language has "/.../" based regex statements.

		// Attributes.
		this.tokens = [];				// use an array with tokens since some tokens need to be edited after they have been appended.
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

		// Attributes for JS.
		this.class_depth = null;		// @TODO js does not allow class definitions inside a class, but it does allow it insice a functio which is a member of a class.
									// something with an array of class depths could be done, if a new class opens add one if it closes remove one, and return the last one to use.

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

		// The default callback.
		this.callback = function() { return false; }

	}

	// Fetch the first non whitespace token going backwards from the specified index.
	// So it also tests the specified index. If the previous token data is excluded it checks one further back.
	get_prev_token(index, exclude = [" ", "\t", "\n"], exclude_comments = false) {
		for (let i = index; i >= 0; i--) {
			const item = this.tokens[i];
			if (exclude_comments && item.token == "token_comment") {
				continue;
			}
			if (!exclude.includes(item.data)) {
				return item;
			}
		}
		return null;
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
		const info_obj = {index: null};
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
	get_first_non_whitespace(index) {
		if (index == null) {
			return null;
		}
		let end;
		for (end = index; end < this.code.length; end++) {
			const c = this.code.charAt(end);
			if (c != " " && c != "\t") {
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
	append_token(token = null) {
		this.tokens.push({token: token, data: this.batch, index: this.tokens.length, line: this.line});
	}
	
	// Append batch.
	// - Batches should only be a single word, unless it is a string or comment
	// - When the token param is false, no spans will be added, when the token ...
	//   Is not null the assigned token will be added as span. And when the token param ...
	//   Is null the batch will be checked against keywords, numerics etc.
	append_batch(token = null) {
		if (this.batch.length == 0) {
			return ;
		}
		
		// Do not parse tokens.
		if (token == false) {
			this.append_token();
		}
		
		// By assigned token.
		else if (token != null) {
			this.append_token(token);
		}
		
		// By next token.
		// Skip whitespace.
		else if (this.next_token != null) {

			// Skip next token but do not reset on whitespace batch.
			if (this.is_linebreak_whitespace_char()) {
				this.append_token();
			}

			// Reset next token when the batch is a word boundary for example in "struct { ... } X".
			else if (this.word_boundaries.includes(this.batch)) {
				this.append_token();
				this.next_token = null;
			}

			// Reset next token when the batch is a keyword for example in "constexpr inline X".
			else if (this.keywords.includes(this.batch)) {
				this.append_token("token_keyword");
				this.next_token = null;
			}

			// Append as next token.
			else {
				this.append_token(this.next_token);
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
				this.append_token("token_operator");
			}
			
			// Numeric.
			else if (this.allow_numerics && /^-?\d+(\.\d+)?$/.test(this.batch)) {
				this.append_token("token_numeric");
			}
			
			// Just a code batch without highlighting.
			else {
				this.append_token(null);
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
		// DO NOT ASSIGN ANY ATTRIBUTES IN THIS FUNC SINCE IT IS ALSO CALLED BY OTHER FUNCS THAN "tokenize()".
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
		for (info_obj.index = start; info_obj.index < end; info_obj.index++) {
			//
			// DO NOT ASSIGN ANY ATTRIBUTES IN THIS FUNC SINCE IT IS ALSO CALLED BY OTHER FUNCS THAN "tokenize()".
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

			// Preprocessor.
			if (this.allow_preprocessors && !is_preprocessor && prev_non_whitespace_char == "\n" && char == "#") {
				is_preprocessor = true;
				const res = callback(char, false, is_comment, is_multi_line_comment, is_regex, is_escaped, is_preprocessor);
				if (res != null) { return res; }
				continue;
			} else if (is_preprocessor && char == "\n" && prev_non_whitespace_char != "\\") {
				is_preprocessor = false;
				const res = callback(char, false, is_comment, is_multi_line_comment, is_regex, is_escaped, is_preprocessor);
				if (res != null) { return res; }
				continue;
			}
			
			// Strings.
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
				if (comment_start.length == 1 && char == comment_start) {
					is_comment = true;
					const res = callback(char, false, is_comment, is_multi_line_comment, is_regex, is_escaped, is_preprocessor);
					if (res != null) { return res; }
					continue;
				} else if (comment_start.length == 2 && char + info_obj.next_char == comment_start) {
					is_comment = true;
					const res = callback(char, false, is_comment, is_multi_line_comment, is_regex, is_escaped, is_preprocessor);
					if (res != null) { return res; }
					continue;
				}
				
				// Multi line comments.
				const mcomment_start = this.multi_line_comment_start;
				if (mcomment_start == false) {
					// skip but do not use continue since the "No string or comment" should be checked.
				} else if (mcomment_start.length == 2 && char + info_obj.next_char == mcomment_start) {
					is_multi_line_comment = true;
					const res = callback(char, false, is_comment, is_multi_line_comment, is_regex, is_escaped, is_preprocessor);
					if (res != null) { return res; }
					continue;
				}
				
			}
			
			// End single line comments.
			else if (
				is_comment &&
				!is_escaped &&
				char == "\n"
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
				if (!is_preprocessor) {
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
						this.append_batch(); // do not use "false" as parameter "token" since the word boundary may be an operator.
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
		this.append_batch();

		// Return tokens.
		if (return_tokens) {
			return {
				tokens: this.tokens,
				line_count: this.line,
			}
		}

		// Build html.
		else {
			return this.build_tokens();
		}
	}

	// Build the html from tokens.
	// - Every "{", "}" and "\n" character should be appended as a single token.
	//   Otherwise foldable spans and newline spans will fail.
	// - New lines will be added inside a span so you can iterate the html children from line till line.
	build_tokens(reformat = true) {

		// Vars.
		let html = "";
		
		// Iterate an array with token objects.
		for (let i = 0; i < this.tokens.length; i++) {
			const token = this.tokens[i];
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
		}
		
		// Handler.
		return html;
	}
}
