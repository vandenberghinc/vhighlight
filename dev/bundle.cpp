// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

#include "/Volumes/persistance/private/vinc/vlib/include/vlib/vlib.h"

using namespace vlib::types::shortcuts;

void bundle() {
	Path source = Path(__FILE__).base(2).join("include/vhighlight/js");
	Path vinc = Path(__FILE__).base(3);
	String js = vlib::JavaScript::bundle({
		.source = source,
		.include_order = {
			"highlight.js",
			"tokenizer.js",
		},
		.exclude = {
			"vhighlight.js"
		},
		.header = to_str(
			"/*" "\n"
			" * Author: Daan van den Bergh" "\n"
			" * Copyright: © 2022 - ", Date::now().year(), " Daan van den Bergh." "\n"
			" */" "\n"
		),
		.newlines = true,
		.double_newlines = false,
		.whitespace = false,
		.comments = false,
	});
	js.save(source.join("vhighlight.js"));
	print_marker("Bundled into ", source.join("vhighlight.js"), ".");
}
