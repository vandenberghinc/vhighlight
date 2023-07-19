/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// namespace test {

// Struct B.
struct struct_b {
	
	// Somefunc.
	/* @docs {
	 @title: Somefunc.
	 @alias: somethingother::struct_b::somefunc
	 @description:
	 This is some func.
	 @parameter: {
	 @name: str
	 @description: The string to concatenate.
	 }
	 @usage:
	 // Somefunc!
	 String str0 = "Hello World!";
	 String str1 = " Hello Universe!";
	 str0 = str0.somefunc(str1);
	 }*/
	constexpr
	String& somefunc(const String& str) const {
		...
	}
	
};

// };
