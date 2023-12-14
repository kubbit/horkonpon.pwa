/* global L */

"use strict";

function Map(root)
{
	this.root = root;
	this.map = null;

	this.btClose = root.querySelector('button.close');
	this.btClose.addEventListener('click', function(e)
	{
		this.hide();
		e.stopPropagation();
	}.bind(this));

	this.resolve = null;
}
Map.OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
Map.OSM_TILE_LAYER = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
Map.DEFAULT_ACCURACY = 1;
Map.DEFAULT_VIEW = [40.413496, -3.735352];
Map.DEFAULT_ZOOM = 5;
Map.MARKER_ZOOM = 17;
Map.prototype.show = async function(readonly)
{
	this.readonly = readonly;

	this.root.classList.toggle('collapsed', false);

	this.initialize();

	return new Promise((resolve) =>
	{
		this.resolve = resolve;
	});
};
Map.prototype.hide = function()
{
	const myself = this;

	if (this.map.marker)
	{
		const pos =
		{
			latitude: myself.map.marker.getLatLng().lat,
			longitude: myself.map.marker.getLatLng().lng,
			accuracy: myself.map.marker.accuracy
		};
		this.resolve(pos);
	}
	else
		this.resolve(null);

	this.root.classList.toggle('collapsed', true);
};
Map.prototype.initialize = function()
{
	if (this.map !== null)
		return;

	this.map = L.map(this.root.id).setView(Map.DEFAULT_VIEW, Map.DEFAULT_ZOOM);
	L.tileLayer(Map.OSM_TILE_LAYER,
	{
		attribution: Map.OSM_ATTRIBUTION
	}).addTo(this.map);

	let myself = this;
	function onMapClick(e)
	{
		if (myself.readonly)
			return;

		const HIDE_DELAY = 1.5 * 1000;

		myself.setMarker(e.latlng);

		setTimeout(function()
		{
			myself.hide();
		}, HIDE_DELAY);
	}

	this.map.on('click', onMapClick);
};
Map.prototype.clearMarker = function()
{
	if (!this.map || !this.map.marker)
		return;

	this.map.marker.remove();
	this.map.marker = null;

	if (this.map.circle)
	{
		this.map.circle.remove();
		this.map.circle = null;
	}
};
Map.prototype.setMarker = function(latlng, accuracy)
{
	if (!this.map)
		return;

	if (!this.map.marker)
		this.map.marker = L.marker(latlng).addTo(this.map);

	this.map.marker.setLatLng(latlng);

	if (this.map.circle)
	{
		this.map.circle.remove();
		this.map.circle = null;
	}

	if (accuracy)
	{
		const CIRCLE_OPTIONS =
		{
			color: '#33b5e5',
			fillColor: '#1e92c1',
			fillOpacity: 0.10,
			radius: accuracy
		};
		this.map.circle = L.circle(latlng, CIRCLE_OPTIONS).addTo(this.map);
	}
	else
		accuracy = Map.DEFAULT_ACCURACY;

	this.map.marker.accuracy = accuracy;

	let zoom = this.map.getZoom();
	if (zoom < Map.MARKER_ZOOM)
		zoom = Map.MARKER_ZOOM;

	this.map.setView(latlng, zoom);
};