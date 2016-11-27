
/////////////////////////////////////filterText Directive//////////////////////////////////////

app.directive('filterText', function() {
   return {
      restrict: 'A',
      template: `<input 
         class="form-control" 
         ng-model="filters[data.field]" 
         ng-change="filterChanged()"/>`,
      controller: 'FilterCtrl',
      require: 'GridCtrl',
      link: function(scope, elem, attr) {

      },
      scope: {
         data: '=data'
      },
   };
})

app.controller('FilterCtrl', ['$scope', '$location', '$rootScope', function($scope, $location, $rootScope) {
   var query = $location.search();
   $scope.filters = {};

   // If url contains our field set the model to its value
   if (query[$scope.data.field]) {
      $scope.filters[$scope.data.field] = query[$scope.data.field];
   }

   // If a filter is changed we update the url
   $scope.filterChanged = function() {
      $location.search($scope.data.field, $scope.filters[$scope.data.field]);
   }

   $rootScope.$on('$locationChangeSuccess', function(event) {

      var query = $location.search();

      // Update field values based on the url
      if (query[$scope.data.field]) {
         $scope.filters[$scope.data.field] = query[$scope.data.field];
      }

   });

}]);


//////////////////////////filterDropdown Directive/////////////////////////////////////////////////

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


