Moosadmin!
===================


A simple admin interface that allows you to search your data based on your existing mongoose models. **Moosadmin** reads your mongoose models and allows for filtering, sorting and editing of your data. It also provides links per document to make navigating through your data as easy as possible.

We have just released our first version and are in the processes of preparing a lot more features. Suggestions and PR's are welcome ;)

----------


Features
-------------


> **Current:**

> - Auto list models
> - Searching filtering and paging
> - Inline editing
> - Quick links to reference documents
> - Standalone server or express middleware

Installing
-------------
```
npm install moosadmin
```



> **Note:** Use with caution. The project is still under active development:


### Standalone server
```
var moosadmin = require('moosadmin',{server:true, port:3006});

// Once all the models have been loaded call buildModelData and pass it mongoose
// Ideally this should be run in the mongoose.connect callback function

moosadmin.buildModelData(require('mongoose'));

```



### Express Middleware
```
var moosadmin = require('moosadmin',{server:true, port:3006});

// Once all the models have been loaded call buildModelData and pass it mongoose
// Ideally this should be run in the mongoose.connect callback function

app.use('/moosadmin', moosadmin.expressMiddleware);

```
