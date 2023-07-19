/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// Header.
#ifndef VLIB_CLI_T_H
#define VLIB_CLI_T_H

// Namespace vlib.
namespace vlib {

// Authentication methods.
enum auth {
	key = (1u << 0),
	token = (1u << 1),
	sign = (1u << 2),
};



// Cast with return.
/* docs {
	@title: To string
	@type: String
	@description:
		Concatenate arg(s) to a `String`.
	@usage:
		to_str("Hello", " ", "World!") ==> "Hello World!";
		to_str(true) ==> "true";
		to_str("Bool: ", true) ==> "Bool: true";
		to_str(1) ==> "1";
		to_str("Int: ", 1) ==> "Int: 1";
		to_str(0.1) ==> "0.100000";
		to_str("Double: ", 0.1) ==> "Double: 0.100000";
		to_str(1, " == ", 1, " = ", 1 == 1) ==> "1 == 1 = true";
} */
template <typename... Args> inline constexpr
auto 	to_str(Args&&... args);

// ---------------------------------------------------------
// CLI Type.

/* @docs {
	@chapter: CLI
	@title: CLI
	@description:
		CLI type to create cli applications.
	@usage:
		#include <vlib/cli.h>
		int main(int argc, char** argv) {
			vlib::cli_t cli(argc, argv);
			...
		}
} */

struct cli_t : protected String {
		
	// ---------------------------------------------------------
	// Attributes.
	
	Array<String> 			m_args;		// {arg, arg}
	dict_t<String, String>	m_docs;		// {chapter: docs}
	
	// ---------------------------------------------------------
	// Constructor.
	
	// Default constructor.
	/* @docs {
		@title: Constructor
		@description:
			Construct the cli object with the `argc` and `argv` arguments.
	 
			- Hello World!
			  Ok.
		@usage:
			#include <vlib/cli.h>
			int main(int argc, char** argv) {
				vlib::cli_t cli(argc, argv);
				...
			}
		@warning: Causes undefined behaviour.
		@warning: And some other warning.
		@template: {
			@name: x
			@description: Some desc.
		}
		@funcs: 2
	} */
	static template <int x = 0, typename... Air> constexpr
	cli_t(const int& argc = 0, char** argv = { int a = 0, int b = 0 })
	{
		if (argv) {
			for (auto& i: range<>(argc)) {
				m_args.append(argv[i]);
			}
		}
	}
	constexpr
	cli_t(const int& argc = 0, char[][] argv = nullptr)
	{
		if (argv) {
			for (auto& i: range<>(argc)) {
				m_args.append(argv[i]);
			}
		}
	}
	
	// ---------------------------------------------------------
	// Properties.
	
	// Set the docs.
	/* @docs {
		@title: Add docs
		@description:
			Add a docs chapter with a docs string.
		@usage:
			cli.add_docs("Help", to_str(
				"--help: Show the cli documentation."
			));
	} */
	constexpr
	void	add_docs(const String& chapter, const String& docs) {
		m_docs.append(chapter, docs);
	}
	
	// Get the docs string.
	/* @docs {
		@title: Get docs
		@description:
			Get the docs in a string representation.
	 
			Optionally specificy a specific chapter.
		@usage:
			vlib::out << cli.docs();
			vlib::out << cli.docs("Help");
	} */
	constexpr
	auto	docs(const String& chapter = nullptr) {
		String str;
		for (auto& i: m_docs.indexes()) {
			String& key = m_docs.key(i);
			if (chapter.isna() || chapter.eq(key)) {
				str << m_docs.value(i);
			}
		}
		return str;
	}
	
// Private.
private:
	
	// ---------------------------------------------------------
	// Private functions.
	
	// Cast to a bool.
	template <typename As> requires (is_bool<As>::value)
	SICE
	As	cast(const char* data, const ullong& sindex, const ullong&) {
		switch (data[sindex]) {
			case 'T':
			case 't':
			case '1':
				return true;
			default:
				return false;
		}
	}
	template <typename As> requires (is_bool<As>::value)
	SICE
	As	cast(const String& arg) {
		return cast<As>(arg.data(), 0, arg.len());
	}
	
