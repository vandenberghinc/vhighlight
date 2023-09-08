/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Markdown highlighter.

vhighlight.md = {};

// The tokenizer options.
vhighlight.md.tokenizer_opts = {
	multi_line_comment_start: "<!--",
	multi_line_comment_end: "-->",
	allow_strings: false,
	allow_numerics: false,
}

// Highlight.
vhighlight.md.highlight = function(code, return_tokens = false) {

	// Initialize the tokenizer.
	const tokenizer = new Tokenizer(vhighlight.md.tokenizer_opts);

	// Assign the code.
	tokenizer.code = code;

	// Let first line.
	let current_line = null;

	// Start.
	tokenizer.callback = function(char) {

		// Start of line excluding whitespace.
		let start_of_line = false;
		if (current_line != this.line && !this.is_whitespace(char)) {
			start_of_line = true;
			current_line = this.line;
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
				else if (this.word_boundaries.includes(c)) {
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
					last_index = this.code.length;
				}
				for (let i = 0; i < add.length; i++) {
					this.batch = add[i][1];
					this.append_batch(add[i][0]);
				}
				this.resume_on_index(last_index);
				return true;
			}
		}

		// Bold or italic text.
		// It may not have whitespace after the "*" or "_" in order to seperate it from an unordered list.
		else if (
			(
				(char == "*" && this.next_char == "*") ||
				(char == "_" && this.next_char == "_")
			) &&
			!this.is_whitespace(this.index + 2)
		) {

			// Find closing char.
			let closing_index = null;
			for (let i = this.index + 2; i < this.code.length; i++) {
				const c = this.code.charAt(i);
				if (c == char) {
					closing_index = i;
					break;
				}
			}
			if (closing_index == null) { return false; }

			// Append batch by seperator.
			this.append_batch();

			// Add tokens.
			this.batch = char + char;
			this.append_batch("token_keyword");
			this.batch = this.code.substr(this.index + 2, closing_index - (this.index + 2));
			this.append_batch("token_bold");
			this.batch = char + char;
			this.append_batch("token_keyword");

			// Set resume index.
			this.resume_on_index(closing_index + 1);
			return true;
		}

		// Bold or italic text.
		// It may not have whitespace after the "*" or "_" in order to seperate it from an unordered list.
		else if (
			(char == "*" || char == "_") &&
			!this.is_whitespace(this.next_char)
		) {

			// Find closing char.
			let closing_index = null;
			for (let i = this.index + 1; i < this.code.length; i++) {
				const c = this.code.charAt(i);
				if (c == char) {
					closing_index = i;
					break;
				}
			}
			if (closing_index == null) { return false; }

			// Append batch by seperator.
			this.append_batch();

			// Add tokens.
			this.batch = char;
			this.append_batch("token_keyword");
			this.batch = this.code.substr(this.index + 1, closing_index - (this.index + 1));
			this.append_batch("token_italic");
			this.batch = char;
			this.append_batch("token_keyword");

			// Set resume index.
			this.resume_on_index(closing_index);
			return true;
		}

		// Block quote.
		else if (start_of_line && char == ">") {
			this.append_batch();
			this.batch = char;
			this.append_batch("token_keyword");
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
			this.append_batch("token_keyword");
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
				this.batch = batch;
				this.append_batch("token_keyword");
				this.resume_on_index(last_index);
				return true;
			}
		}

		// Link or image.
		else if (char == "[") {

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
			const prev = this.get_prev_token(this.tokens.length - 1, [" ", "\t"]);
			const is_image = prev.data == "!";
			if (is_image) {
				prev.token = "token_keyword";
			}

			// Add text tokens.
			this.batch = "[";
			this.append_batch("token_keyword");
			this.batch = this.code.substr(opening_bracket + 1, (closing_bracket - 1) - (opening_bracket + 1) + 1);
			this.append_batch("token_string");
			this.batch = "]";
			this.append_batch("token_keyword");

			// Add url tokens.
			this.batch = "(";
			this.append_batch("token_keyword");
			this.batch = this.code.substr(opening_parentheses + 1, (closing_parentheses - 1) - (opening_parentheses + 1) + 1);
			this.append_batch("token_string");
			this.batch = ")";
			this.append_batch("token_keyword");

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
			this.batch = this.code.substr(this.index, closing_index - this.index + 1);
			this.append_batch("token_codeblock");

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

			// Highlight the code.
			const start = this.index + 3 + language.length;
			const code = this.code.substr(start, (closing_index - 3) - start + 1);
			let result = null;
			if (language != "") {
				result = vhighlight.highlight({
					language: language,
					code: code,
					return_tokens: true,
				})
			}

			// Add tokens.
			this.batch = "```";
			this.append_batch("token_keyword");
			if (result == null) {
				this.batch = language + code;
				this.append_batch("token_codeblock");	
			} else {
				this.batch = language;
				this.append_batch("token_keyword");
				this.line += result.line_count;
				for (let i = 0; i < result.tokens.length; i++) {
					this.tokens.push(result.tokens[i]);
				}
			}
			this.batch = "```";
			this.append_batch("token_keyword");

			// Set resume index.
			this.resume_on_index(closing_index);
			return true;
			
		}


		// Not appended.
		return false;
	}

	// Tokenize.
	return tokenizer.tokenize(return_tokens);
}
























