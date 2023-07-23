/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// Header.
#ifndef VHIGHLIGHT_CPP_H
#define VHIGHLIGHT_CPP_H

// namespace vhighlight.
namespace vhighlight {

// C++ syntax highlighter.
struct cpp {
	
// Private.
private:
	
	// ---------------------------------------------------------
	// Static attributes.
	
	// Keywords.
	static inline const Array<String> keywords = {
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
	};
	
	// Type keywords.
	static inline const Array<String> type_keywords = {	// pre type keywords.
		"const",
		"volatile",
		"mutable",
		"constexpr",
	};
	
	// Type definition keywords.
	static inline const Array<String> typedef_keywords = {	// type definition keywords.
        "namespace",
		"struct",
		"class",
		"enum",
	};
	
	// ---------------------------------------------------------
	// Private functions.
	
	// Highlight block.
	SICE
	void 	highlight_block(Code& highlighted, const Code& block) {
		
		// Vars.
		bool allow_types = true; // allow types at the start of a block.
		bool next_is_type = false; // everything next is a type except special chars like = etc. Only used for keyword "using".
		// bool allow_func_definitions = true; // allow function definitions.
		bool is_str = false;
		bool is_preprocessor = false;
		bool is_template = false;
		bool is_template_keyword = false;
		bool is_requires_clause = false;
		int parentheses_depth = 0;
		Code batch;
		Code prev_batch; // previous batch, exluding " \t\n".
		
		// Funcs.
		auto append_batch = [&](const bool& highlight = true) {
			if (highlight) {
				Code lbatch = batch.replace_start(" \n").replace_end_r(" ");
				
				// Keyword.
				if (keywords.contains(lbatch)) {
					highlighted.concat_r("<span class='token_keyword'>");
					highlighted.concat_r(batch);
					highlighted.concat_r("</span>");
					if (lbatch == "template") {
						is_template_keyword = true;
					} else if (lbatch == "requires") {
						is_requires_clause = true;
					} else if (lbatch == "using") {
						next_is_type = true;
					}
				}
					
				// Type inside template.
				else if (batch.is_defined() && is_template && !is_template_keyword && !is_requires_clause && batch.find_first(":") == NPos::npos) {
					highlighted.concat_r("<span class='token_type'>");
					highlighted.concat_r(batch);
					highlighted.concat_r("</span>");
				}
					
				// Typdef keyword by previous batch.
				else if (!next_is_type && typedef_keywords.contains(prev_batch)) {
					highlighted.concat_r("<span class='token_type_def'>");
					highlighted.concat_r(batch);
					highlighted.concat_r("</span>");
				}
					
				// Double colon on previous batch so type or function.
				else if (prev_batch == "::") {
					highlighted.concat_r("<span class='token_type'>");
					highlighted.concat_r(batch);
					highlighted.concat_r("</span>");
				}
					
				// All else.
				else if (batch.len() > 0 && batch != ' ' && batch != '\t' && batch != '\n' && batch != '.' && batch.remove(' ') != "...") {
					
					// Check numeric.
					bool is_numeric = false;
					for (auto& i: batch) {
						switch (i) {
						case ' ':
						case '\t':
						case '\n':
						case '.':
						case '0':
						case '1':
						case '2':
						case '3':
						case '4':
						case '5':
						case '6':
						case '7':
						case '8':
						case '9':
							is_numeric = true;
							continue;
						default:
							is_numeric = false;
							break;
						}
						break;
					}
					if (is_numeric) {
						highlighted.concat_r("<span class='token_numeric'>");
						highlighted.concat_r(batch);
						highlighted.concat_r("</span>");
					}
					
					// Type.
					else if (next_is_type) {
						highlighted.concat_r("<span class='token_type'>");
						highlighted.concat_r(batch);
						highlighted.concat_r("</span>");
					}
					
					// Regular.
					else {
						highlighted.concat_r(batch);
					}
					
				// Regular.
				} else {
					highlighted.concat_r(batch);
				}
				
			// Do not highlight.
			} else {
				highlighted.concat_r(batch);
			}
			
			// Set previous batch.
			if (batch.is_defined() && batch != ' ' && batch != '\t' && batch != '\n') {
				prev_batch = batch;
			}
			
			// Reset batch.
			batch.reset();
			
		};
		
		// Add comment since these are seperate blocks.
		if (
			block.len() >= 2 &&
			(
				(block.get(0) == '/' && block.get(1) == '/') ||
				(block.get(0) == '/' && block.get(1) == '*')
			)
		) {
			highlighted.concat_r("<span class='token_comment'>");
			highlighted.concat_r(block);
			highlighted.concat_r("</span>");
		}
		
		// Iterate.
		else {
			for (auto& i: block.iterate()) {
				const char& c = i.character();
				
				// String / char.
				bool do_switch = false;
				if (!is_str && (i.is_str() || i.is_char() || (is_preprocessor && c == '<'))) {
					append_batch();
					highlighted.concat_r("<span class='token_string'>");
					if (c == '<') {
						batch.concat_r("&lt;");
					} else {
						batch.append(i.character());
					}
					is_str = true;
				}
				else if (
					is_str &&
					(
						(!is_preprocessor && !i.is_str() && !i.is_char()) ||
						(is_preprocessor && i.template_depth() == 0)
					)
				) {
					if ((is_preprocessor && i.template_depth() == 0)) {
						if (c == '>') {
							batch.concat_r("&gt;");
						} else {
							batch.append(i.character());
						}
					}
					append_batch(false);
					highlighted.concat_r("</span>");
					is_str = false;
					if (!(is_preprocessor && i.template_depth() == 0)) {
						do_switch = true;
					}
				}
				
				// Append when string or comment.
				else if (is_str) {
					switch (c) {
					case '&':
						batch.concat_r("&amp;");
						break;
					case '<':
						batch.concat_r("&lt;");
						break;
					case '>':
						batch.concat_r("&gt;");
						break;
					default:
						batch.append(c);
						break;
					}
				}
				else {
					do_switch = true;
				}
				
				// Code.
				if (do_switch) {
				
					switch (c) {
						
					// Preprocessor.
					case '#': {
						append_batch();
						batch.append(i.character());
						is_preprocessor = true;
						break;
					}
						
					// Newline delimiter.
					case '\n': {
						append_batch();
						batch.append(i.character());
						append_batch();
						is_preprocessor = false;
						break;
					}
					
					// Colon delimiter.
					case ':': {
						if (i.next() == ':') {
							highlighted.concat_r("<span class='token_type'>");
							append_batch(false);
							highlighted.concat_r("</span>");
							batch.append(c);
						
						// Make sure double colon is appended as one batch so append_batch ...
						// Can recognize type token after a double colon.
						} else if (batch == ':') {
							batch.append(c);
							append_batch(false);
						} else {
							append_batch();
							batch.append(c);
							append_batch(false);
						}
						break;
					}
						
					// Semicolon delimiter.
					case ';': {
						append_batch();
						batch.append(c);
						append_batch(false);
						next_is_type = false;
						break;
					}
						
					// Comma delimiter.
					case ',': {
						if (
							i.template_depth() != 0 ||
							i.parentheses_depth() != 0 ||
							i.brackets_depth() != 0 ||
							i.curly_brackets_depth() != 0
						) {
							allow_types = true;
						}
						append_batch();
						batch.append(c);
						append_batch(false);
						break;
					}
						
					// Other delimiters.
					// case '.': // not possible with packed types.
					case '[':
					case ']':
					case '{':
					case '}':
					case '+':
					case '-':
					// case '*': // not possible with pointer types.
					case '/':
					case '^':
					case '%':
					case '!':
					case '=': {
						append_batch();
						batch.append(c);
						append_batch(false);
						break;
					}
						
					// parentheses.
					case '(': {
						if (batch.is_defined() && batch != ' ' && batch != '\n' && batch != '\t') {
							String token;
							Code removed_space_start_end_batch = batch.replace_end(" ").replace_start_r(" ");
							
							// Type defition aka func or struct etc definition.
							if (i.parentheses_depth() == 1 && block.last() == '{') {
								if (block.len() < 2 || block.rget(2) != '(') { // exclude { within parentheses for calls like "Server server ({...});"
									token = "token_type_def";
								}
							}
								
							// Check constructor or type.
							else if (batch.find('.') == NPos::npos && block.last() == ';') {
								
								// Just always use token type when func def is allowed.
								// For exaple with undefined functions ending with ;.
								// Since ending with { is already matched.
								// if (allow_func_definitions) {
									token = "token_type";
								// }
								
								// Check if the type is indeed a type.
								// Or theA~Q construction of an object for example.
								/*
								else {
									Code lblock = block.slice(0, i.index - batch.len()); // get code till the current index.
									lblock.replace_end_r(" \t");
									
									// Undefined.
									if (lblock.is_undefined() || lblock == '\n') {
										token = "token_type";
									}
									
									// Operators.
									else if (String("=+-*^%/|.:").contains(lblock.last())) {
										token = "token_type";
									} else if (
										lblock.len() >= 2 &&
										lblock.rget(1) == '>' &&
										lblock.rget(2) == '>'
									) {
										token = "token_type";
									} else if (
										lblock.len() >= 2 &&
										lblock.rget(1) == '<' &&
										lblock.rget(2) == '<'
									) {
										token = "token_type";
										
									// New operator.
									} else if (
										lblock.len() >= 4 &&
										lblock.rget(1) == 'w' &&
										lblock.rget(2) == 'e' &&
										lblock.rget(3) == 'n' &&
										(
											lblock.rget(4) == ' ' ||
											lblock.rget(4) == '\t' ||
											lblock.rget(4) == '='
										)
									) {
										token = "token_type";
									}
								}
								*/
							}
								
							// Is always a type except when the current batch matches certain special characters.
							else if (removed_space_start_end_batch != "&&" &&
									 removed_space_start_end_batch != '&' &&
									 removed_space_start_end_batch != "||" &&
									 removed_space_start_end_batch != '|'
							) {
								token = "token_type";
							}
							
							// Check if dot in batch, colon is already matched by case.
							ullong pos = batch.find<Backwards>('.');
							if (pos != NPos::npos) {
								Code lbatch = batch.slice(0, pos + 1);
								highlighted.concat_r(lbatch);
								batch.slice_r(pos + 1);
							}
							
							// Append batch.
							if (token.is_defined()) {
								highlighted.concat_r("<span class='");
								highlighted.concat_r(token);
								highlighted.concat_r("'>");
							}
							append_batch(false);
							if (token.is_defined()) {
								highlighted.concat_r("</span>");
							}
							
						} else {
							append_batch(false);
						}
						++parentheses_depth;
						batch.append(c);
						append_batch();
						allow_types = true;
						break;
					}
					case ')': {
						append_batch();
						--parentheses_depth;
						if (parentheses_depth == 0) {
							is_requires_clause = false; // reset requires clause.
						}
						batch.append(c);
						append_batch();
						break;
					}
						
					// Greater and lower then.
					case '<':
						is_template = i.next() != c && i.prev() != c && block.find('>', i.index + 1) != NPos::npos;
						if (is_template && !is_template_keyword) {
							highlighted.concat_r("<span class='token_type'>");
							append_batch(false);
							highlighted.concat_r("</span>");
						} else {
							append_batch();
						}
						batch.concat_r("&lt;");
						append_batch(false);
						if (is_template) {
							allow_types = true;
						}
						break;
					case '>':
						append_batch();
						is_template = false;
						if (is_template_keyword && i.next() != c && i.prev() != c) {
							allow_types = true;
						}
						is_template_keyword = false;
						batch.concat_r("&gt;");
						append_batch();
						break;
						
					// And.
					// case '&':
					// 	// batch.concat_r("&amp;");
					// 	break;
						
					// Space delimiter.
					case ' ': {
						Code no_processor_and_inside_parentheses_check = block.slice(i.index).replace_start_r(" \t");
						
						// Add keyword.
						if (keywords.contains(batch)) {
							append_batch();
							batch.append(c);
							append_batch(false);
						}
						
						// No preprocessor and inside parentheses.
						else if (!is_preprocessor && no_processor_and_inside_parentheses_check.len() > 0 && no_processor_and_inside_parentheses_check.first() == '(') {
							batch.append(c);
						}
						
						// Preprocessor.
						else if (is_preprocessor) {
							highlighted.concat_r("<span class='token_keyword'>");
							batch.append(c);
							append_batch(false);
							highlighted.concat_r("</span>");
							allow_types = false;
						}
						
						// Allow types.
						else if (batch.is_defined() && batch != ' ' && batch != '\n' && batch != '\t' && allow_types) {
							Code no_name_check_block = block.slice(i.index + 1).replace_start_r(" \t");
							
							// Simply add certain batches without highlighting.
							if (batch == '&' || batch == '|' || batch == "&&" || batch == "||") {
								append_batch(false);
							}
							
							// Check if the code has no name after it and no { in case of constructor and no ( in case of func call.
							// Because then it is just code.
							else if (
								no_name_check_block.len() > 0 &&
								no_name_check_block.first() != '{' && // constructor by {
								no_name_check_block.first() != '(' && // func call by (
								!String(vlib::random::alphabet).contains(no_name_check_block.first()) && // no name.
								!String(vlib::random::alphabet_uppercase).contains(no_name_check_block.first()) // no name.
							) {
								batch.append(c);
								append_batch();
							}
							else {
							
								// Check keyword or type.
								Code lbatch = batch.replace_start(" \n").replace_end_r(" ");
								Code batch_post;
								ullong pos = batch.find_first("&*.");
								
								// Remove special chars for keyword recognition.
								if (pos != NPos::npos) {
									batch_post = batch.slice(pos);
									batch.slice_r(0, pos);
									lbatch.slice_r(0, lbatch.find_first("&*."));
								}
								
								// Type keyword.
								if (type_keywords.contains(lbatch)) {
									highlighted.concat_r("<span class='token_keyword'>");
									append_batch(false);
									highlighted.concat_r("</span>");
								}
								
								// Other keyword.
								else if (keywords.contains(lbatch)) {
									highlighted.concat_r("<span class='token_keyword'>");
									append_batch(false);
									highlighted.concat_r("</span>");
									allow_types = false;
									if (lbatch == "template") {
										is_template_keyword = true;
									}
								}
								
								// Type definition.
								else if (!next_is_type && typedef_keywords.contains(prev_batch)) {
									highlighted.concat_r("<span class='token_type_def'>");
									append_batch(false);
									highlighted.concat_r("</span>");
									allow_types = false;
								}
								
								// Type.
								else {
									highlighted.concat_r("<span class='token_type'>");
									append_batch(false);
									highlighted.concat_r("</span>");
									allow_types = false;
								}
								
								// Concat sliced post.
								if (batch_post.is_defined()) {
									highlighted.concat_r(batch_post);
								}
								
								// Add to new batch.
								batch.append(c);
								
							}
						}
						
						// Append normal code batch.
						else {
							batch.append(c);
							append_batch();
						}
						break;
					}
						
					// Append.
					default:
						batch.append(c);
						break;
					}
				}
			}
		}
		append_batch();
		
	}
	
// Public.
public:
	
