/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// Header.
#ifndef VHIGHLIGHT_PYTHON_H
#define VHIGHLIGHT_PYTHON_H

// Includes.
#include <sstream>
#include <regex>

// namespace vhighlight.
namespace vhighlight {

// Python syntax highlighter.
struct python {
	
// Private.
private:
	
	// Do regex.
	// Match regexes.
	static
	void do_regex(
		Code& content,
		std::istringstream& inputStream,
		std::smatch& match,
		std::string& line,
		bool add_newline = true,
		bool is_func_def = false,
		bool is_params = false,
		bool is_param = false
	) {
		
		// Define regex patterns for different Python syntax elements
		static std::regex keyword_regex(R"((^|.*?|\s+|\t*)(^|[^A-Za-z0-9])(and|as|assert|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|not|or|pass|raise|return|try|while|with|yield|self|True|False|None)\b(.*?)$)");
		static std::regex multiline_string_regex(R"((.*?)(['"]{3})(.*?)\2(.*?)$)");
		static std::regex multiline_string_start_1_regex(R"((.*?)("{3})(.*?)$)");
		static std::regex multiline_string_start_2_regex(R"((.*?)('{3})(.*?)$)");
		static std::regex string_regex(R"((.*?)(['"])(.*?)\2(.*?)$)");
		static std::regex numeric_regex(R"((^|.*?)(^|[^A-Za-z0-9])(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)(.*?)$)");
		static std::regex comment_regex(R"((^|\s+|\S|\t*)(#.*)$)");
		
		// static std::regex type_regex(R"((^.*?)([\^A-Za-z0-9_])([A-Za-z0-9_]+)(\()(.*?))");
		static std::regex type_regex(R"((?:^[^"']*?)([\^A-Za-z0-9_])([A-Za-z0-9_]+)(\()(.*?))");
		
		static std::regex type_def_regex(R"((^\s*|\t*)(def|class|lambda)(\s+)([A-Za-z0-9_]+)(\()(.*?)$)");
		
		static std::regex params_regex(R"((\s*)(\()(.*?)(\))(.*?)$)");
		static std::regex params_start_regex(R"((\s*)(\()(.*?)$)");
		static std::regex params_end_regex(R"((^\s*(?![\s\t]*#).*?)(\))(.*?)$)");


		static std::regex param_regex(R"((^.*?)(^|[A-Za-z0-9_]+)(,|$)(.*?)$)");
		static std::regex param_assignment_regex(R"((^.*?)(^|[A-Za-z0-9_]+)(=)(.*?)(,|$)(.*?)$)");
		
		// No length.
		if (line.empty()) {
			if (add_newline) {
				content << '\n';
			}
			return ;
		}
		
		// Comments.
		if (std::regex_match(line, match, comment_regex)) {
			std::string before = match[1];
			std::string m2 = match[2];
			do_regex(content, inputStream, match, before, false);
			content << "<span class='token_comment'>";
			content.concat_r(m2.data(), m2.length());
			content << "</span>";
			if (add_newline) {
				content << '\n';
			}
		}
		
		// Type definition.
		else if (std::regex_match(line, match, type_def_regex)) {
			std::string m1 = match[1];
			std::string m2 = match[2];
			std::string m3 = match[3];
			std::string m4 = match[4];
			std::string after = match[5].str() + match[6].str();
			content.concat_r(m1.data(), m1.length());
			content << "<span class='token_keyword'>";
			content.concat_r(m2.data(), m2.length());
			content << "</span>";
			content.concat_r(m3.data(), m3.length());
			content << "<span class='token_type_def'>";
			content.concat_r(m4.data(), m4.length());
			content << "</span>";
			do_regex(content, inputStream, match, after, add_newline, true, false);
		}
		
		// Type.
		else if (std::regex_match(line, match, type_regex)) {
			std::string before = line.substr(0, match.position(1));
			std::string m1 = match[1];
			std::string m2 = match[2];
			std::string after = match[4].str() + match[5].str();
			do_regex(content, inputStream, match, before, false);
			content << "<span class='token_type'>";
			content.concat_r(m1.data(), m1.length());
			content.concat_r(m2.data(), m2.length());
			content << "</span>";
			content << '(';
			do_regex(content, inputStream, match, after, add_newline, false, true);
		}
		
		// Parameters.
		else if ((is_params || is_func_def) && std::regex_match(line, match, params_regex)) {
			print(line);
			std::string before = match[1].str();
			std::string m2 = match[2];
			std::string m3 = match[3];
			std::string m4 = match[4];
			std::string after = match[5];
			content.concat_r(before.data(), before.length());
			content.concat_r(m2.data(), m2.length());
			do_regex(content, inputStream, match, m3, false, is_func_def, false, true);
			content.concat_r(m4.data(), m4.length());
			do_regex(content, inputStream, match, after, add_newline, is_func_def, false, true);
			if (add_newline) {
				content << '\n';
			}
		}
		else if ((is_params || is_func_def) && std::regex_match(line, match, params_start_regex)) {
			std::string before = match[1].str();
			std::string m2 = match[2];
			std::string after = match[3];
			content.concat_r(before.data(), before.length());
			content.concat_r(m2.data(), m2.length());
			do_regex(content, inputStream, match, after, add_newline, is_func_def, false, true);
			while (std::getline(inputStream, line)) {
				if (std::regex_match(line, match, params_end_regex)) {
					std::string m1 = match[1];
					std::string m2 = match[2];
					do_regex(content, inputStream, match, m1, false, is_func_def, false, true);
					content.concat_r(m2.data(), m2.length());
					if (add_newline) {
						content << '\n';
					}
					break;
				} else {
					do_regex(content, inputStream, match, line, add_newline, is_func_def, false, true);
				}
			}
		}
		else if (is_param && std::regex_match(line, match, param_assignment_regex)) {
			std::string before = match[1].str();
			std::string m2 = match[2];
			std::string m3 = match[3];
			std::string m4 = match[4];
			std::string m5 = match[5];
			std::string after = match[6];
			do_regex(content, inputStream, match, before, false, is_func_def, false, true);
			content << "<span class='token_parameter'>";
			content.concat_r(m2.data(), m2.length());
			content << "</span>";
			content.concat_r(m3.data(), m3.length());
			do_regex(content, inputStream, match, m4, false);
			content.concat_r(m5.data(), m5.length());
			print(after);
			do_regex(content, inputStream, match, after, add_newline, is_func_def, false, true);
		}
		else if (is_func_def && is_param && std::regex_match(line, match, param_regex)) {
			std::string before = match[1].str();
			std::string m2 = match[2];
			std::string m3 = match[3];
			std::string after = match[4];
			content.concat_r(before.data(), before.length());
			content << "<span class='token_parameter'>";
			content.concat_r(m2.data(), m2.length());
			content << "</span>";
			content.concat_r(m3.data(), m3.length());
			do_regex(content, inputStream, match, after, add_newline, is_func_def, false, true);
		}
		
		// Strings.
		else if (std::regex_match(line, match, multiline_string_regex)) {
			std::string before = match[1];
			std::string m2 = match[2];
			std::string m3 = match[3];
			std::string m4 = match[4];
			do_regex(content, inputStream, match, before, false);
			content << "<span class='token_string'>";
			content.concat_r(m2.data(), m2.length());
			content.concat_r(m3.data(), m3.length());
			content.concat_r(m2.data(), m2.length());
			content << "</span>";
			do_regex(content, inputStream, match, m4, add_newline);
		}
		else if (std::regex_match(line, match, multiline_string_start_1_regex)) {
			std::string before = match[1];
			std::string m2 = match[2];
			std::string m3 = match[3];
			do_regex(content, inputStream, match, before, false);
			content << "<span class='token_string'>";
			content.concat_r(m2.data(), m2.length());
			content.concat_r(m3.data(), m3.length());
			if (add_newline) {
				content << '\n';
			}
			while (std::getline(inputStream, line)) {
				if (std::regex_match(line, match, multiline_string_start_1_regex)) {
					std::string m1 = match[1];
					std::string m2 = match[2];
					std::string after = match[3];
					content.concat_r(m1.data(), m1.length());
					content.concat_r(m2.data(), m2.length());
					do_regex(content, inputStream, match, after, add_newline);
					break;
				} else {
					content.concat_r(line.data(), line.length());
					if (add_newline) {
						content << '\n';
					}
				}
			}
			content << "</span>";
		}
		else if (std::regex_match(line, match, multiline_string_start_2_regex)) {
			std::string before = match[1];
			std::string m2 = match[2];
			std::string m3 = match[3];
			do_regex(content, inputStream, match, before, false);
			content << "<span class='token_string'>";
			content.concat_r(m2.data(), m2.length());
			content.concat_r(m3.data(), m3.length());
			if (add_newline) {
				content << '\n';
			}
			while (std::getline(inputStream, line)) {
				if (std::regex_match(line, match, multiline_string_start_2_regex)) {
					std::string m1 = match[1];
					std::string m2 = match[2];
					std::string after = match[3];
					content.concat_r(m1.data(), m1.length());
					content.concat_r(m2.data(), m2.length());
					do_regex(content, inputStream, match, after, add_newline);
					break;
				} else {
					content.concat_r(line.data(), line.length());
					if (add_newline) {
						content << '\n';
					}
				}
			}
			content << "</span>";
		}
		else if (std::regex_match(line, match, string_regex)) {
			std::string before = match[1];
			std::string m2 = match[2];
			std::string m3 = match[3];
			std::string after = match[4];
			do_regex(content, inputStream, match, before, false);
			if (content.last() == '\n') {
				print(content);
				exit(1);
			}
			content << "<span class='token_string'>";
			content.concat_r(m2.data(), m2.length());
			content.concat_r(m3.data(), m3.length());
			content.concat_r(m2.data(), m2.length());
			content << "</span>";
			do_regex(content, inputStream, match, after, add_newline);
		}
		
		// Keywords.
		else if (std::regex_match(line, match, keyword_regex)) {
			std::string before = match[1].str() + match[2].str();
			std::string m2 = match[2];
			std::string m3 = match[3];
			std::string after = match[4];
			do_regex(content, inputStream, match, before, false);
			content << "<span class='token_keyword'>";
			content.concat_r(m3.data(), m3.length());
			content << "</span>";
			do_regex(content, inputStream, match, after, add_newline);
		}
		
		// Numerics.
		else if (std::regex_match(line, match, numeric_regex)) {
			std::string before = match[1].str() + match[2].str();
			std::string m3 = match[3];
			std::string after = match[4];
			do_regex(content, inputStream, match, before, false);
			content << "<span class='token_string'>";
			content.concat_r(m3.data(), m3.length());
			content << "</span>";
			do_regex(content, inputStream, match, after, add_newline);
		}
		
		// Add line.
		else {
			content.concat_r(line.data(), line.length());
			if (add_newline) {
				content << '\n';
			}
		}
		
	};
	
// Public.
public:
	
	// ---------------------------------------------------------
	// Public functions.
	
	// Highlight.
	static
	Code 	highlight(const Code& code) {

		// Vars.
		Code content;
		std::string s (code.c_str(), code.len());
		std::istringstream inputStream(s);
		std::string line;
		std::smatch match;
		
		
		// Iterate lines.
		while (std::getline(inputStream, line)) {
			do_regex(content, inputStream, match, line);
		}
		
		// Handler.
		return content;
		
	}
	
		
}; 		// End struct highlighter.
}; 		// End namespace vhighlight.
#endif	// End header.

