/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Javascript highlighter.

vhighlight.js = {};

// Keywords.
vhighlight.js.keywords = [
	"break",
	"case",
	"catch",
	"class",
	"const",
	"continue",
	"debugger",
	"default",
	"delete",
	"do",
	"else",
	"export",
	"extends",
	"finally",
	"for",
	"function",
	"if",
	"import",
	"in",
	"instanceof",
	"let",
	"new",
	"of",
	"return",
	"super",
	"switch",
	"this",
	"throw",
	"try",
	"typeof",
	"var",
	"void",
	"while",
	"with",
	"yield",
	"prototype",
	"true",
	"false",
	"null",
	"static",
	"=>",
];

// Type definition keywords.
vhighlight.js.type_def_keywords = [
	"class",
	"extends",
];

// Function definition keywords.
vhighlight.js.func_def_keywords = [
	'function', 
	'static', 
	'async', 
	'get', 
	'set', 
	'constructor', 
];

// Type keywords.
vhighlight.js.type_keywords = [
	"extends",
];

// Regexes helpers.
vhighlight.js.exclude_span = "(?!(?:[^<]|<(?!/?span[^>]*>))*?<\\/span>)"; // exclude contents inside a "<span>HERE</span>"
vhighlight.js.html_open = "(?<!<[^>]*)"; // exclude inside a opening < html tag.
vhighlight.js.html_close = "(?![^<]*>)"; // exclude inside a closing > html tag.

// Regexes.
vhighlight.js.comment_regex = /(\/\/.*|\/\*[\s\S]*?\*\/)(?!\S)/g;
vhighlight.js.keyword_regex = new RegExp(`${vhighlight.js.exclude_span}\\b(${vhighlight.js.keywords.join('|')})\\b`, 'gm');
vhighlight.js.string_regex = new RegExp(`(${vhighlight.js.exclude_span}${vhighlight.js.html_open})(['"\`/]{1})(.*?)\\2${vhighlight.js.html_close}`, 'gms');
vhighlight.js.numeric_regex = new RegExp(`${vhighlight.js.exclude_span}\\b-?\\d+(?:\\.\\d+)?\\b`, 'g');
vhighlight.js.type_def_regex = new RegExp(`${vhighlight.js.exclude_span}\\b(${vhighlight.js.type_def_keywords.join('|')})(\\s+[A-Za-z_][A-Za-z0-9_]+)(\\s*[\\(|{|\\s+])`, 'gm');

vhighlight.js.prototype_type_def_regex = new RegExp(`${vhighlight.js.exclude_span}\\b([A-Za-z_][A-Za-z0-9_]+)(\\s*=\\s*function\\s*\\()`, 'gm');
// vhighlight.js.anonymous_prototype_type_def_regex = new RegExp(`${vhighlight.js.exclude_span}\\b([A-Za-z_][A-Za-z0-9_]+)(\\s*=\\s*\\([^\\)]*\\s*=)`, 'gm');
vhighlight.js.anonymous_prototype_type_def_regex = new RegExp(`${vhighlight.js.exclude_span}\\b([A-Za-z_][A-Za-z0-9_]+)(\\s*=\\s*\\([^()]*\\))`, 'gm')

vhighlight.js.type_def_body_regex = new RegExp(`${vhighlight.js.exclude_span}(\\b${vhighlight.js.type_def_keywords.join('|')}\\b)([^{]+)\\s*\\{`, 'gm');

// vhighlight.js.outside_class_func_def_regex = new RegExp(`${vhighlight.js.exclude_span}\\b(${vhighlight.js.func_def_keywords.join('\\s+|')}\\s+)(\\s*[A-Za-z_][A-Za-z0-9_]+)(\\s*\\([^\\)]*\\))\\s*{`, 'gm');
vhighlight.js.outside_class_func_def_regex = new RegExp(`${vhighlight.js.exclude_span}${vhighlight.js.html_open}\\b(${vhighlight.js.func_def_keywords.join('\\s+|')}\\s+)(\\s*[A-Za-z_][A-Za-z0-9_]+)(\\s*\\([^{}]*{)${vhighlight.js.html_close}`, 'gm');

