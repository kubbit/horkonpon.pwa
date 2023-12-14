"use strict";

function Camera(root)
{
	this.fileInput = root;

	this.img = document.createElement("img");

	this.onChange = function()
	{
		const [file] = this.fileInput.files;
		if (!file)
			return;

		if (file.type !== 'image/jpeg')
			return;

		this.img.src = URL.createObjectURL(file);
	};
	this.afterLoad = async function()
	{
		let picture = await this.resize(this.img);

		if (this.onAccept)
			this.onAccept(picture);
	};

	this.fileInput.addEventListener("change", this.onChange.bind(this));
	this.img.addEventListener("load", this.afterLoad.bind(this));
}
Camera.prototype.show = function()
{
	this.fileInput.click();
};
Camera.prototype.resize = async function(img)
{
	const MAX_SIZE = 600;

	let width = img.width;
	let height = img.height;

	let ratio = width / height;
	if (ratio > 0)
	{
		width = MAX_SIZE;
		height = width / ratio;
	}
	else
	{
		height = MAX_SIZE;
		width = height * ratio;
	}

	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;

	canvas.getContext('2d').drawImage(img, 0, 0, width, height);

	return canvas.toDataURL('image/jpeg');
};
Camera.prototype.onAccept = null;