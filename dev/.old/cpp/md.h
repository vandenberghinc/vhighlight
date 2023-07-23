/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// Header.
#ifndef VHIGHLIGHT_MD_H
#define VHIGHLIGHT_MD_H

// Includes.
#include <sstream>
#include <regex>

// namespace vhighlight.
namespace vhighlight {

// Markdown syntax highlighter.
struct md {
	
// Public.
public:
	
	// ---------------------------------------------------------
	// Public functions.	
	
	// Highlight.
	static
	Code 	highlight(const Code& code) {
		
		// Vars.
		Code content;
		
		// Regexes.
		static const std::regex heading_regex(R"(^(#{1,6})(.+)$)", std::regex::multiline);
		static const std::regex unordered_list_regex(R"(^(\s+[-+*])(.+)$)", std::regex::multiline);
		static const std::regex ordered_list_regex(R"(^(\s+\d+)(.+)$)", std::regex::multiline);
		static const std::regex paragraph_regex(R"(^(.+)$)", std::regex::multiline);
		
		static const std::regex emphasis_regex(R"((\*|_)(.*?)(\*|_))");
		static const std::regex strong_regex(R"((\*|_)(\*|_)(.*?)(\*|_)(\*|_))");
		static const std::regex link_regex(R"(\[([^\]]+)\]\(([^\)]+)\))");
		static const std::regex code_regex(R"(`(.*?)`)");
		static const std::regex singleline_codeblock_regex(R"((.*?)(^```[^\n]*\n(.*?)\n```$|^```(.*?)```$|.*?```(.*?)```.*?)(.*?))");
		static const std::regex multiline_codeblock_regex(R"((^|.*[^`])```(\S*)$)");
		static const std::regex image_regex(R"(\!\[([^\]]+)\]\(([^\)]+)\))");
		
		// Iterate lines.
		std::string s (code.c_str(), code.len());
		std::istringstream inputStream(s);
		std::string line;
		std::smatch match;
		while (std::getline(inputStream, line)) {
		
			// Headings.
			if (
				std::regex_match(line, match, heading_regex) ||
				std::regex_match(line, match, unordered_list_regex) ||
				std::regex_match(line, match, ordered_list_regex)
			) {
				std::string m1 = match[1];
				std::string m2 = match[2];
				content << "<span class='token_keyword'>";
				content.concat_r(m1.data(), m1.length());
				content << "</span>";
				content.concat_r(m2.data(), m2.length());
				content.append('\n');
			}
			
			// Single line codeblock
			else if (std::regex_match(line, match, singleline_codeblock_regex)) {
				String code;
				std::string s4 = match[4], s5 = match[5];
				if (s4.empty()) {
					code.reconstruct(s5.data(), s5.length());
				} else {
					code.reconstruct(s4.data(), s4.length());
				}
				code.replace_start_r("\n").replace_end_r("\n");
				
				content << "<span class='token_comment'>";
				content.concat_r("```", 3);
				content.concat_r(code);
				content.concat_r("```", 3);
				content << "</span>";
				content << '\n';
			}
			
			// Code Block
			else if (std::regex_match(line, match, multiline_codeblock_regex)) {
				std::string language = match[2];
				String code;
				while (std::getline(inputStream, line)) {
					if (std::regex_match(line, multiline_codeblock_regex)) {
						break;
					} else {
						code << line.c_str() << "\n";
					}
				}
				code.replace_start_r("\n").replace_end_r("\n");
				
				content << "<span class='token_comment'>";
				content.concat_r("```", 3);
				content.concat_r(language.data(), language.length());
				content << "</span>";
				content << '\n';
				
				if (language == "cpp") {
					code = cpp::highlight(code);
					content.concat_r(code);
				} else {
					content << "<span class='token_comment'>";
					content.concat_r(code);
					content << "</span>";
				}
				content << '\n';
				
				content << "<span class='token_comment'>";
				content.concat_r("```", 3);
				content << "</span>";
				
				content << '\n';
			}
			
			// Paragraph
			else if (std::regex_match(line, match, paragraph_regex)) {
				std::string s = match[1];
				const char* remaining = s.c_str();
				while (true) {
					std::string str = remaining;
			
					// Code.
					if (std::regex_search(str, match, code_regex)) {
						std::string before = str.substr(0, match.position());
						std::string m1 = match[1].str();
						
						content.concat_r(before.data(), before.length());
						
						content << "<span class='token_keyword'>";
						content.append('`');
						content << "</span>";
						
						content << "<span class='token_comment'>";
						content.concat_r(m1.data(), m1.length());
						content << "</span>";
						
						content << "<span class='token_keyword'>";
						content.append('`');
						content << "</span>";
						
						remaining += match.position() + match.length();
					}
			
					// Strong
					// Should be before emphasis.
					else if (std::regex_search(str, match, strong_regex)) {
						std::string before = str.substr(0, match.position());
						std::string m1 = match[1].str();
						std::string m2 = match[2].str();
						std::string m3 = match[3].str();
						std::string m4 = match[4].str();
						std::string m5 = match[5].str();
						
						content.concat_r(before.data(), before.length());
						
						content << "<span class='token_keyword'>";
						content.concat_r(m1.data(), m1.length());
						content.concat_r(m2.data(), m2.length());
						content << "</span>";
						
						content << "<b>";
						content.concat_r(m3.data(), m3.length());
						content << "</b>";
						
						content << "<span class='token_keyword'>";
						content.concat_r(m4.data(), m1.length());
						content.concat_r(m5.data(), m2.length());
						content << "</span>";
						
						remaining += match.position() + match.length();
					}
			
					// Emphasis
					else if (std::regex_search(str, match, emphasis_regex)) {
						std::string before = str.substr(0, match.position());
						std::string m1 = match[1].str();
						std::string m2 = match[2].str();
						std::string m3 = match[3].str();
						
						content.concat_r(before.data(), before.length());
						
						content << "<span class='token_keyword'>";
						content.concat_r(m1.data(), m1.length());
						content << "</span>";
						
						content << "<i>";
						content.concat_r(m2.data(), m2.length());
						content << "</i>";
						
						content << "<span class='token_keyword'>";
						content.concat_r(m3.data(), m3.length());
						content << "</span>";
						
						remaining += match.position() + match.length();
					}
					
					// Images
					else if (std::regex_search(str, match, image_regex)) {
						std::string before = str.substr(0, match.position());
						std::string m1 = match[1].str();
						std::string m2 = match[2];
						
						content.concat_r(before.data(), before.length());
						
						content << "<span class='token_string'>";
						content.append('!');
						content << "</span>";
						
						content << "<span class='token_keyword'>";
						content.append('[');
						content << "</span>";
						
						content << "<span class='token_string'>";
						content.concat_r(m1.data(), m1.length());
						content << "</span>";
						
						content << "<span class='token_keyword'>";
						content.append(']');
						content << "</span>";
						
						content << "<span class='token_string'>";
						content.append('(');
						content.concat_r(m2.data(), m2.length());
						content.append(')');
						content << "</span>";
						
						remaining += match.position() + match.length();
					}
     
					// Links
					else if (std::regex_search(str, match, link_regex)) {
						std::string before = str.substr(0, match.position());
						std::string m1 = match[1].str();
						std::string m2 = match[2];
					
						content.concat_r(before.data(), before.length());
						
						content << "<span class='token_keyword'>";
						content.append('[');
						content << "</span>";
					
						content << "<span class='token_string'>";
						content.concat_r(m1.data(), m1.length());
						content << "</span>";
					
						content << "<span class='token_keyword'>";
						content.append(']');
						content << "</span>";
					
						content << "<span class='token_string'>";
						content.append('(');
						content.concat_r(m2.data(), m2.length());
						content.append(')');
						content << "</span>";
					
						remaining += match.position() + match.length();
					}
			
					// No matches so add data.
					else {
						content << remaining;
						break;
					}
			
				}
				content << "\n";
			}
			
			// Unrecognized line - treat as plain text
			else {
				content.concat_r(line.data(), line.length());
				content << '\n';
			}
		}
		
		// Handler.
		return content;
		
	}
	
		
}; 		// End struct highlighter.
}; 		// End namespace vhighlight.
#endif	// End header.