// vhighlight.js.inside_class_func_def_regex = new RegExp(`${vhighlight.js.exclude_span}\\b(${vhighlight.js.func_def_keywords.join('\\s+|')}\\s+)*(\\s*[A-Za-z_][A-Za-z0-9_]+)(\\s*\\([^\\)]*\\))\\s*{`, 'gm');
// vhighlight.js.inside_class_func_def_regex = new RegExp(`${vhighlight.js.exclude_span}\\b(${vhighlight.js.func_def_keywords.join('\\s+|')}\\s+)*(\\s*[A-Za-z_][A-Za-z0-9_]+)([^\\}]*{)`, 'gm');

// vhighlight.js.inside_class_func_def_regex = new RegExp(`${vhighlight.js.exclude_span}([\\s*\\b]+)(${vhighlight.js.func_def_keywords.join('\\s+|')}\\s+)*(\\s*[A-Za-z_][A-Za-z0-9_]+)(\\s*\\([^{]*{)`, 'gm');
// vhighlight.js.inside_class_func_def_regex = new RegExp(`${vhighlight.js.exclude_span}\\b(${vhighlight.js.func_def_keywords.join('\\s+|')}\\s+)*(\\s*[A-Za-z_][A-Za-z0-9_]+)(\\s*\\([^{]*{)`, 'gm');

// vhighlight.js.inside_class_func_def_regex = new RegExp(`${vhighlight.js.exclude_span}(${vhighlight.js.func_def_keywords.join('\\s+|')}\\s+)*(\\s*[A-Za-z_][A-Za-z0-9_]+)(\\s*\\([^{}"\`]*{)`, 'gm');
// vhighlight.js.inside_class_func_def_regex = new RegExp(`${vhighlight.js.exclude_span}(${vhighlight.js.func_def_keywords.join('\\s+|')}\\s+)*(\\s*[A-Za-z_][A-Za-z0-9_]+)(\\s*\\([^{}"'\/\`]+{)`, 'gm');
// vhighlight.js.inside_class_func_def_regex = new RegExp(`${vhighlight.js.exclude_span}(${vhighlight.js.func_def_keywords.join('\\s+|')}\\s+)*(\\s*[A-Za-z_][A-Za-z0-9_]+)(\\s*\\([^{}]*{)`, 'gm');
// vhighlight.js.inside_class_func_def_regex = new RegExp(`${vhighlight.js.exclude_span}(${vhighlight.js.func_def_keywords.join('\\s+|')}\\s+)*(\\s*[A-Za-z_][A-Za-z0-9_]+)(\\s*\\((?!{|})*{)`, 'gm');
// vhighlight.js.inside_class_func_def_regex = new RegExp(`${vhighlight.js.exclude_span}(${vhighlight.js.func_def_keywords.join('\\s+|')}\\s+)*(\\s*[A-Za-z_][A-Za-z0-9_]+)\\s*\\(([^{}]*)\\{`, 'gm');
// vhighlight.js.inside_class_func_def_regex = new RegExp(`${vhighlight.js.exclude_span}(${vhighlight.js.func_def_keywords.join('\\s+|')}\\s+)*(\\s*[A-Za-z_][A-Za-z0-9_]+)(\\s*\\([^{}<]*{)`, 'gm');

vhighlight.js.inside_class_func_def_regex = new RegExp(`${vhighlight.js.exclude_span}(^|${vhighlight.js.func_def_keywords.join('\\s+|')}\\s+)(\\s*[A-Za-z_][A-Za-z0-9_]+)(\\s*\\([^{}]*{)`, 'gm');






vhighlight.js.nameless_func_def_regex = new RegExp(`${vhighlight.js.exclude_span}\\b(function\\s*)(\\([^\\)]*\\))\\s*{`, 'gm');
vhighlight.js.nameless_func_def_regex_2 = new RegExp(`${vhighlight.js.exclude_span}\\b(function\\s*)(\\()`, 'gm');
// vhighlight.js.anonymous_func_def_regex = new RegExp(`${vhighlight.js.exclude_span}\\b(\\([^\\)]*\\)\\s*=>)\\s*{`, 'gm');
// vhighlight.js.anonymous_func_def_regex = new RegExp(`${vhighlight.js.exclude_span}\\b(\\([^\\)]*\\))\\s*=&gt;\\s*{`, 'gm');

