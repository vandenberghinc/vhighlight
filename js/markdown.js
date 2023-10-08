/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Markdown highlighter.

vhighlight.Markdown = class Markdown extends vhighlight.Tokenizer {
	constructor({
		insert_codeblocks = true, // allow codeblocks to be parsed or put them into a single token.
	} = {}) {

		// Initialize the tokenizer.
		super({
			// multi_line_comment_start: "<!--",
			// multi_line_comment_end: "-->",
			allow_strings: false,
			allow_numerics: false,
			// Attributes for partial tokenizing.
			scope_separators: [],
		});

		// Assign language, not used in the tokenizer but can be used by other libs, such as vdocs.
		this.language = "Markdown";

		// Set callback.
		this.callback = (char) => {
			
			// Start of line excluding whitespace.
			let start_of_line = false;
			if (this.current_line != this.line && !this.is_whitespace(char)) {
				start_of_line = true;
				this.current_line = this.line;
			}

			// Headings.
			if (start_of_line && char == "#") {

				// Append batch by word boundary.
				this.append_batch();

				// Do a forward lookup.
				const add = [];
				let last_index = null;
				let at_start = true;
				let word = "";
				for (let i = this.index; i < this.code.length; i++) {
					const c = this.code.charAt(i);

					// Stop at linebreak.
					if (c == "\n") {
						if (word.length > 0) {
							add.push(["bold", word]);
						}
						last_index = i - 1;
						break;
					}

					// Add whitespace seperately to not break "at_start".
					else if (c == " " || c == "\t") {
						if (word.length > 0) {
							add.push(["bold", word]);
							word = "";
						}
						add.push([false, c]);
					}

					// Add # as keyword.
					else if (at_start && c == "#") {
						add.push(["keyword", c]);
					}

					// Seperate words by a word boundary.
					else if (this.word_boundaries.includes(c)) {
						at_start = false;
						if (word.length > 0) {
							add.push(["bold", word]);
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
						last_index = this.code.length;
					}
					for (let i = 0; i < add.length; i++) {
						this.append_forward_lookup_batch(add[i][0], add[i][1]);
					}
					this.resume_on_index(last_index);
					return true;
				}
			}

			// Bold text.
			// It may not have whitespace after the "*" or "_" in order to seperate it from an unordered list.
			else if (
				(
					(char == "*" && this.next_char == "*") ||
					(char == "_" && this.next_char == "_")
				) &&
				!this.is_whitespace(this.code.charAt(this.index + 2))
			) {

				// Find closing char.
				let closing_index = null;
				for (let i = this.index + 2; i < this.code.length; i++) {
					const c = this.code.charAt(i);
					if (c == char && !this.is_escaped(i)) {
						closing_index = i;
						break;
					}
				}
				if (closing_index == null) { return false; }

				// Append batch by separator.
				this.append_batch();

				// Add tokens.
				this.append_forward_lookup_batch("keyword", char + char);
				this.append_forward_lookup_batch("bold", this.code.substr(this.index + 2, closing_index - (this.index + 2)));
				this.append_forward_lookup_batch("keyword", char + char);

				// Set resume index.
				this.resume_on_index(closing_index + 1);
				return true;
			}

			// Italic text.
			// It may not have whitespace after the "*" or "_" in order to seperate it from an unordered list.
			else if (
				(char == "*" || char == "_") &&
				!this.is_whitespace(this.next_char)
			) {

				// Find closing char.
				let closing_index = null;
				for (let i = this.index + 1; i < this.code.length; i++) {
					const c = this.code.charAt(i);
					if (c == char && !this.is_escaped(i)) {
						closing_index = i;
						break;
					}
				}
				if (closing_index == null) { return false; }

				// Append batch by separator.
				this.append_batch();

				// Add tokens.
				this.append_forward_lookup_batch("keyword", char);
				this.append_forward_lookup_batch("italic", this.code.substr(this.index + 1, closing_index - (this.index + 1)));
				this.append_forward_lookup_batch("keyword", char);

				// Set resume index.
				this.resume_on_index(closing_index);
				return true;
			}

			// Block quote.
			else if (start_of_line && char == ">") {
				this.append_batch();
				this.batch = char;
				this.append_batch("keyword");
				return true;
			}

			// Unordered list.
			// It must have whitespace after the "*" in order to seperate it from bold or italic text.
			else if (
				start_of_line && 
				(char == "-" || char == "*" || char == "+") && 
				this.is_whitespace(this.next_char)
			) {
				this.append_batch();
				this.batch = char;
				this.append_batch("keyword");
				return true;
			}

			// Ordered list.
			else if (start_of_line && this.is_numerical(char)) {

				// Do a forward lookup to check if there are only numerical chars and then a dot.
				let batch = char;
				let finished = false;
				let last_index = null;
				for (let i = this.index + 1; i < this.code.length; i++) {
					const c = this.code.charAt(i);
					if (c == "\n") {
						break;
					} else if (c == ".") {
						batch += c;
						finished = true;
						last_index = i;
						break;
					} else if (this.is_numerical(c)) {
						batch += c;
					} else {
						break;
					}
				}

				// Check if finished successfully.
				if (finished) {
					this.append_batch();
					this.append_forward_lookup_batch("keyword", batch);
					this.resume_on_index(last_index);
					return true;
				}
			}

			// Link or image.
			else if (char == "[" && !is_escaped) {

				// Append batch by word boundary.
				this.append_batch();

				// Get closing bracket.
				const opening_bracket = this.index;
				const closing_bracket = this.get_closing_bracket(opening_bracket);
				if (closing_bracket == null) { return false; }

				// Get opening and closing parentheses, but no chars except for whitespace may be between the closing barcket and opening parentheses.
				let opening_parentheses = null;
				for (let i = closing_bracket + 1; i < this.code.length; i++) {
					const c = this.code.charAt(i);
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
				const closing_parentheses = this.get_closing_parentheses(opening_parentheses);
				if (closing_parentheses == null) { return false; }

				// Check if it is a link or an image by preceding "!".
				const prev = this.get_prev_token(this.added_tokens - 1, [" ", "\t"]);
				const is_image = prev != null && prev.data == "!";
				if (is_image) {
					prev.token = "keyword";
				}

				// Add text tokens.
				this.append_forward_lookup_batch("keyword", "[");
				this.append_forward_lookup_batch("string", this.code.substr(opening_bracket + 1, (closing_bracket - 1) - (opening_bracket + 1) + 1));
				this.append_forward_lookup_batch("keyword", "]");

				// Add url tokens.
				this.append_forward_lookup_batch("keyword", "(");
				this.append_forward_lookup_batch("string", this.code.substr(opening_parentheses + 1, (closing_parentheses - 1) - (opening_parentheses + 1) + 1));
				this.append_forward_lookup_batch("keyword", ")");

				// Set resume index.
				this.resume_on_index(closing_parentheses);
				return true;
			}

			// Single line code block.
			else if (char == "`" && this.next_char != "`" && this.prev_char != "`") {

				// Do a forward lookup till the next "`".
				let closing_index = null;
				for (let i = this.index + 1; i < this.code.length; i++) {
					const c = this.code.charAt(i);
					if (c == "`") {
						closing_index = i;
						break;
					}
				}
				if (closing_index == null) { return false; }

				// Add token.
				this.append_forward_lookup_batch("codeblock", this.code.substr(this.index, closing_index - this.index + 1));

				// Set resume index.
				this.resume_on_index(closing_index);
				return true;
			}

			// Multi line code block.
			else if (char == "`" && this.next_char == "`" && this.code.charAt(this.index + 2) == "`") {

				// Do a forward lookup till the next "`".
				let closing_index = null;
				let do_language = true;
				let language = "";
				for (let i = this.index + 3; i < this.code.length; i++) {
					const c = this.code.charAt(i);
					const is_whitespace = this.is_whitespace(c);
					if (c == "`" && this.code.charAt(i + 1) == '`' && this.code.charAt(i + 2) == "`") {
						closing_index = i + 2;
						break;
					} else if (do_language && language.length > 0 && (is_whitespace || c == "\n")) {
						do_language = false;
					} else if (do_language && language.length == 0 && !is_whitespace && !this.is_alphabetical(c)) {
						do_language = false;
					} else if (do_language && !is_whitespace && c != "\n") {
						language += c;
					}
				}
				if (closing_index == null) { return false; }

				// Slice the code.
				const start = this.index + 3 + language.length;
				const code = this.code.substr(start, (closing_index - 3) - start + 1);
				let tokenizer = language == "" ? null : vhighlight.init_tokenizer(language)

				// Insert codeblock tokens.
				if (insert_codeblocks) {

					// Highlight.
					let result = null;
					if (tokenizer != null) {
						tokenizer.code = code;
						result = tokenizer.tokenize()
						console.log("RESULT:",result)
					}

					// Add tokens.
					this.append_forward_lookup_batch("keyword", "```");
					if (result == null) {
						this.append_forward_lookup_batch("codeblock", language + code);
					} else {
						this.append_forward_lookup_batch("keyword", language);
						this.concat_tokens(result);
					}
					this.append_forward_lookup_batch("keyword", "```");
				}

				// Put the codeblock into a single token.
				else {
					this.batch = code;
					this.append_batch("codeblock", {language: tokenizer == null ? null : tokenizer.language});
				}

				// Set resume index.
				this.resume_on_index(closing_index);
				return true;
				
			}


			// Not appended.
			return false;
		}
	}

	// Reset attributes that should be reset before each tokenize.
	derived_reset() {
		this.current_line = null; // curent line to detect start of the line.
	}
}

// Initialize.
vhighlight.md = new vhighlight.Markdown();
