/* global App, APP_VERSION, I18N_STRINGS */

"use strict";

const API_URL = '{{ .Site.Params.settings.apiUrl }}';
const STORAGE_KEY_ISSUE_PREFIX = 'issue:';
const SESION_STORAGE_CURRENT_ISSUE = 'issueId';
const PRIVATE_KEY = 'internal';

var TNotifyEvent = function(callback, ...args)
{
	if (callback && typeof callback === 'function')
		callback.apply(this, args);
};

// get current date without milliseconds
function getNewDate()
{
	let now = new Date();

	now.setMilliseconds(0);

	return now;
};

Date.prototype.toLongString = function()
{
	const options =
	{
		dateStyle: "full",
		timeStyle: "short"
	};

	return this.toLocaleString(﻿document.documentElement.lang, options);
};
Date.prototype.toShortString = function()
{
	let today = new Date();

	if (this.toDateString() === today.toDateString())
		return this.toLocaleTimeString(﻿document.documentElement.lang, { hour12: false, hour: '2-digit', minute: '2-digit' });
	else
		return this.toLocaleDateString(﻿document.documentElement.lang, { month: 'short', day: 'numeric' });
};

function Utils()
{
}
Utils.swipeListener = function(node, callback)
{
	if (!node || !callback)
		return;

	let atTop = false;
	let atBottom = false;
	let pos = null;

	node.addEventListener('touchstart', e =>
	{
		atTop = node.scrollTop === 0;
		atBottom = node.scrollTop === node.scrollHeight - node.offsetHeight;

		pos = e.changedTouches[0].screenY;
	});

	node.addEventListener('touchend', e =>
	{
		let newPos = e.changedTouches[0].screenY;

		// only fire event when at the edge
		if ((atBottom && newPos < pos)
		 || (atTop && newPos > pos))
		{
			if (callback && typeof callback === 'function')
				callback();
		}
		pos = newPos;
	});
};

function User()
{

};
User.prototype.id = null;
User.prototype.anonymous = true;
User.prototype.fullname = null;

function GPS()
{

}
GPS.prototype.longitude = null;
GPS.prototype.latitude = null;
GPS.prototype.accuracy = null;
GPS.prototype.isSet = function()
{
	return this.latitude !== null;
};

function Location()
{
	this.gps = new GPS();
};
Location.prototype.gps = null;
Location.prototype.locality = null;
Location.prototype.address = null;
Location.prototype.toString = function()
{
	if (this.locality)
		return this.locality;

	return '[' + this.gps.latitude.toFixed(6) + ', ' + this.gps.longitude.toFixed(6) + ']';
};

function Message()
{
	this.date = getNewDate();
	this.user = App.getInstance().settings.getUserId();
};
Message.prototype.date = null;
Message.prototype.user = null;
Message.prototype.text = null;
Message.prototype.isSame = function(message)
{
	if (this.date.getTime() !== message.date.getTime())
		return false;

	if (this.user !== message.user)
		return false;

	if (this.text !== message.text)
		return false;

	return true;
};

function File()
{
	this.date = getNewDate();
	this.user = App.getInstance().settings.getUserId();
};
File.prototype.date = null;
File.prototype.user = null;
File.prototype.filename = null;
File.prototype.content = null;
File.prototype.setContent = function(content)
{
	// remove uri
	let url = content.split(',');
	if (url.length > 1)
		this.content = url[1];
	else
		this.content = content;
};
File.prototype.asURLObject = function()
{
	if (this.content)
		return 'data:image/jpeg;base64,' + this.content;

	return null;
};

function IssueInfo()
{
	this.unread = 0;
}
IssueInfo.prototype.remoteId = null;
IssueInfo.prototype.status = null;
IssueInfo.prototype.lastSync = null;
IssueInfo.prototype.unread = null;

