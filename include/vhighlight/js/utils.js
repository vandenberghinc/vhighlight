/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Utils.

vhighlight.utils = {};

// Replace start till end index with substr.
vhighlight.utils.replace_by_index = function(str, start, end, substr) {
	let replaced = str.substr(0, start);
	replaced += substr;
	replaced += str.substr(end, str.length - end);
	return replaced;
}

// Is escaped character at index.
// - Does not return true for escaped chars like \n it merely checks if
//   there is a \\ before the char, recursively.
// - So it is more for the code editor end, where a \n is actually always a \\n.
vhighlight.utils.is_escaped = function(code, index) {
	if (code.charAt(index - 1) == "\\") {
		if (code.charAt(index - 2) == "\\") {
			return vhighlight.utils.is_escaped(code, index - 2);
		}
		return true;
	}
	return false;
}

// Insert data from start till end with data.
vhighlight.utils.insert_str = function(str, start, insert) {
	let inserted = str.substr(0, start);
	inserted += insert;
	inserted += str.substr(start);
	return inserted;
}

// Operators.
// vhighlight.utils.operators = Array.from(new Set([
// 	// JavaScript Operators
// 	"+", "-", "*", "/", "%", "**", "=", "+=", "-=", "*=", "/=", "%=", "**=",
// 	"==", "!=", "===", "!==", ">", "<", ">=", "<=", "&&", "||", "!", "&", "|",
// 	"^", "~", "<<", ">>", ">>>", "++", "--", "?",

// 	// C++ Operators
// 	"&&", "||", "!", "==", "!=", ">", "<", ">=", "<=", "+", "-", "*", "/", "%",
// 	"=", "+=", "-=", "*=", "/=", "%=", "++", "--", "<<", ">>", "&", "|", "^", "~",
// 	"?",

// 	// Python Operators
// 	"==", "!=", "<", ">", "<=", ">=", "+", "-", "*", "/", "%", "**", "//", "&", "|",
// 	"^", "~", "<<", ">>", "and", "or", "not", "is", "in", "not in",

// 	// Java Operators
// 	"==", "!=", "<", ">", "<=", ">=", "+", "-", "*", "/", "%", "&&", "||", "!", "&", "|",
// 	"^", "~", "<<", ">>", ">>>", "instanceof", "instanceof",

// 	// C# Operators
// 	"==", "!=", "<", ">", "<=", ">=", "+", "-", "*", "/", "%", "&&", "||", "!", "&", "|",
// 	"^", "~", "<<", ">>", "==", "!=", "<=", ">=", "+=", "-=", "*=", "/=", "%=", "&=", "|=",
// 	"^=", "<<=", ">>=",

// 	// Ruby Operators
// 	"==", "!=", "<", ">", "<=", ">=", "+", "-", "*", "/", "%", "**", "&", "|", "^", "~",
// 	"<<", ">>", "&&", "||", "!", "and", "or", "not",

// 	// Swift Operators
// 	"==", "!=", "<", ">", "<=", ">=", "+", "-", "*", "/", "%", "&", "|", "^", "~",
// 	"<<", ">>", "&&", "||", "!", "is", "as", "in",

// 	// PHP Operators
// 	"==", "!=", "<", ">", "<=", ">=", "+", "-", "*", "/", "%", "&", "|", "^", "~",
// 	"<<", ">>", "&&", "||", "!", "===", "!==", "instanceof",

// 	// Go Operators
// 	"==", "!=", "<", ">", "<=", ">=", "+", "-", "*", "/", "%", "&", "|", "^", "~",
// 	"<<", ">>", "&&", "||", "!", "&^",
// ]));

// Build the html from tokens.
// - Every "{", "}" and "\n" character should be appended as a single token.
//   Otherwise foldable spans and newline spans will fail.
// - New lines will be added inside a span so you can iterate the html children from line till line.
// vhighlight.utils.build_tokens = function(tokens, options = {is_line: false, reformat: true}) {

// 	// Vars.
// 	let html = "";
// 	const is_line = options.is_line != false;
// 	const reformat = options.reformat != false;
	
// 	// Build token function.
// 	function build_token(token) {
// 		const type = token.token;
// 		if (reformat) {
// 			token.data = token.data.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
// 		}
// 		if (type == null) {
// 			html += token.data;
// 		} else if (type == "token_foldable") {
// 			if (token.data == "{") {
// 				html += `<span id='token_foldable_${token.line}' class='token_foldable'>{`;
// 			} else {
// 				html += "</span>}";
// 			}
// 		} else if (is_line == false || type != "token_line") {
// 			html += `<span class='${type}'>${token.data}</span>`
// 		}
// 	}
	
