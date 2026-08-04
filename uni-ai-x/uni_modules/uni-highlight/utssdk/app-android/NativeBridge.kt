package com.dcloud.scopeparser

class MainActivity {
    companion object {
        init {
            System.loadLibrary("scopeparser")
        }
    }
	external fun addGrammar(langId: String, jsonText: String): Long
	
	external fun tokenizeLine(handle: Long, langId: String, lineText: String): String
	
	external fun destroyHandle(handle: Long)
	
	external fun resetHandle(handle: Long)
}