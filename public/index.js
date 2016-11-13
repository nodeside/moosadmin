var app = angular.module('app', ['ngTouch', 'ui.grid',
   'ui.grid.pagination',
   'ui.grid.resizeColumns',
   'ui.grid.moveColumns',
   'ui.grid.edit',
   'ui.grid.rowEdit',
   'ui.grid.cellNav'
   /*'ui.grid.treeView'*/
]);

app.controller('MainCtrl', ['$scope', '$http', '$interval', '$q', 'uiGridConstants', function($scope, $http, $interval, $q, uiGridConstants) {

   var modelNames = [];
   var modelSelected = '';
   var modelSchema = {};
   $scope.$watch('modelSelected', function(newValue, oldValue) {
      if (newValue != oldValue) {
         getPage();
      }
   });

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

   $scope.gridOptions = {
      paginationPageSizes: [5, 25, 50, 75],
      paginationPageSize: 5,
      useExternalPagination: true,
      useExternalSorting: true,
      enableFiltering: true,
      useExternalFiltering: true,
      enableColumnResizing: true,
      //columnDefs: columnDefs,

      onRegisterApi: function(gridApi) {
         $scope.gridApi = gridApi;
         gridApi.rowEdit.on.saveRow($scope, $scope.saveRow);

         $scope.gridApi.core.on.sortChanged($scope, function(grid, sortColumns) {
            if (sortColumns.length == 0) {
               paginationOptions.sort = null;
            } else {
               paginationOptions.sort = sortColumns[0].sort.direction;
               paginationOptions.sortField = sortColumns[0].field;
            }
            getPage();
         });

         gridApi.pagination.on.paginationChanged($scope, function(newPage, pageSize) {
            paginationOptions.pageNumber = newPage;
            paginationOptions.pageSize = pageSize;
            getPage();
         });


         $scope.gridApi.core.on.filterChanged($scope, function() {
            var grid = this.grid;
            var urlVariables = '';
            for (var col in grid.columns) {
               if (!col.filters[0].term) {
                  if (!urlVariables) {
                     urlVariables = '?filter.' + col.filters[0].term;
                  } else {
                     urlVariables = '&filter.' + col.filters[0].term;
                  }
               }
            }
            $http.get('/' + $scope.modelSelected + urlVariables).success(function(data) {
               $scope.gridOptions.data = data;
            });
         });

         // $scope.gridApi.treeBase.on.rowExpanded($scope, function(row) {
         //    if (row.entity.$$hashKey === $scope.gridOptions.data[50].$$hashKey && !$scope.nodeLoaded) {
         //       $interval(function() {
         //          $scope.gridOptions.data.splice(51, 0, {
         //             name: 'Dynamic 1',
         //             gender: 'female',
         //             age: 53,
         //             company: 'Griddable grids',
         //             balance: 38000,
         //             $$treeLevel: 1
         //          }, {
         //             name: 'Dynamic 2',
         //             gender: 'male',
         //             age: 18,
         //             company: 'Griddable grids',
         //             balance: 29000,
         //             $$treeLevel: 1
         //          });
         //          $scope.nodeLoaded = true;
         //       }, 2000, 1);
         //    }
         // });
      }
   };

   var getPage = function() {
      var url;
      switch (paginationOptions.sort) {
         case uiGridConstants.ASC:
            url = '/' + $scope.modelSelected + '?sort=' + paginationOptions.sortField + '&order=1';
            break;
         case uiGridConstants.DESC:
            url = '/' + $scope.modelSelected + '?sort=' + paginationOptions.sortField + '&order=-1';
            break;
         default:
            url = '/' + $scope.modelSelected;
            break;
      }

      $http.get(url).success(function(data) {
         $scope.gridOptions.columnDefs = [];

         for (var key in modelSchema[$scope.modelSelected].fields) {
            $scope.gridOptions.columnDefs.push({
               name: key
            });
         }

         $scope.gridOptions.totalItems = data.count;
         var firstRow = (paginationOptions.pageNumber - 1) * paginationOptions.pageSize;
         $scope.gridOptions.data = data.docs.slice(firstRow, firstRow + paginationOptions.pageSize);
      });

      // $scope.saveRow = function(rowEntity) {
      //    // create a fake promise - normally you'd use the promise returned by $http or $resource
      //    var promise = $q.defer();
      //    $scope.gridApi.rowEdit.setSavePromise(rowEntity, promise.promise);

      //    // fake a delay of 3 seconds whilst the save occurs, return error if gender is "male"
      //    $interval(function() {
      //       if (rowEntity.gender === 'male') {
      //          promise.reject();
      //       } else {
      //          promise.resolve();
      //       }
      //    }, 3000, 1);
      // };
   };
}]);