// 	// Check if the array has sub arrays with token objects, aka line tokens.
// 	if (Array.isArray(tokens[0])) {
// 		for (let x = 0; x < tokens.length; x++) {
// 			const arr = tokens[x];
// 			for (let y = 0; y < arr.length; y++) {
// 				build_token(arr[y]);
// 			}
// 		}
// 	}
	
// 	// Iterate an array with token objects.
// 	else {
// 		for (let i = 0; i < tokens.length; i++) {
// 			build_token(tokens[i]);
// 		}
// 	}
	
// 	// Handler.
// 	return html;
// }

// Word boundaries.
// vhighlight.utils.word_boundaries = [
//     ' ',
//     '\t',
//     '\n',
//     '\r',
//     '.',
//     ',',
//     '!',
//     '?',
//     ';',
//     ':',
//     '-',
//     // '_',
//     '/',
//     '\\',
//     '|',
//     '(',
//     ')',
//     '[',
//     ']',
//     '{',
//     '}',
//     '<',
//     '>',
//     '=',
//     '+',
//     '*',
//     '&',
//     '%',
//     '$',
//     '#',
//     '@',
//     '`',
//     '~',
//     '"',
//     "'",
//     '\u2019', // Right single quotation mark
//     '\u2018', // Left single quotation mark
//     '\u201d', // Right double quotation mark
//     '\u201c', // Left double quotation mark
// ];

// Iterate code function.
// The callback can take params (index, char, is_str, is_comment, is_multi_line_comment, is_regex, is_escaped).
// When the callback returns a non null value the iteration will stop and that value will be returned.
// vhighlight.utils.single_line_comment_start = {
// 	"python": "#",
// 	"js": "//",
// 	"cpp": "//",
// }
// vhighlight.utils.multi_line_comment_start = {
// 	"python": false,
// 	"js": "/*",
// 	"cpp": "/*",
// }
// vhighlight.utils.multi_line_comment_end = {
// 	"python": false,
// 	"js": "*/",
// 	"cpp": "*/",
// }
// vhighlight.utils.iterate_code = function({
// 	code = "",
// 	callback = null,
// 	start = 0,
// 	end = null,
// 	language = "cpp",
// }) {

// 	// Is escaped.
// 	function is_escaped_func(index) {
// 		if (code.charAt(index - 1) == "\\") {
// 			if (code.charAt(index - 2) == "\\") {
// 				return is_escaped_func(index - 2);
// 			}
// 			return true;
// 		}
// 		return false;
// 	}
	
// 	// Default end.
// 	if (end == null) {
// 		end = code.length;
// 	}

// 	// Iterate.
// 	let result = null;
// 	let is_comment = false;
// 	let is_multi_line_comment = false;
// 	let string_char = null;
// 	let is_regex = false; // only used for langauges that can define a regex as /hello/ such as js.
// 	for (let index = start; index < end; index++) {
// 		const char = code.charAt(index);
// 		const is_escaped = is_escaped_func(index);
		
// 		// Strings.
// 		if (
// 			!is_escaped &&
// 			!is_comment &&
// 			!is_multi_line_comment &&
// 			!is_regex &&
// 			string_char == null &&
// 			(char == '"' || char == "'" || char == '`')
// 		) {
// 			string_char = char;
// 			result = callback(index, char, true, is_comment, is_multi_line_comment, is_regex, is_escaped);
// 			if (result != null) {
// 				return result;
// 			}
// 			continue;
// 		}
// 		else if (
// 			!is_escaped &&
// 			string_char != null &&
// 			char == string_char
// 		) {
// 			string_char = null;
// 			result = callback(index, char, true, is_comment, is_multi_line_comment, is_regex, is_escaped);
// 			if (result != null) {
// 				return result;
// 			}
// 			continue;
// 		}
// 		else if (string_char != null) {
// 			result = callback(index, char, true, is_comment, is_multi_line_comment, is_regex, is_escaped);
// 			if (result != null) {
// 				return result;
// 			}
// 			continue;
// 		}
		
// 		// Open comments.
// 		if (
// 			!is_escaped &&
// 			!is_comment &&
// 			!is_multi_line_comment &&
// 			!is_regex
// 			// && string_char == null
// 		) {
		
// 			// Single line comments.
// 			const comment_start = vhighlight.utils.single_line_comment_start[language];
// 			if (comment_start == null) {
// 				console.error("Unsupported language \"", language, "\".");
// 			} else if (comment_start.length == 1 && char == comment_start) {
// 				is_comment = true;
// 				result = callback(index, char, false, is_comment, is_multi_line_comment, is_regex, is_escaped);
// 				if (result != null) {
// 					return result;
// 				}
// 				continue;
// 			} else if (comment_start.length == 2 && char + code.charAt(index + 1) == comment_start) {
// 				is_comment = true;
// 				result = callback(index, char, false, is_comment, is_multi_line_comment, is_regex, is_escaped);
// 				if (result != null) {
// 					return result;
// 				}
// 				continue;
// 			}
			
