
(function(module){

  module.config(function($locationProvider){
    $locationProvider.html5Mode(false);
    $locationProvider.hashPrefix('!');
  });

  module.run(function($rootScope, $templateCache, Noty, DB){
    var promise = DB.initialize();
    promise.then(function(){
      $rootScope.$broadcast('db-loaded');

      Noty.log('receptes.cat is running');
    });

    $rootScope.$on('$viewContentLoaded', function() {
      $templateCache.removeAll();
    });
  });

})(angular.module('receptes', [
  'receptes.services',
  'receptes.filters',
  'receptes.directives',
  'receptes.controllers',
  'ui.bootstrap',
  'ui.select2'
]));