function Issue()
{
	this[PRIVATE_KEY] = new IssueInfo();
	this.app = new Object();
	this.app.os = 'PWA';
	this.app.version = APP_VERSION;
	this.date = getNewDate();
	this.users = new Array();
	this.location = new Location();
	this.messages = new Array();
	this.files = new Array();
	this.user = App.getInstance().settings.getUserId();
}
Issue.prototype.id = null;
Issue.prototype.date = null;
Issue.prototype.user = null;
Issue.prototype.location = null;
Issue.prototype.messages = null;
Issue.prototype.files = null;
Issue.prototype.getUpdated = function()
{
	let updated = this.date;

	for (let m of this.messages)
		if (m.date > updated)
			updated = m.date;

	for (let f of this.files)
		if (f.date > updated)
			updated = f.date;

	return updated;
};
Issue.prototype.getLastSync = function()
{
	return this.internal.lastSync;
};
Issue.prototype.setMessage = function(text)
{
	if (this.messages.length === 0)
		this.messages.push(new Message());

	let message = this.messages[0];
	message.date = getNewDate();
	message.text = text;
};
Issue.prototype.setFile = function(content)
{
	if (this.files.length === 0)
		this.files.push(new File());

	let file = this.files[0];
	file.date = getNewDate();
	file.filename = 'pic' + this.files.length + '.jpg';
	file.setContent(content);
};
Issue.prototype.validate = function()
{
	if (this.messages.length === 0 && this.files.length === 0)
	{
		this.onError(i18n(I18N_STRINGS.ISSUE_VALIDATION_NO_DATA));
		return false;
	}

	if (this.location.gps.longitude === null || this.location.gps.latitude === null)
	{
		this.onError(i18n(I18N_STRINGS.LOCATION_ERROR));
		return false;
	}

	return true;
};
Issue.prototype.internalSave = function()
{
	if (!this.id)
		this.id = Issues.getInstance().length + 1;

	localStorage.setItem(STORAGE_KEY_ISSUE_PREFIX + this.id, this.asPrivateJSON());

	if (!Issues.getInstance().includes(this))
		Issues.getInstance().push(this);

};
Issue.prototype.save = function(notify = true)
{
	if (!this.validate())
		return false;

	this.internalSave();

	if (this.onSave && notify)
		this.onSave(this);

	return true;
};
Issue.prototype.asPrivateJSON = function()
{
	return JSON.stringify(this);
};
Issue.prototype.asJSON = function()
{
	function replacer(key, value)
	{
		// do not include private data
		if (key === PRIVATE_KEY)
			return undefined;

		// remove milliseconds
		if (this[key] instanceof Date)
			return value.replace(/\.\d+/, '');

		return value;
	};

	return JSON.stringify(this, replacer);
};
Issue.fromJSON = function(json)
{
	let issue = new Issue();

	let parsed = JSON.parse(json);

	issue.id = parsed.id;

	issue.date = new Date(parsed.date);
	issue.user = parsed.user;

	if (parsed.internal)
	{
		issue.internal.remoteId = parsed.internal.remoteId;
		issue.internal.lastSync = new Date(parsed.internal.lastSync);
		if (parsed.internal.unread)
			issue.internal.unread = parsed.internal.unread;
	}

	if (parsed.users)
	{
		for (let u of parsed.users)
		{
			let user = new User();

			user.id = u.id;
			user.fullname = u.fullname;

			issue.users.push(user);
		}
	}

	if (parsed.location)
	{
		if (parsed.location.gps)
		{
			issue.location.gps.longitude = parsed.location.gps.longitude;
			issue.location.gps.latitude = parsed.location.gps.latitude;
			issue.location.gps.accuracy = parsed.location.gps.accuracy;
		}
		issue.location.locality = parsed.location.locality;
		issue.location.address = parsed.location.address;
	}

	if (parsed.messages)
	{
		for (let m of parsed.messages)
		{
			let message = new Message();

			message.date = new Date(m.date);
			message.user = m.user;
			message.text = m.text;

			issue.messages.push(message);
		}
	}

	if (parsed.files)
	{
		for (let f of parsed.files)
		{
			let file = new File();

			file.date = new Date(f.date);
			file.user = f.user;
			file.filename = f.filename;
			file.content = f.content;

			issue.files.push(file);
		}
	}

	return issue;
};
Issue.prototype.merge = function(issue)
{
	this[PRIVATE_KEY].remoteId = issue.id;
	this[PRIVATE_KEY].lastSync = getNewDate();

	if (!this.location.locality)
		this.location.locality = issue.location.locality;

	if (issue.users)
	{
		for (let ru of issue.users)
		{
			let found = false;
			for (let iu of this.users)
			{
				if (iu.id === ru.id)
				{
					found = true;
					break;
				}
			}

			if (found)
				continue;

			// not found
			let usr = new User();
			usr.id = ru.id;
			usr.fullname = ru.fullname;
			this.users.push(usr);
		}

	}

	if (issue.messages)
	{
		for (let rm of issue.messages)
		{
			let found = false;
			for (let im of this.messages)
			{
				if (im.isSame(rm))
				{
					found = true;
					break;
				}
			}

			if (found)
				continue;

			// not found, add to issue
			let msg = new Message();
			msg.date = new Date(rm.date);
			msg.user = rm.user;
			msg.text = rm.text;
			this.messages.push(msg);

			this.internal.unread++;
		}
	}
};
Issue.prototype.isOutdated = function()
{
	const OUTDATED_MIN_SYNC_INTERVAL = 60 * 1000;
	const OUTDATED_MEASURE_DIVISOR = 5;

	if (!this.internal.remoteId
	 || !this.getLastSync()
	 || this.getLastSync() < this.getUpdated())
		return true;

	let now = getNewDate().getTime();

	let sinceSync = now - this.getLastSync().getTime();
	if (sinceSync < OUTDATED_MIN_SYNC_INTERVAL)
		return false;

	let sinceUpdate = now - this.getUpdated().getTime();

	return sinceSync > sinceUpdate / OUTDATED_MEASURE_DIVISOR;
};
Issue.prototype.onSave = null;
Issue.prototype.onError = TNotifyEvent;

