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

vhighlight.CSS = class CSS extends vhighlight.Tokenizer {
	constructor() {

		// Initialize the tokenizer .
		super({
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
			multi_line_comment_start: "/*",
			multi_line_comment_end: "*/",

			// Attributes for partial tokenizing.
			scope_separators: [
				"{", 
				"}", 
			],

			// Language, must never be changed it is used by dependents, such as vdocs.
			language: "CSS",
		});

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
		this.callback = (char, is_escaped) => {
			
			// At keywords such as "@keyframes".
			if (char == "@") {
				const end = this.get_first_word_boundary(this.index + 1);
				this.append_batch();
				this.append_forward_lookup_batch("keyword", this.code.substr(this.index, end - this.index));
				this.resume_on_index(end - 1);
				return true;
			}

			// Hex colors.
			if (this.batch == "" && char == "#") {
				const end = this.get_first_word_boundary(this.index + 1);
				this.append_batch();
				this.append_forward_lookup_batch("string", this.code.substr(this.index, end - this.index));
				this.resume_on_index(end - 1);
				return true;
			}

			// Css class definitions.
			else if (char == "{") {
				this.append_batch();
				let index = this.added_tokens - 1;
				while (true) {
					const prev = this.get_prev_token(index, [" ", ",", "\t", ":"]);
					if (prev == null || prev.data == "\n") {
						break;
					}
					else if (
						(prev.token == "string") || // for "#myid" which will otherwise be treated as hex strings.
						(prev.token == "keyword" && prev.data.charAt(0) != "@") ||
						(prev.token === undefined && 
							(
								prev.data == "#" || 
								prev.data == "." || 
								prev.data == "*" || 
								prev.data == "-" || 
								this.is_alphabetical(prev.data.charAt(0))
							)
						)
					) {
						const pprev = this.tokens[prev.index - 1];
						if (pprev != null && pprev.data == ":") {
							prev.token = "keyword";
							// pprev.token = "keyword";
							// const ppprev = this.tokens[pprev.index - 1];
							// if (ppprev != null && ppprev.data == ":") {
							// 	ppprev.token = "keyword";
							// }
						} else {
							prev.token = "type_def";
						}
					}
					index = prev.index - 1;
				}
			}

			// CSS style attribute, curly depth is higher then 1 with pattern "^\s*XXX:" or ";\s*XXX:".
			else if (this.curly_depth > 0 && char == ":") {
				this.append_batch();
				let index = this.added_tokens - 1;
				let edits = [];
				let finished = false;
				while (true) {
					const prev = this.get_prev_token(index, [" ", "\t"]);
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
						edits[i].token = "keyword";
					}
					
					// Set style start and end.
					this.style_start = this.index;
					for (let i = this.index + 1; i < this.code.length; i++) {
						const c = this.code.charAt(i);
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
			else if (char == "%" && this.numeric_regex.test(this.batch + char)) {
				this.batch += char;
				this.append_batch("numeric");
				return true;
			}
			else if (this.word_boundaries.includes(char) && this.numeric_regex.test(this.batch)) {
				this.append_batch("numeric");
			}

			// Style attribute value keywords.
			// Basically every token that does not have an assigned token and does not contain a word boundary except for "-" between the style start and end.
			// Must be after numerics.
			else if (this.style_end != null && this.index >= this.style_end) {
				this.append_batch();
				let index = this.added_tokens - 1;
				let finished = false;
				const edits = [];
				while (true) {
					const prev = this.get_prev_token(index, [" ", "\t"]);
					if (prev == null || prev == "\n") {
						break;
					}
					else if (prev.data == ":") {
						finished = true;
						break;
					}
					else if (prev.token === undefined && !this.str_includes_word_boundary(prev.data)) {
						edits.push(prev);
					}
					index = prev.index - 1;
				}
				if (finished) {
					for (let i = 0; i < edits.length; i++) {
						edits[i].token = "keyword";
					}
				}
				this.style_end = null;
			}

			// Nothing done.
			return false;
		}

		// Set on parenth close.
		this.on_parenth_close = ({
			token_before_opening_parenth = token_before_opening_parenth,
			after_parenth_index = after_parenth_index,
		}) => {
			if (token_before_opening_parenth != null && token_before_opening_parenth.token === undefined) {
				token_before_opening_parenth.token = "type";
				return token_before_opening_parenth;
			}
		}
	}

	// Reset attributes that should be reset before each tokenize.
	derived_reset() {

		// Start and end of css style attribute index, start begins after the ":" and the end is at the ";".
		this.style_start = null;
		this.style_end = null;
	}
}

// Initialize.
vhighlight.css = new vhighlight.CSS();
