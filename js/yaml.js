/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// YAML highlighter.

vhighlight.YAML = class YAML extends vhighlight.Tokenizer {
	constructor({
		// Line by line mode.
		line_by_line_mode = false,
	} = {}) {

		// Initialize the tokenizer.
		super({
			keywords: [
				"null",
				"|",
			],
			single_line_comment_start: "#",

			// Line by line mode.
			line_by_line_mode,
			
			// Language, must never be changed it is used by dependents, such as Libris.
			language: "YAML",
		});

		// Set callback.
		this.callback = (char) => {

			// Resume on "-" inside alphabetical.
			if (char === "-" && this.is_alphabetical(this.code.charAt(this.index-1)) && this.is_alphabetical(this.code.charAt(this.index+1))) {
				this.batch += char;
				return true;
			}
			
			// Keyword.
			else if (char === ":") {

				// Check start of line.
				let prev = this.get_last_token();
				if (prev == null) { // no tokens yet so batch is start of line.
					this.append_batch("keyword");
					return false;
				}
				if (!prev.is_line_break) {
					while (true) {
						prev = this.get_prev_token_by_token(prev, [" ", "\t", "-"]);	
						if (prev != null && !prev.is_line_break && prev.is_whitespace) {
							continue;
						}
						break;
					}
				}
				if (prev == null || prev.is_line_break) {
					this.append_batch("keyword");
				}
			}

			// Not appended.
			return false;
		}
	}
}

// Initialize.
vhighlight.yaml = new vhighlight.YAML();
