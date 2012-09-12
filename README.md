OAjax jQuery plugin
=====

Summary
---
Perform an asynchronous HTTP (Ajax) request with OAuth

@copyright 2012 Polonious Pty Ltd.

@website https://github.com/polonious/jquery-oajax/

@version 1.0

Licensed under the MIT License
http://www.opensource.org/licenses/mit-license.php

Usage
---

Init
```html
$.oajax.init({
	baseUrl:"http://domain", 
	client:"base64_encoded_string", 
	login: function(){console.log("open login dialog...");}
});
```

Ajax call
```html
$.oajax("/rest/user/profile")
	.done(function(data){console.log(data);})
	.fail(function(jqXHR, textStatus){console.log(textStatus);console.log(jqXHR.responseText);});
$.oajax.post("path", jsonData, "json");
```

Login
```html
$.oajax.login("usernameFromInput", "passwordFromInput")
	.done(function(data){console.log("login successful");console.log(data);})
	.fail(function(jqXHR, textStatus){console.log("login "+textStatus);console.log(jqXHR.responseText);});
```
