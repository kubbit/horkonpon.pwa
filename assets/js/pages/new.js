/* global App, AppSections, Pages */

"use strict";

const LOCATION_SEARCH_DELAY = 2 * 1000;

Pages.New = function(root)
{
	this.imgPicture = root.querySelector('section img');
	this.btSend = root.querySelector('fieldset > button');
	this.txtMessage = root.querySelector('#txtMessage');
	this.camera = new Camera(root.querySelector('.camera'));
	this.pnlAddress = root.querySelector('article');
	this.txtAddress = this.pnlAddress.querySelector('p');

	this.default_img = this.imgPicture.getAttribute('src');

	this.pictureUrl = null;
	this.map = null;

	this.btSend.addEventListener('click', this.send.bind(this));
	this.imgPicture.addEventListener('click', this.showCamera.bind(this));
	this.camera.onAccept = this.acceptPicture.bind(this);

	this.geolocation = new Geolocation();
	this.geolocation.onChange = this.geolocationChange.bind(this);

	this.txtMessage.addEventListener('focus', async function()
	{
		// if granted, try to get location as soon as posible
		if (await this.geolocation.permissionGranted())
			this.geolocation.check();
	}.bind(this));

	this.txtMessage.addEventListener('blur', function()
	{
		if (this.txtMessage.value !== '')
			this.geolocation.check();
	}.bind(this));

	this.clear();
};
Pages.New.prototype.issue = null;
Pages.New.prototype.load = function()
{
	if (this.issue.location.locality)
		App.getInstance().setTitle(this.issue.location.locality);
};
Pages.New.prototype.geolocationChange = function(msg, position)
{
	console.log(msg);
	App.getInstance().setTitle(msg);

	if (typeof position === 'undefined' || position.location === null)
		return;

	this.issue.location.gps.longitude = position.coords.longitude;
	this.issue.location.gps.latitude = position.coords.latitude;
	this.issue.location.gps.accuracy = position.coords.accuracy;

	if (position.locality)
	{
		this.issue.location.locality = position.locality;
		App.getInstance().setTitle(position.locality);
	}

	if (position.address)
	{
		this.issue.location.address = position.address;
		this.pnlAddress.classList.toggle('hidden', false);
		this.txtAddress.innerText = position.address;
	}
	else
		this.pnlAddress.classList.toggle('hidden', true);

	if (this.map)
		this.map.setMarker([this.issue.location.gps.latitude, this.issue.location.gps.longitude], this.issue.location.gps.accuracy);
};
Pages.New.prototype.actionMap = function()
{
	this.map = App.getInstance().getMap();

	if (this.issue.location.gps.isSet())
		this.map.setMarker([this.issue.location.gps.latitude, this.issue.location.gps.longitude], this.issue.location.gps.accuracy);
	else
		this.map.clearMarker();

	this.map.show().then(pos =>
	{
		if (!pos)
			return;

		this.geolocation.set(pos.latitude, pos.longitude, pos.accuracy);
	});
};
Pages.New.prototype.showCamera = async function()
{
	// if granted, try to get location as soon as posible
	if (await this.geolocation.permissionGranted())
		this.geolocation.check();

	this.camera.show();
};
Pages.New.prototype.acceptPicture = function(picture)
{
	if (picture !== null)
	{
		this.imgPicture.setAttribute('src', picture);
		this.issue.setFile(picture);
	}

	this.geolocation.check();
};
Pages.New.prototype.clear = function()
{
	this.issue = new Issue();
	this.issue.onError = function(msg)
	{
		App.getInstance().showMessage(msg);
	};

	this.imgPicture.setAttribute('src', this.default_img);
	this.txtMessage.value = '';
};
Pages.New.prototype.send = function()
{
	if (this.txtMessage.value.trim() !== '')
		this.issue.setMessage(this.txtMessage.value);

	console.log(this.issue.asJSON());

	if (!this.issue.save())
		return;

	App.getInstance().activateSection(AppSections.Sent);
	App.getInstance().activateSection(AppSections.IssueShow, this.issue);

	this.clear();
};