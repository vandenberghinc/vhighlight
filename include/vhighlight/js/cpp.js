/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// C++ highlighter.

vhighlight.CPP = class CPP {
	constructor() {

		// Initialize the tokenizer.
		this.tokenizer = new vhighlight.Tokenizer({
			keywords: [
				"alignas",
				"alignof",
				"and",
				"and_eq",
				"asm",
				"atomic_cancel",
				"atomic_commit",
				"atomic_noexcept",
				"auto",
				"bitand",
				"bitor",
				"bool",
				"break",
				"case",
				"catch",
				"char",
				"char8_t",
				"char16_t",
				"char32_t",
				"class",
				"compl",
				"concept",
				"const",
				"consteval",
				"constexpr",
				"constinit",
				"const_cast",
				"continue",
				"co_await",
				"co_return",
				"co_yield",
				"decltype",
				"default",
				"delete",
				"do",
				"double",
				"dynamic_cast",
				"else",
				"enum",
				"explicit",
				"export",
				"extern",
				"false",
				"float",
				"for",
				"friend",
				"goto",
				"if",
				"inline",
				"int",
				"long",
				"mutable",
				"namespace",
				"new",
				"noexcept",
				"not",
				"not_eq",
				"nullptr",
				"operator",
				"or",
				"or_eq",
				"private",
				"protected",
				"public",
				"reflexpr",
				"register",
				"reinterpret_cast",
				"requires",
				"return",
				"short",
				"signed",
				"sizeof",
				"static",
				"static_assert",
				"static_cast",
				"struct",
				"switch",
				"synchronized",
				"template",
				"this",
				"thread_local",
				"throw",
				"true",
				"try",
				"typedef",
				"typeid",
				"typename",
				"union",
				"unsigned",
				"using",
				"virtual",
				"void",
				"volatile",
				"wchar_t",
				"while",
				"xor",
				"xor_eq",
			],
			type_def_keywords: [
				"namespace",
				"struct",
				"class",
				"enum",
				"union",
			], 
			type_keywords: [
				"const",
				"constexpr",
				"static",
				"volatile",
				"mutable",
			],
			operators: [
				"&&", "||", "!", "==", "!=", ">", "<", ">=", "<=", "+", "-", "*", "/", "%",
				"=", "+=", "-=", "*=", "/=", "%=", "++", "--", "<<", ">>", "&", "|", "^", "~",
				"?",
			],
			special_string_prefixes: [
				"L",
				"u",
				"U",
				"R",
				"u8",
			],
			single_line_comment_start: "//",
			multi_line_comment_start: "/*",
			multi_line_comment_end: "*/",
			allow_preprocessors: true,
			// Attributes for partial tokenizing.
			scope_seperators: [
				"{", 
				"}", 
			],
			allow_string_scope_seperator: false,
			allow_comment_scope_seperator: false,
			allow_regex_scope_seperator: false,
			allow_preprocessor_scope_seperator: false,
		});

		// Assign attributes.
		this.reset();

		// Set callback.
		this.tokenizer.callback = (char) => {
			const tokenizer = this.tokenizer;
			
			// Close is func.
			if (this.inside_func && tokenizer.index > this.inside_func_closing_curly) {
				this.inside_func = false;
			}

			// Detect types by the first x words on the line preceded by whitespace and another alphabetical character.
			// Must be first since other if statements in this func check if the token before x is not a type.
			if (
				(this.last_line_type != tokenizer.line && char != " " && char != "\t") || // types are allowed at the start of the line.
				(tokenizer.prev_char == "(" || (tokenizer.parenth_depth > 0 && tokenizer.prev_char == ",")) // types are allowed inside parentheses.
			) {
				this.last_line_type = tokenizer.line;

				// Append the batch because of the lookup.
				tokenizer.append_batch();

				// Do a lookup to check if there are two consecutive words without any word boundaries except for whitespace.
				let is_type = false;
				let hit_template = 0;
				let word = "";
				let words = 0;
				let append_to_batch = [];
				let last_index, last_append_index;
				for (let index = tokenizer.index; index < tokenizer.code.length; index++) {
					const c = tokenizer.code.charAt(index);

					// Hit template, treat different.
					// Iterate till end of template and then check if there is only whitespace and then a char.
					if (hit_template == 2) {

						// Allowed chars.
						if (c == " " || c == "\t" || c == "*" || c == "&" || c == "\n") {
							continue;
						}

						// Stop at first word char.
						else if (tokenizer.is_alphabetical(c)) {
							if (words == 1) {
								is_type = true;
								break;
							}
							break;
						}

						// Non allowed chars.
						else {
							break;
						}
					}
					else if (hit_template == 1) {
						if (c == ">") {
							hit_template = 2;
						}
					}

					// Did not hit any template.
					else {

						// Allowed seperator characters.
						if (c == " " || c == "\t" || c == ":" || c == "*" || c == "&" || (words == 0 && c == "<")) {
							if (c == "<") {
								hit_template = 1;
							}
							if (word.length > 0) {
								if (tokenizer.keywords.includes(word)) { // do not increment words on a keyword.
									append_to_batch.push(["token_keyword", word]);
								} else {
									if (c != ":" || tokenizer.code.charAt(index + 1) != ":") { // do not increment on colons like "vlib::String" since they should count as one word.
										++words;
									}
									append_to_batch.push(["token_type", word]);
								}
								last_index = index;
								last_append_index = append_to_batch.length - 1;
								word = "";
							}
							if (c == "*" || c == "&") {
								append_to_batch.push(["token_operator", c]);
							} else {
								append_to_batch.push([null, c]); // @todo changed jerre [false, c] to [null, c] still have to check but it should still highlight numerics in append_token called by append_forward_lookup_token
							}
						}

						// Allowed word chars.
						else if (tokenizer.is_alphabetical(c) || (word.length > 0 && tokenizer.is_numerical(c))) {
							if (words == 1) {
								is_type = true;
								break;
							}
							word += c;
						}

						// Non allowed chars.
						else {
							break;
						}
					}
				}

				// Add the batches when it is a type.
				// length - 1 since 
				if (is_type) {
					for (let i = 0; i <= last_append_index; i++) {
						tokenizer.append_forward_lookup_batch(append_to_batch[i][0], append_to_batch[i][1]);
					}
					tokenizer.resume_on_index(last_index - 1);
					return true;
				}

			}

			// Opening parentheses.
			else if (char == "(") {

				// Append current batch by word boundary seperator.
				tokenizer.append_batch();

				// Get the closing parentheses.
				const closing = tokenizer.get_closing_parentheses(tokenizer.index);
				const non_whitespace_after = tokenizer.get_first_non_whitespace(closing + 1);
				if (closing != null && non_whitespace_after != null) {

					// Edit the previous token when the token is not already assigned, for example skip the keywords in "if () {".
					// And skip lambda functions with a "]" before the "(".
					let prev = tokenizer.get_prev_token(tokenizer.added_tokens - 1, [" ", "\t", "\n", "*", "&"]);
					const prev_prev_is_colon = tokenizer.get_prev_token(prev.index - 1).data == ":";
					if (
						(prev.token === undefined && prev.data != "]") || // when no token is specified and exclude lambda funcs.
						(prev.token == "token_type" && prev_prev_is_colon) // when the previous token is token_type by a double colon.
					) {

						// When the first character after the closing parentheses is a "{", the previous non word boundary token is a type def.
						// Unless the previous non word boundary token is a keyword such as "if () {".
						const lookup = tokenizer.code.charAt(non_whitespace_after); 
						if (
							(lookup == ";" && !this.inside_func) || // from semicolon when not inside a function body.
							lookup == "{" || // from opening curly.
							lookup == "c" || // from "const".
							lookup == "v" || // from "volatile".
							lookup == "n" || // from "noexcept".
							lookup == "o" || // from "override".
							lookup == "f" || // from "final".
							lookup == "r" // from "requires".
						) {
							prev.token = "token_type_def";

							// When the prev prev token is a colon, also set the "token_type" assigned by double colon to "token_type_def".
							let token = prev;
							while (true) {
								token = tokenizer.get_prev_token(token.index - 1, [":"]);
								if (tokenizer.str_includes_word_boundary(token.data)) {
									break;
								}
								token.token = "token_type_def";
							}


							// Set the inside func flag.
							// It is being set a little too early but that doesnt matter since ...
							// Semicolons should not be used in the context between here and the opening curly.
							// Unless the func is a header definition, but then the forward lookup loop stops.
							let opening = null;
							for (let i = closing; i < tokenizer.code.length; i++) {
								const c = tokenizer.code.charAt(i);
								if (c == ";") {
									break;
								}
								else if (c == "{") {
									opening = i;
									break;
								}
							}
							if (opening != null) {
								this.inside_func = true;
								this.inside_func_closing_curly = tokenizer.get_closing_curly(opening);
							}
						}

						// When the first character after the closing parentheses is not a "{" then the previous token is a "token_type".
						// Unless the token before the previous token is already a type, such as "String x()".
						else {

							// Check if the prev token is a template closing.
							if (prev.data == ">") {
								const token = tokenizer.get_opening_template(prev.index);
								if (token != null) {
									prev = tokenizer.get_prev_token(token.index - 1, [" ", "\t", "\n"]);
								}
							}

							// Make sure the token before the prev is not a keyword such as "if ()".
							let prev_prev = tokenizer.get_prev_token(prev.index - 1, [" ", "\t", "\n", "*", "&"]);
							if (prev_prev.data == ">") {
								const token = tokenizer.get_opening_template(prev_prev.index);
								if (token != null) {
									prev_prev = tokenizer.get_prev_token(token.index - 1, [" ", "\t", "\n"]);
								}
							}
							if (prev_prev.token != "token_type") {
								prev.token = "token_type";
							}
						}
					}
				}
			}

			// Braced initialiatons, depends on a ">" from a template on not being an operator.
			else if (char == "{") {

				// Append current batch by word boundary seperator.
				tokenizer.append_batch();

				// Edit the previous token when the token is not already assigned and when the data is not "(" for a func or "if", and skip operators etc.
				// Skip where the token before the previous is already type for example "String x {}".
				// Also skip the tokens between < and > when the initial prev and the prev prev token is a ">".
				let prev = tokenizer.get_prev_token(tokenizer.added_tokens - 1, [" ", "\t", "\n", "&", "*"]);
				if (prev.data == ">") {
					const token = tokenizer.get_opening_template(prev.index);
					if (token != null) {
						prev = tokenizer.get_prev_token(token.index - 1, []);
					}
				}
				let prev_prev = tokenizer.get_prev_token(prev.index - 1, [" ", "\t", "\n", "&", "*"]);
				if (prev_prev.data == ">") {
					const token = tokenizer.get_opening_template(prev_prev.index);
					if (token != null) {
						prev_prev = tokenizer.get_prev_token(token.index - 1, []);
					}
				}
				if (prev_prev.token != "token_type" && prev.token === undefined && prev.data != ")") {
					prev.token = "token_type";
				}

			}

			// Types inside templates.
			else if (char == "<") {

				// Append the batch because of the lookup.
				tokenizer.append_batch();

				// Do a forward lookup till the closing >, if there are any unallowed characters stop the lookup.
				// Since lines like "x < y;" are allowed, so not everything is a template.
				let is_template = false;
				let depth = 1;
				let word = "";
				let append_to_batch = [[false, char]];
				let index;
				let first_word_in_seperator = true;
				for (index = tokenizer.index + 1; index < tokenizer.code.length; index++) {
					const c = tokenizer.code.charAt(index);

					// Closing template.
					if (c == "<") {
						append_to_batch.push([false, c]);
						++depth;
					} else if (c == ">") {
						if (word.length > 0) {
							if (tokenizer.keywords.includes(word)) {
								append_to_batch.push(["token_keyword", word]);
							} else if (first_word_in_seperator) {
								append_to_batch.push(["token_type", word]);
							} else {
								append_to_batch.push([false, word]);
							}
							word = "";
						}
						append_to_batch.push([false, c]);
						--depth;
						if (depth == 0) {
							is_template = true;
							break;
						}
					}

					// Allowed seperator characters.
					else if (tokenizer.is_whitespace(c) || c == "," || c == ":" || c == "*" || c == "&" || c == "\n") {
						if (word.length > 0) {
							if (tokenizer.keywords.includes(word)) {
								append_to_batch.push(["token_keyword", word]);
							} else if (first_word_in_seperator) {
								append_to_batch.push(["token_type", word]);
							} else {
								append_to_batch.push([false, word]);
							}
							word = "";
							if (c == " ") {
								first_word_in_seperator = false;
							} else if (c == ",") {
								first_word_in_seperator = true;
							}
						}
						append_to_batch.push([false, c]);
					}

					// Allowed alpha and numeric
					else if (tokenizer.is_alphabetical(c) || tokenizer.is_numerical(c)) {
						word += c;
					}

					// Non allowed characters.
					else {
						break;
					}

				}
				
				// Add the batches when it is a template.
				if (is_template) {
					for (let i = 0; i < append_to_batch.length; i++) {
						tokenizer.append_forward_lookup_batch(append_to_batch[i][0], append_to_batch[i][1]);
					}
					tokenizer.resume_on_index(index);
					return true;
				}
			}

			// Double colon.
			else if (char == ":" && tokenizer.prev_char == ":") {

				// Append batch by seperator.
				tokenizer.append_batch();

				// Append to new batch.
				tokenizer.batch += char;
				tokenizer.append_batch(false);

				// Set next token.
				tokenizer.next_token = "token_type";

				// Set prev token.
				// Skip the tokens between < and > when the initial prev token is a ">".
				let prev = tokenizer.get_prev_token(tokenizer.added_tokens - 1, [":"]);
				if (prev.data == ">") {
					prev = tokenizer.get_opening_template(prev.index);
					if (prev !== null) {
						prev = tokenizer.get_prev_token(prev.index - 1, [])
					}
				}
				if (prev == null) {
					return false;
				}
				if (
					(prev.token === undefined || prev.token == "token_type_def") // when token is null or prev token from like "using namespace a::b::c;"
					&& !tokenizer.str_includes_word_boundary(prev.data)) {
					prev.token = "token_type";
				}
				return true;
			}

			// Not appended.
			return false;
		}
	}

	// Reset attributes that should be reset before each tokenize.
	reset() {
		// The last line to detect types.
		this.last_line_type = null;

		// Whether the iteration is inside a function.
		// Used to distinct a function header definition from a constructor, so it wont work when ...
		// The user defines a function definition header inside a function but that is fine.
		this.inside_func = false;
		this.inside_func_closing_curly = null;
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
	// @todo should still account for the is inside func to distinguish a func header definition of a type constructor init.
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
	} 
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

		// Reset.
		this.reset();

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
	*/
}

// Initialize.
vhighlight.cpp = new vhighlight.CPP();