// 			// Multi line comments.
// 			const mcomment_start = vhighlight.utils.multi_line_comment_start[language];
// 			if (mcomment_start == null) {
// 				console.error("Unsupported language \"", language, "\".");
// 			} else if (mcomment_start == false) {
// 				// skip but do not use continue since the "No string or comment" should be checked.
// 			} else if (mcomment_start.length == 2 && char + code.charAt(index + 1) == mcomment_start) {
// 				is_multi_line_comment = true;
// 				result = callback(index, char, false, is_comment, is_multi_line_comment, is_regex, is_escaped);
// 				if (result != null) {
// 					return result;
// 				}
// 				continue;
// 			}
			
// 		}
		
// 		// End single line comments.
// 		else if (
// 			is_comment &&
// 			!is_escaped &&
// 			char == "\n"
// 		) {
// 			is_comment = false;
// 			result = callback(index, char, false, true, is_multi_line_comment, is_regex, is_escaped);
// 			if (result != null) {
// 				return result;
// 			}
// 			continue;
// 		}
		
// 		// End multi line comments.
// 		else if (
// 			is_multi_line_comment &&
// 			!is_escaped
// 		) {
// 			const mcomment_end = vhighlight.utils.multi_line_comment_end[language];
// 			if (mcomment_end.length == 2 && code.charAt(index - 1) + char == mcomment_end) {
// 				is_multi_line_comment = false;
// 				result = callback(index, char, false, is_comment, true, is_regex, is_escaped);
// 				if (result != null) {
// 					return result;
// 				}
// 				continue;
// 			}
// 		}
		
// 		// Inside comments.
// 		else if (is_comment || is_multi_line_comment) {
// 			result = callback(index, char, false, is_comment, is_multi_line_comment, is_regex, is_escaped);
// 			if (result != null) {
// 				return result;
// 			}
// 			continue;
// 		}
		
// 		// Statements should reuse the "if" not "else if" after the start of the comment check.
// 		// Since that does not always match in the first if statement.
// 		// End of comment checks can still use "else if".
		
// 		// Check the start of a regex definition "/hello/", must check the previous char.
// 		if (!is_escaped && !is_regex && char == "/" && language == "js") {
// 			let prev = null;
// 			for (let p = index - 1; p >= 0; p--) {
// 				const prev_char = code.charAt(p);
// 				if (prev_char != " " && prev_char != "\t") {
// 					prev = prev_char;
// 					break;
// 				}
// 			}
// 			if (
// 				prev != null &&
// 				(
// 					prev == "\n" || prev == "," || prev == "(" ||
// 					prev == "[" || prev == "{" || prev == ":" ||
// 					vhighlight.utils.operators.includes(prev)
// 				)
// 			) {
// 				is_regex = true;
// 				result = callback(index, char, false, is_comment, is_multi_line_comment, is_regex, is_escaped);
// 				if (result != null) {
// 					return result;
// 				}
// 				continue;
// 			}
// 		}
		
// 		// Inside / end of regex.
// 		else if (is_regex) {
// 			if (char == '/' && !is_escaped) {
// 				is_regex = false;
// 			}
// 			result = callback(index, char, false, is_comment, is_multi_line_comment, true, is_escaped); // always use true for is_regex to make sure the closing / is still treated as a regex.
// 			if (result != null) {
// 				return result;
// 			}
// 			continue;
// 		}
		
// 		// Statements should reuse the "if" not "else if" after the start of the regex check.
// 		// Since that does not always match in the first if statement.
// 		// End of regex checks can still use "else if".
		
// 		// No string, comment or regex.
// 		result = callback(index, char, false, is_comment, is_multi_line_comment, is_regex, is_escaped);
// 		if (result != null) {
// 			return result;
// 		}
		
// 	}
// 	return null;
// };

