//schema.paths and schema.trees
var Models = {};

var express = require('express');
var bodyParser = require('body-parser')

var path = require('path')

var mongoose;

var app = express();

module.exports = function(mng, options) {

	// Defining out local mongoose to equal that of the app
	mongoose = mng;

	// Looping over models and creatin key value object
	buildKeyValueModelData(mongoose.models);

	app.use(bodyParser.json());
	// Require and create routing based on the Models
	app.get('/api', function(req, res) {
		res.send(Models);
	});

	// Loop over model and inject various crud methods
	for (var model in Models) {
		injectGet(model);
		injectPut(model);
	}

	// Exposing static files for the front end
	app.use(express.static(path.join(__dirname, 'public')));

	app.listen(options.port || 3006);
	console.log('Moosadmin is listening on port: ' + (options.port || 3006));
}

function buildKeyValueModelData(models) {
	for (var model in models) {

		var paths = models[model].schema.paths

		Models[model] = Models[model] || {
			fields: {}
		};

		Models[model].totalFields = 0;

		for (var field in paths) {

			Models[model].totalFields++;
			var inner = paths[field]

			var refType = '';

			if (inner.options.type && inner.options.type.schemaName === 'ObjectId' && inner.options.ref) {
				refType = inner.options.ref;
			}

			// var dataType = Object.getPrototypeOf(inner).constructor.schemaName;

			Models[model].fields[field] = {
				// model: model,
				field: field,
				dataType: inner.instance,
				refType: refType,
				enumValues: inner.enumValues || []
			}
		}
	}
}

function injectGet(model) {

	app.get('/api/' + model + '/:id?', function(req, res, next) {
		var Model = mongoose.model(model);
		var Query = Model.find({}, {});
		var Count = Model.count();

		if (req.params.id && mongoose.Types.ObjectId.isValid(req.params.id)) {
			Query.where('_id', req.params.id);
			Count.where('_id', req.params.id);
		}

		var limit = 100;
		var skip = 0;

		if (req.query.pageSize && !isNaN(req.query.pageSize)) {
			limit = parseInt(req.query.pageSize);
		}

		if (req.query.pageNumber && !isNaN(req.query.pageNumber)) {
			skip = (parseInt(req.query.pageNumber) - 1) * limit;
		}

		Query.limit(limit).skip(skip);

		if (req.query.sort) {
			var sort = {}
			var validSortValues = ['1', '-1', 'asc', 'desc', 'ascending', 'descending']
			req.query.order = req.query.order || -1;

			if (validSortValues.indexOf(req.query.order) === -1) {
				req.query.order = -1;
			}
			sort[req.query.sort] = req.query.order;
			Query.sort(sort);
		}

		var querystring = require('querystring');


		// Formatting filter


		if (req.query.filter) {

			for (var name in req.query.filter) {


				if (Models[model].fields[name]) {

					switch (Models[model].fields[name].dataType) {
						case 'ObjectID':

							if (mongoose.Types.ObjectId.isValid(req.query.filter[name])) {
								Count.where(name, req.query.filter[name]);
								Query.where(name, req.query.filter[name]);
							}
							break;
						default:
							if (req.query.filter[name]) {
								Count.where(name, {
									$regex: req.query.filter[name]
								});
								Query.where(name, {
									$regex: req.query.filter[name]
								});
							}
							break;
					}
				}

			}
		}

		Count.exec(function(err, count) {
			if (err) {
				return next(err);
			}

			Query.exec(function(err, docs) {

				if (err) {
					return next(err);
				}
				res.send({
					count: count,
					docs: docs
				});
			})
		})
	});
}

function injectPut(model) {
	app.put('/api/' + model + '/:id', function(req, res, next) {
		var Model = mongoose.model(model);


		if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {

			return res.send(400, {
				error: true,
				message: 'Missing id of document'
			});

		}

		var set = objToDotNotation(req.body);

		Model.findOneAndUpdate({
			_id: req.params.id
		}, {
			$set: set
		}, {
			multi: false,
			upsert: false,
			new: true
		}).exec(function(err, doc) {
			if (err) {
				return next(err);
			}

			res.send(doc);
		})

	});
}


function objToDotNotation(obj, options) {
	options = options || {};
	var out = options.append || {};
	flattenFields(options.prefix || '', obj, out);
	return out;
}

function flattenFields(prefix, details, obj) {

	for (var i in details) {
		if (typeof details[i] === 'object') {

			var addedPrefix = ''
			if (prefix) {
				addedPrefix = prefix + '.';
			}

			flattenFields(addedPrefix +
				i, details[i], obj)
		} else {
			var addedPrefix = ''
			if (prefix) {
				addedPrefix = prefix + '.';
			}
			obj[addedPrefix + i] = details[i];
		}
	}
}