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

// Slice template.
vhighlight.utils.slice_template = function(code, start_index, start_char, end_char, include = false) {
	let depth = 0;
	let start = -1;
	let end = -1;
	let sliced = "";
	let string_char = null;
	for (let index = start_index; index < code.length; index++) {
		if (string_char == null && (code[index] == '"' || code[index] == "'" || code[index] == '`')) {
			string_char = code[index];
		}
		else if (string_char != null && code[index] == string_char) {
			string_char = null;
		}
		else if (string_char == null) {
			if (code[index] == start_char) {
				if (depth == 0) {
					start = index;
				}
				++depth;
			} else if (code[index] == end_char) {
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
						"start": start,
						"end": end,
						"data": code.substr(start, end - start),
					}
				}
			}
		}
	}
	return null;
}

// Slice curly brackets.
vhighlight.utils.slice_curly_brackets = function(code, start_index, include = false) {
	return vhighlight.utils.slice_template(code, start_index, '{', '}', include);
}

// Slice curly parentheses.
vhighlight.utils.slice_parentheses = function(code, start_index, include = false) {
	return vhighlight.utils.slice_template(code, start_index, '(', ')', include);
}
