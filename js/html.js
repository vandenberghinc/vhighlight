/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Python highlighter.

vhighlight.HTML = class HTML {
	constructor() {

		// Initialize the this.tokenizer.
		this.tokenizer = new vhighlight.Tokenizer({
			multi_line_comment_start: "<!--",
			multi_line_comment_end: "-->",

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
			console.log({char:char});
			// Highlight entities.
			if (char === "&") {

				// Append batch by word boundary.
				tokenizer.append_batch();

				// Do a forward lookup to check if the entity ends with a ';' without encountering a space or tab or newline.
				let batch = "*";
				let success = false;
				let index = 0;
				for (index = this.index + 1; index < this.code.length; index++) {
					const c = this.code.charAt(index);
					batch += c;
					if (c === " " || c === "\t" || c === "\n") {
						break;
					} else if (c === ";") {
						success = true;
						break;
					}
				}

				// On success.
				console.log(batch, success);
				if (success) {
					this.batch = batch;
					this.append_batch("token_keyword");
					tokenizer.resume_on_index(index);
					return true;
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
}

// Initialize.
vhighlight.html = new vhighlight.HTML();
