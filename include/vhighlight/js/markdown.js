/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Markdown highlighter.

vhighlight.md = {};
	
// supported codeblock languages.
vhighlight.md.codeblock_languages = [
	"cpp",
	"md",
];

// Regexes helpers.
vhighlight.md.exclude_span = "(?!(?:[^<]|<(?!/?span[^>]*>))*?<\\/span>)"; // exclude contents inside a "<span>HERE</span>"

// Regexes.
// vhighlight.md.heading_regex =  /^\s*(#{1,6})(\s*.*)/gm;
vhighlight.md.heading_regex = new RegExp(`${vhighlight.md.exclude_span}(^\\s*#{1,6}\\s*)(.*)(\\n|$)`, 'gm');
vhighlight.md.bold_regex = new RegExp(`${vhighlight.md.exclude_span}(^|\\s)(\\*|_)(\\*|_)(.*?)(\\*|_)(\\*|_)`, "gm");
vhighlight.md.italic_regex = new RegExp(`${vhighlight.md.exclude_span}(^|\\s)([*_])(.*?)\\2(\\s|$)`, "gm");
vhighlight.md.ul_regex = new RegExp(`${vhighlight.md.exclude_span}^(\\s*[-+*]\\s*)(.*)`, "gm");
vhighlight.md.ol_regex = new RegExp(`${vhighlight.md.exclude_span}^(\\s*\\d+)(.+)$`, "gm");
vhighlight.md.link_regex = new RegExp(`${vhighlight.md.exclude_span}\\[([^\\]]+)\\]\\(([^\\)]+)\\)`, "gm");
vhighlight.md.image_regex = new RegExp(`${vhighlight.md.exclude_span}!\\[([^\\]]+)\\]\\(([^\\)]+)\\)`, "gm");
// vhighlight.md.codeline_regex = new RegExp(`${vhighlight.md.exclude_span}\`(.*?)\``, "gm");
vhighlight.md.codeline_regex = /(?<!`)(`{1})([^`]*?)\1(?!`)/gm;
vhighlight.md.codeblock_regex = new RegExp(`${vhighlight.md.exclude_span}\`\`\`((?:${vhighlight.md.codeblock_languages.join('|')})*)([^\`]*)\`\`\``, "gm");

// Highlight.
vhighlight.md.highlight = function(code) {

	// Replace < and >.
	// Need to be replaced again, they should also be replaced before assigning the initial pre data.
	// But because of the rendering they may need to be replaced again.
	code = code.replaceAll("<", "&lt;");
	code = code.replaceAll(">", "&gt;");

	// Regex replacements.
	code = code.replace(vhighlight.md.heading_regex, '<span class="token_preprocessor">$1</span><b>$2</b>$3');
	code = code.replace(vhighlight.md.bold_regex, '<span class="token_bold">$&</span>'); // should be before italic regex.
	code = code.replace(vhighlight.md.italic_regex, '<span class="token_italic">$&</span>'); // should be before ul and ol regex.
	code = code.replace(vhighlight.md.ul_regex, '<span class="token_preprocessor">$1</span>$2');
	code = code.replace(vhighlight.md.ol_regex, '<span class="token_preprocessor">$1</span>$2');
	code = code.replace(vhighlight.md.image_regex, '<span class="token_string">!</span><span class="token_preprocessor">[</span><span class="token_string">$1</span><span class="token_preprocessor">]</span><span class="token_string">($2)</span>'); // should be before link regex.
	code = code.replace(vhighlight.md.link_regex, '<span class="token_preprocessor">[</span><span class="token_string">$1</span><span class="token_preprocessor">]</span><span class="token_string">($2)</span>');
	code = code.replace(vhighlight.md.codeblock_regex, (match, m1, m2) => { // should be last but before codeline regex.
		if (m1 == "") {
			return `<div class='token_codeblock'>\`\`\`${m2}\`\`\`</div>`
		} else if (m1 == "cpp") {
			return `<div class='token_codeblock'>\`\`\`${m1}${cpp.highlight(m2)}\`\`\`</div>`
		} else {
			return `<div class='token_codeblock'>\`\`\`${m1}${m2}\`\`\`</div>`
		}
	});
	code = code.replace(vhighlight.md.codeline_regex, '<span class="token_codeline">$&</span>'); // should be last.

	// Handler.
	return code;
}
