/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 Daan van den Bergh.
 */

#include "/Volumes/persistance/private/vinc/vlib/include/vlib/vlib.h"
#include"/Volumes/persistance/private/vinc/vlib/include/vlib/vlib.h"
#include </Volumes/persistance/private/vinc/vlib/include/vlib/vlib.h>
#include</Volumes/persistance/private/vinc/vlib/include/vlib/vlib.h>

using namespace vlib::types::shortcuts;

#define SOME PREPROCESSOR

#define SOME PREPROCESSOR \
MULTI \
LINE

// Some comment with a \n.
/* Some comment with a \n. */
String s = "Some comment with a \n.";
String s = 'Some comment with a \n.';
span class = "test";

String s = "void somefunc() {}";

// Commented out finction.
// void somefunc() {}

template <typename HelloWorld, int Me> constexpr requires (is_string<Hi>::value)
template <
	typename HelloWorld,
	int Me
> constexpr requires (
	is_string<Hi>::value ||
	is_string<Hi>::value &&
	SomeVal == 1
)
class MyClass : public BaseClass1, BaseClass2 {
	
	constexpr friend static inline
	Array<Array, Int> somefunc(Int i = 0) {
		#if somevar
		String s = 0;
		#endif
		return 0;
	}
	
	constexpr friend static inline
	String somefunc(Array<Array, Int> a = 0, vlib::types::Array<Array, Int> b = "<", const vlib::types::Array<vlib::types::Array, String>* c = 0) {
		String s = 0;
		const String s = 0;
		static const String s = 0;
		static inline constexpr String &s = 0;
		static inline constexpr String* s = 0;
		static inline constexpr vlib::types::String* s = 0;
		vlib::types::String;
		Array<Array, Int> a = 0;
		vlib::types::Array<Array, Int> b = "<";
		const vlib::types::Array<vlib::types::Array, String>* c = 0;
		Array<Array, Int> a (0);
		Array<Array, Int> a {0};
		return Array<Array, Int> {};
		return Array<Array, Int> ();
		return 0;
	}
	
	constexpr friend static inline
	String some_header_func(Int i = 0, const Int c = 0, const Int& c = 0, const Int* c = 0, const Int &c = 0, const Int...&& c = 0, const Int *c = 0, static inline constexpr Int *c = 0);
	
	constexpr friend static inline
	String somefunc(Int i = 0) {
		String s = 0;
		return 0;
	}
	
	constexpr friend static inline
	vlib::types::Array<vlib::types::Array, Int> somefunc(Int i = 0) {
		String s = 0;
		return 0;
	}
	
	constexpr friend static inline
	String somefunc(
		Int<Array, Int> a = 0,
		Int<Array, Int> b = "<",
		Int<Array, String> c = 0
	) {
		String s = 0;
		return 0;
	}
	
	constexpr friend static inline
	String somefunc(
		// Comment 1.
		Int<Array, Int> a = 0, // Comment 2.
		Int<Array, Int> b = "<",
		/* Comment 3 */
		Int<Array, String> c = 0
	) {
		String s = 0;
		String s("a likkle fucker");
		String s{"a likkle fucker"};
		return 0;
		return {
			
		};
		return HI();
		return HI ();
		return HI(
			
		);
		return HI (
			
		);
		return HI{};
		return HI {};
		return HI{
			
		};
		return HI {
			
		};
	}
	
	constexpr friend static inline
	String somefunc(Int<Array, Int> i = Array<Int>()) {
		String s = 0;
		return 0;
	}
	
	constexpr friend static inline
	String somefunc_with_cb(Int i = {}) {
		String s = 0;
		return 0;
	}
	
	constexpr friend static inline
	String somefunc_with_cb(Int i = Dict{{"a", 0}, {"b", false}}) {
		String s = 0;
		return 0;
	}
	
	constexpr friend static inline
	String somefunc_with_p(Int i = __builtin_function()) {
		String s = 0;
		return 0;
	}
	
}

// Add js.
constexpr void add_data_to_js(String& js, const Code& data) {
	for (auto& i: data.iterate()) {
		if (
			i.is_comment() ||
			(i.is_code() && (
				(js.last() == '\n' && i.character() == '\n') ||
				(js.last() == ' ' && i.character() == ' ') ||
				(i.character() == '\t') ||
				((i.character() == ' ' || i.character() == '\t') && i.next() == '\n')
			))
		) {
			continue;
		} else {
			js.append(i.character());
		}
	}
}

int main() {
	
	/*
	 Some multi
	 Line
	 Comment
	 */
	
	String s = "I am a string";
	String s = 'I am a string';
	String s = "I 'am' a string";
	String s = "I \"am\" a string";
	
	Int i = 0;
	Int i = 1+1;
	Int i = 1*1;
	
	Bool b = true;
	Bool b = false;
	Bool b =true;
	Bool b = true+false;
	
	// Some init with ().
	String mystr();
	
	// Init js.
	String js;
	String
	mystr;
	js <<
	"/*" "\n"
	" * Author: Daan van den Bergh" "\n"
	" * Copyright: © 2022 - 2023 Daan van den Bergh." "\n"
	" */" "\n";
	
	// Dir.
	Path dir = Path(__FILE__).base(2).join("include/vweb/js");
	Array<Path> paths;
	
	// Define paths in order.
	for (auto& path: Array<Path>{
		dir.join("ui/element.js"),
	}) {
		paths.append(path);
		Code data = path.load();
		add_data_to_js(js, data);
	}
	
	// Parse.
	for (auto& path: dir.paths(true)) {
		if (path.full_name() != "vweb.js" && path.extension() == "js") {
			if (paths.contains(path)) {
				continue;
			}
			paths.append(path);
			Code data = path.load();
			add_data_to_js(js, data);
		}
	}
	js.save(dir.join("vweb.js"));
	print("Bundled into ", dir.join("vweb.js"), ".");
}
