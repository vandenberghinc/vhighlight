/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
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
		const tokenizer = this.tokenizer;

		// Assign attributes.
		this.reset();

		// Set callback.
		this.tokenizer.callback = (char, is_escaped) => {
			
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

		// Set on parenth close.
		this.tokenizer.on_parenth_close = ({
			token_before_opening_parenth = token_before_opening_parenth,
			after_parenth_index = after_parenth_index,
		}) => {
			if (after_parenth_index != null && tokenizer.code.charAt(after_parenth_index) === "{") {
				token_before_opening_parenth.token = "token_type_def";
				return token_before_opening_parenth;
			}
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
vhighlight.bash = new vhighlight.Bash();
