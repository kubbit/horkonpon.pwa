"use strict";

const STORAGE_KEY_LANGUAGE = 'config:lang';

const DEFAULT_LANG = 'eu';

const I18N_LANGS = ['en', 'eu', 'es'];

const I18N_STRINGS =
{
	LOCATION_SEARCHING:
	[
		'Searching location...',
		'Kokapena bilatzen...',
		'Buscando localización...'
	],
	LOCATION_SET:
	[
		'Location set',
		'Kokapena ezarrita',
		'Posición establecida'
	],
	LOCATION_ERROR:
	[
		'Cannot get location. Check GPS is active',
		'Kokapena ezin izan da ezarri. GPS-a aktibo dagoelaz ziurtatu',
		'No se ha podido establecer la posición. Compruebe que el GPS está activado'
	],
	ISSUE_VALIDATION_NO_DATA:
	[
		'You need to send a picture or some text describing the issue',
		'Argazkia edo oharra beharrezkoa da',
		'Es necesario enviar una foto o un comentario'
	],
	CAMERA_NOT_AVAILABLE:
	[
		'Camera not available',
		'Kamera ez dago erabilgarri',
		'Cámara no disponible'
	],
	NEW_MESSAGES:
	[
		'You have new messages',
		'Mezu berriak jaso dituzu',
		'Tienes nuevos mensajes'
	]
};

function i18n(msg)
{
	let langIdx = I18N_LANGS.indexOf(document.documentElement.lang);

	return msg[langIdx];
}

function saveCurrentLanguage()
{
	localStorage.setItem(STORAGE_KEY_LANGUAGE, document.documentElement.lang);
}

function checkLanguage()
{
	let lang = localStorage.getItem(STORAGE_KEY_LANGUAGE) || navigator.language || DEFAULT_LANG;

	if (!I18N_LANGS.includes(lang))
		lang = DEFAULT_LANG;

	window.location = `/${lang}/`;
}