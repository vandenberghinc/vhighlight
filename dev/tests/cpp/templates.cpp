

template <typename X>
void x(X x) {}

template <typename X, String Y>
void x(X x) {}

template <
	typename X,
	String Y,
>
void x(X x) {}

template <
	typename X,
	String Y = myfunc(),
>
void x(X x) {}

template <
	typename X = Array<My, You>,
>
void myfunc2() {}

Array<Me, You> x;
std::Array<Me, You> x;
std::Array<decltype(myfunc())> x;
std::vector<char> x;
myfunc<char>(x);
myfunc<char, int>(x);
myfunc<
	char,
	int,
	String
>(x);

if (x < 0 && y > 1) {

}