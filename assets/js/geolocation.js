/* global I18N_STRINGS, TNotifyEvent */

"use strict";

const MIN_REFRESH_TIME = 30 * 1000;

Geolocation = function(root)
{
	this.checking = false;
};
Geolocation.prototype.location = null;
Geolocation.prototype.date = null;
Geolocation.prototype.onChange = TNotifyEvent;
Geolocation.prototype.permissionGranted = async function()
{
	if (!navigator.geolocation || !navigator.permissions)
		return false;

	let granted = false;
	await navigator.permissions.query({name:'geolocation'})
	.then(result =>
	{
		granted = result.state === 'granted';
	});

	return granted;
};
Geolocation.prototype.set = function(latitude, longitude, accuracy)
{
	this.location =
	{
		coords:
		{
			latitude: latitude,
			longitude: longitude,
			accuracy: accuracy
		}
	};

	this.date = Date.now();
	this.onChange(i18n(I18N_STRINGS.LOCATION_SET), this.location);
	this.reverseGeocode();
};
Geolocation.prototype.check = function()
{
	if (this.checking)
		return;

	// prevent checking again too soon
	let elapsed = Date.now() - this.date ?? 0;
	if (this.location !== null && elapsed < MIN_REFRESH_TIME)
	{
		this.onChange(i18n(I18N_STRINGS.LOCATION_SET), this.location);
		return;
	}

	if (!navigator.geolocation || !navigator.permissions)
	{
		this.onChange(i18n(I18N_STRINGS.LOCATION_ERROR));
		return;
	}

	let myself = this;
	navigator.permissions.query({name:'geolocation'}).then(function(result)
	{
		switch (result.state)
		{
			case 'granted':
			case 'prompt':
				const GEOLOCATION_OPTIONS =
				{
					enableHighAccuracy: true,
					timeout: 20 * 1000,
					maximumAge: 30 * 1000
				};
				function geolocation_success(position)
				{
					myself.checking = false;
					myself.location = position;
					myself.date = Date.now();
					myself.onChange(i18n(I18N_STRINGS.LOCATION_SET), position);

					myself.reverseGeocode();
				};
				function geolocation_error(error)
				{
					myself.checking = false;

					if (myself.location)
						myself.onChange(i18n(I18N_STRINGS.LOCATION_SET), myself.location);
					else
						myself.onChange(i18n(I18N_STRINGS.LOCATION_ERROR));

					console.error(error.message);
				}

				myself.checking = true;
				myself.onChange(i18n(I18N_STRINGS.LOCATION_SEARCHING));
				navigator.geolocation.getCurrentPosition(geolocation_success, geolocation_error, GEOLOCATION_OPTIONS);
				break;

			default:
				// not allowed by user
				if (myself.location)
					myself.onChange(i18n(I18N_STRINGS.LOCATION_SET), myself.location);
				else
					myself.onChange(i18n(I18N_STRINGS.LOCATION_ERROR));
		}
	});
};
Geolocation.prototype.getReverseGeocode = async function(latitude, longitude)
{
	if (!latitude || !longitude)
		return null;

	const REVERSE_GEOCODING_SERVER = 'https://photon.komoot.io/';
	const REVERSE_GEOCODING_QUERY = `reverse?lon=${longitude}&lat=${latitude}&layer=house&lang=default`;

	let r = new Rest_client(REVERSE_GEOCODING_SERVER);
	let response = await r.read(REVERSE_GEOCODING_QUERY);

	if (response.features.length === 0)
		return null;

	return response.features[0].properties;
};
Geolocation.prototype.reverseGeocode = async function()
{
	try
	{
		let prop = await this.getReverseGeocode(this.location.coords.latitude, this.location.coords.longitude);
		if (!prop)
			return;

		this.location.locality = prop.city;
		if (prop.street)
			this.location.address = prop.street;
		if (prop.housenumber)
			this.location.address += ', ' + prop.housenumber;

		if (this.location.locality)
			this.onChange(this.location.locality, this.location);
	}
	catch (e)
	{
		// ignore any errors, reverse geocoding is not required, it's only used as visual help
		console.error(e);
	}
};