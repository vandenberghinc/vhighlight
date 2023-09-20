/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
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
			@name: data
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
			@name: insert_start
			@type: string
			@description: The start line from where to insert the new tokens into.
		}
		@parameter: {
			@name: insert_end
			@type: string
			@description: The end line from where to insert the new tokens into. The end line includes the line itself.
		}
		@parameter: {
			@name: tokens
			@type: array[object]
			@description: The old tokens.
		}
		@parameter: {
			@name: update_offsets
			@type: boolean
			@description: Update the offsets of the new tokens.
		}
	} */
	partial_highlight({
		code = null,
		edits_start = null,
		edits_end = null,
		insert_start = null,
		insert_end = null,
		tokens = [],
		update_offsets = true,
	}) {

		// Assign code when not assigned.
		// So the user can also assign it to the tokenizer without cause two copies.
		if (code !== null) {
			this.tokenizer.code = code;
		}

		// Partial tokenize.
		return this.tokenizer.partial_tokenize({
			edits_start: edits_start,
			edits_end: edits_end,
			insert_start: insert_start,
			insert_end: insert_end,
			tokens: tokens,
			update_offsets: update_offsets,
		})
	}
}

// Initialize.
vhighlight.json = new vhighlight.Json();
