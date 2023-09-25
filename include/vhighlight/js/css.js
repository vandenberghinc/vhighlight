/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// CSS highlighter.

vhighlight.CSS = class CSS {
	constructor() {

		// Initialize the this.tokenizer.
		this.tokenizer = new vhighlight.Tokenizer({
			keywords: [
				// Transition Timing Functions
				'ease',
				'ease-in',
				'ease-out',
				'ease-in-out',
				'linear',
				'step-start',
				'step-end',

				// Animation Timing Functions
				'ease-in-quad',
				'ease-in-cubic',
				'ease-in-quart',
				'ease-in-quint',
				'ease-in-sine',
				'ease-in-expo',
				'ease-in-circ',
				'ease-in-back',
				'ease-out-quad',
				'ease-out-cubic',
				'ease-out-quart',
				'ease-out-quint',
				'ease-out-sine',
				'ease-out-expo',
				'ease-out-circ',
				'ease-out-back',
				'ease-in-out-quad',
				'ease-in-out-cubic',
				'ease-in-out-quart',
				'ease-in-out-quint',
				'ease-in-out-sine',
				'ease-in-out-expo',
				'ease-in-out-circ',
				'ease-in-out-back',

				// Animation Fill Modes
				'none',
				'forwards',
				'backwards',
				'both',

				// Animation Play State
				'paused',
				'running',

				// CSS Gradient Types
				'linear-gradient',
				'radial-gradient',
				'conic-gradient',

				// CSS Function Notations
				'rgb',
				'rgba',
				'hsl',
				'hsla',
				'url',

				// CSS Keyframe Properties
				'from',
				'to',

				// CSS Animations Properties
				'infinite',
				'alternate',
				'alternate-reverse',

				// Style keywords.
				// Not reliable, using manual implementation.
				// 'auto',
				// 'normal',
				// 'none',
				// 'hidden',
				// 'visible',
				// 'solid',
				// 'dotted',
				// 'dashed',
				// 'double',
				// 'groove',
				// 'ridge',
				// 'inset',
				// 'outset',
				// 'inherit',
				// 'initial',
				// 'unset',
				// 'center',
				// 'move',
				// 'pointer',
				// 'not-allowed',
				// 'crosshair',
				// 'grab',
				// 'grabbing',
				// 'zoom-in',
				// 'zoom-out',
				// 'text',
				// 'all-scroll',
				// 'col-resize',
				// 'row-resize',
				// 'n-resize',
				// 's-resize',
				// 'e-resize',
				// 'w-resize',
				// 'ne-resize',
				// 'nw-resize',
				// 'se-resize',
				// 'sw-resize',
				// 'ew-resize',
				// 'ns-resize',
				// 'nwse-resize',
				// 'nesw-resize',
				// 'start',
				// 'end',
				// 'italic',
				// 'bold',
				// 'underline',
				// 'overline',
				// 'line-through',
				// 'solid',
				// 'dotted',
				// 'dashed',
				// 'double',
				// 'groove',
				// 'ridge',
				// 'inset',
				// 'outset',
				// 'capitalize',
				// 'uppercase',
				// 'lowercase',
				// 'break-all',
				// 'break-word',
				// 'nowrap',
				// 'pre',
				// 'pre-line',
				// 'pre-wrap',
				// 'normal',
				// 'bold',
				// 'bolder',
				// 'lighter',
				// 'initial',
				// 'inherit',
				// 'unset',

				// Measurement keywords.
				// Not possible since the numerics are append to them so neither the numerics or the suffixes will match, so manual implementation is required.
				// 'px',
				// 'em',
				// 'rem',
				// 'ex',
				// 'ch',
				// 'vw',
				// 'vh',
				// 'vmin',
				// 'vmax',
				// '%',
				// 'in',
				// 'cm',
				// 'mm',
				// 'pt',
				// 'pc',
				// 'fr',
				// 'deg',
				// 'grad',
				// 'rad',
				// 'turn',
				// 'ms',
				// 's',
				// 'Hz',
				// 'kHz',
				// 'dpi',
				// 'dpcm',
				// 'dppx',
				// 'x',

				// Pseudo keywords.
				// Not usable because of the including word boundary ":".
				// '::after',
				// '::before',
				// '::first-letter',
				// '::first-line',
				// '::selection',
				// '::backdrop',
				// '::placeholder',
				// '::marker',
				// '::spelling-error',
				// '::grammar-error',
				// ':active',
				// ':checked',
				// ':default',
				// ':dir',
				// ':disabled',
				// ':empty',
				// ':enabled',
				// ':first',
				// ':first-child',
				// ':first-of-type',
				// ':focus',
				// ':focus-within',
				// ':fullscreen',
				// ':hover',
				// ':indeterminate',
				// ':in-range',
				// ':invalid',
				// ':last-child',
				// ':last-of-type',
				// ':left',
				// ':link',
				// ':not',
				// ':nth-child',
				// ':nth-last-child',
				// ':nth-last-of-type',
				// ':nth-of-type',
				// ':only-child',
				// ':only-of-type',
				// ':optional',
				// ':out-of-range',
				// ':read-only',
				// ':read-write',
				// ':required',
				// ':right',
				// ':root',
				// ':scope',
				// ':target',
				// ':valid',
				// ':visited',
			],
			single_line_comment_start: false,
			multi_line_comment_start: "/*",
			multi_line_comment_end: "*/",
		});

		// Assign attributes.
		this.reset();

		// Numerics regex.
		const numeric_suffixes = [
			'px',
			'em',
			'rem',
			'ex',
			'ch',
			'vw',
			'vh',
			'vmin',
			'vmax',
			'%',
			'in',
			'cm',
			'mm',
			'pt',
			'pc',
			'fr',
			'deg',
			'grad',
			'rad',
			'turn',
			'ms',
			's',
			'Hz',
			'kHz',
			'dpi',
			'dpcm',
			'dppx',
			'x'
		].join("|");
		this.numeric_regex = new RegExp(`^-?\\d+(\\.\\d+)?(${numeric_suffixes})*$`);

		// Set callback.
		this.tokenizer.callback = (char, is_escaped) => {
			const tokenizer = this.tokenizer;
			
			// At keywords such as "@keyframes".
			if (char == "@") {
				const end = tokenizer.get_first_word_boundary(tokenizer.index + 1);
				tokenizer.append_batch();
				tokenizer.append_forward_lookup_batch("token_keyword", tokenizer.code.substr(tokenizer.index, end - tokenizer.index));
				tokenizer.resume_on_index(end - 1);
				return true;
			}

			// Hex colors.
			if (tokenizer.batch == "" && char == "#") {
				const end = tokenizer.get_first_word_boundary(tokenizer.index + 1);
				tokenizer.append_batch();
				tokenizer.append_forward_lookup_batch("token_string", tokenizer.code.substr(tokenizer.index, end - tokenizer.index));
				tokenizer.resume_on_index(end - 1);
				return true;
			}

			// Css class definitions.
			else if (char == "{") {
				tokenizer.append_batch();
				let index = tokenizer.added_tokens - 1;
				while (true) {
					const prev = tokenizer.get_prev_token(index, [" ", ",", "\t", ":"]);
					if (prev == null || prev.data == "\n") {
						break;
					}
					else if (
						(prev.token == "token_string") || // for "#myid" which will otherwise be treated as hex strings.
						(prev.token == "token_keyword" && prev.data.charAt(0) != "@") ||
						(prev.token === undefined && 
							(
								prev.data == "#" || 
								prev.data == "." || 
								prev.data == "*" || 
								prev.data == "-" || 
								tokenizer.is_alphabetical(prev.data.charAt(0))
							)
						)
					) {
						const pprev = tokenizer.tokens[prev.index - 1];
						if (pprev != null && pprev.data == ":") {
							prev.token = "token_keyword";
							// pprev.token = "token_keyword";
							// const ppprev = tokenizer.tokens[pprev.index - 1];
							// if (ppprev != null && ppprev.data == ":") {
							// 	ppprev.token = "token_keyword";
							// }
						} else {
							prev.token = "token_type_def";
						}
					}
					index = prev.index - 1;
				}
			}

			// CSS function calls such as "translateX(...)"
			else if (char == "(") {
				tokenizer.append_batch();
				const prev = tokenizer.get_prev_token(tokenizer.added_tokens - 1, [" ", "\t", "\n"]);
				if (prev != null && prev.token === undefined) {
					prev.token = "token_type";
				}
			}

			// CSS style attribute, curly depth is higher then 1 with pattern "^\s*XXX:" or ";\s*XXX:".
			else if (tokenizer.curly_depth > 0 && char == ":") {
				tokenizer.append_batch();
				let index = tokenizer.added_tokens - 1;
				let edits = [];
				let finished = false;
				while (true) {
					const prev = tokenizer.get_prev_token(index, [" ", "\t"]);
					if (prev == null) {
						break;
					}
					else if (prev.data == "\n" || prev.data == ";") {
						finished = true;
						break;
					}
					else if (prev.token === undefined/* || prev.data == "-"*/) {
						edits.push(prev);
					}
					index = prev.index - 1;
					// console.log(edits);
				}
				if (finished) {
					for (let i = 0; i < edits.length; i++) {
						edits[i].token = "token_keyword";
					}
					
					// Set style start and end.
					this.style_start = tokenizer.index;
					for (let i = tokenizer.index + 1; i < tokenizer.code.length; i++) {
						const c = tokenizer.code.charAt(i);
						if (c == "\n") {
							this.style_start = null;
							break;
						} else if (c == ";") {
							this.style_end = i;
							break;
						}
					}
				}
			}

			// Numerics.
			else if (char == "%" && this.numeric_regex.test(tokenizer.batch + char)) {
				tokenizer.batch += char;
				tokenizer.append_batch("token_numeric");
				return true;
			}
			else if (tokenizer.word_boundaries.includes(char) && this.numeric_regex.test(tokenizer.batch)) {
				tokenizer.append_batch("token_numeric");
			}

			// Style attribute value keywords.
			// Basically every token that does not have an assigned token and does not contain a word boundary except for "-" between the style start and end.
			// Must be after numerics.
			else if (this.style_end != null && tokenizer.index >= this.style_end) {
				tokenizer.append_batch();
				let index = tokenizer.added_tokens - 1;
				let finished = false;
				const edits = [];
				while (true) {
					const prev = tokenizer.get_prev_token(index, [" ", "\t"]);
					if (prev == null || prev == "\n") {
						break;
					}
					else if (prev.data == ":") {
						finished = true;
						break;
					}
					else if (prev.token === undefined && !tokenizer.str_includes_word_boundary(prev.data)) {
						edits.push(prev);
					}
					index = prev.index - 1;
				}
				if (finished) {
					for (let i = 0; i < edits.length; i++) {
						edits[i].token = "token_keyword";
					}
				}
				this.style_end = null;
			}

			// Nothing done.
			return false;
		}
	}

	// Reset attributes that should be reset before each tokenize.
	reset() {

		// Start and end of css style attribute index, start begins after the ":" and the end is at the ";".
		this.style_start = null;
		this.style_end = null;
	}

	// Highlight.
	highlight(code = null, return_tokens = false) {
		this.reset();
		if (code !== null) {
			this.tokenizer.code = code;
		}
		return this.tokenizer.tokenize(return_tokens);
	}

	// Partial highlight.
	/*	@docs: {
		@title Partial highlight.
		@description: Partially highlight text based on edited lines.
		@parameter: {
			@name: data
			@type: string
			@description: The new code data.
		}
		@parameter: {
			@name: edits_start
			@type: string
			@description: The start line of the new edits.
		}
		@parameter: {
			@name: edits_end
			@type: string
			@description: The end line of the new edits. The end line includes the line itself.
		}
		@parameter: {
			@name: insert_start
			@type: string
			@description: The start line from where to insert the new tokens into.
		}
		@parameter: {
			@name: insert_end
			@type: string
			@description: The end line from where to insert the new tokens into. The end line includes the line itself.
		}
		@parameter: {
			@name: tokens
			@type: array[object]
			@description: The old tokens.
		}
		@parameter: {
			@name: update_offsets
			@type: boolean
			@description: Update the offsets of the new tokens.
		}
	} */
	partial_highlight({
		code = null,
		edits_start = null,
		edits_end = null,
		insert_start = null,
		insert_end = null,
		tokens = [],
		update_offsets = true,
	}) {

		// Assign code when not assigned.
		// So the user can also assign it to the tokenizer without cause two copies.
		if (code !== null) {
			this.tokenizer.code = code;
		}

		// Reset.
		this.reset();

		// Partial tokenize.
		return this.tokenizer.partial_tokenize({
			edits_start: edits_start,
			edits_end: edits_end,
			insert_start: insert_start,
			insert_end: insert_end,
			tokens: tokens,
			update_offsets: update_offsets,
		})
	}
}

// Initialize.
vhighlight.css = new vhighlight.CSS();
