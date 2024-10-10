/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Javascript parser when in node js.

if (typeof module !== "undefined" && typeof module.exports !== "undefined") {

	// Imports.
	const libfs = require("fs");
	const babel = require('@babel/core');
	const { parse: babel_parse } = require('@babel/parser');
	const babel_traverse = require('@babel/traverse').default;

	// JS compiler class.
	vhighlight.JSCompiler = class JSCompiler {

		// Constructor.
		/*	@docs:
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

			@parameter:
				@name: line_breaks
				@type: boolean
				@description: Allow single line breaks.
			@parameter:
				@name: double_line_breaks
				@type: boolean
				@description: Allow double line breaks.
			@parameter:
				@name: comments
				@type: boolean
				@description: Allow comments.
			@parameter:
				@name: white_space
				@type: boolean
				@description: Allow optional whitespace.
			@parameter:
			    @name: tree_shaking
			    @description: Optimize javascript source code by removing dead code.
			    @type: boolean
			@parameter:
			    @name: mangle
			    @description: Optimize javascript source code by mangling function names.
			    @type: boolean
		*/
		constructor({
			line_breaks = true,
			double_line_breaks = false,
			comments = false,
			white_space = false,
			tree_shaking = false,
			mangle = false,
		} = {}) {

			// Parameters.
			this.line_breaks = line_breaks;
			this.double_line_breaks = double_line_breaks;
			this.comments = comments;
			this.white_space = white_space;
			this.tree_shaking = tree_shaking;
			this.mangle = mangle;

			// Attributes.
			this.str_chars = ["\"", "'", "`;"]
			this.tokenizer = new vhighlight.JS({
				allow_preprocessors: true,
				excluded_word_boundary_joinings: [" ", "\t"],
				compiler: true,
			});
		}
		
		// Bundle.
		/*	@docs: {
			@title Bundle.
			@description: Bundle and parse javascript files into a single file.
			@parameter:
				@name: export_path
				@type: string
				@description: The bundled export path.
			@parameter:
				@name: include
				@type: array[string]
				@description: The array with file paths, when a path is a directory the entire directory will be included.
			@parameter:
				@name: exclude
				@type: array[string]
				@description: The file paths that will be excluded.
			@parameter:
				@name: compile_min
				@type: boolean
				@description: Also compile path's that end with `min.js`.
			@parameter:
				@name: log
				@type: boolean
				@description: Log an exported to string.
		*/
		bundle({
			export_path = null,
			includes = [],
			excludes = [],
			compile_min = false,
			log = false,
		}) {

			// Reset preprocessor definitions.
			this.preprocessor_defs = {};
			this.serialized_preprocessor_defs = {};
			
			// Vars.
			let code = "";

			// Gather all paths.
			const paths = [];
			const include_path = (path) => {

				// Convert to string, also for vlib.Path.
				if (typeof path === "object") {
					path = path.toString();
				}

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
				else if (paths.includes(path) === false) {
					paths.push(path);
				}
			}
			for (let i = 0; i < includes.length; i++) {
				include_path(includes[i]);
			}

			// Compile all paths.
			// const now = Date.now();
			// const times = [];
			for (let i = 0; i < paths.length; i++) {
				const path = paths[i];
				if (compile_min === false && path.length > 7 && path.substr(path.length - 7) === ".min.js") {
					code += libfs.readFileSync(path);
				} else {
					// const l_now = Date.now();
					code += this.compile(path);
					// times.push([path, Date.now() - l_now]);
				}
			}
			// console.log(">>> Performance:", Date.now() - now + "ms.");
			// times.sort((a, b) => b[1] - a[1]);
			// for (let i = 0; i < Math.min(times.length, 10); i++) {
			// 	console.log(times[i][0] + ":", times[i][1] + "ms.")
			// }

			// Export.
			libfs.writeFileSync(export_path, code);

			// Log.
			if (log) {
				console.log(`Bundled into "${export_path}".`);
			}
		}

		// Compile a single file.
		compile(path) {
			return this.compile_code(libfs.readFileSync(path).toString(), path);
		}

		// Compile code data.
		compile_code(code_data, path = "<raw code data>", _first_run = true) {

			// ---------------------------------------------------------
			// Tokenize.			

			// Parse tokens.
			this.tokenizer.code = code_data;
			this.tokens = this.tokenizer.tokenize()

			// Remove dead code.
			if (_first_run && this.tree_shaking) {
				this.remove_dead_code(path);
			}

			// Mangle func names.
			// if (_first_run && this.mangle) {
			// 	this.mangle_code(path);
			// }

			// ---------------------------------------------------------
			// Compile.		

			// Code insertions.
			// { after_token: <number> (insert after this token index), data: <string> (the data to insert) }
			this.code_insertions = [];

			// Other vars
			let code = "";
			let prev_prev_token;
			let prev_prev_nw_token;
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
					if (token.index >= token_index + lookup && token.data != "" && !exclude.includes(token.data)) {
						return token;
					}
				})
			}

			// Serialize a code variable value in string into a variable format.
			const serialize_str_variable = (value) => {

				// Serialize strings.
				if (
					(value.charAt(0) == "\"" && value.charAt(value.length - 1) == "\"") ||
					(value.charAt(0) == "'" && value.charAt(value.length - 1) == "'") ||
					(value.charAt(0) == "`" && value.charAt(value.length - 1) == "`")
				) {
					value = value.substr(1, value.length - 2);
				}

				// Serialize objects.
				else if (
					(value.charAt(0) == "[" && value.charAt(value.length - 1) == "]") ||
					(value.charAt(0) == "{" && value.charAt(value.length - 1) == "}")
				) {
					value = JSON.parse(value);
				}

				// Serialize boolean.
				else if (value === "true") {
					value = true;
				}
				else if (value === "false") {
					value = false;
				}

				// Serialize null.
				else if (value === "null") {
					value = null;
				}

				// Serialize undefined.
				else if (value === "undefined") {
					value = undefined;
				}
				
				// Serialize numbers.
				else if (/^-?\d+(\.\d+)?$/.test(value)) {
					value = parseFloat(value);
				}

				// Response.
				return value;
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
					const next_nw_token = get_next_token(1, [" ", "\t", "\n", ""]);
					const next_token = get_next_token(1);
					const next_is_operator = next_token !== null && next_token.token == "operator";
					const next_is_whitespace = next_token !== null && next_token.is_word_boundary === true && next_token.data.length === 1 && (next_token.data === " " || next_token.data === "\t");
					if (at_line_start && is_whitespace === false) {
						at_line_start = false;
					}

					// Minify.
					/* */

					// ---------------------------------------------------------
					// Apply decorators.

					if (_first_run && token.is_decorator === true) {

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
							prev_nw_token == null || 
							(
								prev_nw_token.is_comment !== true && 
								prev_nw_token.is_str !== true &&
								prev_nw_token.is_regex !== true && 
								prev_nw_token.is_preprocessor !== true
							)
						) // always allow line breaks after comments, strings, regex and preprocessors.
					) {
						if (
							// this.line_breaks === false // do not always remove line breaks like this, can cause errors.
							(this.double_line_breaks === false && added_tokens == 0)
							|| (
								this.line_breaks === false &&
								prev_nw_token != null && 
								(
									prev_nw_token.data === ","
									|| prev_nw_token.data === ";"
									|| prev_nw_token.data === ":"
									|| prev_nw_token.data === "&"
									|| prev_nw_token.data === "|"
									|| prev_nw_token.data === "["
									|| prev_nw_token.data === "{"
									|| prev_nw_token.data === "("
									|| prev_nw_token.data === "+"
									|| prev_nw_token.data === "-"
									|| prev_nw_token.data === "*"
									|| prev_nw_token.data === "/"
								)
							)
						) {
							if (prev_nw_token !== undefined && prev_nw_token.token === "keyword") {
								code += " ";
							}
							return null;
						}

						// Skip newlines on consecutive ]}) chars.
						else if (
							this.line_breaks === false &&
							(
								prev_nw_token.data === "]"
								|| prev_nw_token.data === "}"
								|| prev_nw_token.data === ")"
							) &&
							(
								next_nw_token != null &&
								(
									next_nw_token.data === "]" || 
									next_nw_token.data === "}" || 
									next_nw_token.data === ")"
								)
							)
						) {
							return null;
						}

						// Skip newlines on next chars.
						else if (
							this.line_breaks === false &&
							next_nw_token != null && 
							(
								next_nw_token.data === "." ||
								next_nw_token.data === ")" ||
								next_nw_token.data === "}" ||
								next_nw_token.data === "]"
							)
						) {
							return null;
						}

						// Skip newlines on ]) with a preceding ; char.
						// else if (
						// 	(
						// 		prev_nw_token.data === "]"
						// 		|| prev_nw_token.data === ")"
						// 	)
						// 	&& prev_prev_nw_token != null
						// 	&& prev_prev_nw_token.data === ";"
						// ) {
						// 	return null;
						// }


					}
	
					// ---------------------------------------------------------
					// Skip double chars.
					// if (
					// 	token.is_comment !== true && 
					// 	token.is_str !== true &&
					// 	token.is_regex !== true && 
					// 	token.is_preprocessor !== true &&
					// 	prev_nw_token != null &&
					// 	(
					// 		// (token.data === ";" && prev_nw_token.data === ";") // NEVER skip this it invalidates statements like `for (;;) {}`
					// 		// (token.data === "," && prev_nw_token.data === ",")
					// 	)
					// ) {
					// 	return null;
					// }

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
								prev_token != null && 
								(
									prev_token.data === "{" ||
									prev_token.data === "}"
								)
							) ||
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
						_first_run && 
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
					// Allow multi line ``` X ``` strings, where the indent of each line will be cleaned, therefore multi line strings can be defined at any indent level.
					// However, all backticks must be escaped inside this multi line backtick string.

					if (_first_run && token.token === "string" && token.data.startsWith("```")) {

						// Find the indent of the defintion line.
						let remove_indent = "", indent = "";
						this.tokens.iterate_tokens_reversed(0, token.line + 1, (token) => {
							if (token.index <= token_index) {
								if (token.is_line_break) {
									remove_indent = indent;
									return true;
								} else if (token.is_whitespace) {
									indent += token.data;
								} else {
									indent = "";
								}
							}
						})

						// Iterate the tokens forwards to add the code and remove the correct amount of indentation.
						let prev = null;
						this.tokens.iterate_tokens(token.line, null, (token) => {
							if (token.index === token_index) {
								code += "`";
								code += token.data.substr(3);
							}
							else if (token.index >= token_index) {

								// Remove whitespace.
								if (remove_indent.length > 0 && prev.is_line_break === true && token.data.startsWith(remove_indent)) {
									token.data = token.data.substr(remove_indent.length);
								}

								// Check closing.
								if (
									token.token === "string" && token.data.endsWith("```")
								) {
									code += token.data.substr(0, token.data.length - 3);
									code += "`";
									resume_on = token.index + 1;
									return true; // do not add three ```, one has already been added.
								}

								// Add to code
								code += token.data;

							}
							prev = token;
						});
						add_to_code = false;
					}

					// ---------------------------------------------------------
					// Convert numeric tokens followed by a "%", "px", "em", "#" to a string.

					if (_first_run && token.token === "numeric") {
						if (next_token != null) {
							if (
								next_token.data.length === 1 && 
								(
									next_token.data === "%" ||
									next_token.data === "#" ||
									next_token.data === "px" ||
									next_token.data === "em"
								)
							) {
								code += `"${token.data}${next_token.data}"`;
								resume_on = next_token.index + 1;
								add_to_code = false;
							}
							else if (
								next_token.data.length === 2 && 
								(
									next_token.data === "px" ||
									next_token.data === "em"
								)
							) {
								code += `"${token.data}${next_token.data.substr(0, 2)}"`;
								next_token.data = next_token.data.substr(2);
								add_to_code = false;
							}
							else if (
								next_token.data.length > 1 && 
								(
									next_token.data.charAt(0) === "%" ||
									next_token.data.charAt(0) === "#"
								)
							) {
								code += `"${token.data}${next_token.data.charAt(0)}"`;
								next_token.data = next_token.data.substr(1);
								add_to_code = false;
							}
						}
					}

					// ---------------------------------------------------------
					// Handle preprocessors.

					if (_first_run && token.token === "preprocessor") {

						// Fetch the complete preprocessor statement, in case it is multi line.
						let preprocessor_data = token.data;
						let lookup = 1;
						while (true) {
							const next = get_next_token(lookup);
							if (next != null && (next.token === "preprocessor" || next.is_preprocessor === true)) {
								++lookup;
								if (token.is_line_break === true) {
									preprocessor_data += " ";
								} else {
									preprocessor_data += next.data;
								}
							} else {
								break;
							}
						}
						resume_on = token_index + lookup;
						preprocessor_data = preprocessor_data.trim();
						add_to_code = false;

						// Definition (#define).
						if (preprocessor_data.startsWith("#define")) {
							const splitted = preprocessor_data.split(" ");
							if (splitted.length >= 3) {

								// Add to raw preprocessor defs.
								let value = splitted.slice(2).join(" ");
								this.preprocessor_defs[splitted[1]] = value;

								// Add to serialized preprocessor defs.
								this.serialized_preprocessor_defs[splitted[1]] = serialize_str_variable(value);
							}
						}

						// If statements (#if, #elif #else #endif).
						else if (preprocessor_data.startsWith("#if")) {

							// Find all the "if" "elif" "else" statements.
							const statement_tokens = [[]];
							const statement_conditions = [preprocessor_data];
							const statement_conditions_tokens = [[]];
							let statement_lookup = lookup;
							let statement = null;
							let statement_index = 0;
							let end_token = null;
							let is_non_statement_preprocessor = false;
							while (true) {
								const next = get_next_token(statement_lookup);

								// New statement.
								if (next.token === "preprocessor" || next.is_preprocessor === true) {
									if (statement == null) {
										if (
											next.data.startsWith("#if") === false && 
											next.data.startsWith("#elif") === false && 
											next.data.startsWith("#else") === false && 
											next.data.startsWith("#endif") === false
										) {
											is_non_statement_preprocessor = true;
											statement_tokens[statement_index].push(next)
										}
									}
									if (is_non_statement_preprocessor !== true) {
										if (statement === null) {
											statement = "";
										}
										if (next.token === "line") {
											statement += " ";
										} else {
											statement += next.data;
										}
										statement_conditions_tokens.push(next);
										if (statement.startsWith("#endif")) {
											end_token = next.index;
											break;
										}
									}
								}

								// Inside statement.
								else {
									is_non_statement_preprocessor = false;

									// Add previous statement.
									if (statement !== null) {
										statement_conditions.push(statement);
										statement_tokens.push([])
										++statement_index;
										statement = null;
									}

									// Add token to statement.
									statement_tokens[statement_index].push(next)
								}
								++statement_lookup;
							}

							// Evaluate which statement is true.
							let evaluated_index = null;
							for (let i = 0; i < statement_conditions.length; i++) {
								let result;
								let statement = statement_conditions[i];

								// Remove the #elif etc text.
								const start = statement.indexOf(" ");
								if (start === -1) {
									result = statement === "#else";
								}
								statement = statement.substr(start + 1).trim()

								// Custom function "path_exists()"
								if (statement.startsWith("path_exists(")) {
									let path = statement.substr(12).trim();
									if (path.charAt(path.length - 1) === ")") {
										path = path.substr(0, path.length - 1);
									}
									path = serialize_str_variable(path);
									try {
										result = libfs.existsSync(path)
									} catch (error) {
										result = false;
									}
								}

								// Custom statement `#if argv_present "..."`
								else if (statement.startsWith("argv_present")) {
									const params = statement.substr(12).replaceAll("\t", " ").replaceAll("\n", " ").replaceAll("  ", " ").trim().split(" ");
									result = process.argv.includes(params[0].slice(1, -1))
								}

								// Custom statement `#if argv_eq "..." "..."`
								else if (statement.startsWith("argv_eq")) {
									const params = statement.substr(7).replaceAll("\t", " ").replaceAll("\n", " ").replaceAll("  ", " ").trim().split(" ");
									const index = process.argv.indexOf(params[0].slice(1, -1));
									result = false;
									if (index !== -1 && index + 1 < process.argv.length) {
										result = params[1].slice(1, -1) === process.argv[index + 1];
									}
								}

								// Evaluate code.
								else if (result !== true) {
									const evaluate = new Function(...Object.keys(this.serialized_preprocessor_defs), `return ${statement};`);
									try {
										result = evaluate(...Object.values(this.serialized_preprocessor_defs));
									} catch (error) {
										throw Error(`Encountered an error while evaluating statement "${statement}": ${error}`);
									}
								}

								// Handle result.
								if (result) {
									evaluated_index = i;
									break;
								}
							}

							// Reset the token data of the non evaluated tokens.
							if (evaluated_index !== null) {
								for (let i = 0; i < statement_conditions.length; i++) {
									if (i !== evaluated_index) {
										statement_tokens[i].iterate((token) => {
											token.data = "";
											token.token = undefined;
										})
									}
								}
								statement_conditions_tokens.iterate((token) => {
									token.data = "";
									token.token = undefined;
								});
							}
						}

						// Not found, throw error.
						else {
							throw Error(`Unknown preprocessor statement "${token.data}"`)
						}
					}

					// Check if the token is a preprocessor definition.
					else if (_first_run && this.preprocessor_defs !== undefined && this.preprocessor_defs[token.data] != null) {
						const value = this.preprocessor_defs[token.data];
						if (typeof value === "string") { // avoid default functions.
							code += value;
							add_to_code = false;
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
					prev_prev_token = prev_token;
					prev_token = token;
					prev_is_whitespace = is_whitespace;
					prev_is_operator = is_operator;
					prev_is_colon = token.token === undefined && token.data.length > 0 && token.data.charAt(token.data.length - 1) === ":";
					if (
						token.is_line_break !== true &&
						(token.data.length > 1 || (token.data != " " && token.data != "\t"))
					) {
						prev_prev_nw_token = prev_nw_token;
						prev_nw_token = token;
					}
				})
			})
	
			// The code must end with a newline otherwise at least firefox may throw an error when the file ends with a }.
			code = code.trim() + (_first_run ? "\n" : "");

			// Second run.
			// if (_first_run) {
			// 	return this.compile_code(code, path, false);
			// }

			// Handler.
			return code;
		}

		// Bundle a library for internal vinc use only.
		async _bundle_library({
		    source, // the source path.
		    name,
		    author = null,
		    start_year = null,
		    version = null,
		    embed_data = [],            // data to embed in front of the copyright string, at the very beginning of the file.
		    dependencies = [],			// dependencies from this project, this is required when `embed_dependencies` is defined. This to make sure old dependencies from embedded libs are uninstalled.
		    compile_libs = [],          // other nodejs compile scripts.
		    embed_libs = [],            // paths to libs to embed.
		    embed_dependencies = [],    // paths of the package.json files of the libs to embed to install their dependencies.
		    includes = [],				// the files or dirs to compile.
		    excludes = [],				// the files or dirs to exclude from compiling.
		    npm_config_path = null,
		    templates = {},				// Templates that can be used {{TEMPLATE}}.
		}) {

			// Include vlib.
			const vlib = require(`${process.env.PERSISTANCE}/private/dev/vinc/vlib/js/vlib.js`);
			source = new vlib.Path(source);
			const package_path = npm_config_path ? new vlib.Path(npm_config_path) : source.join("package.json");
			const package_data = package_path.exists() ? JSON.parse(package_path.load_sync()) : null;
			if (version == null) {
				version = package_data.version;
			}

			// Recompile libs.
		    compile_libs.iterate((path) => { require(path); });

		    // Check args.
		    if (source == null) {
		        throw new Error("Define parameter \"source\".");
		    }
		    if (name == null) {
		        throw new Error("Define parameter \"name\".");
		    }

		    // Paths.
		    source = new vlib.Path(source).abs();
		    const export_path = source.join(name);

		    // Compile the client library.
		    this.bundle({
		        includes,
		        excludes,
		        export_path: export_path.str(),
		    });

		    // Load bundled.
		    let bundled = export_path.load_sync();
		    let update_bundled = false;

		    // Replace version.
		    if (version) {
		    	update_bundled = true;
		    	bundled = bundled.replaceAll("__VERSION__", `"${version}"`);
		    }

		    // Fill templates.
		    bundled = this._fill_templates(bundled, templates, true);

		    // Retrieve first party bytes.
		    const first_party_bytes = export_path.size;
		    export_path.reset();

		    // Create prepend data.
		    let prepend = "";
	        embed_data.iterate(data => { prepend += data; })
	        if (author != null)  {
		        prepend += 
			        `/*\n` +
			        ` * Author: ${author}\n` +
			        ` * Copyright: © ${start_year === null ? new Date().getFullYear() : start_year} - ${new Date().getFullYear()} ${author}\n` +
			        ` * Version: v${version ? version : "?"}\n` +
			        ` */\n`;
		    }

		    // Prepend libs.
		    if (embed_libs.length > 0) {
		        embed_libs.iterate((path) => {
		        	if (path != null && typeof path === "object" && path.data) {
		        		prepend += path.data;
		        	} else {
		        		prepend += new vlib.Path(path).load_sync();
		        	}
		        });
		        export_path.save_sync(prepend + ";" + bundled);
		    }

		    // Save copyright and embed data.
		    else {
		    	export_path.save_sync(prepend + bundled);
		    }

		    // Install dependencies.
		    if (embed_dependencies.length > 0) {
		        let install_dependencies = [];
		        embed_dependencies.iterate((path) => {
		            const package_dependencies = JSON.parse(new vlib.Path(path).load_sync()).dependencies;
		            if (typeof package_dependencies === "object") {
			            Object.keys(package_dependencies).iterate((key) => {
			                install_dependencies.push(`${key}@${package_dependencies[key]}`);
			                dependencies.push(key);
			            });
			        }
		        });
		        if (install_dependencies.length > 0) {
		            const proc = new vlib.Proc();
		            const exit_status = await proc.start({
		            	command: "npm",
		            	args: ["install", "--save", ...install_dependencies],
		            	working_directory: source.str(),
		            });
		            if (exit_status !== 0) {
		                throw new Error(`Installing dependencies failed with exit_status ${proc.exit_status}.\n${proc.err}`);
		            }
		        }
		    }

		    // Uninstall dependencies.
		    // Only enabled when embed_dependencies is defined.
		    let remove_dependencies = [];
		    if (embed_dependencies.length > 0 && package_path.exists()) {
		        const installed_dependencies = package_data.dependencies;
		        if (typeof installed_dependencies === "object") {
			        Object.keys(installed_dependencies).iterate((lib) => {
			            if (!dependencies.includes(lib)) {
			                remove_dependencies.push(lib);
			            }
			        });
			        if (remove_dependencies.length > 0) {
			            const proc = new vlib.Proc();
			            const exit_status = await proc.start({
			            	command: "npm",
			            	args: ["uninstall", "--save", ...remove_dependencies],
			            	working_directory: source.str(),
			            });
			            if (exit_status !== 0) {
			                throw new Error(`Uninstalling dependencies failed with exit_status ${proc.exit_status}.\n${proc.err}`);
			            }
			        }
			    }
		    } else if (embed_dependencies.length > 0 && !package_path.exists()) {
		        console.log(`Warning: NPM package path "${package_path.str()}" does not exist, not uninstalling any dependencies.`);
		    }

		    // Log.
		    const total_bytes = (export_path.size / 1024).toFixed(2);
		    const third_party_bytes = ((1.0 - (first_party_bytes / export_path.size)) * 100).toFixed(2)
		    if (embed_libs.length > 0) {
		    	vlib.print_marker(`Compiled ${export_path.name()}${version ? "@" + version : ""} [${total_bytes}KB, ${third_party_bytes}% from embedded libs].`);
		    } else {
		    	vlib.print_marker(`Compiled ${export_path.name()}${version ? "@" + version : ""} [${total_bytes}KB].`);
		    }
		}

		// Extract global variables.
		extract_globals(code) {

			// Parse the code into an AST
			const {ast} = babel.transformSync(code, {
				sourceType: 'module',
				// plugins: ['@babel/plugin-syntax-jsx'], // Include necessary plugins
				ast: true, // If you need the AST
				code: false, // Set to false if you don't need the transformed code
			});
	    	// const ast = babel_parse(code, {
		    //     sourceType: 'module',
		    //     plugins: ['jsx']
		    // });

		    const globals = {
		        variables: new Set(),
		        classes: new Set(),
		        functions: new Set()
		    };

		    // Traverse the AST to find global declarations
		    babel_traverse(ast, {
		        VariableDeclaration(path) {
		            // Check if declared at the top-level of the program
		            if (path.parent.type === 'Program') {
		                path.node.declarations.forEach(declaration => {
		                    if (declaration.id.type === 'Identifier') {
		                        globals.variables.add(declaration.id.name);
		                    }
		                });
		            }
		        },
		        FunctionDeclaration(path) {
		            if (path.parent.type === 'Program' && path.node.id && path.node.id.name) {
		                globals.functions.add(path.node.id.name);
		            }
		        },
		        ClassDeclaration(path) {
		            if (path.parent.type === 'Program' && path.node.id && path.node.id.name) {
		                globals.classes.add(path.node.id.name);
		            }
		        }
		    });

		    return [...Array.from(globals.variables), ...Array.from(globals.classes), ...Array.from(globals.functions)];
		}

		// Remove dead code.
		// Currently it only removes function names that are not used, not looking at classes, so when my_func_1 is called and is both a func on MyClass1 and MyClass2 then it would keep both.
		remove_dead_code(path = "<raw code data>") {

			// Vars.
			const dont_remove = [
				"constructor",
				"toString",
				"valueOf",
				"hasOwnProperty",
				"isPrototypeOf",
				"propertyIsEnumerable",
				"toLocaleString",
				"apply",
				"call",
				"bind",
				"__defineGetter__",
				"__defineSetter__",
				"__lookupGetter__",
				"__lookupSetter__"
			];

			// Map every function, which function it calls etc.
			const detect_types = (start_token) => {
				let skip_till = null;
				const detected_types = [];
				this.tokens.iterate_tokens(start_token.line, null, (token) => {

					// Skip first columns.
					if (token.index <= start_token.index) {
						return null;
					}

					// Skip inside functions.
					if (
						skip_till != null && 
						token.curly_depth === skip_till[0] && 
						token.bracket_depth === skip_till[1] && 
						token.parenth_depth === skip_till[2]
					) {
						skip_till = null;
					} else if (token.token === "type_def") {
						skip_till = [token.curly_depth, token.bracket_depth, token.parenth_depth];
						return null;
					} else if (skip_till != null) {
						return null;
					}

					// Detect closing curly.
					if (
						token !== start_token && 
						token.curly_depth === start_token.curly_depth && 
						token.bracket_depth === start_token.bracket_depth && 
						token.parenth_depth === start_token.parenth_depth
					) {
						return false;
					}

					// Detect types.
					else if (token.token === "type") {
						detected_types.push(token.data);
					}
				})
				return detected_types;
			}

			// Detect types.
			// now = Date.now();
			const type_defs = [];
			const type_defs_names = new Set();
			const main_level_calls = new Set();
			let end_of_func = null;
			this.tokens.iterate_tokens((token) => {

				// Check end of type def.
				if (
					end_of_func != null && 
					token.curly_depth === end_of_func[0] && 
					token.bracket_depth === end_of_func[1] && 
					token.parenth_depth === end_of_func[2]
				) {
					end_of_func = null;
				}

				// Found type def token.
				if (token.token === "type_def" && token.curly_depth != null) {

					// Dont remove classes.
					let used = false;
					if (token.type != null) {
						token.type.iterate((item) => {
							if (item.data === "class" && item.token === "keyword") {
								used = true;
								return false;
							}
						})
					}

					// Append.
					type_defs.push({
						name: token.data,
						calls: null,
						used,
						token,
					});
					type_defs_names.add(token.data);

					// Set end of func depths.
					end_of_func = [
						token.curly_depth,
						token.bracket_depth,
						token.parenth_depth,
					];
				}

				// Inside function but not nested within another nested func.
				else if (end_of_func === null) {

					// Add main level func call.
					if (token.token === "type") {
						main_level_calls.add(token.data);
					}

					// Also add normal code followed by a "." since this can be used to bind a function like "this.my_func.bind(...)" so it should also be detected as a used func.
					// else if (token.token === undefined && this.tokenizer.is_alphabetical(token.data.charAt(0))) {
					// 	const next = this.tokenizer.get_next_token_by_token(token, []);
					// 	if (next != null && next.data === "." && !main_level_calls.has(token.data)) {
					// 		if (token.data === "iterate_nodes") {
					// 			console.log("OOIOIOI", token)
					// 		}
					// 		main_level_calls.add(token.data);
					// 	}
					// }
				}
			})

			// console.log("Detect types", Date.now() - now);
			// now = Date.now();

			// // Mark as used.
			const mark_as_used = (name) => {
				type_defs.iterate((type_def) => {
					if (!type_def._iterated && name === type_def.name) {
						type_def.used = true;
						type_def._iterated = true;
						if (type_def.calls === null) {
							type_def.calls = detect_types(type_def.token);
						}
						type_def.calls.iterate(mark_as_used)
					}
				})
			}
			Array.from(main_level_calls).iterate(mark_as_used);

			// Mark default functions always as used.
			type_defs.iterate((type_def) => {
				if (dont_remove.includes(type_def.name)) {
					type_def.used = true;
					type_def._iterated = true;
					if (type_def.calls === null) {
						type_def.calls = detect_types(type_def.token);
					}
					type_def.calls.iterate(mark_as_used)
				}
			})

			// Mark all functions as used when the exact token data matches the func's name. For example when assiging a func to an object, or copying a func or using `.bind` on a func.
			this.tokens.iterate_tokens((token) => {
				if (
					token.token === undefined && 
					!token.is_whitespace &&
					!token.is_word_boundary &&
					!token.is_line_break &&
					type_defs_names.has(token.data)
				) {
					mark_as_used(token.data);
				}
			});

			// console.log("Mark as used", Date.now() - now);
			// now = Date.now();

			// Remove tokens.
			const remove_tokens = new Map();
			type_defs.iterate((type_def) => {
				if (!type_def.used) {
					
					// Remove the function header before the {.
					let prev_token = type_def.token;
					let also_remove_before = false;
					let start_remove_index = type_def.token.index;
					while ((prev_token = this.tokenizer.get_prev_token_by_token(prev_token, [" ", "\t", "\n"])) != null) {
						if (
							prev_token.token === "keyword" ||
							prev_token.data === "," ||
							also_remove_before
						) {
							start_remove_index = prev_token.index;
							also_remove_before = false;
						}
						else if (
							prev_token.data === "=" || 
							prev_token.data === "." || 
							prev_token.data === ":"
						) {
							start_remove_index = prev_token.index;
							also_remove_before = true;
						}
						else {
							break;
						}
					}

					// Add to removed.
					remove_tokens.set(start_remove_index, {
						curly_depth: type_def.token.curly_depth,
						bracket_depth: type_def.token.bracket_depth,
						parenth_depth: type_def.token.parenth_depth,
					});
				}
			})
			let remove_index = null;
			this.tokens.iterate_tokens((token) => {
				if (remove_index !== null) {
					const info = remove_tokens.get(remove_index);
					if (
						token.data === "}" && 
						token.curly_depth === info.curly_depth && 
						token.bracket_depth === info.bracket_depth && 
						token.parenth_depth === info.parenth_depth
					) {
						remove_index = null;
					}
					token.remove = true;

				}
				else if (remove_tokens.has(token.index)) {
					remove_index = token.index;
					token.remove = true;
				}
			})

			// console.log("Mark as removed", Date.now() - now);
			// now = Date.now();

			// console.log(this.tokens);
			this.tokenizer.assign_tokens(this.tokens);
			this.tokens = this.tokenizer.tokens;
			// console.log(this.tokens);

			// console.log("Remove tokens", Date.now() - now);
			// now = Date.now();

			// console.log("Done")
			// console.log(type_defs);
			// console.log(main_level_calls);
		}

		// Mangle names.
		/*
		mangle_code(path = "<raw code data>") {

			// Detect sequantials that can be mangled.
			// Currently only supports:
			// - x.y.myfunc using dots
			// - raw func names.

			// Vars.
			let mangled = new Map();
			const mangled_names = new Map();
			const existing_names = new Set();
			const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
			let chars = [0];
			const dont_mangle = [
			  "constructor",
			  "toString",
			  "valueOf",
			  "hasOwnProperty",
			  "isPrototypeOf",
			  "propertyIsEnumerable",
			  "toLocaleString",
			  "apply",
			  "call",
			  "bind",
			  "__defineGetter__",
			  "__defineSetter__",
			  "__lookupGetter__",
			  "__lookupSetter__"
			]

			// Find sequences to mangle.
			this.tokens.iterate_tokens((token) => {

				// Detect type def.
				if (token.token === "type_def" && !dont_mangle.includes(token.data)) {
					mangled.set(token.data, {
						name: token.data,
						occurences: 0
					});
				}

				// Count and detect.
				if (token.token === "type_def" || token.token === "type") {
					if (!existing_names.has(token.data)) {
						existing_names.add(token.data);
					}
					if (mangled.has(token.data)) {
						++mangled.get(token.data).occurences;
					}
				}
			})
			mangled = new Map([...mangled.entries()].sort((a, b) => a.occurences - b.occurences));

			// Create mangled names.
			function generate_name(original_name) {
				const start_chars = chars;
				for (let x = 0; x < 100000; x++) {

					// Generate name.
					let name = "";
					for (let i = 0; i < chars.length; i++) {
						name += charset.charAt(chars[i]);
					}
					for (let i = 0; i < chars.length; i++) {
						if (chars[i] + 1 < charset.length) {
							++chars[i];
							break;
						} else {
							if (i + 1 === chars.length) {
								for (let i = 0; i < chars.length; i++) {
									chars[i] = 0;
								}
								chars.push(0);
								break;
							}
							chars[i] = 0;
						}
					}

					// Current name exceeds original name.
					if (name.length > original_name.length) {
						chars = start_chars;
						return original_name;
					}

					// Found name.
					if (!existing_names.has(name)) {
						return name;
					}
				}
				return original_name;
			}
			for (const item of mangled.values()) {
				mangled_names.set(item.name, generate_name(item.name))
			}

			// Mangle.
			this.tokens.iterate_tokens((token) => {
				if (token.token === "type_def" || token.token === "type") {
					const mangled = mangled_names.get(token.data);
					if (mangled != null) {
						token.data = mangled;
					}
				}
			})
		}
		*/

		// ---------------------------------------------------------
		// Utils.

		// Fill templates {{TEMPLATE}}
		_fill_templates(data, templates, curly_style = true) {
		    if (templates == null) { return data; }
		    const keys = Object.keys(templates);

		    // Iterate data.
		    if (keys.length > 0) {
		        for (let i = 0; i < data.length; i++) {

		            // {{TEMPLATE}} Curly style.
		            if (curly_style && data.charAt(i) === "{" && data.charAt(i + 1) === "{") {

		                // Iterate all templates.  
		                for (let k = 0; k < keys.length; k++) {
		                    if (
		                        data.charAt(i + keys[k].length + 2) === "}" && 
		                        data.charAt(i + keys[k].length + 3) === "}" && 
		                        data.eq_first(keys[k], i + 2)
		                    ) {
		                        const end_index = i + keys[k].length + 4;
		                        if (templates[keys[k]] != null && typeof templates[keys[k]] === "object") {
		                            data = data.replace_indices(JSON.stringify(templates[keys[k]]), i, end_index);
		                        } else {
		                            data = data.replace_indices(templates[keys[k]], i, end_index);
		                        }
		                        i = end_index - 1;
		                    }
		                }
		            }

		            // $TEMPLATE dollar style.
		            else if (!curly_style && data.charAt(i) === "$") {

		                // Iterate all templates.  
		                for (let k = 0; k < keys.length; k++) {
		                    if (
		                        data.eq_first(keys[k], i + 1)
		                    ) {
		                        const end_index = i + keys[k].length + 1;
		                        if (templates[keys[k]] != null && typeof templates[keys[k]] === "object") {
		                            data = data.replace_indices(JSON.stringify(templates[keys[k]]), i, end_index);
		                        } else {
		                            data = data.replace_indices(templates[keys[k]], i, end_index);
		                        }
		                        i = end_index - 1;
		                    }
		                }
		            }
		        }
		    }

		    // Response.
		    return data;
		}

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
				const class_keyword = this.tokenizer.get_prev_token_by_token(type_def_token, [" ", "\t", "\n"]);
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
			let resume = this.get_closing_token(token.line, token.index + 1, "(", ")", false);
			if (resume.close_token == null) {
				resume_on = token.index + 1;
			} else {
				resume_on = resume.close_token.index + 1;
			}

			// Find the closing "}" token.
			let {open_token, close_token} = this.get_closing_token(token.line, resume_on - 1, "{", "}");
			if (open_token === null || close_token === null) {
				throw Error(`${path}:${token.line}:${column}: Unable to find the scope's open and close tokens (${decorator}).`);
			} else {
				let prev = this.tokenizer.get_prev_token_by_token(open_token, [" ", "\t", "\n"]);
				if (prev != null && prev.data === "(") {  // when a function call using assignment operators is used to return a derived class.
					const res = this.get_closing_token(token.line, close_token.index + 1, "{", "}");
					open_token = res.open_token;
					close_token = res.close_token;
					if (open_token === null || close_token === null) {
						throw Error(`${path}:${token.line}:${column}: Unable to find the scope's open and close tokens (${decorator}).`);
					}
				}
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
				let suffix = get_param_value("suffix", "Class", true);

				// Check if the suffix matches the end of the target type.
				if (
					type_def_token.data.length < suffix.length || 
					type_def_token.data.substr(type_def_token.data.length - suffix.length) != suffix
				) {

					// When the suffix is the default "Class" then also check for "Element".
					const old_suffix = suffix;
					suffix = "Element";
					if (
						type_def_token.data.length < suffix.length || 
						type_def_token.data.substr(type_def_token.data.length - suffix.length) != suffix
					) {
						throw Error(`${path}:${token.line}:${column}: The target type definition "${type_def_token.data}" does not contain suffix "${old_suffix}" (${decorator}).`);
					}
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
			// Register the elemtent as a custom html element.

			else if (decorator === "@register_element") {

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

	// Compile function.
}