	// Cast to any integer or floating.
	template <typename As> requires (is_any_integer<As>::value || is_floating<As>::value)
	SICE
	As	cast(const char* data, const ullong& sindex, const ullong& eindex) {
		return tonumeric<As>(data + sindex, eindex - sindex);
	}
	template <typename As> requires (is_any_integer<As>::value || is_floating<As>::value)
	As	cast(const String& arg) {
		return cast<As>(arg.data(), 0, arg.len());
	}
	
	// Cast to a non integral type.
	// - The type requires the function "parse(const char*, const ullong&)" to parse from a string.
	template <typename As> requires (
		!is_integral<As>::value &&
		(is_String<As>::value || !is_Array<As>::value) &&
		!is_dict_t<As>::value &&
		!is_Json<As>::value
	)
	SICE
	As	cast(const char* data, const ullong& sindex, const ullong& eindex) {
		return As::parse(data + sindex, eindex - sindex);
	}
	template <typename As> requires (
		!is_integral<As>::value &&
		(is_String<As>::value || !is_Array<As>::value) &&
		!is_dict_t<As>::value &&
		!is_Json<As>::value
	)
	SICE
	As	cast(const String& arg) {
		return As::parse(arg.data(), arg.len());
	}

	// Cast to an array type.
	template <typename As> requires (!is_String<As>::value && is_Array<As>::value)
	SICE
	As	cast(const String& arg) {
		const char* data = arg.data();
		ullong sindex = 0;
		As obj;
		for (auto& i: arg.indexes()) {
			switch (data[i]) {
				case ',': {
					if (i == 0 || data[i-1] != '\\') {
						obj.append(cast<typename As::value_type>(data, sindex, i));
						sindex = i + 1;
					}
					continue;
				}
				default: break;
			}
		}
		if (sindex < arg.len()) {
			obj.append(cast<typename As::value_type>(data, sindex, arg.len()));
		}
		return obj;
	}
	
	// Cast to dict.
	template <typename As> requires (is_dict_t<As>::value)
	SICE
	As	cast(const String& arg) {
		const char* data = arg.data();
		ullong kstart = 0;
		ullong kend = 0;
		ullong vstart = 0;
		bool is_key = true;
		As obj;
		for (auto& i: arg.indexes()) {
			switch (data[i]) {
				case ':': {
					if (is_key && (i == 0 || data[i-1] != '\\')) {
						kend = i;
						vstart = i + 1;
						is_key = false;
					}
					continue;
				}
				case ',': {
					if (!is_key && (i == 0 || data[i-1] != '\\')) {
						obj.append(
								   cast<typename As::key_type>(data, kstart, kend),
								   cast<typename As::value_type>(data, vstart, i)
						);
						kstart = i + 1;
						vstart = 0;
						is_key = true;
					}
					continue;
				}
				default: break;
			}
		}
		if (!is_key && vstart != 0 && vstart < arg.len()) {
			obj.append(
			   cast<typename As::key_type>(data, kstart, kend),
			   cast<typename As::value_type>(data, vstart, arg.len())
			);
		}
		return obj;
	}
	
// Public.
public:
	
	// ---------------------------------------------------------
	// Functions.
	
	// Length.
	/* @docs {
		@title: Length
		@description:
			Get the arguments length.
		@usage:
			ullong len = cli.len();
	} */
	constexpr
	auto&	len() { return m_args.len(); }
	
	// Check if an argument is present.
	//
	// By id.
	constexpr
	bool	present(const char* id, const ullong& len) {
		for (auto& i: m_args) {
			if (i.eq(id, len)) { return true; }
		}
		return false;
	}
	/* @docs {
		@title: Present
		@description:
			Check if an argument is present.
		@parameter: {
			@name: id
			@description: The id of the requested argument.
		}
		@usage:
			bool present = cli.present("--help");
	} */
	constexpr
	bool	present(const String& id) {
		return present(id.data(), id.len());
	}
	
