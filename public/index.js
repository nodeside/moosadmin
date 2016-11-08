var app = angular.module('app', ['ngTouch', 'ui.grid', 'ui.grid.pagination']);



app.controller('MainCtrl', [
  '$scope', '$http', '$interval', 'uiGridConstants',
  function($scope, $http, $interval, uiGridConstants) {

    var paginationOptions = {
      pageNumber: 1,
      pageSize: 25,
      sort: null
    };

    $scope.gridOptions = {
      paginationPageSizes: [25, 50, 75],
      paginationPageSize: 25,
      useExternalPagination: true,
      useExternalSorting: true,
      enableFiltering: true,
      useExternalFiltering: true,
      columnDefs: [{
        name: 'name',
        enableFiltering: false,
      }, {
        name: 'gender',
        enableSorting: false,
        enableFiltering: false,

      }, {
        name: 'company',
        enableSorting: false
      }],
      onRegisterApi: function(gridApi) {
        $scope.gridApi = gridApi;

        $scope.gridApi.core.on.filterChanged($scope, function() {
          var grid = this.grid;
          if (grid.columns[1].filters[0].term === 'male') {
            $http.get('https://cdn.rawgit.com/angular-ui/ui-grid.info/gh-pages/data/100_male.json')
              .success(function(data) {
                $scope.gridOptions.data = data;
              });
          } else if (grid.columns[1].filters[0].term === 'female') {
            $http.get('https://cdn.rawgit.com/angular-ui/ui-grid.info/gh-pages/data/100_female.json')
              .success(function(data) {
                $scope.gridOptions.data = data;
              });
          } else {
            $http.get('https://cdn.rawgit.com/angular-ui/ui-grid.info/gh-pages/data/100.json')
              .success(function(data) {
                $scope.gridOptions.data = data;
              });
          }
        });

        $scope.gridApi.core.on.sortChanged($scope, function(grid, sortColumns) {
          if (sortColumns.length == 0) {
            paginationOptions.sort = null;
          } else {
            paginationOptions.sort = sortColumns[0].sort.direction;
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
      switch (paginationOptions.sort) {
        case uiGridConstants.ASC:
          url = 'https://cdn.rawgit.com/angular-ui/ui-grid.info/gh-pages/data/100_ASC.json';
          break;
        case uiGridConstants.DESC:
          url = 'https://cdn.rawgit.com/angular-ui/ui-grid.info/gh-pages/data/100_DESC.json';
          break;
        default:
          url = 'https://cdn.rawgit.com/angular-ui/ui-grid.info/gh-pages/data/100.json';
          break;
      }

      $http.get(url)
        .success(function(data) {
          $scope.gridOptions.totalItems = 100;
          var firstRow = (paginationOptions.pageNumber - 1) * paginationOptions.pageSize;
          $scope.gridOptions.data = data.slice(firstRow, firstRow + paginationOptions.pageSize);
        });
    };

    getPage();
  }
]);