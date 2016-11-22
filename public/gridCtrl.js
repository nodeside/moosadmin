// app.directive('filterDropdown', function() {
//    return {
//       restrict: 'A',
//       template: `<select 
//          class="form-control" 
//          ng-model="filters[data.field]" 
//          ng-change="filterChanged()" 
//          ng-options="option.id as option.value for option in data.options"></select>`,
//       controller: function($scope) {
//          $scope.filters = {};
//          $scope.filterChanged = function() {
//             console.log($scope.filters)
//          }
//       },
//       scope: {
//          data: '=data'
//       },
//    };
// })

app.directive('filterText', function() {
   return {
      restrict: 'A',
      template: `<input 
         class="form-control" 
         ng-model="filters[data.field]" 
         ng-change="filterChanged()"/>`,
      controller: function($scope, $location) {
         $scope.filters = {};


         if ($location.search()[$scope.data.field]) {
            $scope.filters[$scope.data.field] = $location.search()[$scope.data.field]
         }

         $scope.filterChanged = function() {

            for (var filter in $scope.filters) {
               $location.search(filter, $scope.filters[filter]);
            }
         }
      },
      scope: {
         data: '=data'
      },
   };
})

app.controller('GridCtrl', ['$scope', '$http', '$timeout', 'uiGridConstants', '$stateParams', '$location', '$rootScope', function($scope, $http, $timeout, uiGridConstants, $stateParams, $location, $rootScope) {

   var Grid = this;

   var modelNames = [];
   var modelSchema = {};

   $scope.show = false;

   var paginationOptions = {
      pageNumber: 1,
      pageSize: 5,
      sort: null
   };

   $rootScope.$on('$locationChangeSuccess', function(event) {

      if ($location.search().moosadminModel && $location.search().moosLink) {

         $scope.modelSelected = $location.search().moosadminModel;

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


   $scope.changeModel = function() {
      $location.search({
         'moosadminModel': $scope.modelSelected
      });

      // setColumnsAndFilters();
      // $scope.getPage();
   }

   function setColumnsAndFilters() {
      $scope.gridOptions.columnDefs = [];
      for (var key in modelSchema[$scope.modelSelected].fields) {

         // Setting default column width and name
         var column = {
            name: key,
            width: 150
         };


         // Setting the filter values based on the url querystring if the field exists in the model


         //            column.filterHeaderTemplate = `<div class="ui-grid-filter-container"><div filter-dropdown data="{field:'gender', options:[{value:'Male', id:'male'},{value:'feMale', id:'female'}]}"></div></div>`;

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
            column.cellTemplate = `<div ui-sref-opts="{inherit: false}" ui-sref="grid({ moosLink:true, moosadminModel: '${modelSchema[$scope.modelSelected].fields[key].refType}', _id:'{{COL_FIELD}}' }) " class="ui-grid-cell-contents">${modelSchema[$scope.modelSelected].fields[key].refType}: <a href="#">{{COL_FIELD}}</a></div>`;
            column.width = 200;
         }

         // Ensuring _id is always the first column
         if (key === '_id') {
            $scope.gridOptions.columnDefs.unshift(column)
         } else {
            $scope.gridOptions.columnDefs.push(column)
         }
      }

   }



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