	// Check if one of the ids is present.
	/* @docs {
		@title: Present
		@description:
			Check if one of multiple arguments is present.
		@parameter: {
			@name: ids
			@description: The array of possible ids of the requested argument.
		}
		@usage:
			bool present = cli.present({"--help", "-h"});
	} */
	constexpr
	bool	present(const Array<String>& ids) {
		for (auto& i: ids) {
			if (present(i.data(), i.len())) {
				return true;
			}
		}
		return false;
	}
	
	// Get an argument.
	//
	// Get by index.
	/* @docs {
		@title: Get
		@description:
			Get an argument by index.
		 @warning:
			 - Will cause a segfault when the index is out of range.
			 - Causes undefined behaviour when casting to a recursive `Array` or `dict_t`.
		 @notes:
			 - Arrays should be formatted like: `--some-array "0,1,2"`.
			 - Dictionaries should be formatted like: `--some-dict "a:0,b:1,c:2"`.
			 - Casting to a `Json` or `JArray` is not supported.
		@parameter: {
			@name: index
			@description: The index of the requested argument.
		}
		@usage:
			String arg = cli.get(0);
	} */
	constexpr
	auto&	get(const ullong& index) {
		return m_args.get(index);
	}
	//
	// Get by id.
	constexpr
	auto	get(const char* id, const ullong& len, const String& def = nullptr) {
		ullong index = 0;
		for (auto& i: m_args) {
			if (i.eq(id, len)) {
				if (index + 1 < m_args.len()) {
					return get(index + 1);
				} else {
					return def;
				}
			}
			++index;
		}
		return def;
	}
	/* @docs {
		@title: Get
		@description:
			Get an argument by id.
	 
			Returns the argument one index after the requested id's index.
		 @warning:
			 - Causes undefined behaviour when casting to a recursive `Array` or `dict_t`.
		 @notes:
			 - Arrays should be formatted like: `--some-array "0,1,2"`.
			 - Dictionaries should be formatted like: `--some-dict "a:0,b:1,c:2"`.
			 - Casting to a `Json` or `JArray` is not supported.
		@parameter: {
			@name: id
			@description: The id of the requested argument.
		}
		@parameter: {
			@name: def
			@description: The returned value when the argument is not present.
		}
		@usage:
			String arg = cli.get("--hello-world");
	} */
	constexpr
	auto	get(const String& id, const String& def = nullptr) {
		return get(id.data(), id.len(), def);
	}
	//
	// Get one of the ids.
	/* @docs {
		@title: Get
		@description:
			Get an argument by multiple id's for the same argument.
	 
			Returns the argument one index after the requested id's index.
		 @warning:
			 - Causes undefined behaviour when casting to a recursive `Array` or `dict_t`.
		 @notes:
			 - Arrays should be formatted like: `--some-array "0,1,2"`.
			 - Dictionaries should be formatted like: `--some-dict "a:0,b:1,c:2"`.
			 - Casting to a `Json` or `JArray` is not supported.
		@parameter: {
			@name: ids
			@description: The array of possible ids of the requested argument.
		 }
		@parameter: {
			@name: def
			@description: The returned value when the argument is not present.
		 }
		@usage:
			String arg = cli.get({"--hello-world", "-hw"});
	} */
	constexpr
	auto	get(const Array<String>& ids, const String& def = nullptr) {
		for (auto& id: ids) {
			ullong index = 0;
			for (auto& arg: m_args) {
				if (id.eq(arg)) {
					if (index + 1 < m_args.len()) {
						return get(index + 1);
					} else {
						return def;
					}
				}
				++index;
			}
		}
		return def;
	}
	
