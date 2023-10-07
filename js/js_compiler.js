/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Javascript parser when in node js.

if (typeof module !== "undefined" && typeof module.exports !== "undefined") {

	// Imports.
	const libfs = require("fs");

	// JS compiler class.
	vhighlight.JSCompiler = class JSCompiler {

		// Constructor.
		/*	@docs: {
			@title JSCompiler constructor.
			@description:
				Bundle or compile javascript files with additinonal syntax options.
				
				Code minimization:
					Minimize code by removing unnecessary characters.
				
				String concatenation:
					A sequence of the matching strings with nothing in between except whitespace (` `, `\t`, `\n`) will automatically be concatenated into one string.

				Numeric procentuals.
					Numerics followed by `%` will automatically be converted into a string.

				Decorators:
					Possible decorators are:
						- @constructor_wrapper(suffix = "Class"): Automatically creates a function wrapper for the class with the same name as the class minus the suffix. The suffix must be present at the end of the class name.
						- @vweb_register: Register the element as a custom HTML element. Requires the vweb client library to be included.

					One or multiple custom decorators can also be defined.
					However this requires the following rules.
					 	- The decorator function must return an anonymous function.
					 	- The decorator function must always contain the `callback` parameter, the callback function can never have any arguments.
					 	- The decorator function must always take assignment parameters `function my_decorator({my_arg = null, callback = () => {}}) {}`.
					 	- When calling the decorator function, any arguments must be passed in a python like keyword assignment way, e.g. `@my_decorator(my_arg = "Hello World!")`.
					 	- The decorator must always be followed by a function or class definition.

			@parameter: {
				@name: line_breaks
				@type: boolean
				@description: Allow single line breaks.
			}
			@parameter: {
				@name: double_line_breaks
				@type: boolean
				@description: Allow double line breaks.
			}
			@parameter: {
				@name: comments
				@type: boolean
				@description: Allow comments.
			}
			@parameter: {
				@name: white_space
				@type: boolean
				@description: Allow optional whitespace.
			}
		} */
		constructor({
			line_breaks = true,
			double_line_breaks = false,
			comments = false,
			white_space = false,
		} = {}) {

			// Parameters.
			this.line_breaks = line_breaks;
			this.double_line_breaks = double_line_breaks;
			this.comments = comments;
			this.white_space = white_space;

			// Attributes.
			this.str_chars = ["\"", "'", "`;"]
			this.tokenizer = new vhighlight.JS({
				excluded_word_boundary_joinings: [" ", "\t"],
			});
		}
		
		// Bundle.
		/*	@docs: {
			@title Bundle.
			@description: Bundle and parse javascript files into a single file.
			@parameter: {
				@name: export_path
				@type: string
				@description: The bundled export path.
			}
			@parameter: {
				@name: include
				@type: array[string]
				@description: The array with file paths, when a path is a directory the entire directory will be included.
			}
			@parameter: {
				@name: exclude
				@type: array[string]
				@description: The file paths that will be excluded.
			}
		} */
		bundle({
			export_path = null,
			includes = [],
			excludes = [],
		}) {
			
			// Vars.
			let code = "";

			// Include path wrapper.
			const include_path = (path) => {
				
				// Skip excluded.
				if (excludes.includes(path)) {
					return null;
				}

				// Check existance.
				if (!libfs.existsSync(path)) {
					throw Error(`Path "${path}" does not exist.`);
				}

				// When the path is a directory.
				if (libfs.statSync(path).isDirectory()) {
					const files = libfs.readdirSync(path);
					for (let i = 0; i < files.length; i++) {
						include_path(`${path}/${files[i]}`);
					}
				}

				// When the path is a file.
				else {
					code += this.compile(path);
				}
			}

			// Iterate includes.
			for (let i = 0; i < includes.length; i++) {
				include_path(includes[i]);
			}

			// Export.
			libfs.writeFileSync(export_path, code);
		}

		// Compile a single file.
		compile(path) {
			return this.compile_code(libfs.readFileSync(path).toString(), path);
		}

		// Compile code data.
		compile_code(code_data, path = "<raw code data>") {

			// ---------------------------------------------------------
			// Tokenize.			

			// Parse tokens.
			this.tokenizer.code = code_data;
			this.tokens = this.tokenizer.tokenize()

			// ---------------------------------------------------------
			// Compile.		

			// Code insertions.
			// { after_token: <number> (insert after this token index), data: <string> (the data to insert) }
			this.code_insertions = [];

			// Other vars
			let code = "";
			let prev_token;						// the direct previous token.
			let prev_nw_token;					// the previous non whitespace token (also counting line breaks).
			let prev_is_whitespace = false;		// if the direct previous token is whitespace (also counting line breaks).
			let prev_is_operator = false;		// if the direct previous token is an operator (also counting line breaks).
			let prev_is_colon = false;			// if the direct previous token ends with a colon.
			let resume_on = 0;					// the token index on which to continue parsing when the token index is lower than resume on, it will be skipped.
			let line_index = -1;
			let token_index = -1;

			// ---------------------------------------------------------
			// Wrapper functions.

			// Get the next token, returns `null` when there is no next token.
			// const get_next_token = (lookup = 1, exclude = [], exclude_count = null) => {
			// 	return this.tokens.iterate_tokens(line_index, null, (token) => {
			// 		const excluded = (exclude_count === null || exclude_count > 0) || exclude.includes(token.data);
			// 		if (token.index >= token_index + lookup && !excluded) {
			// 			return token;
			// 		}
			// 		if (excluded && exclude_count !== null) {
			// 			--exclude_count;
			// 		}
			// 	})
			// }
			const get_next_token = (lookup = 1, exclude = []) => {
				return this.tokens.iterate_tokens(line_index, null, (token) => {
					if (token.index >= token_index + lookup && !exclude.includes(token.data)) {
						return token;
					}
				})
			}

			// ---------------------------------------------------------
			// Iterate tokens.

			// Mimize and format code.
			this.tokens.iterate((line_tokens) => {
				++line_index;

				// Iterate tokens.
				let added_tokens = 0;
				let at_line_start = true;
				line_tokens.iterate((token) => {

					// ---------------------------------------------------------
					// Vars.

					++token_index;
					let add_to_code = true;
					const is_whitespace = token.is_word_boundary === true && token.data.length === 1 && (token.data === " " || token.data === "\t");
					const is_operator = token.token === "operator";
					const next_nw_token = get_next_token(1, [" ", "\t", "\n"]);
					const next_token = get_next_token(1);
					const next_is_operator = next_token !== null && next_token.token == "operator";
					const next_is_whitespace = next_token !== null && next_token.is_word_boundary === true && next_token.data.length === 1 && (next_token.data === " " || next_token.data === "\t");
					if (at_line_start && is_whitespace === false) {
						at_line_start = false;
					}

					// ---------------------------------------------------------
					// Apply decorators.

					if (token.is_decorator === true) {

						// Apply.
						resume_on = this.apply_decorator(path, token);

						// Stop.
						return null;
					}

					// ---------------------------------------------------------
					// Skip.
					// But only after applying the decorators.

					if (token.index < resume_on) {
						return null;
					}

					// ---------------------------------------------------------
					// Skip single/double newlines.
					// But insert whitespace when the direct previous token was a keyword.

					if (
						token.is_line_break && 
						(token.is_comment !== true && token.is_str !== true && token.is_regex !== true && token.is_preprocessor !== true) && // always allow line breaks inside comments, strings, regex and preprocessors.
						(
							this.line_breaks === false ||
							(this.double_line_breaks === false && added_tokens == 0)
						)
					) {
						if (prev_token !== undefined && prev_token.token === "keyword") {
							code += " ";
						}
						return null;
					}

					// ---------------------------------------------------------
					// Skip whitespace.
					// Except a single whitespace after and before keywords.
					if (
						this.white_space === false && 
						is_whitespace &&
						(
							at_line_start || 
							prev_is_operator ||
							prev_is_colon ||
							next_is_whitespace ||
							next_is_operator ||
							(
								(prev_nw_token == null || prev_nw_token.token !== "keyword") &&
								(next_token == null || next_token.token !== "keyword")
							)
						)
					) {
						return null;
					}

					// ---------------------------------------------------------
					// Skip comments.

					if (
						this.comments === false && 
						token.is_comment === true &&
						(token.is_line_break !== true || added_tokens === 0)
					) {
						return null;
					}

					// ---------------------------------------------------------
					// Concatenate strings in a sequence with only whitespace in between.

					if (
						prev_nw_token !== undefined &&
						prev_nw_token.token === "string" &&
						token.token === "string" &&
						this.str_chars.includes(prev_nw_token.data[prev_nw_token.data.length - 1]) &&
						this.str_chars.includes(token.data[0]) &&
						prev_nw_token.data[prev_nw_token.data.length - 1] === token.data[0]
					) {
						
						// Remove all previous chars till (including) the last string closer.
						const closer = prev_nw_token.data[prev_nw_token.data.length - 1];
						let success = false, close_index;
						for (close_index = code.length - 1; close_index >= 0; close_index--) {
							if (code.charAt(close_index) === closer) {
								success = true;
								break;
							}
						}
						if (success) {
							code = code.substr(0, close_index);
							token.data = token.data.substr(1);
						}
					}

					// ---------------------------------------------------------
					// Convert numeric tokens followed by a "%" to a string.

					if (token.token === "numeric") {
						if (next_nw_token != null && next_nw_token.is_word_boundary) {
							if (next_nw_token.data.length === 1 && next_nw_token.data === "%") {
								code += `"${token.data}%"`;
								resume_on = next_nw_token.index + 1;
								add_to_code = false;
							} else if (next_nw_token.data.length > 1 && next_nw_token.data.charAt(0) === "%") {
								code += `"${token.data}%"`;
								next_nw_token.data = next_nw_token.data.substr(1);
								add_to_code = false;
							}
						}
					}

					// ---------------------------------------------------------
					// Add to code.

					// Append token.
					if (add_to_code) {
						code += token.data;
					}

					// ---------------------------------------------------------
					// Check code insertions.

					if (this.code_insertions.length > 0) {
						const new_code_insertions = [];
						this.code_insertions.iterate((item) => {
							if (item.after_token === token.index) {
								code += item.data;
							} else {
								new_code_insertions.push(item);
							}
						})
						this.code_insertions = new_code_insertions;
					}

					// ---------------------------------------------------------
					// Post edits.

					// Update iteration vars.
					++added_tokens;
					prev_token = token;
					prev_is_whitespace = is_whitespace;
					prev_is_operator = is_operator;
					prev_is_colon = token.token === undefined && token.data.length > 0 && token.data.charAt(token.data.length - 1) === ":";
					if (
						token.is_line_break !== true &&
						(token.data.length > 1 || (token.data != " " && token.data != "\t"))
					) {
						prev_nw_token = token;
					}
				})
			})
	
			// Add last newline.
			if (this.line_breaks === true && code.charAt(code.length - 1) !== "\n") {
				code += "\n";
			}

			// Handler.
			return code;
		}

		// ---------------------------------------------------------
		// Utils.

		// Get the next `type_def` token from a start line and token index.
		// Returns `null` when no token is found.
		get_next_type_def(line, start_index) {
			return this.tokens.iterate_tokens(line, null, (token) => {
				if (token.index >= start_index && token.token === "type_def") {
					return token;
				}
			})
		}

		// Get closing depth token from a start token line and token index.
		// Can only be used for `()`, `[]` and `{}`.
		// The returned attributes will be null when the closing scope was not found.
		// Allow non whitespace only counts when the depth is 0.
		get_closing_token(line, start_index, opener = "(", closer = ")", allow_non_whitespace = true) {
			let depth = 0, open_token = null, close_token = null;
			const res = this.tokens.iterate_tokens(line, null, (token) => {
				if (token.index >= start_index) {
					if (token.token === undefined && token.data.length === 1 && token.data === opener) {
						if (depth === 0) {
							open_token = token;
						}
						++depth;
					} else if (token.token === undefined && token.data.length === 1 && token.data === closer) {
						--depth;
						if (depth === 0) {
							close_token = token;
							return true;
						}
					} else if (
						depth === 0 && 
						allow_non_whitespace === false && 
						(
							token.data.length > 1 ||
							(token.data != " " && token.data != "\t" && token.data != "\n")
						)
					) {
						return false;
					}
				}
			})
			return {close_token, open_token};
		}

		// @todo an async function that uses a decorator still does not work, need to check for async and if so then make the callback also async, not sure about await etc, perhaps do not await but throw error if the decorator is not async and the func is.
		/* 	Apply a decorator token.
		 * 	Returns the resume on token index.
		 * 	A code insertion object looks as follows:
		 * 	{
		 * 		after_token: <number>, // insert after this token index.	
		 * 		data: <string>, // the data to insert.
		 *	}
		 */
		apply_decorator(path, token) {

			// ---------------------------------------------------------
			// Preperation.

			// Vars
			const column = token.offset - this.tokens[token.line][0].offset;
			const decorator = token.data;
			let resume_on;
			const line_break = this.line_breaks ? "" : "\n";

			// Get a decorator parameter value by name (decorators must always use keyword assignment).
			const get_param_value = (name, def = null, unqoute = false) => {
				let value = def;
				token.parameters.iterate((param) => {
					if (param.name === name) {
						if (param.value !== null && param.value.length > 0) {
							value = "";
							param.value.iterate((item) => {
								value += item.data;
							})
						}
						return true;
					}
				})
				if (value === undefined) { value = def; }
				while (value.length >= 2 && this.str_chars.includes(value.charAt(0)) && this.str_chars.includes(value.charAt(value.length - 1))) {
					value = value.substr(1, value.length - 2);
				}
				const str_chars = ["'", '"', "`"];
				if (unqoute && str_chars.includes(value.charAt(0)) && str_chars.includes(value.charAt(value.length - 1))) {
					value = value.substr(1, value.length - 2);
				}
				return value;
			}

			// Check if the previous token is keyword class.
			const check_prev_is_keyword_class = (type_def_token) => {
				const class_keyword = this.tokenizer.get_prev_token(type_def_token.index - 1, [" ", "\t", "\n"]);
				if (class_keyword == null || class_keyword.data !== "class") {
					throw Error(`${path}:${token.line}:${column}: The target type definition "${type_def_token.data}" is not a class (${decorator}).`);
				}
				return class_keyword;
			}

			// Build params as a js string.
			const build_params = (params) => {
				let data = "(";
				let i = 0, last_i = params.lenth - 1;
				params.iterate((param) => {
					if (param.name != null) {
						data += `${param.name}=`;
					}
					data += param.value;
					if (i != last_i) {
						data += ",";
					}
					++i;
				})
				data += ")";
				return data;
			}

			// Get the value to which a type def was assigned to eg "mylib.myfunc = ..." to retrieve "mylib.myfunc".
			// When there was no assignment used then `null` is returned.
			const get_assignment_name = (from_token_index) => {
				const assignment = this.tokenizer.get_prev_token(from_token_index, [" ", "\t", "\n"]);
				let assignment_name = null;
				if (assignment != null && assignment.data === "=") {
					assignment_name = "";
					this.tokens.iterate_tokens_reversed(assignment.line, assignment.line + 1, (token) => {
						if (token.index < assignment.index) {
							if (assignment_name.length === 0 && token.is_word_boundary !== true) {
								assignment_name += token.data;
							} else if (assignment_name.length !== 0) {
								if (token.is_word_boundary && token.data !== ".") {
									return false;
								} else {
									assignment_name = token.data + assignment_name;
								}
							}
						}
					})
					if (assignment_name.length === 0) {
						assignment_name = null;
					}
				}
				return assignment_name;
			}

			// Find the resume token.
			const resume = this.get_closing_token(token.line, token.index + 1, "(", ")", false);
			if (resume.close_token == null) {
				resume_on = token.index + 1;
			} else {
				resume_on = resume.close_token.index + 1;
			}

			// Find the closing "}" token.
			const {open_token, close_token} = this.get_closing_token(token.line, resume_on - 1, "{", "}");
			if (open_token === null || close_token === null) {
				throw Error(`${path}:${token.line}:${column}: Unable to find the scope's open and close tokens (${decorator}).`);
			}

			// Find the next type def token.
			const type_def_token = this.get_next_type_def(token.line, resume_on - 1);
			if (type_def_token === null || type_def_token.index >= open_token.index) {
				throw Error(`${path}:${token.line}:${column}: There is no type definition before the scope opening (${decorator}).`);
			}

			// ---------------------------------------------------------
			// Constructor wrapper.

			if (decorator === "@constructor_wrapper") {

				// Check if the previous token is "class".
				const class_keyword = check_prev_is_keyword_class(type_def_token);
				
				// Check if the class was assigned to a module with like "mylib.myclass = class MyClass {}".
				const assignment_name = get_assignment_name(class_keyword.index - 1);
				
				// Args.
				const suffix = get_param_value("suffix", "Class", true);

				// Check if the suffix matches the end of the target type.
				if (
					type_def_token.data.length < suffix.length || 
					type_def_token.data.substr(type_def_token.data.length - suffix.length) != suffix
				) {
					throw Error(`${path}:${token.line}:${column}: The target type definition "${type_def_token.data}" does not contain suffix "${suffix}" (${decorator}).`);
				}

				// Create data.
				let data = ";";
				if (assignment_name !== null) {
					data += `${assignment_name}=`;
				}
				data += `${line_break}function ${type_def_token.data.substr(0, type_def_token.data.length - suffix.length)}(...args){return new ${type_def_token.data}(...args)};`;
				
				// Return code insertion.
				this.code_insertions.push({
					after_token: close_token.index,
					data: data,
				});
			}

			// ---------------------------------------------------------
			// Constructor wrapper.

			else if (decorator === "@vweb_register") {

				// Check if the previous token is "class".
				const class_keyword = check_prev_is_keyword_class(type_def_token);

				// Create data.
				const data = `;${line_break}vweb.elements.register(${type_def_token.data});`;
				
				// Return code insertion.
				this.code_insertions.push({
					after_token: close_token.index,
					data: data,
				});
			}

			// ---------------------------------------------------------
			// Custom decorators.

			else {

				// Put the entire function call inside a sub function named callback.
				if (type_def_token.custom_decorators === undefined) {
					this.code_insertions.push({
						after_token: open_token.index,
						data: `${line_break}let callback=()=>{`,
					})
					this.code_insertions.push({
						after_token: close_token.index - 1,
						data: `};${line_break}`,
					})
				}

				// When there are multiple custom decoratos then the decorators that were declared first should be called as last in order to keep the execute order right.
				// So remove this functions custom decorators from the code insertions and then add them in the correct order.
				let old_decorators = [];
				if (type_def_token.custom_decorators !== undefined) {
					const new_insertions = [];
					this.code_insertions.iterate((item) => {
						if (item.decorator !== type_def_token.offset) {
							new_insertions.push(item);
						}
						else if (item.end_decorator !== true) {
							old_decorators.push(item);
						}
					})
					this.code_insertions = new_insertions;
				}

				// Add the decorator.
				let data = `callback=${decorator.substr(1)}({callback:callback`;
				token.parameters.iterate((param) => {
					if (param.name == null) {
						throw Error(`${path}:${token.line}:${column}: Decorator parameters must always use keyword assignment "@decorator(my_param = 0)" (${decorator}).`);
					}
					data += `,${param.name}:${param.value}`
				})
				data += `});${line_break}`
				this.code_insertions.push({
					after_token: close_token.index - 1,
					data: data,
					decorator: type_def_token.offset, // use as id.
				})

				// Add the old decorators.
				old_decorators.iterate((item) => {
					this.code_insertions.push(item);
				})

				// Return the callback.
				this.code_insertions.push({
					after_token: close_token.index - 1,
					data: `return callback();${line_break}`,
					decorator: type_def_token.offset, // use as id.
					end_decorator: true,
				})

				// Assign token's custom decorators.
				if (type_def_token.custom_decorators === undefined) {
					type_def_token.custom_decorators = [decorator];
				} else {
					type_def_token.custom_decorators.push(decorator);
				}

			}

			// ---------------------------------------------------------
			// Finish.

			// Unknown decorator.
			// else {
			// 	throw Error(`${path}:${token.line}: Unknown decorator "${decorator}".`);
			// }

			// Handler.
			return resume_on;

		}
	}
}