var express = require('express');
var router = express.Router();

module.exports = function(models) {

	router.route('/').get(function(req,res,next) {
		return res.send(models);
	})
	return router;
}