	// Get an argument with a type cast.
	// - Causes undefined behaviour when casting to a recursive array or dictionary.
	// - Does not support casts to json.
	//
	// Get by index.
	/* @docs {
		@title: Get
		@description:
			Get an argument by index with a type cast.
		 @warning:
			 - Will cause a segfault when the index is out of range.
			 - Causes undefined behaviour when casting to a recursive `Array` or `dict_t`.
		 @notes:
			 - Arrays should be formatted like: `--some-array "0,1,2"`.
			 - Dictionaries should be formatted like: `--some-dict "a:0,b:1,c:2"`.
			 - Casting to a `Json` or `JArray` is not supported.
		@parameter: {
			@name: index
			@description: The index of the requested argument.
		}
		@usage:
			int_t arg = cli.get<int_t>(0);
	} */
	template <typename As> constexpr
	As		get(const ullong& index) {
		return cast<As>(m_args.get(index));
	}
	//
	// Get by id.
	template <typename As> constexpr
	As		get(const char* id, const ullong& len) {
		ullong index = 0;
		for (auto& i: m_args) {
			if (i.eq(id, len)) {
				if (index + 1 < m_args.len()) {
					return get<As>(index + 1);
				} else {
					return As();
				}
			}
			++index;
		}
		return As();
	}
	template <typename As> constexpr
	As		get(const char* id, const ullong& len, const As& def) {
		ullong index = 0;
		for (auto& i: m_args) {
			if (i.eq(id, len)) {
				if (index + 1 < m_args.len()) {
					return get<As>(index + 1);
				} else {
					return def;
				}
			}
			++index;
		}
		return def;
	}
	/* @docs {
		 @title: Get
		 @description:
			 Get an argument by id with a type cast.
	  
			 Returns the argument one index after the requested id's index.
		 @warning:
			 - Causes undefined behaviour when casting to a recursive `Array` or `dict_t`.
		 @notes:
			 - Arrays should be formatted like: `--some-array "0,1,2"`.
			 - Dictionaries should be formatted like: `--some-dict "a:0,b:1,c:2"`.
			 - Casting to a `Json` or `JArray` is not supported.
		 @parameter: {
			 @name: id
			 @description: The id of the requested argument.
		 }
		 @usage:
			 int_t arg = cli.get<int_t>("--some-int");
	} */
	template <typename As> constexpr
	As		get(const String& id) {
		return get<As>(id.data(), id.len());
	}
	/* @docs {
		@title: Get
		@description:
			Get an argument by id with a type cast.
	 
			Returns the argument one index after the requested id's index.
		 @warning:
			 - Causes undefined behaviour when casting to a recursive `Array` or `dict_t`.
		 @notes:
			 - Arrays should be formatted like: `--some-array "0,1,2"`.
			 - Dictionaries should be formatted like: `--some-dict "a:0,b:1,c:2"`.
			 - Casting to a `Json` or `JArray` is not supported.
		@parameter: {
			@name: id
			@description: The id of the requested argument.
		}
		@parameter: {
			@name: def
			@description: The returned value when the argument is not present.
		}
		@usage:
			int_t arg = cli.get<int_t>("--some-int", 0);
	} */
	template <typename As> constexpr
	As		get(const String& id, const As& def) {
		return get<As>(id.data(), id.len(), def);
	}
	//
	// Get one of the ids.
	/* @docs {
		@title: Get
		@description:
			Get an argument by multiple id's for the same argument with a type cast.
	 
			Returns the argument one index after the requested id's index.
		 @warning:
			 - Causes undefined behaviour when casting to a recursive `Array` or `dict_t`.
		 @notes:
			 - Arrays should be formatted like: `--some-array "0,1,2"`.
			 - Dictionaries should be formatted like: `--some-dict "a:0,b:1,c:2"`.
			 - Casting to a `Json` or `JArray` is not supported.
		@parameter: {
			@name: ids
			@description: The array of possible ids of the requested argument.
		}
		@usage:
			int_t arg = cli.get<int_t>({"--some-int", "-si"});
	} */
	template <typename As> constexpr
	As		get(const Array<String>& ids) {
		for (auto& id: ids) {
			ullong index = 0;
			for (auto& arg: m_args) {
				if (id.eq(arg)) {
					if (index + 1 < m_args.len()) {
						return get<As>(index + 1);
					} else {
						return As();
					}
				}
				++index;
			}
		}
		return As();
	}
	/* @docs {
		@title: Get
		@description:
			Get an argument by multiple id's for the same argument with a type cast.
	 
			Returns the argument one index after the requested id's index.
		@warning:
			- Causes undefined behaviour when casting to a recursive `Array` or `dict_t`.
		@notes:
			- Arrays should be formatted like: `--some-array "0,1,2"`.
			- Dictionaries should be formatted like: `--some-dict "a:0,b:1,c:2"`.
			- Casting to a `Json` or `JArray` is not supported.
		@parameter: {
			@name: ids
			@description: The array of possible ids of the requested argument.
		}
		@parameter: {
			@name: def
			@description: The returned value when the argument is not present.
		}
		@template: {
			@name: As
			@description: The type to cast the value to.
		}
		@usage:
			int_t arg = cli.get<int_t>({"--some-int", "-si"}, 0);
	} */
	template <typename As> constexpr
	As		get(const Array<String>& ids, const As& def) {
		for (auto& id: ids) {
			ullong index = 0;
			for (auto& arg: m_args) {
				if (id.eq(arg)) {
					if (index + 1 < m_args.len()) {
						return get<As>(index + 1);
					} else {
						return def;
					}
				}
				++index;
			}
		}
		return def;
	}
	
