app.controller('GridCtrl', ['$scope', '$http', '$timeout', 'uiGridConstants', '$stateParams', '$location', '$rootScope', function($scope, $http, $timeout, uiGridConstants, $stateParams, $location, $rootScope) {

   var Grid = this;

   var modelNames = [];
   var modelSchema = {};
   $scope.show = false;

   var defaultColumn = {
      name: '_id',
      width: 150,
      filter: {}
   }
   var paginationOptions = {
      pageNumber: 1,
      pageSize: 5,
      sort: null
   };

   $scope.changeModel = function() {
      $location.search({
         'moosadminModel': $scope.modelSelected
      });

      setColumnsAndFilters();
      $scope.getPage();
   }

   function setColumnsAndFilters() {
      $scope.gridOptions.columnDefs = [];
      for (var key in modelSchema[$scope.modelSelected].fields) {

         var column = {
            name: key,
            width: 150
         };

         //         console.log(key)

         if ($location.search()[key] && modelSchema[$scope.modelSelected].fields[key]) {
            column.filter = {
               term: $location.search()[key]
            }
         }
         if (key == noCellEdit.id || key == noCellEdit.v) {
            column.enableCellEdit = false;

         }
         if (modelSchema[$scope.modelSelected].fields[key].dataType === 'ObjectID' && modelSchema[$scope.modelSelected].fields[key].refType) {
            column.cellTemplate = `<div ui-sref-opts="{inherit: false}" ui-sref="grid({ moosLink:true, moosadminModel: '${modelSchema[$scope.modelSelected].fields[key].refType}', _id:'{{COL_FIELD}}' }) " class="ui-grid-cell-contents">${modelSchema[$scope.modelSelected].fields[key].refType}: <a href="#">{{COL_FIELD}}</a></div>`;
            column.width = 200;
         }
         if (key === '_id') {
            $scope.gridOptions.columnDefs.unshift(column)
         } else {
            console.log(column)
            $scope.gridOptions.columnDefs.push(column)
         }
      }

   }

   // $rootScope.$on('$locationChangeSuccess', function(event) {

   //    if ($location.search().moosadminModel && $location.search().moosLink) {
   //       $scope.modelSelected = $location.search().moosadminModel;
   //       setColumnsAndFilters();
   //       $scope.getPage();
   //    }



   // });


   var pageSettings = '?pageNumber=' + paginationOptions.pageNumber + '&pageSize=' + paginationOptions.pageSize;

   var noCellEdit = {
      id: '_id',
      v: '__v'
   }

   var init = function() {

      $http.get('api').then(function(res) {
         modelSchema = res.data;
         for (var name in res.data) {
            modelNames.push(name);
         }
         $scope.models = modelNames;
         if ($location.search().moosadminModel && modelNames.indexOf($location.search().moosadminModel) !== -1) {
            $scope.modelSelected = $location.search().moosadminModel;
            setColumnsAndFilters();
            $scope.getPage();

         }
      });
   }

   init();

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


         // Filtering
         // $scope.gridApi.core.on.filterChanged($scope, function() {

         //    if (angular.isDefined($scope.filterTimeout)) {
         //       clearTimeout($scope.filterTimeout);
         //    }

         //    $scope.filterTimeout = setTimeout(function() {
         //       $scope.getPage(gridApi);
         //    }, 500);
         // });


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


      var filterStr = ''
      var grid = gridApi ? gridApi.grid : null;

      var allFilter = {};

      for (var index in $location.search()) {
         if (modelSchema[$scope.modelSelected].fields[index]) {
            allFilter[index] = $location.search()[index];
         } else if (index !== 'moosadminModel') {
            $location.search(index, null)
         }
      }

      if (grid) {

         for (var col in grid.columns) {
            if (grid.columns[col].filters[0].term != null && grid.columns[col].filters[0].term != '') {
               allFilter[grid.columns[col].field] = grid.columns[col].filters[0].term;
            }
         }
      }

      for (var key in allFilter) {
         filterStr += '&filter[' + key + ']=' + allFilter[key];

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

      $http.get(url).success(function(data) {

         // Creating columDefs

         $scope.gridOptions.totalItems = data.count;
         $scope.gridOptions.data = data.docs;
         $scope.show = true;

         var grid = gridApi ? gridApi.grid : null;

         if (grid) {

            for (var col in grid.columns) {
               if (grid.columns[col].filters[0].term != null && grid.columns[col].filters[0].term != '') {
                  // filterStr += '&filter[' + grid.columns[col].field + ']=' + grid.columns[col].filters[0].term;
                  $location.search(grid.columns[col].field, grid.columns[col].filters[0].term)
               }
            }
         }
      });
   };
}]);


function parseQuery(qstr) {
   var query = {};
   var a = qstr.substr(1).split('&');
   for (var i = 0; i < a.length; i++) {
      var b = a[i].split('=');
      query[decodeURIComponent(b[0])] = decodeURIComponent(b[1] || '');
   }
   return query;
}