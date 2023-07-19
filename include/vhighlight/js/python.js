/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Python highlighter.

vhighlight.python = {};

// Keywords.
vhighlight.python.keywords = [
	"and",
	"as",
	"assert",
	"break",
	"class",
	"continue",
	"def",
	"del",
	"elif",
	"else",
	"except",
	"finally",
	"for",
	"from",
	"global",
	"if",
	"import",
	"in",
	"is",
	"lambda",
	"not",
	"or",
	"pass",
	"raise",
	"return",
	"try",
	"while",
	"with",
	"yield",
	"self",
	"True",
	"False",
	"None",
];

// Regexes helpers.
vhighlight.python.exclude_span = "(?!(?:[^<]|<(?!/?span[^>]*>))*?<\\/span>)"; // exclude contents inside a "<span>HERE</span>"

// Regexes.
vhighlight.python.comment_regex = new RegExp(`${vhighlight.python.exclude_span}^(\\s*#.*)`, 'gm');


vhighlight.python.keyword_regex = new RegExp(`${vhighlight.python.exclude_span}\\b(${vhighlight.python.keywords.join('|')})\\b`, 'gm');
vhighlight.python.multi_line_string_regex = new RegExp(`(${vhighlight.python.exclude_span})(['"]{3})(.*?)\\2`, 'gms');
vhighlight.python.string_regex = new RegExp(`(${vhighlight.python.exclude_span})(['"]{1})(.*?)\\2`, 'gms');
vhighlight.python.numeric_regex = new RegExp(`${vhighlight.python.exclude_span}\\b(\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)\\b`, 'gm');
vhighlight.python.type_def_regex = new RegExp(`${vhighlight.python.exclude_span}\\b(def|class|lambda)(\\s+[A-Za-z_][A-Za-z0-9_]*)(\\s*\\()`, 'gm');
vhighlight.python.call_regex = new RegExp(`${vhighlight.python.exclude_span}\\b([A-Za-z0-9_]+)(\\()`, 'gm');
vhighlight.python.call_parentheses_regex = new RegExp(`${vhighlight.python.exclude_span}(\\b[A-Za-z0-9_]+\\s*\\()`, 'g');
vhighlight.python.def_parentheses_regex = new RegExp(`${vhighlight.python.exclude_span}(\\s*\\bdef\\s+[A-Za-z0-9_]+\\s*\\()`, 'g');
vhighlight.python.call_parameter_regex = new RegExp(`${vhighlight.python.exclude_span}(^|,)(\\s*[A-Za-z0-9_]+\\b)(?=\\s*[=$])`, 'gm');
vhighlight.python.def_parameter_regex = new RegExp(`${vhighlight.python.exclude_span}(^|,)(\\s*[A-Za-z0-9_]+\\b)(?=\\s*[=,$])`, 'gm');

// Highlight.
vhighlight.python.highlight = function(code) {

	// Replace < and >.
	// Need to be replaced again, they should also be replaced before assigning the initial pre data.
	// But because of the rendering they may need to be replaced again.
	code = code.replaceAll("<", "&lt;");
	code = code.replaceAll(">", "&gt;");

	// Pre argument regex replacements.
	code = code.replace(vhighlight.python.comment_regex, '<span class="token_comment">$&</span>');
	code = code.replace(vhighlight.python.multi_line_string_regex, '<span class="token_string">$&</span>'); // must be before type def, keyword and string regex.
	code = code.replace(vhighlight.python.string_regex, '<span class="token_string">$&</span>');

	// Replace function args.
	// Should be before call and typedef regex.
	function replace_parameter_names(func_regex, replace_regex, replace_with) {
		let match;
		const regex = func_regex;
		while ((match = regex.exec(code)) !== null) {
			let result = vhighlight.utils.slice_parentheses(code, match.index, false);
			if (result != null) {
				code = vhighlight.utils.replace_by_index(code, result.start, result.end, result.data.replace(replace_regex, replace_with));
				regex.lastIndex = result.start + 1;
			}
		}
	}
	replace_parameter_names(vhighlight.python.call_parentheses_regex, vhighlight.python.call_parameter_regex, "$1<span class='token_parameter'>$2</span>");
	replace_parameter_names(vhighlight.python.def_parentheses_regex, vhighlight.python.def_parameter_regex, "$1<span class='token_parameter'>$2</span>");

	// Post argument regex replacements.
	code = code.replace(vhighlight.python.type_def_regex, '<span class="token_keyword">$1</span><span class="token_type_def">$2</span>$3'); // should be before keyword and type regex.
	code = code.replace(vhighlight.python.call_regex, '<span class="token_type">$1</span>$2'); // should be before keyword regex.
	code = code.replace(vhighlight.python.keyword_regex, '<span class="token_keyword">$&</span>');
	code = code.replace(vhighlight.python.numeric_regex, '<span class="token_numeric">$&</span>');

	// Handler.
	return code;
}
