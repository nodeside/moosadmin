var app = angular.module('moosadmin', ['ui.bootstrap', 'ngTouch', 'ui.router', 'ui.grid',
   'ui.grid.pagination',
   'ui.grid.resizeColumns',
   'ui.grid.moveColumns',
   'ui.grid.edit'
   /*'ui.grid.treeView'*/
]);

app.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {

   $urlRouterProvider.otherwise('/grid');

   $stateProvider
      .state('grid', {
         url: '/grid?moosadminModel&_id&moosLink',
         templateUrl: 'templates/grid.html',
         controller: 'GridCtrl',
         controllerAs: 'Grid',
         reloadOnSearch: false

      });
}]);