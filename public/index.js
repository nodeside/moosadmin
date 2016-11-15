var app = angular.module('app', ['ngTouch', 'ui.grid',
   'ui.grid.pagination',
   'ui.grid.resizeColumns',
   'ui.grid.moveColumns',
   'ui.grid.edit'
   /*'ui.grid.treeView'*/
]);

app.controller('MainCtrl', ['$scope', '$http', '$interval', '$q', 'uiGridConstants', function($scope, $http, $interval, $q, uiGridConstants) {

   var modelNames = [];
   var modelSchema = {};
   $scope.show = false;

   var init = function() {
      $http.get('/').then(function(res) {
         modelSchema = res.data;
         for (var name in res.data) {
            modelNames.push(name);
         }
         $scope.models = modelNames
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
      //columnDefs: columnDefs,

      onRegisterApi: function(gridApi) {
         $scope.gridApi = gridApi;
         // gridApi.rowEdit.on.saveRow($scope, $scope.saveRow);

         $scope.gridApi.core.on.sortChanged($scope, function(grid, sortColumns) {
            if (sortColumns.length == 0) {
               paginationOptions.sort = null;
            } else {
               paginationOptions.sort = sortColumns[0].sort.direction;
               paginationOptions.sortField = sortColumns[0].field;
            }
            $scope.getPage();
         });


         gridApi.pagination.on.paginationChanged($scope, function(newPage, pageSize) {
            paginationOptions.pageNumber = newPage;
            paginationOptions.pageSize = pageSize;
            pageSettings = '?pageNumber=' + newPage + '&pageSize=' + pageSize;
            $scope.getPage();
         });


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


         gridApi.edit.on.afterCellEdit($scope, function(rowEntity, colDef, newValue, oldValue) {

            var updateData = {};

            updateData[colDef.name] = newValue;


            $http.put('/' + $scope.modelSelected + '/' + rowEntity._id, updateData).then(function(data) {

               for (var index in data.data) {
                  rowEntity[index] = data.data[index];
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

      var url;
      switch (paginationOptions.sort) {
         case uiGridConstants.ASC:
            url = '/' + $scope.modelSelected + pageSettings + filterVar + '&sort=' + paginationOptions.sortField + '&order=1';
            break;
         case uiGridConstants.DESC:
            url = '/' + $scope.modelSelected + pageSettings + filterVar + '&sort=' + paginationOptions.sortField + '&order=-1';
            break;
         default:
            url = '/' + $scope.modelSelected + pageSettings + filterVar;
            break;
      }

      $http.get(url).success(function(data) {
         $scope.gridOptions.columnDefs = [];
         for (var key in modelSchema[$scope.modelSelected].fields) {
            if (key == noCellEdit.id || key == noCellEdit.v) {
               $scope.gridOptions.columnDefs.push({
                  name: key,
                  width: 100,
                  enableCellEdit: false
               });
            } else {
               $scope.gridOptions.columnDefs.push({
                  name: key,
                  width: 100
               });
            }
         }
         $scope.gridOptions.totalItems = data.count;
         $scope.gridOptions.data = data.docs;
         $scope.show = true;
      });
   };
}]);