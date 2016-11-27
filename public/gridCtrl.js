app.controller('GridCtrl', ['$scope', '$http', '$timeout', 'uiGridConstants', '$stateParams', '$location', '$rootScope',
   function($scope, $http, $timeout, uiGridConstants, $stateParams, $location, $rootScope) {

      var modelNames = [];
      var modelSchema = {};
      // Default pagination options
      var paginationOptions = {
         pageNumber: 1,
         pageSize: 75,
         sort: null
      };

      var pageSettings = '?pageNumber=' + paginationOptions.pageNumber + '&pageSize=' + paginationOptions.pageSize;

      var noCellEdit = {
         id: '_id',
         v: '__v'
      }

      $scope.show = false;

      // Loading all the model data

      (function() {

         $http.get('api').then(function(res) {
            modelSchema = res.data;
            for (var name in res.data) {
               modelNames.push(name);
            }

            $scope.models = modelNames;

            var query = $location.search();
            // If we have a model and it is a valid model name we set that as the selected model
            if (query.moosadminModel && modelNames.indexOf(query.moosadminModel) !== -1) {
               $scope.modelSelected = query.moosadminModel;

               // Define columns
               setColumnsAndFilters();

               // Make the query
               console.log('First getPage')
               $scope.getPage();
            }
         });
      })()


      $rootScope.$on('$locationChangeSuccess', function(event) {

         var query = $location.search();
         // If a link was clicked we need to clear all query params
         if (query.moosadminModel && query.moosLink) {

            $scope.modelSelected = query.moosadminModel;

            $location.search({
               moosadminModel: $scope.modelSelected,
               _id: $location.search()._id
            });

         }

         if (angular.isDefined($scope.filterTimeout)) {
            clearTimeout($scope.filterTimeout);
         }

         $scope.filterTimeout = setTimeout(function() {
            console.log('location changed')
            setColumnsAndFilters();
            $scope.getPage();
         }, 500);

      });

      // Changing the model changes the url
      $scope.changeModel = function() {
         $location.search({
            'moosadminModel': $scope.modelSelected
         });
      }

      function setColumnsAndFilters() {
         // Defining columns as empty
         $scope.gridOptions.columnDefs = [];

         // Looping through all fields in the model
         for (var key in modelSchema[$scope.modelSelected].fields) {

            // Setting default column width and name
            var column = {
               name: key,
               width: 150
            };

            switch (modelSchema[$scope.modelSelected].fields[key].dataType) {
               default: column.filterHeaderTemplate = `
               <div class="ui-grid-filter-container">
                  <div filter-text data="{field:'${key}'}"></div>
               </div>`;
               break;
            }


            // Prevent editing got certain fields
            if (key == noCellEdit.id || key == noCellEdit.v) {
               column.enableCellEdit = false;

            }

            // Making a link if it is an object id
            if (modelSchema[$scope.modelSelected].fields[key].dataType === 'ObjectID' && modelSchema[$scope.modelSelected].fields[key].refType) {
               column.width = 200;
               column.cellTemplate = `<div 
                  ui-sref="grid({ moosLink:true, moosadminModel: '${modelSchema[$scope.modelSelected].fields[key].refType}', _id:'{{COL_FIELD}}' })" 
                  ui-sref-opts="{inherit: false}" 
                  class="ui-grid-cell-contents">${modelSchema[$scope.modelSelected].fields[key].refType}: <a href="#">{{COL_FIELD}}</a></div>`;
            }

            // Ensuring _id is always the first column
            if (key === '_id') {
               $scope.gridOptions.columnDefs.unshift(column)
            } else {
               $scope.gridOptions.columnDefs.push(column)
            }
         }
      }

      $scope.gridOptions = {
         paginationPageSizes: [5, 25, 50, 75, 150],
         paginationPageSize: 75,
         useExternalPagination: true,
         useExternalSorting: true,
         enableFiltering: true,
         useExternalFiltering: true,
         enableColumnResizing: true,
         enableCellEdit: true,

         onRegisterApi: function(gridApi) {
            $scope.gridApi = gridApi;

            // Sorting
            $scope.gridApi.core.on.sortChanged($scope, function(grid, sortColumns) {
               if (sortColumns.length == 0) {
                  paginationOptions.sort = null;
               } else {
                  paginationOptions.sort = sortColumns[0].sort.direction;
                  paginationOptions.sortField = sortColumns[0].field;
               }
               $scope.getPage(gridApi);
            });

            // Pagingation         
            gridApi.pagination.on.paginationChanged($scope, function(newPage, pageSize) {
               paginationOptions.pageNumber = newPage;
               paginationOptions.pageSize = pageSize;
               pageSettings = '?pageNumber=' + newPage + '&pageSize=' + pageSize;
               $scope.getPage(gridApi);
            });

            // Editing
            gridApi.edit.on.afterCellEdit($scope, function(rowEntity, colDef, newValue, oldValue) {
               var updateData = {};
               updateData[colDef.name] = newValue;
               $http.put('api/' + $scope.modelSelected + '/' + rowEntity._id, updateData).then(function(data) {
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


      $scope.getPage = function(gridApi) {

         var allFilters = {};
         var query = $location.search();

         for (var field in query) {
            // If the query in the url matches a valid field
            if (modelSchema[$scope.modelSelected].fields[field] && query[field]) {
               // Add the query to our allFilter
               allFilters[field] = query[field];
            } else if (field !== 'moosadminModel') {
               // If we have an invalid query we remove it
               $location.search(field, null)
            }
         }

         // Building up the filters into a querystring
         var filterStr = ''
         for (var key in allFilters) {
            filterStr += '&filter[' + key + ']=' + allFilters[key];
         }

         var url = 'api/' + $scope.modelSelected + pageSettings + filterStr;
         switch (paginationOptions.sort) {
            case uiGridConstants.ASC:
               url += '&sort=' + paginationOptions.sortField + '&order=1';
               break;
            case uiGridConstants.DESC:
               url += '&sort=' + paginationOptions.sortField + '&order=-1';
               break;
            default:
               break;
         }

         // Get the actual data from the api
         $http.get(url).success(function(data) {
            $scope.show = true;
            $scope.gridOptions.totalItems = data.count;
            $scope.gridOptions.data = data.docs;
         });
      };
   }
]);