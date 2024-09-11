@constructor_wrapper
@register_element
class CodeLineElement extends CreateVElementClass({
	type: "CodeLine",
	tag: "span",
	default_style: {
		"font-family": "\"Menlo\", \"Consolas\", monospace",
		"font-size": "0.90em",
		"font-style": "italic",
		"background": "#000000",
		"color": "#FFFFFF",
		"border-radius": "10px",
		"white-space": "pre",
		"padding": "2.5px 7.5px 2.5px 7.5px",
	},
}) {
	
	// Constructor.
	constructor(text) {
		
		// Initialize base class.
		super();
		
		// Set text.
		this.inner_html(text);
		
	}

	/*	@docs:
		@title: Fill
		@descr: Fill the markdown style codeline elements in a string.
	 */
	static fill(text, codeline_callback = () => CodeLine()) {
		// Fill code line's.
		if (text.indexOf("`") !== -1) {
			const split = text.split("`");
			let is_code = false;
			let filled = "";
			for (let i = 0; i < split.length; i++) {
				if (is_code) {
					filled += codeline_callback().text(split[i]);
				} else {
					filled += split[i];
				}
				is_code = !is_code;
			}
			text = filled;
		}
		return text;
	}
		
}