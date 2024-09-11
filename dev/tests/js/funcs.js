function func_1(a, b) {}
function func_2(a=1, b=2) {}
function func_3(
	a=1,
	b=2,
) {}
function func_4({
	a=1,
	b=2,
}) {}

const me = static async function () {}

const func1 = function assign_func_1_func(a=1, b=2) {}
const func2 = function assign_func_2(
	a=1,
	b=2,
) {}

const func1 = async function assign_func_1_func(a=1, b=2) {}
const func2 = async function assign_func_2(
	a=1,
	b=2,
) {}


const anon_func_1 = (a=1, b=2) => {}
const anon_func_2 = (
	a=1,
	b=2,
	c = {
		a: "",
		b: "",
		c: function(a, b, c) {},
	},
	d=3,
) => {}

const anon_func_1 = async (a=1, b=2) => {}
const anon_func_2 = async (
	a=1,
	b=2,
) => {}


class Me {
	class_func_1(a=1, b=2) {}
	class_func_2(
		a=1,
		b=2,
	) {}

	async class_func_3(a=1, b=2) {}
	async class_func_4(
		a=1,
		b=2,
	) {}
}

const x = {
	class_func_1: function(a=1, b=2) {},
	class_func_1: async function(a=1, b=2) {},
	class_func_1: (a=1, b=2) => {},
	class_func_1: async (a=1, b=2) => {},

	class_func_2(a=1, b=2) {},
	async class_func_3(a=1, b=2) {},
}
const x = myfunc(y, otherfunc())

const mylib.mynamespace.myfunc = () => {}