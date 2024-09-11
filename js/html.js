/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Python highlighter.

vhighlight.HTML = class HTML extends vhighlight.Tokenizer {

	// Static attributes.
	static language_tags = [
		"script",
		"style",
		"js", // for libris document syntax.
	];
	static verbatim_tags = [
		'textarea',
		'pre',
		'xmp',
		'plaintext',
		'listing',
	];

	// Constructor.
	constructor({
		allow_entities = true, // when allow_entities is true an entity like &gt; will not be converted to &amp;gt;
	} = {}) {

		// Initialize the tokenizer.
		super({
			multi_line_comment_start: "<!--",
			multi_line_comment_end: "-->",
			allow_parameters: false,

			// Language, must never be changed it is used by dependents, such as Libris.
			language: "HTML",
		});

		// Params.
		this.allow_entities = allow_entities;

		// Set callback.
		this.callback = HTML.create_callback().bind(this);
		this.derived_reset = HTML.create_derived_reset().bind(this);
		this.derived_retrieve_state = HTML.create_derived_retrieve_state().bind(this);
	}

	// Create callback.
	static create_callback() {

		// Variables.
		const number_regex = /^-?\d+(\.\d+)?$/;

		// Set callback.
		return function(char) {

			// Inside opening tag, parse attributes.
			if (this.html_inside_opening_tag != null) {
				
				// Check if the current batch is an attribute name or certain values encapsulated by a word boundary.
				if (this.word_boundaries.includes(char)) {
					let token_type;
					switch (this.batch) {

						// Tokenize certain values as keyword.
						case "true": case "True": case "false": case "False": case "null": case "none":
							token_type = "keyword"
							break;

						// Tokenize as parameter.
						default:
							if (number_regex.test(this.batch)) {
								token_type = "numeric";
							}
							else if (this.curly_depth === 0) {
								// In LMX parameter values can be defined as js style objects.
								// So only count as parameter when curly depth is 0.
								token_type = "parameter";
							}
							break;
					}
					this.append_batch(token_type)
				}

				// Check stop on flag.
				// Strings comments etc are already catched by base tokenizer.
				if (char === ">") {
					this.append_batch();
					this.batch += ">"
					this.append_batch("keyword")
					this.html_inside_opening_tag = null;
					if (this.html_inside_verbatim_tag) {
						this.preprocess_code = false;
					}

					// Restore allow strings for LDOC.
					this.allow_strings = this._old_allow_strings
					return true;
				}

				// Do nothing here, also no fallthrough.
				return false;

			}

			// Inside verbatim tag, must be after "html_inside_opening_tag".
			else if (this.html_inside_verbatim_tag) {

				// Stop preprocessing the code when the opening verbatim tag closes.
				if (this.preprocess_code && char === ">") {
					this.preprocess_code = false;
				}
				
				// Check if the verbatim tag is about to be closed.
				let start;
				if (
					this.index + 1 === this.code.length || 
					(
						char === "<" &&
						(start = this.get_first_non_whitespace(this.index + 1, true)) != null &&
						this.code.charAt(start) === "/" &&
						this.code.eq_first(this.html_inside_verbatim_tag, start + 1)
					)
				) {

					// Add last char on last index.
					if (this.index + 1 === this.code.length) {
						this.batch += char;
					}

					// Tokenize the batch.
					switch (this.html_inside_verbatim_tag) {
					
						// JS code.
						case "js": // for libris
						case "JS": // for libris
						case "GlobalJS": // for libris
						case "script": {
							const tokenizer = new vhighlight.JS();
							const tokens = tokenizer.tokenize({code: this.batch, state: this.html_inside_verbatim_tag_state});
							this.concat_tokens(tokens);
							this.html_inside_verbatim_tag_state = tokenizer.state();
							break;
						}

						// html code.
						case "html": // for libris
						case "HTML": // for libris
						{
							const tokenizer = new vhighlight.HTML();
							const tokens = tokenizer.tokenize({code: this.batch, state: this.html_inside_verbatim_tag_state});
							this.concat_tokens(tokens);
							this.html_inside_verbatim_tag_state = tokenizer.state();
							break;
						}

						// CSS code.
						case "style": {
							const tokenizer = new vhighlight.CSS();
							const tokens = tokenizer.tokenize({code: this.batch, state: this.html_inside_verbatim_tag_state});
							this.concat_tokens(tokens);
							this.html_inside_verbatim_tag_state = tokenizer.state();
							break;
						}

						// Plain text verbatim tag.
						default:
							this.append_batch();
							break;

					}

					// Append close tag keyword.
					if (start != null) {
						let end = this.code.indexOf(">", start + 1);
						if (end === -1) {
							end = this.code.length;
						} else {
							++end;
						}
						this.batch = this.code.substr(this.index, end - this.index);
						this.append_batch("keyword");

						// Set resume index.
						this.resume_on_index(end - 1);

						// Reset.
						this.html_inside_verbatim_tag = null;
						this.html_inside_verbatim_tag_state = null;
					}

					// Stop.
					this.preprocess_code = true;
					return true;
				}

				// Append verbatim to batch.
				this.batch += char;
				return true;
			}

			// Tag opener / closer.
			else if (char === "<") {

				// Lookup result.
				const lookup_tokens = [];
				let resume_on_index = null;

				// Get tag indexes.
				let tag_name_start = this.get_first_non_whitespace(this.index + 1, true);
				if (tag_name_start === null) { return false; }
				const is_tag_closer = this.code.charAt(tag_name_start) === "/";

				// const tag_end_index = this.lookup({query: ">", index: this.index});
				// if (tag_end_index === null) { return false; }

				// Append < token.
				lookup_tokens.push(["operator", "<"]);

				// Append whitespace tokens.
				const whitespace = tag_name_start - (this.index + 1);
				if (whitespace > 0) {
					lookup_tokens.push([false, this.code.substr(this.index + 1, whitespace)]);
				}

				// Add / or ! tokens at the tag name start.
				let skip = ["/", "!"];
				while (skip.includes(this.code.charAt(tag_name_start))) {

					lookup_tokens.push(["operator", this.code.charAt(tag_name_start)]);
					
					// Get real start of tag name.
					const real_tag_name_start = this.get_first_non_whitespace(tag_name_start + 1, true);
					if (real_tag_name_start === null) { return false; }

					// Append whitespace tokens.
					const whitespace = real_tag_name_start - (tag_name_start + 1);
					if (whitespace > 0) {
						lookup_tokens.push([false, this.code.substr(tag_name_start + 1, whitespace)]);
					}

					// Update tag name start.
					tag_name_start = real_tag_name_start;
				}

				// Append the tag name as keyword.
				let tag_name_end = tag_name_start;
				while (true) {
					tag_name_end = this.get_first_word_boundary(tag_name_end);
					if (tag_name_end === null) {
						tag_name_end = this.code.length;
						break;
					} else if (this.code.charAt(tag_name_end) !== "-") {
						break;
					} else {
						++tag_name_end;
					}
				}
				const tag_name = this.code.substr(tag_name_start, tag_name_end - tag_name_start);
				lookup_tokens.push(["keyword", tag_name]);

				// Check if the tag is a verbatim tag.
				if (
					!is_tag_closer && 
					(
						vhighlight.HTML.verbatim_tags.includes(tag_name) ||
						vhighlight.HTML.language_tags.includes(tag_name) ||
						tag_name === "JS" ||
						tag_name === "GlobalJS"
					)
				) {
					this.html_inside_verbatim_tag = tag_name;
				}

				// Append the lookup tokens.
				for (let i = 0; i < lookup_tokens.length; i++) {
					this.append_forward_lookup_batch(lookup_tokens[i][0], lookup_tokens[i][1]);
				}
				this.resume_on_index(tag_name_end - 1);

				// Set inside item flag.
				if (!is_tag_closer) {
					this.html_inside_opening_tag = tag_name;
					this._old_allow_strings = this.allow_strings;
					this.allow_strings = true; // allow strings since LMX does not allow strings by default.
				} else {

					// Find closing >
					let close = this.code.indexOf(">", tag_name_end);
					if (close === -1) {
						close = this.code.length;
					}
					this.append_forward_lookup_batch("keyword", this.code.substr(tag_name_end, (close + 1) - tag_name_end));
					this.resume_on_index(close);
				}

				// Success.
				return true;
			}

			// Highlight entities.
			else if (char === "&") {

				// Append batch by word boundary.
				this.append_batch();

				// Do a forward lookup to check if the entity ends with a ';' without encountering a space or tab or newline.
				let batch;
				if (this.allow_entities) {
					batch = "&";
				} else {
					batch = "&amp;";
				}
				let success = false;
				let index = 0;
				for (index = this.index + 1; index < this.code.length; index++) {
					const c = this.code.charAt(index);
					batch += c;
					if (c === " " || c === "\t" || c === "\n") {
						break;
					} else if (c === ";") {
						batch = batch.substr(0, batch.length - 1) + "\;"
						success = true;
						break;
					}
				}

				// On success.
				if (success) {
					this.batch = batch;
					this.append_batch("keyword");
					this.resume_on_index(index);
					return true;
				}
			}



			// Tag opener / closer.
			/*
			else if (char === "<") {

				// Lookup result.
				const lookup_tokens = [];
				let resume_on_index = null;

				// Get tag indexes.
				let tag_name_start = this.get_first_non_whitespace(this.index + 1, true);
				if (tag_name_start === null) { return false; }
				const is_tag_closer = this.code.charAt(tag_name_start) === "/";
				const tag_end_index = this.lookup({query: ">", index: this.index});
				if (tag_end_index === null) { return false; }

				// Append < token.
				lookup_tokens.push(["operator", "<"]);

				// Append whitespace tokens.
				const whitespace = tag_name_start - (this.index + 1);
				if (whitespace > 0) {
					lookup_tokens.push([false, this.code.substr(this.index + 1, whitespace)]);
				}

				// Add / or ! tokens at the tag name start.
				let skip = ["/", "!"];
				while (skip.includes(this.code.charAt(tag_name_start))) {

					lookup_tokens.push(["operator", this.code.charAt(tag_name_start)]);
					
					// Get real start of tag name.
					const real_tag_name_start = this.get_first_non_whitespace(tag_name_start + 1, true);
					if (real_tag_name_start === null) { return false; }

					// Append whitespace tokens.
					const whitespace = real_tag_name_start - (tag_name_start + 1);
					if (whitespace > 0) {
						lookup_tokens.push([false, this.code.substr(tag_name_start + 1, whitespace)]);
					}

					// Update tag name start.
					tag_name_start = real_tag_name_start;
				}

				// Append the tag name as keyword.
				const tag_name_end = this.get_first_word_boundary(tag_name_start);
				if (tag_name_end === null) { return false; }
				const tag_name = this.code.substr(tag_name_start, tag_name_end - tag_name_start);
				lookup_tokens.push(["keyword", tag_name]);

				// Parse the attributes.
				const info = {index: null};
				let passed_first_whitespace = false;
				let was_str = false, str_start = 0;
				let was_comment = false, comment_start = 0;
				let last_index = tag_end_index - 1;
				let is_attr_type = false, attr_type = null;
				const err = this.iterate_code(info, tag_name_end, tag_end_index, (char, is_str, _, is_comment) => {
					const is_last_index = info.index === last_index;

					// String end.
					if (was_str && (is_str === false || is_last_index)) {
						let end;
						if (last_index === info.index) { end = info.index + 1; }
						else { end = info.index; }
						const data = this.code.substr(str_start, end - str_start);
						lookup_tokens.push(["string", data]);
						if (is_attr_type) {
							if ((data.startsWith('"') && data.endsWith('"')) || (data.startsWith("'") && data.endsWith("'"))) {
								attr_type = data.slice(1, -1);
							} else {
								attr_type = data;
							}
						}
						was_str = false;
					}

					// Comment end.
					else if (was_comment && (is_comment === false || is_last_index)) {
						let end;
						if (last_index === info.index) { end = info.index + 1; }
						else { end = info.index; }
						lookup_tokens.push(["comment", this.code.substr(comment_start, end - comment_start)]);
						was_comment = false;
					}

					//
					// Resume with if after here.
					//

					// String start.
					if (was_str === false && is_str) {
						was_str = true;
						str_start = info.index;
					}

					// Inside string.
					else if (was_str) {}

					// Comment start.
					else if (was_comment === false && is_comment) {
						was_comment = true;
						comment_start = info.index;
					}

					// Inside comment.
					else if (was_comment) {}

					// Whitespace.
					else if (char === " " || char === "\t" || char === "\n") {
						lookup_tokens.push([null, char]);
						passed_first_whitespace = true;
					}

					// Assignment operator.
					else if (char === "=") {
						lookup_tokens.push(["operator", char]);
					}

					// Attribute keyword.
					else {
						const end = this.get_first_word_boundary(info.index);
						if (end === info.index) { // current char is word boundary, prevent infinite loop.
							lookup_tokens.push([null, char]);
							return null;
						}
						if (end > tag_end_index) { return true; }
						const data = this.code.substr(info.index, end - info.index);
						// lookup_tokens.push(["keyword", data]);
						let token_type = "keyword";
						if (passed_first_whitespace) { // only params after the first whitespace otherwise it might be "list" in "<my list ...>".
							switch (data) {
								case "true": case "True": case "false": case "False": case "null": case "none":
									token_type = "keyword"
									break;
								default:
									if (number_regex.test(data)) {
										token_type = "numeric";
										break;
									}
									token_type = "parameter";
									break;
							}
						}
						lookup_tokens.push([token_type, data]); 
						info.index = end - 1;
						is_attr_type = data === "type";
					}
				});
				if (err === true) {
					return false;
				}

				// Add the closing > token.
				lookup_tokens.push(["operator", ">"]);

				// Set default resume on index.
				resume_on_index = tag_end_index;

				// Append the lookup tokens.
				for (let i = 0; i < lookup_tokens.length; i++) {
					this.append_forward_lookup_batch(lookup_tokens[i][0], lookup_tokens[i][1]);
				}
				this.resume_on_index(resume_on_index);

				// Parse the entire tag till closing tag on certain tags.
				let verbatim_tag = false;
				if (
					is_tag_closer === false && 
					(
						(verbatim_tag = vhighlight.HTML.verbatim_tags.includes(tag_name)) === true || 
						vhighlight.HTML.language_tags.includes(tag_name)
					)
				) {

					// Vars.
					const content_start = tag_end_index + 1;

					// Find the closing tag.
					const info = {index: null};
					let close_tag_start_index = null, close_tag_end_index = null;
					let close_tag = `/${tag_name}>`;
					this.iterate_code(info, tag_end_index, null, (char, is_str, _, is_comment) => {
						if (is_str === false && is_comment === false && char === "<") {
							close_tag_start_index = info.index;
							let tag_i = 0;
							for (let i = info.index + 1; i < this.code.length; i++) {
								const c = this.code.charAt(i);
								if (c === " " || c === "\t" || c === "\n") {
									continue;
								} else if (c !== close_tag.charAt(tag_i)) {
									break;
								}
								++tag_i;
								if (tag_i >= close_tag.length) {
									close_tag_end_index = info.index;
									return false;
								}
							}
						}
					})

					// When the close tag is not found then skip everything afterwards.
					if (close_tag_end_index === null) {
						this.append_forward_lookup_batch(false, this.code.substr(content_start));
						this.resume_on_index(this.code.length);
					}


					// For certain tags the highlighting needs to be skipped until the tag closes.
					else if (verbatim_tag) {
						this.append_forward_lookup_batch(false, this.code.substr(content_start, close_tag_start_index - content_start));
						this.resume_on_index(close_tag_start_index - 1);
					}

					// Parse css.
					else if (tag_name === "style") {
						const tokens = vhighlight.css.tokenize({code: this.code.substr(content_start, close_tag_start_index - content_start), is_insert_tokens: true})
						this.concat_tokens(tokens);
						this.resume_on_index(close_tag_start_index - 1);
					}

					// Parse javascript.
					else if (tag_name === "script" && (attr_type == null || attr_type === "text/javascript" || attr_type === "application/javascript")) {
						const tokens = vhighlight.js.tokenize({code: this.code.substr(content_start, close_tag_start_index - content_start), is_insert_tokens: true})
						this.concat_tokens(tokens);
						this.resume_on_index(close_tag_start_index - 1);
					}

					// Uncaucht so add as plain text.
					else {
						this.append_forward_lookup_batch(false, this.code.substr(content_start, close_tag_start_index - content_start));
						this.resume_on_index(close_tag_start_index - 1);
					}
				
				}

				// Success.
				return true;

			}
			*/

			// Not appended.
			return false;
		}
	}

	// Reset attributes that should be reset before each tokenize.
	static create_derived_reset() {
		return function () {
			this.html_inside_opening_tag = null; // flag for when inside an opening html tag <tag HERE >
			this.html_inside_verbatim_tag = null; // flag for inside verbatim tags.
			this.html_inside_verbatim_tag_state = null; // tokenizer state for inside different lang highlighted verbatim tags.
		}
	}

	// Derived retrieve state.
	static create_derived_retrieve_state() {
		return function (data) {
			data.html_inside_opening_tag = this.html_inside_opening_tag;
			data.html_inside_verbatim_tag = this.html_inside_verbatim_tag;
			data.html_inside_verbatim_tag_state = this.html_inside_verbatim_tag_state;
		}
	}
}

// Initialize.
vhighlight.html = new vhighlight.HTML();
