
(function(module){

  module.factory('DB', ['$http', '$q', function($http, $q){
    var recipes = [];
    var users = [];

    var DataBaseService = {
      getData: function(){
        var promiseA = $http.get('res/data/recipes.json');
        var promiseB = $http.get('res/data/users.json');
        
        promiseA.success(function(data){
          recipes = data;
        });
        
        promiseB.success(function(data){
          users = data;
        });

        return $q.all([promiseA, promiseB]);
      },
      getAllRecipes: function(){
        return recipes;
      },
      getUserByName: function(name){
        var l = users.filter(function(u){
          return angular.lowercase(u.name) == angular.lowercase(name);
        });

        return l[0];
      }
    };

    return DataBaseService;
  }]);

  module.factory('Noty', function(){
    var log = function(level){
      return function(message, opts){
        var defaults = {
          type: level,
          text: message,
          timeout: 2500,
          layout: 'bottomRight'
        };

        opts = opts ? opts : {};

        jQuery.extend(opts, defaults);

        noty(opts);
      };
    };

    var NotyService = {
      log   : log('alert'),
      info  : log('information'),
      warn  : log('warning'),
      error : log('error'),
      good  : log('success'),
    };

    return NotyService;
  });

  module.factory('Session', ['$q', 'DB', function($q, DB){
    var s = null;

    var SessionService = {
      logIn: function(username){
        var deferred = $q.defer();
        
        var user = DB.getUserByName(username);
        if ( user )
        {
          s = {
            'id': user.id,
            'name': user.name,
            'avatar': user.avatar
          };

          deferred.resolve();
        }
        else
        {
          deferred.reject();
        }

        return deferred.promise;
      },
      getName: function(){
        return s.name;
      },
      getAvatar: function(){
        return s.avatar;
      },
      isLoggedIn: function(){
        return s != null;
      }
    };

    return SessionService;
  }]);

})(angular.module('receptes.services', []));

(function(module){

  var LogonController = function($scope, $modalInstance, Session){
    $scope.user = {};

    $scope.submit = function(){
      var promise = Session.logIn($scope.user.name);
      promise.then(function(){
        $modalInstance.close();
      }, function(){
        $modalInstance.dismiss('error');
      });
    };

    $scope.close = function(){
      $modalInstance.dismiss('cancel');
    };
  };

  module.controller('HomeController', function($scope, $log, $modal, DB, Noty, Session){
    $scope.login = false;
    
    $scope.userName = null;
    $scope.userAvatar = null;

    $scope.searchText = null;

    $scope.recipes = [];

    var Card = function(r, i){
      return {
        id: i,
        title: r.title,
        author: r.authorName,
        image: r.images[0]
      };
    };

    $scope.viewRecipe = function(card){
    };

    $scope.openLoginForm = function(){
      var loginForm = $modal.open({
        templateUrl: 'lib/receptes/tmpl/login.html',
        controller: LogonController
      });

      var onSuccess = function(){
        $scope.userName = Session.getName();
        $scope.userAvatar = Session.getAvatar();
        $scope.login = true;

        Noty.good('Benvingut, ' + $scope.userName);
      };

      var onError = function(reason){
        if ( reason != 'cancel' )
          Noty.error("L'usuari no existeix.");
      };

      var promise = loginForm.result;
      promise.then(onSuccess, onError);
    };

    $scope.$on('db-loaded', function(){
      var recipes = DB.getAllRecipes();
      recipes.forEach(function(r, i){
        $scope.recipes.push(Card(r, i));
      });
    });
  });

  module.run(function($rootScope, Noty, DB){
    var promise = DB.getData();
    promise.then(function(){
      $rootScope.$broadcast('db-loaded');

      Noty.log('receptes is running');
    });
  });

})(angular.module('receptes', ['receptes.services', 'ui.bootstrap']));