	// Dump docs.
	/* @docs {
		@title: Dump docs
		@description:
			Dump the cli documentation to the console.
	 
			Optionally specify a chapter.
		@parameter: {
			@name: chapter
			@description: The chapter, when the chapter is undefined, the entire docs will be dumped.
		}
		@usage:
			cli.dump_docs();
	} */
	void 	dump_docs(const String& chapter = nullptr) {
		if (m_docs.is_defined()) {
			vlib::out << docs(chapter) << "\n";
		}
	}
	
	// Dump docs, throw an invalid argument(s) error and exit with an exit status
	/* @docs {
		@title: Throw an invalid argument error
		@description:
			Dump the documentation, throw an invalid argument error and exit with an exit status.
		@parameter: {
			@name: chapter
			@description: The chapter, when the chapter is undefined, the entire docs will be dumped.
		}
		@parameter: {
			@name: status
			@description: The exit status.
		}
		@usage:
			cli.throw_invalid();
	} */
	void 	throw_invalid(const String& chapter = nullptr, const int& status = 1) {
		if (m_docs.is_defined()) {
			vlib::out << docs(chapter) << "\n";
		}
		vlib::err <<
		colors::bold <<
		colors::red <<
		"error: " <<
		colors::end <<
		"Invalid argument(s)." <<
		"\n";
		exit(status);
	}
	
	// Dump docs, throw a define argument error and exit with an exit status
	/* @docs {
		@title: Throw a define argument error
		@description:
			Dump the documentation, throw a define argument error and exit with an exit status.
		@parameter: {
			@name: arg
			@description: The id of the argument that should be defined.
		}
		@parameter: {
			@name: chapter
			@description: The chapter, when the chapter is undefined, the entire docs will be dumped.
		}
		@parameter: {
			@name: status
			@description: The exit status.
		}
		@usage:
			cli.throw_define_arg("--hello-world");
	} */
	void 	throw_define_arg(const String& arg, const String& chapter = nullptr, const int& status = 1) {
		if (m_docs.is_defined()) {
			vlib::out << docs(chapter) << "\n";
		}
		vlib::err <<
		colors::bold <<
		colors::red <<
		"error: " <<
		colors::end <<
		"Define argument: " << arg << "." <<
		"\n";
		exit(status);
	}
	
	// Throw an error and exit with an exit status
	/* @docs {
		@title: Throw a custom error
		@description:
			Throw a custom error and exit with an exit status.
		@parameter: {
			@name: e
			@description: The custom error message.
		}
		@parameter: {
			@name: status
			@description: The exit status.
		}
		@usage:
			cli.throw_error("Some error.");
	} */
	void 	throw_error(const String& e, int status = 1) {
		vlib::err <<
		colors::bold <<
		colors::red <<
		"error: " <<
		colors::end <<
		e <<
		"\n";
		exit(status);
	}

	// Show a warning.
	/* @docs {
		@title: Throw warning
		@description:
			Throw a custom warning message.
		@parameter: {
			@name: e
			@description: The custom warning message.
		}
		@usage:
			cli.throw_warning("Some warning.");
	} */
	void 	throw_warning(const String& e) {
		vlib::err <<
		colors::bold <<
		colors::yellow <<
		"warning: " <<
		colors::end <<
		e <<
		"\n";
	}
	
	
};

// ---------------------------------------------------------
// End.

}; 		// End namespace vlib.
#endif 	// End header.
