module.exports = {
	"image-captcha":{
		"width": 150, 				//图片宽度
		"height": 44, 				//图片高度                                                     
		"background": "#FFFAE8",	//验证码背景色，设置空字符`''`不使用背景颜色                   
		// "size": 4, 					//验证码长度，最多 6 个字符                                    
		// "noise": 4, 				//验证码干扰线条数                                             
		// "color": false, 			//字体是否使用随机颜色，当设置`background`后恒为`true`         
		// "fontSize": 40, 			//字体大小                                                     
		// "ignoreChars": '', 		//忽略那些字符                                                 
		// "mathExpr": false, 		//是否使用数学表达式                                           
		// "mathMin": 1, 			//表达式所使用的最小数字                                       
		// "mathMax": 9, 			//表达式所使用的最大数字                                       
		// "mathOperator": ''	 	//表达式所使用的运算符，支持 `+`、`-`。不传随机使用
		// "expiresDate":180		//验证码过期时间(s)			
	}
}