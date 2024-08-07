/* global App, AppSections, Issues, Pages */

"use strict";

Pages.Show = function(root)
{
	this.imgPicture = root.querySelector('section img');
	this.thumbnailsBar = root.querySelector('.thumbnails');
	this.thumbnails = root.querySelector('.thumbnails div');
	this.btAddPicture = root.querySelector('.thumbnails button');
	this.btMessages = root.querySelector('section > .actionButton');
	this.txtDate = root.querySelector('article:nth-child(1) p');
	this.txtLocation = root.querySelector('article:nth-child(2) p');
	this.txtMessage = root.querySelector('article:nth-child(3) p');
	this.camera = new Camera(root.querySelector('.camera'));

	this.default_img = this.imgPicture.getAttribute('src');

	this.pictureUrl = null;

	this.btMessages.addEventListener('click', this.showMessages.bind(this));
	this.imgPicture.addEventListener('click', function()
	{
		this.camera.show();
	}.bind(this)); // fix for safari
	this.btAddPicture.addEventListener('click', this.showCamera.bind(this));
	this.camera.onAccept = this.acceptPicture.bind(this);
};
Pages.Show.prototype.issue = null;
Pages.Show.prototype.load = function(issue)
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

	if (this.issue.files.length > 0)
		this.imgPicture.setAttribute('src', this.issue.files[0].asURLObject());
	else
		this.imgPicture.setAttribute('src', this.default_img);

	this.thumbnailsBar.classList.toggle('hidden', this.issue.files.length === 0);

	let imgPicture = this.imgPicture;
	this.thumbnails.innerHTML = '';
	for (let f of this.issue.files)
	{
		let img = document.createElement('img');
		img.setAttribute('src', f.asURLObject());
		img.addEventListener('click', function()
		{
			imgPicture.setAttribute('src', f.asURLObject());
		});
		this.thumbnails.appendChild(img);
	}

	this.txtDate.innerText = this.issue.getUpdated().toLongString();

	if (this.issue.location.address)
	{
		this.txtLocation.innerText = this.issue.location.address;
		this.txtLocation.parentElement.classList.toggle('hidden', false);
	}
	else
		this.txtLocation.parentElement.classList.toggle('hidden', true);

	this.txtMessage.innerText = '';
	for (let m of this.issue.messages)
		this.txtMessage.innerHTML += `<span>${m.text}</span>`;

	this.txtMessage.scrollTop = this.txtMessage.scrollHeight;

	if (this.issue.internal.unread > 0)
	{
		this.issue.internal.unread = 0;
		this.issue.save();
	}
};
Pages.Show.prototype.showCamera = function()
{
	this.camera.show();
};
Pages.Show.prototype.acceptPicture = function(picture)
{
	if (picture === null)
		return;

	this.imgPicture.setAttribute('src', picture);
	let file = new File();
	file.setContent(picture);
	file.filename = 'pic' + (this.issue.files.length + 1) + '.jpg';
	this.issue.files.push(file);
	this.issue.save();

	this.load(this.issue);
};
Pages.Show.prototype.showMessages = function()
{
	App.getInstance().activateSection(AppSections.Messages, this.issue);
};
Pages.Show.prototype.actionMap = function()
{
	let map = App.getInstance().getMap();

	if (this.issue.location.gps.isSet())
		map.setMarker([this.issue.location.gps.latitude, this.issue.location.gps.longitude], this.issue.location.gps.accuracy);

	map.show(true);
};