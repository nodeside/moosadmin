var app = angular.module('app', ['ngTouch', 'ui.grid', 'ui.grid.pagination']);

app.controller('MainCtrl', ['$scope', '$http', '$interval', 'uiGridConstants', function($scope, $http, $interval, uiGridConstants) {

   var columnDefs = [];
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


   // angular.forEach(res, function(value, key) {
   //       columnDefs = {
   //         name: value,
   //         enableFiltering: false
   //       }
   //     });

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

      columnDefs: columnDefs,
      // columnDefs: [{
      //   name: 'name',
      //   enableFiltering: false,
      // }, {
      //   name: 'gender',
      //   enableSorting: false,
      //   enableFiltering: false,

      // }, {
      //   name: 'company',
      //   enableSorting: false
      // }],
      onRegisterApi: function(gridApi) {
         $scope.gridApi = gridApi;

         // $scope.gridApi.core.on.filterChanged($scope, function() {
         //   var grid = this.grid;
         //   if (grid.columns[1].filters[0].term === 'male') {
         //     $http.get('https://cdn.rawgit.com/angular-ui/ui-grid.info/gh-pages/data/100_male.json')
         //       .success(function(data) {
         //         $scope.gridOptions.data = data;
         //       });
         //   } else if (grid.columns[1].filters[0].term === 'female') {
         //     $http.get('https://cdn.rawgit.com/angular-ui/ui-grid.info/gh-pages/data/100_female.json')
         //       .success(function(data) {
         //         $scope.gridOptions.data = data;
         //       });
         //   } else {
         //     $http.get('https://cdn.rawgit.com/angular-ui/ui-grid.info/gh-pages/data/100.json')
         //       .success(function(data) {
         //         $scope.gridOptions.data = data;
         //       });
         //   }
         // });

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
      }
   };

   var getPage = function() {
      var url;

      console.log(paginationOptions)
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

      $http.get(url)
         .success(function(data) {
            $scope.gridOptions.columnDefs = [];

            for (var key in modelSchema[$scope.modelSelected].fields) {
               $scope.gridOptions.columnDefs.push({
                  name: key,
                  enableColumnResizing:true
             
               })
            }

            /*

[{
      //   name: 'name',
      //   enableFiltering: false,
      // }, {
      //   name: 'gender',
      //   enableSorting: false,
      //   enableFiltering: false,

      // }, {
      //   name: 'company',
      //   enableSorting: false
      // }]

            */
            // columnDefs = [];
            //  for (var index in data.docs[0]) {
            //    columnDefs += '{' + index + '},'
            // }
            $scope.gridOptions.totalItems = data.count;
            var firstRow = (paginationOptions.pageNumber - 1) * paginationOptions.pageSize;
            $scope.gridOptions.data = data.docs.slice(firstRow, firstRow + paginationOptions.pageSize);
         });
   };

   //getPage();
}]);