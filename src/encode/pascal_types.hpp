/* Library to deal with legacy Pascal (e.g. Borland Turbo Pascal) data types */

/****************************************************************************
 * @format.tab-size 4		(Plain Text/Source Code File Header)			*
 * @format.use-tabs true	(see http://www.synchro.net/ptsc_hdr.html)		*
 *																			*
 * Copyright Rob Swindell - http://www.synchro.net/copyright.html			*
 *																			*
 * This library is free software; you can redistribute it and/or			*
 * modify it under the terms of the GNU Lesser General Public License		*
 * as published by the Free Software Foundation; either version 2			*
 * of the License, or (at your option) any later version.					*
 * See the GNU Lesser General Public License for more details: lgpl.txt or	*
 * https://www.gnu.org/licenses/old-licenses/lgpl-2.0.html					*
 *																			*
 * For Synchronet coding style and modification guidelines, see				*
 * http://www.synchro.net/source.html										*
 *																			*
 * Note: If this box doesn't appear square, then you need to fix your tabs.	*
 ****************************************************************************/
 
#include <climits>
#include <cstdint>
#include <algorithm>    // std::min
#include <type_traits>
#include "gen_defs.h"
#include "endian.hpp"

namespace Pascal {

// Statically-allocated String
template <size_t size>
class String {
	static_assert(size <=  UCHAR_MAX, "Pascal::String size cannot be > 255");
	uint8_t buf[size + 1]{};
public:
	// Current string length (ala std::string::length)
	size_t length() { 
		return buf[0]; 
	}
	// Maximum string length (ala std::string::max_size)
	size_t max_size() const {
		return size;
	}
	void operator = (const char* s) {
		using std::min;
		memset(buf, 0, size);
		buf[0] = (uint8_t)min(size, strlen(s));
		memcpy(buf + 1, s, length());
	}
};

// Boolean is an 8-bit integer with only 2 possible values: TRUE and FALSE
class Boolean {
	int8_t value{};
public:
	void operator = (int nval) {
		// Insure only TRUE or FALSE are stored in Booleans
		value = INT_TO_BOOL(nval);
	}
	int8_t operator = (const Boolean&) {
		return value;
	}
};

// All multi-byte integer data types are all implicitly little-endian (x86),
// so provide automatic byte-swap (on big-endian systems) during assignment operations.

using Integer   = LittleEndInt<int16_t>;  // Integer is a 16-bit signed integer
using Word      = LittleEndInt<uint16_t>; // Word is a 16-bit unsigned integer
using LongInt   = LittleEndInt<int32_t>;  // LongInt is a 32-bit signed integer
using LongWord  = LittleEndInt<uint32_t>; // LongWord is a 32-bit unsigned integer
using Byte      = uint8_t;                // Byte is an 8-bit unsigned integer
using Char      = char;                   // Char is an 8-bit char

} // namespace Pascal
