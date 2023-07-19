/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// Header.
#ifndef VHIGHLIGHT_H
#define VHIGHLIGHT_H

// Includes.
#if __has_include("/Volumes/persistance/private/vinc/vlib/include/vlib/types.h")
	#include "/Volumes/persistance/private/vinc/vlib/include/vlib/types.h"
#elif __has_include("/Users/administrator/persistance/private/vinc/vlib/include/vlib/types.h")
	#include "/Users/administrator/persistance/private/vinc/vlib/include/vlib/types.h"
#else
	#include <vlib/types.h>
#endif

// Shortcuts.
namespace vhighlight {
using namespace vlib::types::shortcuts;
}

// Local includes.
#include "cpp/cpp.h"
#include "cpp/md.h"
#include "cpp/python.h"

// End header.
#endif
