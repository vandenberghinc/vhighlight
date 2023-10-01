/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Python highlighter.

vhighlight.HTML = class HTML {

	// Static attributes.
	static language_tags = [
		"script",
		"style",
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

		// Params.
		this.allow_entities = allow_entities;

		// Initialize the this.tokenizer.
		this.tokenizer = new vhighlight.Tokenizer({
			multi_line_comment_start: "<!--",
			multi_line_comment_end: "-->",
			allow_parameters: false,

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

			// Highlight entities.
			if (char === "&") {

				// Append batch by word boundary.
				tokenizer.append_batch();

				// Do a forward lookup to check if the entity ends with a ';' without encountering a space or tab or newline.
				let batch;
				if (this.allow_entities) {
					batch = "&";
				} else {
					batch = "&amp;";
				}
				let success = false;
				let index = 0;
				for (index = tokenizer.index + 1; index < tokenizer.code.length; index++) {
					const c = tokenizer.code.charAt(index);
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
					tokenizer.batch = batch;
					tokenizer.append_batch("token_keyword");
					tokenizer.resume_on_index(index);
					return true;
				}
			}

			// Tag opener / closer.
			else if (char === "<") {

				// Lookup result.
				const lookup_tokens = [];
				let resume_on_index = null;

				// Get tag indexes.
				let tag_name_start = tokenizer.get_first_non_whitespace(tokenizer.index + 1, true);
				if (tag_name_start === null) { return false; }
				const is_tag_closer = tokenizer.code.charAt(tag_name_start) === "/";
				const tag_end_index = tokenizer.lookup({query: ">", index: tokenizer.index});
				if (tag_end_index === null) { return false; }

				// Append < token.
				lookup_tokens.push(["token_operator", "<"]);

				// Append whitespace tokens.
				const whitespace = tag_name_start - (tokenizer.index + 1);
				if (whitespace > 0) {
					lookup_tokens.push([false, tokenizer.code.substr(tokenizer.index + 1, whitespace)]);
				}

				// Add / or ! tokens at the tag name start.
				let skip = ["/", "!"];
				while (skip.includes(tokenizer.code.charAt(tag_name_start))) {

					lookup_tokens.push(["token_operator", tokenizer.code.charAt(tag_name_start)]);
					
					// Get real start of tag name.
					const real_tag_name_start = tokenizer.get_first_non_whitespace(tag_name_start + 1, true);
					if (real_tag_name_start === null) { return false; }

					// Append whitespace tokens.
					const whitespace = real_tag_name_start - (tag_name_start + 1);
					if (whitespace > 0) {
						lookup_tokens.push([false, tokenizer.code.substr(tag_name_start + 1, whitespace)]);
					}

					// Update tag name start.
					tag_name_start = real_tag_name_start;
				}

				// Append the tag name as keyword.
				const tag_name_end = tokenizer.get_first_word_boundary(tag_name_start);
				if (tag_name_end === null) { return false; }
				const tag_name = tokenizer.code.substr(tag_name_start, tag_name_end - tag_name_start);
				lookup_tokens.push(["token_keyword", tag_name]);

				// Parse the attributes.
				const info = {index: null};
				let was_str = false, str_start = 0;
				let was_comment = false, comment_start = 0;
				let last_index = tag_end_index - 1;
				let is_attr_type = false, attr_type = null;
				const err = tokenizer.iterate_code(info, tag_name_end, tag_end_index, (char, is_str, _, is_comment) => {
					const is_last_index = info.index === last_index;

					// String end.
					if (was_str && (is_str === false || is_last_index)) {
						let end;
						if (last_index === info.index) { end = info.index + 1; }
						else { end = info.index; }
						const data = tokenizer.code.substr(str_start, end - str_start);
						lookup_tokens.push(["token_string", data]);
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
						lookup_tokens.push(["token_comment", tokenizer.code.substr(comment_start, end - comment_start)]);
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
					}

					// Assignment operator.
					else if (char === "=") {
						lookup_tokens.push(["token_operator", char]);
					}

					// Attribute keyword.
					else {
						const end = tokenizer.get_first_word_boundary(info.index);
						if (end === info.index) { // current char is word boundary, prevent infinite loop.
							lookup_tokens.push([null, char]);
							return null;
						}
						if (end > tag_end_index) { return true; }
						const data = tokenizer.code.substr(info.index, end - info.index);
						lookup_tokens.push(["token_keyword", data]);
						info.index = end - 1;
						is_attr_type = data === "type";
					}
				});
				if (err === true) {
					return false;
				}

				// Add the closing > token.
				lookup_tokens.push(["token_operator", ">"]);

				// Set default resume on index.
				resume_on_index = tag_end_index;

				// Append the lookup tokens.
				for (let i = 0; i < lookup_tokens.length; i++) {
					tokenizer.append_forward_lookup_batch(lookup_tokens[i][0], lookup_tokens[i][1]);
				}
				tokenizer.resume_on_index(resume_on_index);

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
					tokenizer.iterate_code(info, tag_end_index, null, (char, is_str, _, is_comment) => {
						if (is_str === false && is_comment === false && char === "<") {
							close_tag_start_index = info.index;
							let tag_i = 0;
							for (let i = info.index + 1; i < tokenizer.code.length; i++) {
								const c = tokenizer.code.charAt(i);
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
						tokenizer.append_forward_lookup_batch(false, tokenizer.code.substr(content_start));
						tokenizer.resume_on_index(tokenizer.code.length);
					}


					// For certain tags the highlighting needs to be skipped until the tag closes.
					else if (verbatim_tag) {
						tokenizer.append_forward_lookup_batch(false, tokenizer.code.substr(content_start, close_tag_start_index - content_start));
						tokenizer.resume_on_index(close_tag_start_index - 1);
					}

					// Parse css.
					else if (tag_name === "style") {
						const tokens = vhighlight.css.highlight(tokenizer.code.substr(content_start, close_tag_start_index - content_start), true)
						tokenizer.concat_tokens(tokens);
						tokenizer.resume_on_index(close_tag_start_index - 1);
					}

					// Parse javascript.
					else if (tag_name === "script" && (attr_type == null || attr_type === "text/javascript" || attr_type === "application/javascript")) {
						const tokens = vhighlight.js.highlight(tokenizer.code.substr(content_start, close_tag_start_index - content_start), true)
						tokenizer.concat_tokens(tokens);
						tokenizer.resume_on_index(close_tag_start_index - 1);
					}

					// Uncaucht so add as plain text.
					else {
						tokenizer.append_forward_lookup_batch(false, tokenizer.code.substr(content_start, close_tag_start_index - content_start));
						tokenizer.resume_on_index(close_tag_start_index - 1);
					}
				
				}

				// Success.
				return true;

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
