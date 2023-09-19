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