	// ---------------------------------------------------------
	// Public functions.
	
	// Parse code into seperate blocks.
	SICE
	Code 	highlight(const Code& code) {
		Code cleaned = code;
		
		// Replacements.
		// cleaned.replace_r('\t', ' ');
		cleaned.replace_r("\t", "    ");
		
		// Vars.
		Code batch;
		Array<Code> blocks;
		bool is_preprocessor = false;
		bool is_comment = false;
		
		// Iterate.
		for (auto& i: cleaned.iterate()) {
			
			// Vars.
			const char& c = i.character();
			const bool& is_code = i.is_code();

			// New comment statement.
			if (!is_comment && i.is_comment()) {
				blocks.append(batch);
				batch.reset();
				is_comment = true;
				batch.append(c);
			}
			
			// End of comment.
			else if (is_comment && !i.is_comment()) {
				blocks.append(batch);
				batch.reset();
				is_comment = false;
				batch.append(c);
			}
			
			// New preprocessor statement.
			else if (is_code && c == '#') {
				is_preprocessor = true;
				batch.append(c);
			}
			
			// End of preprocessor.
			else if (is_code && is_preprocessor && c == '\n') {
				is_preprocessor = false;
				batch.append(c);
				blocks.append(batch);
				batch.reset();
			}
			
			// End of statement.
			else if (
				is_code &&
				i.parentheses_depth() == 0 &&
				(c == '{' ||
				 c == '}' ||
				 c == ';')
			) {
				batch.append(c);
				blocks.append(batch);
				batch.reset();
			}
			
			// Append to batch.
			else { batch.append(c); }

		}
		if (batch.is_defined()) { // add last batch.
			blocks.append(batch);
			batch.reset();
		}
		
		// Highlight.
		Code highlighted;
		for (auto& i: blocks) {
			highlight_block(highlighted, i);
		}
		return highlighted;
		
	}
	
