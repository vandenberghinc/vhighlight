/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// LMX Highlighter, Libris Markup Extended.

vhighlight.LMX = class LMX extends vhighlight.Tokenizer {
	constructor({
		insert_codeblocks = true, // allow codeblocks to be parsed or put them into a single token.
		allow_entities = true, // when allow_entities is true an entity like &gt; will not be converted to &amp;gt;
	} = {}) {

		// Initialize the tokenizer.
		super({
			multi_line_comment_start: "<!--",
			multi_line_comment_end: "-->",
			allow_parameters: false,
			allow_strings: false,

			// Language, must never be changed it is used by dependents, such as Libris.
			language: "LMX",
		});

		// Params.
		this.insert_codeblocks = insert_codeblocks;
		this.allow_entities = allow_entities;
		this.allow_markdown_bold_italic = false;

		// Inherit Markdown.
		this.md_callback = vhighlight.Markdown.create_callback().bind(this);
		this.md_derived_reset = vhighlight.Markdown.create_derived_reset().bind(this);
		this.md_derived_retrieve_state = vhighlight.Markdown.create_derived_retrieve_state().bind(this);

		// Inherit HTML.
		this.html_callback = vhighlight.HTML.create_callback().bind(this);
		this.html_derived_reset = vhighlight.HTML.create_derived_reset().bind(this);
		this.html_derived_retrieve_state = vhighlight.HTML.create_derived_retrieve_state().bind(this);

		// Set callback.
		this.callback = (char, a, b, c, d, is_escaped) => {

			// Markdown.
			if (
				this.html_inside_opening_tag == null && // skip when html continuation flag is set.
				this.html_inside_verbatim_tag == null && // skip when html continuation flag is set.
				this.md_callback(char, a, b, c, d, is_escaped)
			) {
				return true;
			}

			// HTML.
			if (
				this.md_inside_codeblock == null && // skip when markdown continuation flag is set.
				this.html_callback(char)
			) {
				return true;
			}

			// {{TEMPLATE}}
			if (char === "{" && this.next_char === "{") {
				let index = this.code.indexOf("}}", this.index + 2);
				if (index !== -1) {
					index += 1;
					this.append_batch();
					this.batch = this.code.substr(this.index, index - this.index);
					this.append_batch("template")
					this.resume_on_index(index - 1);
					return true;
				}
			}

			// Not appended.
			return false;
		}
	}

	// Reset attributes that should be reset before each tokenize.
	derived_reset() {
		this.md_derived_reset();
		this.html_derived_reset();
	}

	// Derived retrieve state.
	derived_retrieve_state(data) {
		this.md_derived_retrieve_state(data);
		this.html_derived_retrieve_state(data);
	}
}

// Initialize.
vhighlight.lmx = new vhighlight.LMX();
