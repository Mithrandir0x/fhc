
(function(module){

  module.factory('DB', ['$http', '$q', function($http, $q){
    var db = {
      recipes: [],
      users: [],
      ingredients: [],
      measures: [
        'Abstracta',
        'Pes (gr)',
        'Volum (ml)',
        'Unitats'
      ],
      abstractMeasures: [
        'Un pessic',
        'Una cullerada'
      ]
    }

    var DataBaseService = {
      initialize: function(){
        var ids = function(iterable){
          var d = [];
          iterable.forEach(function(o, i){
            d.push({
              id: i + 1,
              text: o
            });
          });
          return d;
        };

        var onSuccess = function(promise, resource, post){
          promise.success(function(data){
            if ( post )
              post(data);
            else
              db[resource] = data;
          });
        };

        var fetch = function(url, resource, post){
          var promise = $http.get(url);
          onSuccess(promise, resource, post);
          return promise;
        };

        db.measures = ids(db.measures);
        db.abstractMeasures = ids(db.abstractMeasures);

        var promiseA = fetch('res/data/recipes.json', 'recipes');
        var promiseB = fetch('res/data/users.json', 'users');
        var promiseC = fetch('res/data/ingredients.json', 'ingredients',
          function(data){
            data.forEach(function(name, i){
              db.ingredients.push({
                id: i,
                text: name
              });
            });
          }
        );

        return $q.all([promiseA, promiseB, promiseC]);
      },
      getAllRecipes: function(){
        return db.recipes;
      },
      getAllIngredients: function(){
        return db.ingredients;
      },
      getMeasures: function(){
        return db.measures;
      },
      getAbstractMeasures: function(){
        return db.abstractMeasures;
      },
      getUserByName: function(name){
        var l = db.users.filter(function(u){
          return angular.lowercase(u.name) == angular.lowercase(name);
        });

        return l[0];
      },
      getIngredientsThatContains: function(text){
        var l = db.ingredients.filter(function(i){
          return i.text.indexOf(text) != -1;
        });

        return l;
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

  module.filter('ingredient', function(){
    var vowels = 'aeiouáéíóúàèìòùäëïöüâêîôû';
    var abstractParser = function(ingredient){
      var name = ingredient.name;
      var quantity = ingredient.quantity.text;
      var conj = vowels.indexOf(name[0]) != -1 ? " d'" : ' de ';
      
      return quantity + conj + name;
    };
    
    var measures = {
      '2': 'gr',
      '3': 'ml'
    };
    var valueParser = function(ingredient){
      var name = ingredient.name;
      var quantity = ingredient.quantity;
      var measure = measures[ingredient.measure];
      var conj = vowels.indexOf(name[0]) != -1 ? " d'" : ' de ';
      
      return quantity + measure + conj + name;
    };

    var unitParser = function(ingredient){
      var name = ingredient.name;
      name = name[0].toUpperCase() + name.substring(1);
      var quantity = ingredient.quantity;
      
      return quantity + ' × ' + name;
    };

    return function(input){
      if ( input.measure == 1 )
        return abstractParser(input);
      else if ( input.measure == 4 )
        return unitParser(input);
      else
        return valueParser(input);
    };
  });

  module.directive("contenteditable", function(){
    return {
      restrict: "A",
      require: "ngModel",
      link: function(scope, element, attrs, ngModel){
        function read() {
          ngModel.$setViewValue(element.html());
        };

        ngModel.$render = function() {
          element.html(ngModel.$viewValue || "");
        };

        element.bind("blur keyup change", function(){
          scope.$apply(read);
        });
      }
    };
  });

  module.directive('dropbox', function(){
    return {
      template: '<div class="dropbox"></div>',
      replace: true,
      transclude: true,
      restrict: 'E',
      scope: {
        allowedFiletypes: '@',
        onEnter: '=',
        onHover: '=',
        onLeave: '=',
        onEnd: '=',
        onDrop: '=',
        global: '@'
      },
      link: function(scope, iElement, attr){
        var stop = function(e){
          e.stopPropagation();
          e.preventDefault();
        };

        var parent = iElement.parent()[0];

        parent.addEventListener('dragenter', function(e){
          iElement.css('display', 'block');
          setTimeout(function(){iElement.addClass('hover');}, 10);

          if ( scope.onEnter )
            scope.onEnter(e);
        }, false);

        if ( scope.onHover )
        {
          parent.addEventListener('dragover', function(e){
            scope.onHover(e);
          }, false);
        }

        parent.addEventListener('drop', function(e){
          stop(e);
          iElement.removeClass('hover');
          iElement.css('display', 'none');
          if ( scope.onDrop )
          {
            var ofiles = e.dataTransfer.files;
            var ffiles = [];
            for ( var i = 0, file = ofiles[0] ; i < ofiles.length ; i++, file = ofiles[i] )
            {
              ffiles.push(file);
            }
            scope.onDrop(ffiles, e);
          }
        }, false);

        parent.addEventListener('dragleave', function(e){
          if ( e.target == iElement[0] )
          {
            iElement.removeClass('hover');
            setTimeout(function(){iElement.css('display', 'none');}, 300);

            if ( scope.onLeave )
              scope.onLeave(e);
          }
        }, false);

        parent.addEventListener('dragend', function(e){
          iElement.removeClass('hover');
          iElement.css('display', 'none');
          if ( scope.onEnd )
              scope.onEnd(e);
        }, false);
      }
    };
  });

  // Shitty way to prevent the browser from loading a file when dropped on it
  window.addEventListener("dragover",function(e){
    e = e || event;
    e.preventDefault();
  },false);
  window.addEventListener("drop",function(e){
    e = e || event;
    e.preventDefault();
  },false);

})(angular.module('receptes.directives', []));

(function(module){

  var LogonController = function($scope, $modalInstance, Session){
    $scope.user = {};

    $scope.submit = function(){
      var promise = Session.logIn($scope.user.name);
      promise.then(function(){
        $modalInstance.close();
      }, function(){
        $modalInstance.dismiss('not-valid-user');
      });
    };

    $scope.close = function(){
      $modalInstance.dismiss('cancel');
    };
  };

  var CardEditorController = function($scope, $modalInstance, DB, Noty){
    var Recipe = function(){
      return {
        id: null,
        title: null,
        ingredients: [],
        mainPhoto: null,
        customersAmount: 1
      };
    };

    var Ingredient = function(){
      return {
        name: null,
        measure: null,
        quantity: null
      };
    };

    // Notice that any scope member here to be inherited must
    // be a non basic type of object, and not null (i.e. an object)
    $scope.recipe = Recipe();
    $scope.newIngredient = Ingredient();

    $scope.addingNewIngredient = false;
    $scope.nameSelector = {
      createSearchChoice: function(term, data) {
        if ( $(data).filter(function() { return this.text.localeCompare(term)===0; }).length===0 )
        {
          return { id:term, text:term };
        }
      },
      query: function(query){
        var data = { results: DB.getIngredientsThatContains(query.term.toLowerCase()) };
        query.callback(data);
      },
      allowClear: true,
      multiple: false
    };
    $scope.measureSelector = {
      data: DB.getMeasures(),
      allowClear: true,
      multiple: false
    };
    $scope.abstractMeasureSelector = {
      data: DB.getAbstractMeasures(),
      allowClear: true,
      multiple: false
    };

    $scope.$watch('newIngredient.name', function(newValue){
      if ( !newValue )
      {
        $scope.newIngredient.measure = null;
        $scope.newIngredient.quantity = null;
      }
    });

    $scope.$watch('newIngredient.measure', function(newValue){
      if ( !newValue )
      {
        $scope.newIngredient.quantity = null;
      }
    });

    $scope.setMainRecipePhoto = function(files){
      if ( files.length == 1 )
      {
        var file = files[0];
        if ( file.type.indexOf('image') != -1 )
        {
          var reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onloadend = function(){
            $scope.recipe.mainPhoto = reader.result;
            $scope.$apply();
          };
        }
        else
        {
          Noty.error("Tipus d'imatge no soportat.");
        }
      }
      else
      {
        Noty.warn('Només es pot afegir una fotografia.');
      }
      
    };

    $scope.removeMainPhoto = function(){
      $scope.recipe.mainPhoto = null;
    };

    $scope.removeIngredient = function(ingredient){
      var ingredients = $scope.recipe.ingredients;
      var i = ingredients.indexOf(ingredient);
      ingredients.splice(i, 1);
    };

    $scope.openIngredientEditor = function(){
      $scope.addingNewIngredient = true;
    };

    $scope.closeIngredientEditor = function(){
      $scope.addingNewIngredient = false;
      $scope.newIngredient.name = null;
    };

    $scope.createNewIngredient = function(i){
      $scope.recipe.ingredients.push({
        id: i.name.id,
        name: i.name.text,
        measure: i.measure.id,
        quantity: i.quantity
      });

      $scope.closeIngredientEditor();
    };

    $scope.saveRecipe = function(){
      console.log($scope.recipe);
    };
  };

  module.controller('HomeController', function($scope, $log, $modal, $controller, DB, Noty, Session){
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
        image: r.images[0] ? r.images[0] : 'http://placehold.it/236x320'
      };
    };

    $scope.viewRecipe = function($event, card){ };

    $scope.createRecipe = function(){
      var cardViewer = $modal.open({
        templateUrl: 'lib/receptes/tmpl/card.edit.html',
        windowClass: 'card-view',
        controller: CardEditorController
      });
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
        if ( reason == 'not-valid-user' )
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

      $scope.createRecipe();
    });

    $scope.$on('new-recipe', function(){

    });
  });

  module.run(function($rootScope, $templateCache, Noty, DB){
    var promise = DB.initialize();
    promise.then(function(){
      $rootScope.$broadcast('db-loaded');

      Noty.log('receptes is running');
    });

    $rootScope.$on('$viewContentLoaded', function() {
      $templateCache.removeAll();
   });
  });

})(angular.module('receptes', [
  'receptes.services',
  'receptes.directives',
  'ui.bootstrap',
  'ui.select2'
]));