vhighlight.js.anonymous_func_def_regex = new RegExp(`${vhighlight.js.exclude_span}(\\([^\\(\\)]*\\)\\s*=&gt;\\s*{)`, 'gm');


vhighlight.js.call_regex = new RegExp(`${vhighlight.js.exclude_span}\\b([A-Za-z0-9_]+)(\\s*\\()`, 'gm');

vhighlight.js.parentheses_regex = new RegExp(`${vhighlight.js.exclude_span}(\\b[A-Za-z0-9_]+\\s*\\()`, 'g');
vhighlight.js.parameter_regex = new RegExp(`${vhighlight.js.exclude_span}(^|,)(\\s*[A-Za-z0-9_]+\\b)(?=\\s*[=,$]*)`, 'gm');

// Highlight.
vhighlight.js.highlight = function(code, is_class = false, reformat = true) {

	// Replace < and >.
	// Need to be replaced again, they should also be replaced before assigning the initial pre data.
	// But because of the rendering they may need to be replaced again.
	if (reformat) {
		code = code.replaceAll("<", "&lt;");
		code = code.replaceAll(">", "&gt;");
	}

	// Pre argument regex replacements.
	if (!is_class) {
		code = code.replace(vhighlight.js.comment_regex, '<span class="token_comment">$&</span>');
		code = code.replace(vhighlight.js.string_regex, '<span class="token_string">$&</span>');
	}

	// Prototype type definition.
	code = code.replace(vhighlight.js.prototype_type_def_regex, '<span class="token_type_def">$1</span>$2'); // should be before nameless func def regex 2 and keyword regex.
	code = code.replace(vhighlight.js.anonymous_prototype_type_def_regex, '<span class="token_type_def">$1</span>$2'); // should be before nameless func def regex 2 and keyword regex.

	// Parameter replacements before class body highlighting.
	function replace_parameters(regex, replacement = null) {
		let match;
		while ((match = regex.exec(code)) !== null) {
			const head = vhighlight.utils.slice_parentheses(code, match.index);
			if (head != null) {
				code = vhighlight.utils.replace_by_index(code, head.start, head.end, head.data.replace(vhighlight.js.parameter_regex, "$1<span class='token_parameter'>$2</span>"));
				regex.lastIndex = head.end + 1;
			}
		}
	}
	replace_parameters(vhighlight.js.anonymous_func_def_regex);
	replace_parameters(vhighlight.js.nameless_func_def_regex, "<span class='token_keyword'>$1</span>$2");
	code = code.replace(vhighlight.js.nameless_func_def_regex_2, '<span class="token_keyword">$1</span>$2'); // to prevent function () from being highlighted as a type def.

	// Highlight class body, since functions inside a class may be declared without a function prefix.
	if (!is_class) {
		let match;
		const regex = vhighlight.js.type_def_body_regex;
		while ((match = regex.exec(code)) !== null) {
			const body = vhighlight.utils.slice_curly_brackets(code, match.index);
			if (body != null) {
				code = vhighlight.utils.replace_by_index(code, body.start, body.end, vhighlight.js.highlight(body.data, true, false));
				regex.lastIndex = body.end + 1;
			}
		}
	}

	// Replace parameters.
	if (is_class) {
		replace_parameters(vhighlight.js.inside_class_func_def_regex);
	} else {
		replace_parameters(vhighlight.js.outside_class_func_def_regex);
	}

	// Post argument regex replacements.
	code = code.replace(vhighlight.js.type_def_regex, '<span class="token_keyword">$1</span><span class="token_type_def">$2</span>$3'); // should be before keyword.
	if (is_class) {
		code = code.replace(vhighlight.js.inside_class_func_def_regex, '<span class="token_keyword">$1</span><span class="token_type_def">$2</span>$3'); // should be before keyword.
	} else {
		code = code.replace(vhighlight.js.outside_class_func_def_regex, '<span class="token_keyword">$1</span><span class="token_type_def">$2</span>$3'); // should be before keyword.
	}
	code = code.replace(vhighlight.js.keyword_regex, '<span class="token_keyword">$&</span>'); // should be before call regex.
	code = code.replace(vhighlight.js.call_regex, '<span class="token_type">$1</span>$2'); 
	code = code.replace(vhighlight.js.numeric_regex, '<span class="token_numeric">$&</span>');

	// Handler.
	return code;
}

