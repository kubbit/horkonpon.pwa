/* global Rest_client */

"use strict";

function API_client(base_url)
{
	this.rest = new Rest_client(base_url);
}
API_client.prototype.rest = null;
API_client.prototype.setAuth = function(user, pwd)
{
	this.rest.username = user;
	this.rest.password = pwd;
};
API_client.prototype.getIssues = async function()
{
	return await this.rest.read('/issues/');
};
API_client.prototype.getIssue = async function(id)
{
	console.log('Feching updates for remote issue ' + id);

	return await this.rest.read('/issues/' + id);
};
API_client.prototype.addIssue = async function(issue)
{
	console.log('Sending new issue to remote API');

	return await this.rest.create('/issues/', issue);
};
API_client.prototype.updateIssue = async function(id, issue)
{
	console.log('Sending changes to remote issue ' + id);

	return await this.rest.update('/issues/' + id, issue);
};
API_client.prototype.checkIssueUpdates = async function(id, lastSync)
{
	// get only remote headers to see if there are updates
	let headers = await this.rest.info('/issues/' + id);

	let lm = new Date(headers.get('last-modified'));
	if (lm < lastSync)
		return false;

	return true;
};
API_client.prototype.getUsers = async function(callback)
{
	return await this.rest.read('/users/', callback);
};
API_client.prototype.getUser = async function(id, callback)
{
	return await this.rest.read('/users/' + id, callback);
};
API_client.prototype.addUser = async function(user, callback)
{
	return await this.rest.create('/users/', user, callback);
};
API_client.prototype.updateUser = async function(id, user, callback)
{
	return await this.rest.update('/users/' + id, user, callback);
};