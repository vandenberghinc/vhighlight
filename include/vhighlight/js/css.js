/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Python highlighter.

vhighlight.css = {};

// The tokenizer options.
vhighlight.css.tokenizer_opts = {
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
}

// Highlight.
vhighlight.css.highlight = function(code, return_tokens = false) {

	// Initialize the tokenizer.
	const tokenizer = new Tokenizer(vhighlight.css.tokenizer_opts);

	// Assign the code.
	tokenizer.code = code;

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
	const numeric_regex = new RegExp(`^-?\\d+(\\.\\d+)?(${numeric_suffixes})*$`);

	// Start and end of css style attribute index, start begins after the ":" and the end is at the ";".
	let style_start = null;
	let style_end = null;

	// The callback.
	tokenizer.callback = function(char, is_escaped) {

		// At keywords such as "@keyframes".
		if (char == "@") {
			const end = this.get_first_word_boundary(this.index + 1);
			this.append_batch();
			this.append_forward_lookup_batch("token_keyword", this.code.substr(this.index, end - this.index));
			this.resume_on_index(end - 1);
			return true;
		}

		// Hex colors.
		if (this.batch == "" && char == "#") {
			const end = this.get_first_word_boundary(this.index + 1);
			this.append_batch();
			this.append_forward_lookup_batch("token_string", this.code.substr(this.index, end - this.index));
			this.resume_on_index(end - 1);
			return true;
		}

		// Css class definitions.
		else if (char == "{") {
			this.append_batch();
			let index = this.tokens.length - 1;
			while (true) {
				const prev = this.get_prev_token(index, [" ", ",", "\t", ":"]);
				if (prev == null || prev.data == "\n") {
					break;
				}
				else if (
					(prev.token == "token_string") || // for "#myid" which will otherwise be treated as hex strings.
					(prev.token == "token_keyword" && prev.data.charAt(0) != "@") ||
					(prev.token == null && 
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
						prev.token = "token_keyword";
						// pprev.token = "token_keyword";
						// const ppprev = this.tokens[pprev.index - 1];
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
			this.append_batch();
			const prev = this.get_prev_token(this.tokens.length - 1, [" ", "\t", "\n"]);
			if (prev != null && prev.token == null) {
				prev.token = "token_type";
			}
		}

		// CSS style attribute, curly depth is higher then 1 with pattern "^\s*XXX:" or ";\s*XXX:".
		else if (this.curly_depth > 0 && char == ":") {
			this.append_batch();
			let index = this.tokens.length - 1;
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
				else if (prev.token == null/* || prev.data == "-"*/) {
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
				style_start = this.index;
				for (let i = this.index + 1; i < this.code.length; i++) {
					const c = this.code.charAt(i);
					if (c == "\n") {
						style_start = null;
						break;
					} else if (c == ";") {
						style_end = i;
						break;
					}
				}
			}
		}

		// Numerics.
		else if (char == "%" && numeric_regex.test(this.batch + char)) {
			this.batch += char;
			this.append_batch("token_numeric");
			return true;
		}
		else if (this.word_boundaries.includes(char) && numeric_regex.test(this.batch)) {
			this.append_batch("token_numeric");
		}

		// Style attribute value keywords.
		// Basically every token that does not have an assigned token and does not contain a word boundary except for "-" between the style start and end.
		// Must be after numerics.
		else if (style_end != null && this.index >= style_end) {
			this.append_batch();
			let index = this.tokens.length - 1;
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
				else if (prev.token == null && !this.str_includes_word_boundary(prev.data)) {
					edits.push(prev);
				}
				index = prev.index - 1;
			}
			if (finished) {
				for (let i = 0; i < edits.length; i++) {
					edits[i].token = "token_keyword";
				}
			}
			style_end = null;
		}

		// Nothing done.
		return false;
	}

	// Tokenize.
	return tokenizer.tokenize(return_tokens);
}
