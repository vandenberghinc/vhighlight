/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Markdown highlighter.

vhighlight.Markdown = class Markdown {
	constructor() {

		// Initialize the this.tokenizer.
		this.tokenizer = new vhighlight.Tokenizer({
			multi_line_comment_start: "<!--",
			multi_line_comment_end: "-->",
			allow_strings: false,
			allow_numerics: false,
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

				// Append batch by seperator.
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

				// Append batch by seperator.
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
				const prev = tokenizer.get_prev_token(tokenizer.tokens.length - 1, [" ", "\t"]);
				const is_image = prev.data == "!";
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
					for (let i = 0; i < result.tokens.length; i++) {
						const token = result.tokens[i];
						token.line += tokenizer.line;
						tokenizer.tokens.push(token);
					}
					tokenizer.line += result.line_count;
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
	highlight(code, return_tokens = false) {
		this.reset();
		this.tokenizer.code = code;
		return this.tokenizer.tokenize(return_tokens);
	}
}

// Initialize.
vhighlight.md = new vhighlight.Markdown();
