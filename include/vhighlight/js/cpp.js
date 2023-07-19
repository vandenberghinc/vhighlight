/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// C++ highlighter.

vhighlight.cpp = {};
	
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
vhighlight.cpp.typedef_keywords = [
	"namespace",
	"struct",
	"class",
	"enum",
	"union",
];

// Regexes helpers.
vhighlight.cpp.exclude_span = "(?!(?:[^<]|<(?!/?span[^>]*>))*?<\\/span>)"; // exclude contents inside a "<span>HERE</span>"
vhighlight.cpp.template_params = "(?:&lt;(?:[^&]|&[^g]|&g[^t])*?&gt;)?"; // add optional template params.
vhighlight.cpp.html_open = "(?<!<[^>]*)"; // exclude inside a opening < html tag.
vhighlight.cpp.html_close = "(?![^<]*>)"; // exclude inside a closing > html tag.

// Regexes.
vhighlight.cpp.comment_regex = /(\/\/.*|\/\*[\s\S]*?\*\/)(?!\S)/g;
vhighlight.cpp.string_regex = new RegExp(`${vhighlight.cpp.exclude_span}${vhighlight.cpp.html_open}(["'])(?:\\\\.|(?![\\1])[^\\\\\\n])*?\\1${vhighlight.cpp.html_close}`, 'g');
vhighlight.cpp.sys_include_regex = new RegExp(`${vhighlight.cpp.exclude_span}(\\s*#[A-Za-z0-9_]*\\s*)(&lt;[\\s\\S]*?&gt;)`, 'g');
vhighlight.cpp.bool_regex = new RegExp(`${vhighlight.cpp.exclude_span}\\b(true|false)\\b`, 'g');
vhighlight.cpp.numeric_regex = new RegExp(`${vhighlight.cpp.exclude_span}\\b-?\\d+(?:\\.\\d+)?\\b`, 'g');
vhighlight.cpp.keyword_regex = new RegExp(`${vhighlight.cpp.exclude_span}${vhighlight.cpp.html_open}\\b(${vhighlight.cpp.keywords.join('|')})\\b${vhighlight.cpp.html_close}`, 'g');
vhighlight.cpp.typedef_regex = new RegExp(`${vhighlight.cpp.exclude_span}\\b(${vhighlight.cpp.typedef_keywords.join('|')})\\b(\\s*[A-Za-z0-9_]*)\\b(.*{)`, 'g');
vhighlight.cpp.preprocessor_regex = new RegExp(`${vhighlight.cpp.exclude_span}(\\s*#(?:[\\s\\S]*?(?=(?<!\\\\)\\n)))`, 'g');
vhighlight.cpp.func_regex = new RegExp(`${vhighlight.cpp.exclude_span}(\\w+)\\s*${vhighlight.cpp.template_params}\\s*(\\w+\\s*\\([\\s\\S]*)[{|;]`, "g");

vhighlight.cpp.param_type_regex = new RegExp(`${vhighlight.cpp.exclude_span}([\\n,(]\\s*)(${vhighlight.cpp.keywords.join('\\s+|') + '\\s+'})*([A-Za-z0-9_|:]*${vhighlight.cpp.template_params})`, 'g');
vhighlight.cpp.constructor_regex = new RegExp(`${vhighlight.cpp.exclude_span}([A-Za-z0-9_]+${vhighlight.cpp.template_params}\\s+)([A-Za-z0-9_]+)(\\s*[\\(|\\{])`, 'g');
vhighlight.cpp.call_regex = new RegExp(`${vhighlight.cpp.exclude_span}\\b([A-Za-z0-9_]+${vhighlight.cpp.template_params})(\\s*[\\(\\{])`, 'g');
vhighlight.cpp.type_regex = new RegExp(`${vhighlight.cpp.exclude_span}${vhighlight.cpp.html_open}(?<=\\b)(${vhighlight.cpp.keywords.join('\\s+|') + '\\s+'})*([A-Za-z0-9_]+${vhighlight.cpp.template_params})([&*]*\\s+(?!&gt;|&lt;)[A-Za-z0-9_&*]+)${vhighlight.cpp.html_close}`, 'gm');
vhighlight.cpp.namespace_regex = new RegExp(`${vhighlight.cpp.exclude_span}([A-Za-z0-9_]*)(::)([A-Za-z0-9_]+${vhighlight.cpp.template_params})`, 'g');
vhighlight.cpp.recorrect_regex = /(<span class="token_type">[^$2|<]*)(,|::|&lt;|&gt;)([^<]*<\/span>)/g;

// Highlight.
vhighlight.cpp.highlight = function(code, options = {is_func: false, reformat: true}) {

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

				// Last space for func name and type name.
				if (pstart == 0 && (code[index] == " " || code[index] == "\t") && code[index + 1] != "(" && code[index + 1] != " ") {
					last_space = index;
				}

				// Params.
				if (pend == 0) {
					if (code[index] == "(") {
						if (depth == 0) {
							pstart = index;
						}
						depth++;
					}
					else if (code[index] == ")") {
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
				else if (bstart == 0 && code[index] == ";") {
					end_index = index + 1;
					break;
				}

				// Brackets.
				else {
					if (code[index] == "{") {
						if (depth == 0) {
							bstart = index;
						}
						depth++;
					}
					else if (code[index] == "}") {
						depth--;
					}
					if (bstart != 0 && depth == 0) {
						bend = index + 1;
						end_index = index + 1;
						depth = 0;
						func_code = code.substr(bstart, bend - bstart).trim();
						break;
					}
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

			// Highlight code and replace code.
			// let replaced = code.substr(0, match.index);
			// replaced += highlighted;
			// replaced += code.substr(end_index, code.length - end_index);
			// code = replaced;
			// regex.lastIndex = match.index + highlighted.length;
		}
	}

	// Regex replacements.
	code = code.replace(vhighlight.cpp.sys_include_regex, '$1<span class="token_string">$2</span>'); // should be before preprocessor.
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
	code = code.replace(vhighlight.cpp.param_type_regex, '$1$2<span class="token_type">$3</span>'); // should be before namespace and keyword.
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

