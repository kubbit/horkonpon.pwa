/* global APP_VERSION */

"use strict";

const HTTP_METHOD =
{
	HEAD: 'HEAD',
	GET: 'GET',
	POST: 'POST',
	PATCH: 'PATCH',
	PUT: 'PUT',
	DELETE: 'DELETE'
};

const XHR_READY_STATE =
{
	UNSENT: 0,
	OPENED: 1,
	HEADERS_RECEIVED: 2,
	LOADING: 3,
	DONE: 4
};

const HTTP_STATUS =
{
	OK: 200,
	CREATED: 201
};

const FETCH_MODE =
{
	AJAX: 1,
	FETCH: 2
};

const API_KEY_HEADER = 'API-Key';

function Rest_client(base_url, mode)
{
	this.base_url = base_url;

	if (mode)
		this.mode = mode;
	else
		this.mode = FETCH_MODE.FETCH;
}
Rest_client.prototype.auth = null;
Rest_client.prototype.username = null;
Rest_client.prototype.password = null;
Rest_client.prototype.token = null;
Rest_client.prototype.on_error = null;
Rest_client.prototype.create = async function(path, data)
{
	return await this.send_json_request(path, HTTP_METHOD.POST, data);
};
Rest_client.prototype.info = async function(path)
{
	let headers = null;

	await this.send_request(path, HTTP_METHOD.HEAD)
	.then(r =>
	{
		if (r)
			headers = r.headers;
	});

	return headers;
};
Rest_client.prototype.read = async function(path)
{
	return await this.send_json_request(path, HTTP_METHOD.GET);
};
Rest_client.prototype.update = async function(path, data)
{
	return await this.send_json_request(path, HTTP_METHOD.PATCH, data);
};
Rest_client.prototype.delete = async function(path)
{
	return await this.send_json_request(path, HTTP_METHOD.DELETE);
};
Rest_client.prototype.put_file = async function(path, file)
{
	return await this.send_json_request(path, HTTP_METHOD.PUT, file);
};
Rest_client.prototype.send_json_request = async function(path, method, data)
{
	let json = null;

	await this.send_request(path, method, data)
	.then(r =>
	{
		if (r)
			json = r.json();
	});

	return json;
};
Rest_client.prototype.send_request = async function(path, method, data)
{
	if (this.mode === FETCH_MODE.AJAX)
		return await this.ajax_request(path, method, data);
	else
		return await this.fetch_request(path, method, data);
};
Rest_client.prototype.fetch_request = async function(path, method, data)
{
	let options =
	{
		method: method,
		headers:
		{
			'Content-type': 'application/json',
			'User-Agent': 'HorKonpon/2.0 (rv:' + APP_VERSION + ')'
		}
	};

	if (this.username || this.password)
		options.headers.Authorization = 'Basic ' + btoa(this.username + ':' + this.password);

	if (this.token)
		options.headers[API_KEY_HEADER] = this.token;

	if (data)
		options.body = data;

	let response = null;
	await fetch(this.base_url + path, options)
	.then(r =>
	{
		if (!r.ok)
			throw new Error([r.status, r.statusText]);

		response = r;
	})
	.catch(e =>
	{
		console.error(e);
		if (this.on_error !== null && typeof this.on_error !== 'undefined')
			this.on_error(e);
	});

	return response;
};
// compat with older browsers
Rest_client.prototype.ajax_request = async function(path, method, data)
{
	var xhr = new XMLHttpRequest();
	var url = this.base_url + path;

	xhr.open(method, url, true);
	xhr.setRequestHeader('Content-type', 'application/json');
	xhr.setRequestHeader('User-Agent', 'HorKonpon/2.0 (rv:' + APP_VERSION + ')');

	if (this.username || this.password)
		xhr.setRequestHeader('Authorization', 'Basic ' + btoa(this.username + ':' + this.password));

	if (this.token)
		xhr.setRequestHeader(API_KEY_HEADER, this.token);

	return new Promise((resolve, reject) =>
	{
		// simulates fetch response object
		function Ajax_response(request)
		{
			this.request = request;
			this.headers = Rest_client.map_headers(request.getAllResponseHeaders());
		}
		Ajax_response.prototype.json = null;
		Ajax_response.prototype.headers = null;
		Ajax_response.prototype.json = function()
		{
			return JSON.parse(this.request.responseText);
		};

		let result;
		xhr.onload = function(e)
		{
			if (xhr.readyState !== XHR_READY_STATE.DONE)
				return;

			result = new Ajax_response(xhr);

			if (xhr.status === HTTP_STATUS.OK || xhr.status === HTTP_STATUS.CREATED)
				resolve(result);
			else
			{
				console.error(xhr.statusText);
				reject(result);
				if (this.on_error !== null && typeof this.on_error !== 'undefined')
					this.on_error(result);
			}
		};

		xhr.onerror = function(e)
		{
			console.error(xhr.statusText);
			reject(result);
			if (this.on_error !== null && typeof this.on_error !== 'undefined')
				this.on_error(result);
		};

		xhr.send(data);
	});
};
// convert headers text into key => value map
Rest_client.map_headers = function(headers)
{
	// create array with header lines
	const headerList = headers.trim().split(/[\r\n]+/);

	// create a key => value map for each header
	let headerMap = {};
	headerList.forEach((line) =>
	{
		const header = line.split(": ");
		const key = header.shift();
		const value = header.join(": ");

		headerMap[key] = value;
	});

	// add method to simulate fetch response headers
	headerMap.get = function(key)
	{
		return this[key];
	};

	return headerMap;
};