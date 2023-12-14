/* global App */

"use strict";

window.onerror = function(msg, url, line)
{
	alert(msg + '\n' + url + '\n' + line + '\n');
};


window.onload = function()
{
	if ('serviceWorker' in navigator)
	{
		navigator.serviceWorker.register('/sw.js', {updateViaCache: "none"}).then(function()
		{
			console.log('Service Worker Registered');
			App.getInstance().load();
		});
	}
	else
		App.getInstance().load();
};