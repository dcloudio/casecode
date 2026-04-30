package com.dcloud.cmark
// 这个 so 库来源 /Users/dcloud_linju/Desktop/appCode/cmark-gfm 和 markdown-converter
class MainActivity {
    companion object {
        init {
            System.loadLibrary("cmark")
        }
    }
		// md2json 函数声明
		external fun md2json(text: String): String
}