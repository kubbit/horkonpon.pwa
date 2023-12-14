/* global App, Issues, Pages, Utils */

"use strict";

Pages.Messages = function(root)
{
	this.container = root.querySelector('section > section');
	this.txtMessage = root.querySelector('textarea');
	this.btSend = root.querySelector('button');
	this.template = root.querySelector('template');
	this.refreshButton = document.getElementById('actionRefresh');
	if (this.refreshButton)
	{
		this.animateSync = function(animate)
		{
			this.refreshButton.classList.toggle('rotate', animate);
		}.bind(this);
	}

	this.btSend.addEventListener('click', this.send.bind(this));

	Utils.swipeListener(this.container, this.actionRefresh.bind(this));
};
Pages.Messages.prototype.issue = null;
Pages.Messages.prototype.load = function(issue)
{
	if (!issue)
	{
		issue = Issues.getInstance().getCurrent();
		if (!issue)
			return;
	}

	this.issue = issue;

	Issues.getInstance().setCurrent(this.issue);

	App.getInstance().setTitle(this.issue.location.toString());

	this.txtMessage.value = '';

	this.container.textContent = '';
	for (let message of this.issue.messages)
	{
		let elMsg = this.template.content.cloneNode(true);

		elMsg.querySelector('p').textContent = message.text;
		if (message.user === App.getInstance().settings.getUserId())
			elMsg.querySelector('article').classList.add('myself');

		let elDate = elMsg.querySelector('aside');
		elDate.textContent = message.date.toShortString();

		this.container.appendChild(elMsg);
	}

	if (this.issue.internal.unread > 0)
	{
		this.issue.internal.unread = 0;
		this.issue.save();
	}

	for (let user of this.issue.users)
	{
		if (user.id !== App.getInstance().settings.getUserId())
		{
			App.getInstance().setTitle(user.fullname);
			break;
		}
	}

	this.container.scrollTop = this.container.scrollHeight;
};
Pages.Messages.prototype.send = function()
{
	if (this.txtMessage.value.trim() === '')
		return;

	let msg = new Message();

	msg.date = getNewDate();
	msg.text = this.txtMessage.value;

	this.issue.messages.push(msg);
	this.issue.save();

	this.load(this.issue);
};
Pages.Messages.prototype.actionRefresh = async function()
{
	if (!this.issue)
		return;

	this.animateSync(true);
	try
	{
		await Issues.getInstance().syncIssue(this.issue);
	}
	finally
	{
		this.animateSync(false);
	}

	if (this.issue.internal.unread > 0)
		this.load(this.issue);
};