	// Highlight type.
	// The full code block must be a type e.g. "const int&" or "Code".
	SICE
	Code 	highlight_type(const Code& block) {
		
		// Vars.
		Code highlighted;
		Code batch;
		
		// Funcs.
		auto append_batch = [&](bool highlight = true) {
			if (highlight && keywords.contains(batch)) {
				highlighted.concat_r("<span class='token_keyword'>");
				highlighted.concat_r(batch);
				highlighted.concat_r("</span>");
			}
			else if (highlight && batch != '&' && batch != '*' && batch != '.' && batch != ':') {
				highlighted.concat_r("<span class='token_type'>");
				highlighted.concat_r(batch);
				highlighted.concat_r("</span>");
			}
			else {
				highlighted.concat_r(batch);
			}
			batch.reset();
		};
		
		// Iterate.
		for (auto& i: block.iterate()) {
			const char& c = i.character();
			switch (c) {
				
			// Special chars.
			case '*':
			case '&':
			case '.':
			case ':':
				append_batch();
				batch.append(c);
				append_batch(false);
				break;
			case '<':
				append_batch();
				batch.concat_r("&lt;");
				append_batch(false);
				break;
			case '>':
				append_batch();
				batch.concat_r("&gt;");
				append_batch(false);
				break;
			
			// Space.
			case ' ':
				append_batch();
				batch.append(c);
				append_batch(false);
				break;
			
			// Append.
			default:
				batch.append(c);
				break;
			}
		}
		append_batch();
			
		return highlighted;
	}
	
		
}; 		// End struct highlighter.
}; 		// End namespace vhighlight.
#endif	// End header.

