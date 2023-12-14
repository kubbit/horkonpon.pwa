/* global App, AppSections, Issues, Pages, TNotifyEvent */

"use strict";

Pages.Settings = function(root)
{
	this.language = root.querySelector('#settings_language');

	this.language.addEventListener('change', function()
	{
		window.location = '/' + this.language.value;
	}.bind(this));

	this.input_user = document.querySelector('#settings_user');
	if (this.input_user)
	{
		this.input_user.value = App.getInstance().settings.getUsername();
		this.input_user.addEventListener('blur', this.changeAuth.bind(this));
	}

	this.input_pwd = document.querySelector('#settings_pwd');
	if (this.input_pwd)
	{
		this.input_pwd.value = App.getInstance().settings.getPassword();
		this.input_pwd.addEventListener('blur', this.changeAuth.bind(this));
	}
};
Pages.Settings.prototype.load = function()
{
	this.language.value = document.documentElement.lang;
};
Pages.Settings.prototype.changeAuth = function()
{
	if (this.onChangeAuth)
		this.onChangeAuth(this.input_user.value, this.input_pwd.value);
};
Pages.Settings.onChangeAuth = TNotifyEvent;