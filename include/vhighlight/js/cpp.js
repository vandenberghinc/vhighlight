/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// C++ highlighter.

vhighlight.cpp = {};	

// the tokenizer options.
vhighlight.cpp.tokenizer_opts = {
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
};

// Highlight.
vhighlight.cpp.highlight = function(code, return_tokens = false) {

	// Initialize the tokenizer.
	const tokenizer = new Tokenizer(vhighlight.cpp.tokenizer_opts);

	// Assign the code.
	tokenizer.code = code;

	// The last line to detect types.
	let last_line_type = null;

	// Whether the iteration is inside a function.
	// Used to distinct a function header definition from a constructor, so it wont work when ...
	// The user defines a function definition header inside a function but that is fine.
	inside_func = false;
	inside_func_closing_curly = null;

	// Iterate tokens backwards till the opening templae.
	// Parameter "index" should be the index of the closing ">" token.
	const find_opening_template_token = (index) => {
		let depth = 1;
		for (let i = index - 1; i >= 0; i--) {
			const token = tokenizer.tokens[i];
			if (token.data == "<") {
				--depth;
				if (depth == 0) {
					return i;
				}
			} else if (token.data == ">") {
				++depth;
			}
		}
		return null;
	}

	// Start.
	tokenizer.callback = function(char) {
		// return false;

		// Close is func.
		if (inside_func && this.index > inside_func_closing_curly) {
			inside_func = false;
		}

		// Detect types by the first x words on the line preceded by whitespace and another alphabetical character.
		// Must be first since other if statements in this func check if the token before x is not a type.
		if (
			(last_line_type != this.line && char != " " && char != "\t") || // types are allowed at the start of the line.
			(this.prev_char == "(" || (this.parenth_depth > 0 && this.prev_char == ",")) // types are allowed inside parentheses.
		) {
			last_line_type = this.line;

			// Append the batch because of the lookup.
			this.append_batch();

			// Do a lookup to check if there are two consecutive words without any word boundaries except for whitespace.
			let is_type = false;
			let hit_template = 0;
			let word = "";
			let words = 0;
			let append_to_batch = [];
			let last_index, last_append_index;
			for (let index = this.index; index < this.code.length; index++) {
				const c = this.code.charAt(index);

				// Hit template, treat different.
				// Iterate till end of template and then check if there is only whitespace and then a char.
				if (hit_template == 2) {

					// Allowed chars.
					if (c == " " || c == "\t" || c == "*" || c == "&" || c == "\n") {
						continue;
					}

					// Stop at first word char.
					else if (this.is_alphabetical(c)) {
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
							if (this.keywords.includes(word)) { // do not increment words on a keyword.
								append_to_batch.push(["token_keyword", word]);
							} else {
								if (c != ":" || this.code.charAt(index + 1) != ":") { // do not increment on colons like "vlib::String" since they should count as one word.
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
							append_to_batch.push([false, c]);
						}
					}

					// Allowed word chars.
					else if (this.is_alphabetical(c) || (word.length > 0 && this.is_numerical(c))) {
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
					this.append_forward_lookup_batch(append_to_batch[i][0], append_to_batch[i][1]);
				}
				this.resume_on_index(last_index - 1);
				return true;
			}

		}

		// Opening parentheses.
		else if (char == "(") {

			// Append current batch by word boundary seperator.
			this.append_batch();

			// Get the closing parentheses.
			const closing = this.get_closing_parentheses(this.index);
			const non_whitespace_after = this.get_first_non_whitespace(closing + 1);
			if (closing != null && non_whitespace_after != null) {

				// Edit the previous token when the token is not already assigned, for example skip the keywords in "if () {".
				// And skip lambda functions with a "]" before the "(".
				let prev = this.get_prev_token(this.tokens.length - 1, [" ", "\t", "\n", "*", "&"]);
				const prev_prev_is_colon = this.get_prev_token(prev.index - 1).data == ":";
				if (
					(prev.token == null && prev.data != "]") || // when no token is specified and exclude lambda funcs.
					(prev.token == "token_type" && prev_prev_is_colon) // when the previous token is token_type by a double colon.
				) {

					// When the first character after the closing parentheses is a "{", the previous non word boundary token is a type def.
					// Unless the previous non word boundary token is a keyword such as "if () {".
					const lookup = this.code.charAt(non_whitespace_after); 
					if (
						(lookup == ";" && !inside_func) || // from semicolon when not inside a function body.
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
							token = this.get_prev_token(token.index - 1, [":"]);
							if (this.str_includes_word_boundary(token.data)) {
								break;
							}
							token.token = "token_type_def";
						}


						// Set the inside func flag.
						// It is being set a little too early but that doesnt matter since ...
						// Semicolons should not be used in the context between here and the opening curly.
						// Unless the func is a header definition, but then the forward lookup loop stops.
						let opening = null;
						for (let i = closing; i < this.code.length; i++) {
							const c = this.code.charAt(i);
							if (c == ";") {
								break;
							}
							else if (c == "{") {
								opening = i;
								break;
							}
						}
						if (opening != null) {
							inside_func = true;
							inside_func_closing_curly = this.get_closing_curly(opening);
						}
					}

					// When the first character after the closing parentheses is not a "{" then the previous token is a "token_type".
					// Unless the token before the previous token is already a type, such as "String x()".
					else {

						// Check if the prev token is a template closing.
						if (prev.data == ">") {
							const opening_token_index = find_opening_template_token(prev.index);
							if (opening_token_index != null) {
								prev = this.get_prev_token(opening_token_index - 1, [" ", "\t", "\n"]);
							}
						}

						// Make sure the token before the prev is not a keyword such as "if ()".
						let prev_prev = this.get_prev_token(prev.index - 1, [" ", "\t", "\n", "*", "&"]);
						if (prev_prev.data == ">") {
							const opening_token_index = find_opening_template_token(prev_prev.index);
							if (opening_token_index != null) {
								prev_prev = this.get_prev_token(opening_token_index - 1, [" ", "\t", "\n"]);
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
			this.append_batch();

			// Edit the previous token when the token is not already assigned and when the data is not "(" for a func or "if", and skip operators etc.
			// Skip where the token before the previous is already type for example "String x {}".
			// Also skip the tokens between < and > when the initial prev and the prev prev token is a ">".
			let prev = this.get_prev_token(this.tokens.length - 1, [" ", "\t", "\n", "&", "*"]);
			if (prev.data == ">") {
				const opening_token_index = find_opening_template_token(prev.index);
				if (opening_token_index != null) {
					prev = this.tokens[opening_token_index - 1];
				}
			}
			let prev_prev = this.get_prev_token(prev.index - 1, [" ", "\t", "\n", "&", "*"]);
			if (prev_prev.data == ">") {
				const opening_token_index = find_opening_template_token(prev_prev.index);
				if (opening_token_index != null) {
					prev_prev = this.tokens[opening_token_index - 1];
				}
			}
			if (prev_prev.token != "token_type" && prev.token == null && prev.data != ")") {
				prev.token = "token_type";
			}

		}

		// Types inside templates.
		else if (char == "<") {

			// Append the batch because of the lookup.
			this.append_batch();

			// Do a forward lookup till the closing >, if there are any unallowed characters stop the lookup.
			// Since lines like "x < y;" are allowed, so not everything is a template.
			let is_template = false;
			let depth = 1;
			let word = "";
			let append_to_batch = [[false, char]];
			let index;
			let first_word_in_seperator = true;
			for (index = this.index + 1; index < this.code.length; index++) {
				const c = this.code.charAt(index);

				// Closing template.
				if (c == "<") {
					append_to_batch.push([false, c]);
					++depth;
				} else if (c == ">") {
					if (word.length > 0) {
						if (this.keywords.includes(word)) {
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
				else if (this.is_whitespace(c) || c == "," || c == ":" || c == "*" || c == "&" || c == "\n") {
					if (word.length > 0) {
						if (this.keywords.includes(word)) {
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
				else if (this.is_alphabetical(c) || this.is_numerical(c)) {
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
					this.append_forward_lookup_batch(append_to_batch[i][0], append_to_batch[i][1]);
				}
				this.resume_on_index(index);
				return true;
			}
		}

		// Double colon.
		else if (char == ":" && this.prev_char == ":") {

			// Append batch by seperator.
			this.append_batch();

			// Append to new batch.
			this.batch += char;
			this.append_batch(false);

			// Set next token.
			this.next_token = "token_type";

			// Set prev token.
			// Skip the tokens between < and > when the initial prev token is a ">".
			let prev = this.get_prev_token(this.tokens.length - 1, [":"]);
			if (prev.data == ">") {
				let depth = 1;
				for (let i = prev.index - 1; i >= 0; i--) {
					const token = this.tokens[i];
					if (token.data == "<") {
						--depth;
						if (depth == 0) {
							prev = this.tokens[i - 1];
							break;
						}
					} else if (token.data == ">") {
						++depth;
					}
				}
			}
			if (prev == null) {
				return false;
			}
			if (
				(prev.token == null || prev.token == "token_type_def") // when token is null or prev token from like "using namespace a::b::c;"
				&& !this.str_includes_word_boundary(prev.data)) {
				prev.token = "token_type";
			}
			return true;
		}

		// Not appended.
		return false;
	}

	// Tokenize.
	return tokenizer.tokenize(return_tokens);
}
























/* Regex based highlighting, way too slow.

// Language.
vhighlight.cpp.language = "cpp";
	
// Keywords.
vhighlight.cpp.keywords = [
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
];

// Type definition keywords.
vhighlight.cpp.type_def_keywords = [
	"namespace",
	"struct",
	"class",
	"enum",
	"union",
];

// Type keywords.
vhighlight.cpp.type_keywords = [
	"const",
	"constexpr",
	"static",
	"volatile",
	"mutable",
];

// Regexes helpers.
vhighlight.cpp.exclude_span = "(?!(?:[^<]|<(?!/?span[^>]*>))*?<\\/span>)"; // exclude contents inside a "<span>HERE</span>"
vhighlight.cpp.template_params = "(?:&lt;(?:[^&]|&[^g]|&g[^t])*?&gt;)?"; // add optional template params.
vhighlight.cpp.html_open = "(?<!<[^>]*)"; // exclude inside a opening < html tag.
vhighlight.cpp.html_close = "(?![^<]*>)"; // exclude inside a closing > html tag.

// Regexes.
vhighlight.cpp.comment_regex = /(\/\/.*|\/\*[\s\S]*?\*\/)(?!\S)/g;
vhighlight.cpp.string_regex = new RegExp(`${vhighlight.cpp.exclude_span}${vhighlight.cpp.html_open}(["'])(?:\\\\.|(?![\\1])[^\\\\\\n])*?\\1${vhighlight.cpp.html_close}`, 'g');
// vhighlight.cpp.sys_include_regex = new RegExp(`${vhighlight.cpp.exclude_span}(\\s*#[A-Za-z0-9_]*\\s*)(&lt;[\\s\\S]*?&gt;)`, 'g');
vhighlight.cpp.sys_include_regex = new RegExp(`${vhighlight.cpp.exclude_span}(\\s*#\\s*include\\s*)((&lt;|")[\\s\\S]*?(&gt;|"))`, 'g');
vhighlight.cpp.bool_regex = new RegExp(`${vhighlight.cpp.exclude_span}\\b(true|false)\\b`, 'g');
vhighlight.cpp.numeric_regex = new RegExp(`${vhighlight.cpp.exclude_span}\\b-?\\d+(?:\\.\\d+)?\\b`, 'g');
vhighlight.cpp.keyword_regex = new RegExp(`${vhighlight.cpp.exclude_span}${vhighlight.cpp.html_open}\\b(${vhighlight.cpp.keywords.join('|')})\\b${vhighlight.cpp.html_close}`, 'g');
vhighlight.cpp.typedef_regex = new RegExp(`${vhighlight.cpp.exclude_span}\\b(${vhighlight.cpp.type_def_keywords.join('|')})\\b(\\s*[A-Za-z0-9_]*)\\b(.*{)`, 'g');
vhighlight.cpp.preprocessor_regex = new RegExp(`${vhighlight.cpp.exclude_span}(\\s*#(?:[\\s\\S]*?(?=(?<!\\\\)\\n)))`, 'g');
vhighlight.cpp.func_regex = new RegExp(`${vhighlight.cpp.exclude_span}(\\w+)\\s*${vhighlight.cpp.template_params}\\s*(\\w+\\s*\\([\\s\\S]*)[{|;]`, "g");

// vhighlight.cpp.param_type_regex = new RegExp(`${vhighlight.cpp.exclude_span}([\\n,(]\\s*)(${vhighlight.cpp.keywords.join('\\s+|') + '\\s+'})*([A-Za-z0-9_|:]*${vhighlight.cpp.template_params})`, 'g');
vhighlight.cpp.param_type_regex = new RegExp(`${vhighlight.cpp.exclude_span}([\\n,(]\\s*)(${vhighlight.cpp.type_keywords.join('\\s+|') + '\\s+'})*([A-Za-z0-9_|:]*${vhighlight.cpp.template_params})`, 'g');
vhighlight.cpp.constructor_regex = new RegExp(`${vhighlight.cpp.exclude_span}([A-Za-z0-9_]+${vhighlight.cpp.template_params}\\s+)([A-Za-z0-9_]+)(\\s*[\\(|\\{])`, 'g');
vhighlight.cpp.call_regex = new RegExp(`${vhighlight.cpp.exclude_span}\\b([A-Za-z0-9_]+${vhighlight.cpp.template_params})(\\s*[\\(\\{])`, 'g');
vhighlight.cpp.type_regex = new RegExp(`${vhighlight.cpp.exclude_span}${vhighlight.cpp.html_open}(?<=\\b)(${vhighlight.cpp.keywords.join('\\s+|') + '\\s+'})*([A-Za-z0-9_]+${vhighlight.cpp.template_params})([&*]*\\s+(?!&gt;|&lt;)[A-Za-z0-9_&*]+)${vhighlight.cpp.html_close}`, 'gm');
vhighlight.cpp.namespace_regex = new RegExp(`${vhighlight.cpp.exclude_span}([A-Za-z0-9_]*)(::)([A-Za-z0-9_]+${vhighlight.cpp.template_params})`, 'g');
vhighlight.cpp.recorrect_regex = /(<span class="token_type">[^$2|<]*)(,|::|&lt;|&gt;)([^<]*<\/span>)/g;

// Highlight.
vhighlight.cpp.highlight = function(
	code,
	options = {
		is_func: false,
		reformat: true,
		vide: false,
	}
) {

	// Og code.
	const og_code = code;
	
	// Replace certain chars.
	// Need to be replaced again.
	// But they should also be replaced before assigning the initial pre data.
	if (options.reformat) { // skip when func since parent has already highlighted it.
		code = code.replaceAll("<", "&lt;");
		code = code.replaceAll(">", "&gt;");
	}

	// Pre func regex replacements.
	if (!options.is_func) { // skip when func since parent has already highlighted it.
		code = code.replace(vhighlight.cpp.comment_regex, '<span class="token_comment">$&</span>'); // should be first except for func.
		code = code.replace(vhighlight.cpp.sys_include_regex, '<span class="token_preprocessor">$1</span><span class="token_string">$2</span>'); // should be before preprocessor and string.
		code = code.replace(vhighlight.cpp.string_regex, '<span class="token_string">$&</span>'); // should be before preprocessor.
	}

	// Separately parse the functions.
	// Since c++ code inside functions should be highlighted differently.
	let code_blocks = [];
	if (!options.is_func) {
		let match;
		const regex = vhighlight.cpp.func_regex;
		while ((match = regex.exec(code)) !== null) {
			
			// Parse function type, name, params and code.
			let func_type = "";
			let func_name = "";
			let func_params = "";
			let func_code = "";
			let end_index = 0;
			let pstart = 0;
			let pend = 0;
			let bstart = 0;
			let bend = 0;
			let depth = 0;
			let last_space = match.index;
			for (let index = match.index; index < code.length; index++) {
				const char = code.charAt(index);
				
				// Last space for func name and type name.
				if (pstart == 0 && (char == " " || char == "\t") && code[index + 1] != "(" && code[index + 1] != " ") {
					last_space = index;
				}

				// Params.
				if (pend == 0) {
					if (char == "(") {
						if (depth == 0) {
							pstart = index;
						}
						depth++;
					}
					else if (char == ")") {
						depth--;
					}
					if (pstart != 0 && depth == 0) {
						pend = index + 1;
						depth = 0;
						func_type = code.substr(match.index, last_space - match.index).trim();
						func_name = code.substr(last_space + 1, pstart - last_space - 1).trim();
						func_params = code.substr(pstart, pend - pstart);
						if (func_name == "requires") {
							break;
						}
					}
				}

				// Stop parsing by func header defintion.
				else if (bstart == 0 && char == ";") {
					end_index = index + 1;
					break;
				}

				// Brackets.
				else if (char == "{") {
					bstart = index;
					const result = vhighlight.utils.slice_curly_brackets({code: code, start_index: bstart, include: true, language: vhighlight.cpp.language});
					if (result == null) { // unfinished curly brackets.
						break;
					}
					bend = result.end;
					end_index = result.end;
					func_code = result.data.trim();
					break;
				}

			}

			// Seperately highlight the requires clause.
			if (func_name == "requires") {
				let highlighted = vhighlight.cpp.highlight_params(func_params);
				code_blocks.push(highlighted);
				let codeblock_id = "{{CODEBLOCK_";
				codeblock_id += code_blocks.length - 1;
				codeblock_id += "}}";
				let replaced = code.substr(0, pstart);
				replaced += codeblock_id;
				replaced += code.substr(pend, code.length - end_index);
				code = replaced;
				regex.lastIndex = match.index + 1;
				regex.lastIndex = pend + 1;
				continue;
			}
			
			// Closing not found, should be after "requires".
			if (end_index == 0) {
				console.log(func_name, " - ", func_type);
				regex.lastIndex = match.index + 1;
				continue;
			}

			// Create highlighted code.
			let highlighted = "";

			// Type.
			if (vhighlight.cpp.keywords.includes(func_type)) {
				highlighted += "<span class='token_keyword'>";
			} else {
				highlighted += "<span class='token_type'>";
			}
			highlighted += func_type;
			highlighted += "</span>";
			highlighted += " ";
			highlighted += "<span class='token_type_def'>";
			highlighted += func_name;
			highlighted += "</span>";

			// Highlight params.
			highlighted += vhighlight.cpp.highlight_params(func_params);

			// Add function code.
			if (bend != 0) {
				highlighted += " ";
				highlighted += this.highlight(func_code, {is_func: true, reformat: false});
			} else {
				highlighted += ";";
			}

			// Add codeblock id.
			code_blocks.push(highlighted);
			let codeblock_id = "{{CODEBLOCK_";
			codeblock_id += code_blocks.length - 1;
			codeblock_id += "}}";
			code = vhighlight.utils.replace_by_index(code, match.index, end_index, codeblock_id);
			regex.lastIndex = match.index + 1;
			
		}
	}

	// Regex replacements.
	code = code.replace(vhighlight.cpp.numeric_regex, '<span class="token_numeric">$&</span>');
	code = code.replace(vhighlight.cpp.bool_regex, '<span class="token_bool">$&</span>');
	code = code.replace(vhighlight.cpp.typedef_regex, '<span class="token_keyword">$1</span><span class="token_type_def">$2</span>$3'); 
	code = code.replace(vhighlight.cpp.namespace_regex, '<span class="token_type">$1</span>$2<span class="token_type">$3</span>'); // should be before keyword regex.
	code = code.replace(vhighlight.cpp.preprocessor_regex, '<span class="token_preprocessor">$&</span>'); // should be before keywords.
	code = code.replace(vhighlight.cpp.keyword_regex, '<span class="token_keyword">$&</span>');	
	if (options.is_func) {
		code = code.replace(vhighlight.cpp.constructor_regex, '<span class="token_type">$1</span><span class="type_no">$2</span>$3'); // should be after keywords and before call regex, and needs a span for the var name otherwise it will be matched by call_regex.
		code = code.replace(vhighlight.cpp.call_regex, '<span class="token_type">$1</span>$2');
		
	}
	code = code.replace(vhighlight.cpp.type_regex, '$1<span class="token_type">$2</span>$3'); // should be after call regex & constructor regex and before keywords.

	// Replace code blocks.
	for (let i = 0; i < code_blocks.length; i++) {
		code = code.replace("{{CODEBLOCK_" + i + "}}", code_blocks[i]);
	}

	// Correct type color , and :.
	let replaced = true;
	while (replaced) {
		replaced = false;
		code = code.replace(vhighlight.cpp.recorrect_regex, function(match, p1, p2, p3) {
			replaced = true;
			return `${p1}</span>${p2}<span class="token_type">${p3}`;
		});
	}
	
	// Create spans for code folding.
	if (options.vide) {
	
		// Vars.
		let code_folding = [];
		let insertions = [];
		let lines = [];
		let last_line = -1;
		let line = 0;
		let indent = "";
		let newline_index = 0;
		
		// Iterate.
		vhighlight.utils.iterate_code({
			code: code,
			language: vhighlight.cpp.language,
			callback: (index, char, is_str, is_comment, is_multi_line_comment, is_escaped) => {
				if (!is_escaped && char == "\n") {
					++line;
					newline_index = index + 1;
					lines.push(newline_index);
				}
				if (!is_str && !is_comment && !is_multi_line_comment) {
					if (line != last_line) { // only one code fold per line.
						if (char == "{") {
							last_line = line;
							indent = "";
							for (let i = newline_index; i < index; i++) {
								const c = code.charAt(i);
								if (c == " " || c == "\t") {
									indent += c;
								} else {
									break;
								}
							}
							insertions.push([index + 1, `<span id='token_foldable_${line}' class='token_foldable'>`]);
							code_folding.push({
								start: true,
								line: line,
								id: `token_foldable_${line}`,
								indent: indent,
							});
							// console.log(line, {indent});
						} else if (char == "}") {
							insertions.push([index, "</span>"]);
							code_folding.push({
								start: false,
								line: line,
							});
						}
					}
				}
			},
		});
		
		// Insert.
		let offset = 0;
		for (let i = 0; i < insertions.length; i++) {
			const insert = insertions[i];
			code = vhighlight.utils.insert_str(code, insert[0] + offset, insert[1]);
			offset += insert[1].length;
		}
		
		// Handler.
		return {
			code: code,
			line_count: line,
			lines: lines,
			code_folding: code_folding,
		};
	}
	
	// Handler.
	return code;
}

// Highlight params code.
vhighlight.cpp.highlight_params = function(code) {
	code = code.replace(vhighlight.cpp.comment_regex, '<span class="token_comment">$&</span>'); // should be first except for func.
	code = code.replace(vhighlight.cpp.typedef_regex, '<span class="token_keyword">$1</span><span class="token_type_def">$2</span>$3'); // should be before keyword.
	code = code.replace(vhighlight.cpp.string_regex, '<span class="token_string">$&</span>'); // should be before preprocessor.
	code = code.replace(vhighlight.cpp.numeric_regex, '<span class="token_numeric">$&</span>');
	code = code.replace(vhighlight.cpp.bool_regex, '<span class="token_bool">$&</span>');
	// code = code.replace(vhighlight.cpp.param_type_regex, '$1$2<span class="token_type">$3</span>'); // should be before namespace and keyword.
	code = code.replace(vhighlight.cpp.param_type_regex, (match, g1, g2, g3) => {
		if (g2 == null) {
			g2 = "";
		}
		if (vhighlight.cpp.keywords.includes(g3)) {
			return `${g1}${g2}<span class="token_keyword">${g3}</span>`;
		} else {
			return `${g1}${g2}<span class="token_type">${g3}</span>`;
		}
	});
	code = code.replace(vhighlight.cpp.namespace_regex, '<span class="token_type">$1</span>$2<span class="token_type">$3</span>'); // should be before keyword.
	code = code.replace(vhighlight.cpp.preprocessor_regex, '<span class="token_keyword">$&</span>'); // should be before keyword.
	code = code.replace(vhighlight.cpp.keyword_regex, '<span class="token_keyword">$&</span>');	
	code = code.replace(vhighlight.cpp.call_regex, '<span class="token_type">$1</span>$2');
	return code;
}

// Highlight type.
// The full code block must be a type e.g. "const int&" or "Code".
vhighlight.cpp.highlight_type = function(block) {
	
	// Vars.
	highlighted = "";
	batch = "";
	
	// Funcs.
	function append_batch(highlight = true) {
		if (highlight && keywords.includes(batch)) {
			highlighted += "<span class='token_keyword'>";
			highlighted += batch;
			highlighted += "</span>";
		}
		else if (highlight && batch != '&' && batch != '*' && batch != '.' && batch != ':') {
			highlighted += "<span class='token_type'>";
			highlighted += batch;
			highlighted += "</span>";
		}
		else {
			highlighted += batch;
		}
		batch = "";
	};
	
	// Iterate.
	for (let i = 0; i < block.length; i++) {
		c = block[i];
		switch (c) {
			
		// Special chars.
		case '*':
		case '&':
		case '.':
		case ':':
			append_batch();
			batch += c;
			append_batch(false);
			break;
		case '<':
			append_batch();
			batch += "&lt;";
			append_batch(false);
			break;
		case '>':
			append_batch();
			batch += "&gt;";
			append_batch(false);
			break;
		
		// Space.
		case ' ':
			append_batch();
			batch += c;
			append_batch(false);
			break;
		
		// Append.
		default:
			batch += c;
			break;
		}
	}
	append_batch();
		
	return highlighted;
}

*/