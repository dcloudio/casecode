package com.dcloud.ConvertedToken

data class ktToken(val start: Int, val end: Int, val token: String)
data class ConvertedToken(val start: Int, val end: Int, val token: String)

fun mapByteOffsetsToCharOffsets(text: String, tokens: Array<ktToken>): Array<ktToken> {

    val byteToChar = mutableMapOf<Int, Int>()
    var byteIndex = 0
    var charIndex = 0

    for (ch in text) {
        val encoded = ch.toString().encodeToByteArray()
        repeat(encoded.size) {
            byteToChar[byteIndex] = charIndex
            byteIndex++
        }
        charIndex++
    }

    return tokens.map {
        val startChar = byteToChar[it.start] ?: 0
        val endChar = byteToChar[it.end - 1]?.plus(1) ?: charIndex
        ktToken(startChar, endChar, it.token)
    }.toTypedArray()
}

// 计算一个 code point 编码成 UTF-8 所需的字节数
fun codePointToUtf8Bytes(cp: Int): Int {
    return when {
        cp <= 0x7F -> 1
        cp <= 0x7FF -> 2
        cp <= 0xFFFF -> 3
        else -> 4
    }
}