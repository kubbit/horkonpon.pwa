/* global Pages */

"use strict";

Pages.Menu = function(root)
{
	this.menu = root;
	this.available = false;

	this.btMenuToggle = document.getElementById('btMenuToggle');

	this.btMenuToggle.addEventListener('click', this.toggle.bind(this));
	this.menu.addEventListener('click', this.keep.bind(this));

	document.addEventListener('click', this.close.bind(this));

	this.onSwipe = function(node, callback)
	{
		if (!node || !callback)
			return;

		let startPos = null;

		node.addEventListener('touchstart', e =>
		{
			startPos = e.changedTouches[0].clientX;
		});

		node.addEventListener('touchend', e =>
		{
			let endPos = e.changedTouches[0].clientX;

			if (callback && typeof callback === 'function')
				callback(startPos, endPos);

			startPos = null;
		});
	};

	const myself = this;
	const MAX_DISTANCE_FROM_EDGE = 20;
	this.onSwipe(document.querySelector('main'), function(startPos, endPos)
	{
		if (startPos < MAX_DISTANCE_FROM_EDGE && endPos > startPos)
			myself.toggle(null);
	});
	this.onSwipe(root, function(startPos, endPos)
	{
		if (endPos < startPos)
			myself.close();
	});
};
Pages.Menu.prototype.setAvailable = function(available)
{
	this.available = available;
	this.btMenuToggle.classList.toggle('hidden', !available);
};
Pages.Menu.prototype.close = function()
{
	this.menu.classList.toggle('collapsed', true);
};
Pages.Menu.prototype.keep = function(event)
{
	event.stopPropagation();
};
Pages.Menu.prototype.toggle = function(event)
{
	if (!this.available)
		return;

	if (event)
		event.stopPropagation();

	this.menu.classList.toggle('collapsed');
};