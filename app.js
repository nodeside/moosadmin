//schema.paths and schema.trees

var Models = {};

var express = require('express');

var path = require('path')

module.exports = function(mongoose, options) {

	var app = express();
	app.listen(options.port || 3006);
	//console.log('listening on 3006')
	app.use('/', require('./routes')(Models));
	app.use(express.static(path.join(__dirname, 'public')));

	var models = mongoose.models;

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

			var dataType = Object.getPrototypeOf(inner).constructor.schemaName;

			Models[model].fields[field] = {
				// model: model,
				field: field,
				dataType: dataType,
				refType: refType,
				instance: inner.instance,
				enumValues: inner.enumValues || []
			}
		}

		for (var model in Models) {

			loadModel(model);

			function loadModel(model) {

				app.get('/' + model + '/:id?', function(req, res, next) {
console.log(req.query)
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
						skip = parseInt(req.query.pageNumber) - 1;
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

					if (req.query.filter) {
						
						var filters = [];
						for (var filter in req.query.filter) {
							filter.push({
								field: filter.substring(0, filter.indexOf('.')),
								data: filter.split('.')[1]
							});
						}
						console.log(filters)
						//Model.find({})

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

				app.post('/edit', function(req, res, next) {

					var Model = mongoose.model(model);
					var Query = Model.find({}, {});

				});
			}
		}
	}
}


function objToDotNotation(obj, options) {
	var out = options.append || {};
	flattenFields(options.prefix || '', obj, out);
	return out;
}

function flattenFields(prefix, details, obj) {
	for (var i in details) {
		if (typeof details[i] === 'object') {
			flattenFields(prefix + '.' +
				i, details[i], obj)
		} else {
			obj[prefix + '.' + i] = details[i];
		}
	}
}