/*
// Slice template.
vhighlight.utils.slice_template = function(
	code,
	start_index,
	start_char,
	end_char,
	include = false,
	language = "cpp"
) {
	let depth = 0;
	let start = -1;
	let end = -1;
	return vhighlight.utils.iterate_code({
		code: code,
		start: start_index,
		language: language,
		callback: (
			index,
			char,
			is_str,
			is_comment,
			is_multi_line_comment,
		) => {
			if (!is_str && !is_comment && !is_multi_line_comment) {
				if (char == start_char) {
					if (depth == 0) {
						start = index;
					}
					++depth;
				} else if (char == end_char) {
					--depth;
					if (depth == 0) {
						if (include) {
							end = index + 1;
						} else {
							end = index;
							++start;
						}
						if (start == end) { return null; }
						return {
							start: start,
							end: end,
							data: code.substr(start, end - start),
						}
					}
				}
			}
		}
	});
	
	
	// let depth = 0;
	// let start = -1;
	// let end = -1;
	// let sliced = "";
	// let is_comment = false;
	// let is_multi_line_comment = false;
	// let string_char = null;
	// for (let index = start_index; index < code.length; index++) {
	// 	const char = code.charAt(index);
	// 	const is_escaped = vhighlight.utils.is_escaped(code, index);
		
	// 	// Strings.
	// 	if (
	// 		!is_escaped &&
	// 		!is_comment &&
	// 		!is_multi_line_comment &&
	// 		string_char == null &&
	// 		(char == '"' || char == "'" || char == '`')
	// 	) {
	// 		string_char = char;
	// 		continue;
	// 	}
	// 	else if (
	// 		!is_escaped &&
	// 		!is_comment &&
	// 		!is_multi_line_comment &&
	// 		string_char != null &&
	// 		char == string_char
	// 	) {
	// 		string_char = null;
	// 		continue;
	// 	}
	// 	else if (string_char != null) {
	// 		continue;
	// 	}
		
	// 	// Open comments.
	// 	if (
	// 		!is_escaped &&
	// 		!is_comment &&
	// 		!is_multi_line_comment &&
	// 		string_char == null
	// 	) {
		
	// 		// Single line comments.
	// 		const comment_start = vhighlight.utils.single_line_comment_start[language];
	// 		if (comment_start == null) {
	// 			console.error("Unsupported language \"", language, "\".");
	// 		} else if (comment_start.length == 1 && char == comment_start) {
	// 			is_comment = true;
	// 			continue;
	// 		} else if (comment_start.length == 2 && char + code[index + 1] == comment_start) {
	// 			is_comment = true;
	// 			continue;
	// 		}
			
	// 		// Multi line comments.
	// 		const mcomment_start = vhighlight.utils.multi_line_comment_start[language];
	// 		if (mcomment_start == null) {
	// 			console.error("Unsupported language \"", language, "\".");
	// 		} else if (mcomment_start == false) {
	// 			// skip but do not use continue since the "No string or comment" should be checked.
	// 		} else if (mcomment_start.length == 2 && char + code[index + 1] == mcomment_start) {
	// 			is_multi_line_comment = true;
	// 			continue;
	// 		}
			
	// 	}
		
	// 	// End single line comments.
	// 	else if (
	// 		is_comment &&
	// 		!is_escaped &&
	// 		char == "\n"
	// 	) {
	// 		is_comment = false;
	// 		continue;
	// 	}
		
	// 	// End multi line comments.
	// 	else if (
	// 		is_multi_line_comment &&
	// 		!is_escaped
	// 	) {
	// 		const mcomment_end = vhighlight.utils.multi_line_comment_end[language];
	// 		if (mcomment_end.length == 2 && code[index - 1] + char == mcomment_end) {
	// 			is_multi_line_comment = false;
	// 			continue;
	// 		}
	// 	}
		
	// 	// Skip when comment.
	// 	else if (is_comment || is_multi_line_comment) {
	// 		continue;
	// 	}
		
	// 	// No string or comment.
	// 	if (!is_comment && !is_multi_line_comment && string_char == null) {
	// 		if (char == start_char) {
	// 			if (depth == 0) {
	// 				start = index;
	// 			}
	// 			++depth;
	// 		} else if (char == end_char) {
	// 			--depth;
	// 			if (depth == 0) {
	// 				if (include) {
	// 					end = index + 1;
	// 				} else {
	// 					end = index;
	// 					++start;
	// 				}
	// 				if (start == end) { return null; }
	// 				return {
	// 					start: start,
	// 					end: end,
	// 					data: code.substr(start, end - start),
	// 				}
	// 			}
	// 		}
	// 	}
	// }
	// return null;
}
// Slice curly brackets.
vhighlight.utils.slice_curly_brackets = function({code, start_index, include = false, language = "cpp"}) {
	return vhighlight.utils.slice_template(code, start_index, '{', '}', include, language);
}
// Slice curly parentheses.
vhighlight.utils.slice_parentheses = function({code, start_index, include = false, language = "cpp"}) {
	return vhighlight.utils.slice_template(code, start_index, '(', ')', include, language);
}
*/