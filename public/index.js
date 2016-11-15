var app = angular.module('app', ['ngTouch', 'ui.grid',
   'ui.grid.pagination',
   'ui.grid.resizeColumns',
   'ui.grid.moveColumns',
   'ui.grid.edit'
   /*'ui.grid.treeView'*/
]);



function parseQuery(qstr) {
   var query = {};
   var a = qstr.substr(1).split('&');
   for (var i = 0; i < a.length; i++) {
      var b = a[i].split('=');
      query[decodeURIComponent(b[0])] = decodeURIComponent(b[1] || '');
   }
   return query;
}

app.controller('MainCtrl', ['$scope', '$http', '$timeout', 'uiGridConstants', function($scope, $http, $timeout, uiGridConstants) {

   var modelNames = [];
   var modelSchema = {};
   $scope.show = false;

   var defaultColumn = {
      name: '_id',
      width: 100,
      filter: {}
   }

   var init = function() {
      $http.get('/api').then(function(res) {
         modelSchema = res.data;
         for (var name in res.data) {
            modelNames.push(name);
         }
         $scope.models = modelNames;

         //yes this is horrible and is only for the next few hours

         var query = parseQuery(window.location.search);

         if (query.model) {
            $scope.modelSelected = query.model
            $scope.getPage();
         }

      });
   }
   init();

   var paginationOptions = {
      pageNumber: 1,
      pageSize: 5,
      sort: null
   };
   var pageSettings = '?pageNumber=' + paginationOptions.pageNumber + '&pageSize=' + paginationOptions.pageSize;
   var filterVar = '';
   var noCellEdit = {
      id: '_id',
      v: '__v'
   }



   $scope.gridOptions = {
      paginationPageSizes: [5, 25, 50, 75],
      paginationPageSize: 5,
      useExternalPagination: true,
      useExternalSorting: true,
      enableFiltering: true,
      useExternalFiltering: true,
      enableColumnResizing: true,
      enableCellEdit: true,
      columnDefs: [defaultColumn],

      onRegisterApi: function(gridApi) {
         $scope.gridApi = gridApi;

         filterVar = '';
         console.log(gridApi.grid.columns)
         for (var col in gridApi.grid.columns) {
            console.log(col)
            if (gridApi.grid.columns[col].filters[0].term != null) {
               filterVar += '&filter[' + gridApi.grid.columns[col].field + ']=' + gridApi.grid.columns[col].filters[0].term;
            }
         }

         // Sorting
         $scope.gridApi.core.on.sortChanged($scope, function(grid, sortColumns) {
            if (sortColumns.length == 0) {
               paginationOptions.sort = null;
            } else {
               paginationOptions.sort = sortColumns[0].sort.direction;
               paginationOptions.sortField = sortColumns[0].field;
            }
            $scope.getPage();
         });


         // Pagingation         
         gridApi.pagination.on.paginationChanged($scope, function(newPage, pageSize) {
            paginationOptions.pageNumber = newPage;
            paginationOptions.pageSize = pageSize;
            pageSettings = '?pageNumber=' + newPage + '&pageSize=' + pageSize;
            $scope.getPage();
         });


         // Filtering
         $scope.gridApi.core.on.filterChanged($scope, function() {
            var grid = this.grid;
            filterVar = '';
            for (var col in grid.columns) {
               if (grid.columns[col].filters[0].term != null) {
                  filterVar += '&filter[' + grid.columns[col].field + ']=' + grid.columns[col].filters[0].term;
               }
            }
            $scope.getPage();
         });


         // Editing
         gridApi.edit.on.afterCellEdit($scope, function(rowEntity, colDef, newValue, oldValue) {
            var updateData = {};
            updateData[colDef.name] = newValue;
            $http.put('/api/' + $scope.modelSelected + '/' + rowEntity._id, updateData).then(function(data) {
               for (var index in data.data) {
                  rowEntity[index] = data.data[index];
                  $scope.lastCellEdited = 'edited row id: ' + rowEntity._id + ' - Column: ' + colDef.name + ' - newValue: ' + newValue + ' - oldValue: ' + oldValue;
                  $timeout(function() {
                     $scope.$apply()
                  });
               }
            }, function(error) {
               alert('Update failed')
            });
         });
      }
   };


   $scope.getPage = function(clear) {

      if (clear == true) {
         pageSettings = '?pageNumber=' + 1 + '&pageSize=' + $scope.gridOptions.paginationPageSize;
         filterVar = '';
      }

      // Temporary 
      var query = parseQuery(window.location.search);

      if (query._id) {
         filterVar += '&filter[_id]=' + query._id;
      }


      var url = '/api/';
      switch (paginationOptions.sort) {
         case uiGridConstants.ASC:
            url += $scope.modelSelected + pageSettings + filterVar + '&sort=' + paginationOptions.sortField + '&order=1';
            break;
         case uiGridConstants.DESC:
            url += $scope.modelSelected + pageSettings + filterVar + '&sort=' + paginationOptions.sortField + '&order=-1';
            break;
         default:
            url += $scope.modelSelected + pageSettings + filterVar;
            break;
      }

      $http.get(url).success(function(data) {


         // Creating columDefs
         $scope.gridOptions.columnDefs = [];

         for (var key in modelSchema[$scope.modelSelected].fields) {


            var column = {
               name: key,
               width: 100
            };
            var query = parseQuery(window.location.search);

            if (query._id && key === '_id') {
               column.filter = {
                  term: query._id
               }
            }

            if (key == noCellEdit.id || key == noCellEdit.v) {
               column.enableCellEdit = false;

            }

            if (modelSchema[$scope.modelSelected].fields[key].dataType === 'ObjectID') {
               column.cellTemplate = '<div class="ui-grid-cell-contents"><a href="?model=' + modelSchema[$scope.modelSelected].fields[key].refType + '&_id={{COL_FIELD}}">{{COL_FIELD}}</a></div>';
            }


            $scope.gridOptions.columnDefs.push(column)
         }
         $scope.gridOptions.totalItems = data.count;
         $scope.gridOptions.data = data.docs;
         $scope.show = true;
      });
   };
}]);