/* Regex based highlighting, way too slow.

// ---------------------------------------------------------
// Markdown highlighter.

vhighlight.md = {};
	
// supported codeblock languages.
vhighlight.md.codeblock_languages = [
	"cpp",
	"md",
];

// Regexes helpers.
vhighlight.md.exclude_span = "(?!(?:[^<]|<(?!/?span[^>]*>))*?<\\/span>)"; // exclude contents inside a "<span>HERE</span>"

// Regexes.
// vhighlight.md.heading_regex =  /^\s*(#{1,6})(\s*.*)/gm;
vhighlight.md.heading_regex = new RegExp(`${vhighlight.md.exclude_span}(^\\s*#{1,6}\\s*)(.*)(\\n|$)`, 'gm');
vhighlight.md.bold_regex = new RegExp(`${vhighlight.md.exclude_span}(^|\\s)(\\*|_)(\\*|_)(.*?)(\\*|_)(\\*|_)`, "gm");
vhighlight.md.italic_regex = new RegExp(`${vhighlight.md.exclude_span}(^|\\s)([*_])(.*?)\\2(\\s|$)`, "gm");
vhighlight.md.ul_regex = new RegExp(`${vhighlight.md.exclude_span}^(\\s*[-+*]\\s*)(.*)`, "gm");
vhighlight.md.ol_regex = new RegExp(`${vhighlight.md.exclude_span}^(\\s*\\d+)(.+)$`, "gm");
vhighlight.md.link_regex = new RegExp(`${vhighlight.md.exclude_span}\\[([^\\]]+)\\]\\(([^\\)]+)\\)`, "gm");
vhighlight.md.image_regex = new RegExp(`${vhighlight.md.exclude_span}!\\[([^\\]]+)\\]\\(([^\\)]+)\\)`, "gm");
// vhighlight.md.codeline_regex = new RegExp(`${vhighlight.md.exclude_span}\`(.*?)\``, "gm");
vhighlight.md.codeline_regex = /(?<!`)(`{1})([^`]*?)\1(?!`)/gm;
vhighlight.md.codeblock_regex = new RegExp(`${vhighlight.md.exclude_span}\`\`\`((?:${vhighlight.md.codeblock_languages.join('|')})*)([^\`]*)\`\`\``, "gm");

// Highlight.
vhighlight.md.highlight = function(code) {

	// Replace < and >.
	// Need to be replaced again, they should also be replaced before assigning the initial pre data.
	// But because of the rendering they may need to be replaced again.
	code = code.replaceAll("<", "&lt;");
	code = code.replaceAll(">", "&gt;");

	// Regex replacements.
	code = code.replace(vhighlight.md.heading_regex, '<span class="token_preprocessor">$1</span><b>$2</b>$3');
	code = code.replace(vhighlight.md.bold_regex, '<span class="token_bold">$&</span>'); // should be before italic regex.
	code = code.replace(vhighlight.md.italic_regex, '<span class="token_italic">$&</span>'); // should be before ul and ol regex.
	code = code.replace(vhighlight.md.ul_regex, '<span class="token_preprocessor">$1</span>$2');
	code = code.replace(vhighlight.md.ol_regex, '<span class="token_preprocessor">$1</span>$2');
	code = code.replace(vhighlight.md.image_regex, '<span class="token_string">!</span><span class="token_preprocessor">[</span><span class="token_string">$1</span><span class="token_preprocessor">]</span><span class="token_string">($2)</span>'); // should be before link regex.
	code = code.replace(vhighlight.md.link_regex, '<span class="token_preprocessor">[</span><span class="token_string">$1</span><span class="token_preprocessor">]</span><span class="token_string">($2)</span>');
	code = code.replace(vhighlight.md.codeblock_regex, (match, m1, m2) => { // should be last but before codeline regex.
		if (m1 == "") {
			return `<div class='token_codeblock'>\`\`\`${m2}\`\`\`</div>`
		} else if (m1 == "cpp") {
			return `<div class='token_codeblock'>\`\`\`${m1}${cpp.highlight(m2)}\`\`\`</div>`
		} else {
			return `<div class='token_codeblock'>\`\`\`${m1}${m2}\`\`\`</div>`
		}
	});
	code = code.replace(vhighlight.md.codeline_regex, '<span class="token_codeline">$&</span>'); // should be last.

	// Handler.
	return code;
}
*/