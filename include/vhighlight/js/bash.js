/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Python highlighter.

vhighlight.bash = {};

// The tokenizer options.
vhighlight.bash.tokenizer_opts = {
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
	multi_line_comment_start: false,
	multi_line_comment_end: false,
}

// Highlight.
vhighlight.bash.highlight = function(code, return_tokens = false) {

	// Initialize the tokenizer.
	const tokenizer = new Tokenizer(vhighlight.bash.tokenizer_opts);

	// Assign the code.
	tokenizer.code = code;

	// Let first line.
	let current_line = null;

	// The callback.
	tokenizer.callback = function(char, is_escaped) {

		// Is whitespace.
		const is_whitespace = this.is_whitespace(char);

		// Start of line excluding whitespace.
		let start_of_line = false;
		if (current_line != this.line && !is_whitespace) {
			start_of_line = true;
			current_line = this.line;
		}

		// Special operators preceded by a "-" such as "-eq".
		if (char == "-") {
			let batch = null;
			if (this.operators.includes(char + this.next_char)) {
				batch = char + this.next_char;
			} else if (this.operators.includes(char + this.next_char + this.code.charAt(this.index + 2))) {
				batch = char + this.next_char + this.code.charAt(this.index + 2);
			}
			if (batch != null) {
				this.append_batch();
				this.append_forward_lookup_batch("token_operator", batch);
				this.resume_on_index(this.index + batch.length - 1);
				return true;
			}
		}

		// Special keywords preceded by a "$" such as "$1".
		else if (char == "$") {
			let batch = "$";
			let index = this.index + 1;
			while (true) {
				c = this.code.charAt(index);
				if (this.is_numerical(c)) {
					batch += c;
				} else {
					break;
				}
				++index;
			}
			if (batch.length == 1 && (this.next_char == "#" || this.next_char == "@" || this.next_char == "?")) {
				batch += this.next_char
			}
			if (batch.length > 1) {
				this.append_batch();
				this.append_forward_lookup_batch("token_keyword", batch);
				this.resume_on_index(this.index + batch.length - 1);
				return true;
			}
		}

		// Function declaration.
		else if (char == "(") {

			// Append batch by word boundary.
			this.append_batch();

			// Do a forward lookup to look for a "() {" pattern with optional whitespace and linebreaks in between.
			let is_func_def = false;
			for (let i = this.index + 1; i < this.code.length; i++) {
				const c = this.code.charAt(i);
				if (c == "{") {
					is_func_def = true;
				}
				else if (c != ")" && c != "\n" && c != "\t" && c != " ") {
					break;
				}
			}

			// Edit prev token.
			if (is_func_def) {
				const prev = this.get_prev_token(this.tokens.length - 1, [" ", "\t", "\n"]);
				prev.token = "token_type_def";
			}
		}

		// Function / command call.
		else if (start_of_line && this.is_alphabetical(char)) {

			// Do a forward lookup for a "AAA A" pattern, two consecutive words with only whitespace in between.
			let finished = false;
			let passed_whitespace = false;
			let word = "";
			let end_index = null;
			for (let i = this.index; i < this.code.length; i++) {
				const c = this.code.charAt(i);
				if (c == " " || c == "\t") {
					passed_whitespace = true;
				} else if (!passed_whitespace && (this.is_alphabetical(c) || this.is_numerical(c))) {
					word += c;
					end_index = i;
				} else if (passed_whitespace && (char == "\\" || !this.operators.includes(char))) {
					finished = true;
					break;
				} else {
					break;
				}
			}
			if (finished && !this.keywords.includes(word)) {
				this.append_batch();
				this.append_forward_lookup_batch("token_type", word);
				this.resume_on_index(end_index);
				return true;
			}
		}

		// Multi line comments.
		else if (start_of_line && char == ":") {

			// Do a forward lookup to determine the style.
			let style = null;
			let start_index = null; // the start after the ": <<" or the start after the ": '"
			let end_index = null;
			for (let i = this.index + 1; i < this.code.length; i++) {
				const c = this.code.charAt(i);
				if (c == " " || c == "\t") {
					continue;
				} else if (c == "<") {
					if (this.code.charAt(i + 1) == "<") {
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
					if (start_index + close_sequence.length > this.code.length) {
				        return false;
				    }
				    const end = start_index + close_sequence.length;
				    let y = 0;
				    for (let x = start_index; x < end; x++) {
				        if (this.code.charAt(x) != close_sequence.charAt(y)) {
				            return false;
				        }
				        ++y;
				    }
				    return true;
				}

				// Get the closing sequence.
				for (let i = start_index; i < this.code.length; i++) {
					const c = this.code.charAt(i);
					if (!found_close_sequence) {
						if (this.is_whitespace(c)) {
							continue;
						} else if (
							c == '"' || 
							c == "'" || 
							c == "_" || 
							c == "-" || 
							this.is_numerical(c) || 
							this.is_alphabetical(c)
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
				const closing_char = this.code.charAt(start_index - 1);
				for (let i = start_index; i < this.code.length; i++) {
					const c = this.code.charAt(i);
					if (!is_escaped && c == closing_char) {
						end_index = i;
						break;
					}
				}
			}

			// Append tokens.
			if (end_index != null) {
				this.append_batch();
				this.append_forward_lookup_batch("token_comment", this.code.substr(this.index, end_index - this.index + 1));
				this.resume_on_index(end_index);
				return true;
			}
		}

		// Nothing done.
		return false;
	}

	// Tokenize.
	return tokenizer.tokenize(return_tokens);
}
