/* global APP_VERSION, DEVEL_MODE, Issues */

"use strict";

const MESSAGE_DIALOG_TIMEOUT = 2 * 1000;
const ANONIMOUS_USER_ID = 'anonymous';
const API_REALM = '{{ .Site.Params.settings.apiRealm }}';
const STORAGE_KEY_SETTINGS = 'config:settings';

var Pages = {};

const AppSections =
{
	New: 'new',
	Sent: 'issues',
	IssueShow: 'show',
	Messages: 'messages',
	Settings: 'settings',
	Privacy: 'privacy',
	About: 'about'
};

function Settings()
{
	this.config =
	{
		auth:
		{
			user: null,
			pwd: null
		}
	};

	this.load();
};
Settings.prototype.getUsername = function()
{
	if (this.config.auth.user)
		return atob(this.config.auth.user);

	return null;
};
Settings.prototype.getPassword = function()
{
	if (this.config.auth.pwd)
		return atob(this.config.auth.pwd);

	return null;
};
Settings.prototype.getUserId = function()
{
	if (this.getUsername())
		return this.getUsername();

	return ANONIMOUS_USER_ID;
};
// credentials are not securely stored until Credential Management API is widely supported
Settings.prototype.save = function(user, passwd)
{
	if (user)
	{
		if (!user.endsWith(API_REALM))
			user += API_REALM;

		this.config.auth.user = btoa(user);
	}
	else
		this.config.auth.user = null;

	if (passwd)
		this.config.auth.pwd = btoa(passwd);
	else
		this.config.auth.pwd = null;

	localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(this.config));
};
Settings.prototype.load = function()
{
	let stored = JSON.parse(localStorage.getItem(STORAGE_KEY_SETTINGS));
	if (!stored)
		return;

	if (stored.auth && stored.auth.user)
		this.config.auth.user = stored.auth.user;
	if (stored.auth && stored.auth.pwd)
		this.config.auth.pwd = stored.auth.pwd;
};

function App()
{
	App._instance = this;

	saveCurrentLanguage();

	this.menu = document.getElementById('menu');
	if (this.menu)
		this.menu.js = new Pages.Menu(this.menu);

	this.dialog = document.querySelector('dialog');
	this.dialogCompat(this.dialog);

	this.titleBar = document.getElementById('titleBar');
	this.btMenuToggle = document.getElementById('btMenuToggle');
	this.btBack = document.getElementById('btBack');
	if (this.btBack) this.btBack.addEventListener('click', function()
	{
		history.back();
	});

	window.addEventListener('hashchange', function()
	{
		this.activateLocationHashSection();
	}.bind(this));

	this.actions = document.getElementById('actions');
	this.loadActions();

	this.map = null;
};
App.prototype.menu = null;
App.prototype.titleBar = null;
App.prototype.sections = new Array();
App.prototype.currentSection = null;
App.prototype.settings = new Settings();
App.getInstance = function()
{
	if (!App._instance)
		App._instance = new App();

	return App._instance;
};
App.prototype.dialogCompat = function(dlg)
{
	if (!dlg)
		return;

	// compat with older browsers
	if (typeof dlg.show === 'undefined')
	{
		dlg.classList.toggle('hidden', true);
		dlg.show = function()
		{
			dlg.classList.toggle('hidden', false);
		};
	}
	else
		dlg.classList.toggle('hidden', false); // remove compatibility class, not needed if show is supported

	if (typeof dlg.close === 'undefined')
	{
		dlg.close = function()
		{
			dlg.classList.toggle('hidden', true);
		};
	}
};
App.prototype.load = function()
{
	this.loadSections();
	this.activateLocationHashSection();

	Issues.getInstance().sync();
};
App.prototype.loadSections = function()
{
	let base = document.getElementById('sections');
	for (let child of base.children)
	{
		this.sections[child.id] = child;
		switch (child.id)
		{
			case AppSections.New:
				child.js = new Pages.New(child);
				break;
			case AppSections.IssueShow:
				child.js = new Pages.Show(child);
				break;
			case AppSections.Sent:
				child.js = new Pages.Sent(child);
				break;
			case AppSections.Messages:
				child.js = new Pages.Messages(child);
				break;
			case AppSections.Settings:
				child.js = new Pages.Settings(child);
				child.js.onChangeAuth = this.settings.save.bind(this.settings);
				break;
		}
	}
};
App.prototype.loadActions = function()
{
	if (!this.actions)
		return;

	for (const action of this.actions.children)
	{
		const btn = document.getElementById(action.id);
		btn.addEventListener('click', function()
		{
			const jsObj = this.currentSection.js;
			// if the section has a method with the action name, call it
			if (jsObj && jsObj[btn.id])
				jsObj[btn.id].apply(jsObj);
		}.bind(this));
	}
};
App.prototype.activateActions = function(section)
{
	// show action buttons for which there is an event listener (actionId())
	for (const action of this.actions.children)
	{
		const managed = section.js && typeof section.js[action.id] !== 'undefined';
		action.classList.toggle('hidden', !managed);
	}
};
App.prototype.activateSection = function(appSection, ...args)
{
	this.hideMap();

	if (this.currentSection)
		this.currentSection.classList.remove('active');

	this.currentSection = this.sections[appSection];
	this.currentSection.classList.add('active');

	document.title = this.currentSection.getAttribute('data-title');

	this.setTitle(document.title);

	if (typeof DEVEL_MODE !== 'undefined')
		document.title += ' (' + APP_VERSION + ')';

	if (typeof this.currentSection.js !== "undefined")
		this.currentSection.js.load.apply(this.currentSection.js, args);

	if (appSection !== AppSections.New)
		window.location.hash = appSection;

	this.btBack.classList.toggle('hidden', appSection === AppSections.New);
	this.menu.js.setAvailable(appSection === AppSections.New);

	this.menu.js.close();

	this.activateActions(this.currentSection);
};
App.prototype.activateLocationHashSection = function()
{
	let hash = window.location.hash.slice(1);

	if (this.currentSection && this.currentSection.id === hash)
		return;

	if (hash)
		this.activateSection(hash);
	else
		this.activateSection(AppSections.New);
};
App.prototype.setTitle = function(title)
{
	this.titleBar.innerText = title;
};
App.prototype.showMessage = function(msg)
{
	if (!this.dialog)
		return;

	let dialog = this.dialog;

	dialog.innerText = msg;
	dialog.show();
	setTimeout(function()
	{
		dialog.close();
	}, MESSAGE_DIALOG_TIMEOUT);
};
App.prototype.getMap = function()
{
	if (!this.map)
	{
		this.map = new Map(document.getElementById('mapa'));
		this.map.initialize();
	}

	return this.map;
};
App.prototype.hideMap = function()
{
	if (!this.map)
		return;

	this.map.hide();
};
