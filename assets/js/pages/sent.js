/* global App, AppSections, Issues, Pages */

"use strict";

Pages.Sent = function(root)
{
	this.ul = root.querySelector('ul');
};
Pages.Sent.prototype.load = function()
{
	this.ul.textContent = '';

	Issues.getInstance().sortByLocalityUpdated();

	let locality = null;
	for (let issue of Issues.getInstance())
	{
		if (issue.location.locality !== locality)
		{
			locality = issue.location.locality;
			let li = document.createElement('li');
			li.innerText = locality || '-';
			li.classList.add('header');
			this.ul.appendChild(li);
		}

		let li = document.createElement('li');
		this.ul.appendChild(li);

		if (issue.messages.length > 0)
			li.innerText = issue.messages[issue.messages.length - 1].text;

		if (issue.internal.unread > 0)
			li.innerText += ' (' + issue.internal.unread + ')';

		li.onclick = function()
		{
			App.getInstance().activateSection(AppSections.IssueShow, issue);
		};

		let img = document.createElement('img');
		li.appendChild(img);
		if (issue.files.length > 0)
			img.src = issue.files[0].asURLObject();
		else
			img.src = '/img/image-off-outline.svg';

		let subtext = document.createElement('span');
		li.appendChild(subtext);
		subtext.innerText = issue.getUpdated().toShortString();
	}
};