function Issues()
{
	Issues._instance = this;

	this.api = new API_client(API_URL);
};
Issues.prototype = new Array();
Issues.getInstance = function()
{
	if (!Issues._instance)
	{
		Issues._instance = new Issues();
		Issues._instance.load();
	}

	return Issues._instance;
};
Issues.prototype.getCurrent = function()
{
	// try to load from session
	if (!sessionStorage.getItem(SESION_STORAGE_CURRENT_ISSUE))
		return null;

	let id = Number(sessionStorage.getItem(SESION_STORAGE_CURRENT_ISSUE));

	return Issues.getInstance().getById(id);
};
Issues.prototype.setCurrent = function(issue)
{
	if (!issue)
		return;

	// store current issue in session
	sessionStorage.setItem(SESION_STORAGE_CURRENT_ISSUE, issue.id);
};
Issues.prototype.getById = function(id)
{
	return this.find(issue => issue.id === id);
};
Issues.prototype.push = function(issue)
{
	// call push() from parent class
	Array.prototype.push.call(this, issue);

	issue.onSave = this.sync.bind(this);
};
Issues.prototype.load = function()
{
	let keys = Object.keys(localStorage);
	for (let key of keys)
		if (key.startsWith(STORAGE_KEY_ISSUE_PREFIX))
			this.push(Issue.fromJSON(localStorage.getItem(key)));
};
Issues.prototype.sortByLocalityUpdated = function()
{
	this.sort(function(a, b)
	{
		if (a.location.locality !== b.location.locality)
			return (a.location.locality ?? 'zz').localeCompare(b.location.locality ?? 'zz');
		else
			return b.getUpdated() - a.getUpdated();
	});
};
Issues.prototype.sortByDate = function()
{
	this.sort(function(a, b)
	{
		return b.date - a.date;
	});
};
Issues.prototype.sync = async function()
{
	let unread = 0;

	this.api.setAuth(App.getInstance().settings.getUsername(), App.getInstance().settings.getPassword());

	for (let issue of this)
	{
		if (!issue.isOutdated())
			continue;

		await this.syncIssue(issue);

		unread += issue.internal.unread;
	}

	if (unread > 0)
		App.getInstance().showMessage(i18n(I18N_STRINGS.NEW_MESSAGES));
};
Issues.prototype.syncIssue = async function(issue)
{
	if (!issue)
		return;

	let response = null;

	if (!issue.internal.remoteId)
		response = await this.api.addIssue(issue.asJSON());
	else if (issue.getUpdated() > issue.getLastSync())
		response = await this.api.updateIssue(issue.internal.remoteId, issue.asJSON());
	else if (await this.api.checkIssueUpdates(issue.internal.remoteId, issue.getLastSync()))
		response = await this.api.getIssue(issue.internal.remoteId);

	issue.internal.lastSync = getNewDate();
	issue.internalSave();

	if (!response)
		return;

	console.log(response);

	let remoteIssue = Issue.fromJSON(JSON.stringify(response));
	issue.merge(remoteIssue);
	issue.save(false);
};