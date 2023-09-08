/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Python highlighter.

vhighlight.json = {};

// The tokenizer options.
vhighlight.json.tokenizer_opts = {
	keywords: [
		"true",
		"false",
		"null",
	],
	single_line_comment_start: "//",
	multi_line_comment_start: "/*",
	multi_line_comment_end: "*/",
}

// Highlight.
vhighlight.json.highlight = function(code, return_tokens = false) {

	// Initialize the tokenizer.
	const tokenizer = new Tokenizer(vhighlight.json.tokenizer_opts);

	// Assign the code.
	tokenizer.code = code;

	// Tokenize.
	return tokenizer.tokenize(return_tokens);
}
























/* Regex based highlighting, way too slow.

// ---------------------------------------------------------
// Javascript highlighter.

vhighlight.json = {};

// Keywords.
vhighlight.json.keywords = [
	"true",
	"false",
	"null",
];

// Regexes helpers.
vhighlight.json.exclude_span = "(?!(?:[^<]|<(?!/?span[^>]*>))*?<\\/span>)"; // exclude contents inside a "<span>HERE</span>"
vhighlight.json.html_open = "(?<!<[^>]*)"; // exclude inside a opening < html tag.
vhighlight.json.html_close = "(?![^<]*>)"; // exclude inside a closing > html tag.

// Regexes.
vhighlight.json.comment_regex = /(\/\/.*|\/\*[\s\S]*?\*\/)(?!\S)/g;
vhighlight.json.string_regex = new RegExp(`(${vhighlight.json.exclude_span}${vhighlight.json.html_open})(['"\`/]{1})(.*?)\\2${vhighlight.json.html_close}`, 'gms');
vhighlight.json.numeric_regex = new RegExp(`${vhighlight.json.exclude_span}\\b-?\\d+(?:\\.\\d+)?\\b`, 'g');
vhighlight.json.keyword_regex = new RegExp(`${vhighlight.json.exclude_span}\\b(${vhighlight.json.keywords.join('|')})\\b`, 'gm');

// Highlight.
vhighlight.json.highlight = function(code) {

	// Replace < and >.
	// Need to be replaced again, they should also be replaced before assigning the initial pre data.
	// But because of the rendering they may need to be replaced again.
	code = code.replaceAll("<", "&lt;");
	code = code.replaceAll(">", "&gt;");

	// Regex replacements.
	code = code.replace(vhighlight.json.comment_regex, '<span class="token_comment">$&</span>');
	code = code.replace(vhighlight.json.string_regex, '<span class="token_string">$&</span>');
	code = code.replace(vhighlight.json.keyword_regex, '<span class="token_keyword">$&</span>'); // should be before call regex.
	code = code.replace(vhighlight.json.numeric_regex, '<span class="token_numeric">$&</span>');

	// Handler.
	return code;
}

*/