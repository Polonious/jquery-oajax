/*
 * OAjax jQuery plugin
 * Perform an asynchronous HTTP (Ajax) request with OAuth
 *
 * @copyright 2012 Polonious Pty Ltd.
 * @website https://github.com/polonious/jquery-oajax/
 * @author Ted Liang <tedliang[dot]email[at]gmail[dot]com>
 * @version 1.0
 *
 * Licensed under the MIT License
 * http://www.opensource.org/licenses/mit-license.php
 */
(function($) {

	"use strict";

	var tokens = {},

	oauth = {
		baseUrl: "",
		tokenUrl: "/oauth/token",
		grantType: "owner"
	},

	method = {
		mixin: 		$.extend,
		isFunction: $.isFunction,

		xhr: 		$.ajax,
		xhrMethod: 	"type",
		xhrDataType:"dataType",

		deferred: 	$.Deferred,
		when: 		$.when,
		then: 		"pipe",
		done:		"done",
		isFulfilled:function(process){
			return process.state() != "pending";
		}
	},

	loginProcess = method.deferred(),

	getUrl = function(path){
		return (oauth.baseUrl && path.indexOf(oauth.baseUrl)==-1) ?
				oauth.baseUrl + path : path;
	},

	initLoginProcess = function(){
		loginProcess.credentialProcess = method.deferred();
		loginProcess.tokenPromise = loginProcess.credentialProcess[method.then](function(credential){
			return tokenProcess("owner", credential);
		});
		// TODO: implement loginProcess timeout
	},

	tokenProcess = function(grantType, data){
		var tokenSettings = {
				url: getUrl(oauth.tokenUrl),
				data: data,
				headers: {Authorization: "Basic "+oauth.client}
			};
		tokenSettings[method.xhrMethod] = "post";
		tokenSettings[method.xhrDataType] = "json";
		return method.xhr(tokenSettings)[method.done](function(token){
			token.timestamp = new Date().valueOf();
			tokens[grantType] = token;
			return token;
		});
	},

	isTokenValid = function(token){
		return token && token.expires_in * 1000 >= (new Date().valueOf() - token.timestamp);
	},

	hasRefreshToken = function(token){
		return token && token.refresh_token;
	},

	getToken = function(grantType){
		var token = tokens[grantType];
		if(isTokenValid(token)){
			return token;
		}
		else if(hasRefreshToken(token)){
			// handle refreshToken expire?
			return tokenProcess(grantType,
					{grant_type: "refresh_token", refresh_token: token.refresh_token});
		}
		else if(grantType=="client"){
			return tokenProcess(grantType,
					{grant_type: "client_credentials"});
		}
		else{
			// call the login function, solved loginProcess directly if credential returned
			if(method.isFunction(oauth.login)){
				var credential = oauth.login();
				if(credential && credential.username){
					login(credential.username, credential.password);
				}
			}
			return loginProcess.tokenPromise;
		}
	},

	parseOptions = function(url, options){
		if ( typeof url === "object" ) return url;
		options = options || {};
		if(url) options.url = url;
		return options;
	},

	init = function(settings) {
		method.mixin(oauth, settings);
		initLoginProcess();
	},

	login = function(username, password) {
		if(method.isFulfilled(loginProcess.credentialProcess)) initLoginProcess();
		loginProcess.credentialProcess.resolve({
			grant_type: "password",
			username: username,
			password: password
		});
		return loginProcess.tokenPromise;
	},

	oajax = function(url, options) {
		options = parseOptions(url, options);
		var grantType = (options.grantType || oauth.grantType).toLowerCase();
		return method.when(getToken(grantType))[method.then](function(token){
			options.url = getUrl(options.url);
			options.headers = method.mixin(options.headers, {
				Authorization: "Bearer "+token.access_token
			});
	    	return method.xhr(options);
		});
	},

	// short hands for $.oajax.get/post/put/del
	omethod = function(xhrMethod, hasData){
		return hasData ?
			function(url, data, dataType){
				var options = parseOptions(url);
				options[method.xhrMethod] = xhrMethod;
				if(data){
					options.data = data;
					if(dataType){
						options[method.xhrDataType] = dataType;
					}
				}
				return oajax(options);
			} :
			function(url, options) {
				options = parseOptions(url, options);
				options[method.xhrMethod] = xhrMethod;
				return oajax(options);
			};
	};

	$.oajax = oajax;
	$.oajax.init = init;
	$.oajax.login = login;

	$.oajax.get = omethod("get", false);
	$.oajax.post= omethod("post",true);
	$.oajax.put = omethod("put", true);
	$.oajax.del = omethod("del", false);

})(jQuery);