
// https://gist.github.com/gdi2290/6703570
function no$$hashKey(key, val){
  if ( key == '$$hashKey' ) return undefined;
  return val;
};

(function(module){

  module.factory('DB', ['$http', '$q', function($http, $q){
    var db = {
      recipes: [],
      users: [],
      ingredients: [],
      measures: [
        'Abstracta',
        'Unitats',
        'Pes (gr)',
        'Volum (ml)',
        'Volum (l)'
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
      getPublishedRecipes: function(){
        return db.recipes.filter(function(r){
          return r.published;
        });
      },
      getMeasureTitle: function(id){
        var l = db.measures.filter(function(m){
          return m.id == id;
        });

        if ( l[0] )
          return l[0]['text'];
        else
          return '';
      },
      getUserByName: function(name){
        var l = db.users.filter(function(u){
          return angular.lowercase(u.login) == angular.lowercase(name);
        });

        return l[0];
      },
      getIngredientsThatContains: function(text){
        var l = db.ingredients.filter(function(i){
          return i.text.indexOf(text) != -1;
        });

        return l;
      },
      saveRecipe: function(recipe){
        var l = db.recipes.filter(function(r){
          return r.id == recipe.id;
        });

        if ( l.length > 0 )
        {
          var i = db.recipes.indexOf(l[0]);
          db.recipes[i] = recipe;
        }
        else
        {
          db.recipes.push(recipe);
        }
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
    var s = {
      id: null,
      name: null,
      avatar: null,
      loggedIn: false
    };

    var SessionService = {
      logIn: function(username){
        var deferred = $q.defer();
        
        var user = DB.getUserByName(username);
        if ( user )
        {
          s = {
            'id': user.id,
            'name': user.name,
            'avatar': user.avatar,
            'loggedIn': true
          };

          deferred.resolve();
        }
        else
        {
          deferred.reject();
        }

        return deferred.promise;
      },
      getId: function(){
        return s.id;
      },
      getName: function(){
        return s.name;
      },
      getAvatar: function(){
        return s.avatar;
      },
      isLoggedIn: function(){
        return s.loggedIn;
      }
    };

    return SessionService;
  }]);

})(angular.module('receptes.services', []));

(function(module){

  module.filter('ingredient', function(){
    var vowels = 'aeiouáéíóúàèìòùäëïöüâêîôû';
    vowels = vowels + vowels.toUpperCase();
    var abstractParser = function(ingredient){
      var name = ingredient.name;
      var quantity = ingredient.quantity.text;
      var conj = vowels.indexOf(name[0]) != -1 ? " d'" : ' de ';
      
      return quantity + conj + name;
    };
    
    var measures = {
      '3': 'gr',
      '4': 'ml',
      '5': 'l'
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
      else if ( input.measure == 2 )
        return unitParser(input);
      else
        return valueParser(input);
    };
  });

  module.filter('persones', function(){
    return function(input){
      var value = parseInt(input);
      if ( value != NaN )
      {
        if ( value == 1 )
          return value + ' persona';
        else
          return value + ' persones';
      }

      return '';
    }
  });

  module.directive("contenteditable", function(){
    return {
      restrict: "A",
      require: "ngModel",
      scope: {
        popline: '@',
        doNotAllowLineBreaks: '@',
        editable: '='
      },
      link: function(scope, element, attrs, ngModel){
        if ( scope.popline )
          element.popline();

        function read() {
          ngModel.$setViewValue(element.html());
        };

        ngModel.$render = function() {
          element.html(ngModel.$viewValue || "");
        };

        if ( scope.doNotAllowLineBreaks )
        {
          element.keydown(function(e){
            return !(e.keyCode == 13);
          });
        }

        scope.$watch('editable', function(editable){
          if ( editable )
          {
            element.attr('contenteditable', '');
            if ( scope.popline )
              element.popline();
          }
          else
          {
            element.removeAttr('contenteditable');
            if ( scope.popline )
              element.popline('destroy');
          }
        });

        element.bind("blur keyup change", function(){
          if ( scope.editable )
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
        onDropExp: '&',
        droppable: '=',
        global: '@'
      },
      link: function(scope, iElement, attr){
        var droppable = true;

        var stop = function(e){
          e.stopPropagation();
          e.preventDefault();
        };

        scope.$watch('droppable', function(value){
          if ( value === true || value === false )
            droppable = value;
          else
            droppable = true;
        });

        var parent = iElement.parent()[0];

        parent.addEventListener('dragenter', function(e){
          if ( droppable )
          {
            iElement.css('display', 'block');
            setTimeout(function(){iElement.addClass('hover');}, 10);

            if ( scope.onEnter )
              scope.onEnter(e); 
          }
        }, false);

        if ( scope.onHover )
        {
          parent.addEventListener('dragover', function(e){
            if ( droppable )
              scope.onHover(e);
          }, false);
        }

        parent.addEventListener('drop', function(e){
          stop(e);
          if ( droppable )
          {
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
            else if ( scope.onDropExp )
            {
              var callback = scope.onDropExp();
              var ofiles = e.dataTransfer.files;
              var ffiles = [];
              for ( var i = 0, file = ofiles[0] ; i < ofiles.length ; i++, file = ofiles[i] )
              {
                ffiles.push(file);
              }
              callback(ffiles, e);
            }            
          }
        }, false);

        parent.addEventListener('dragleave', function(e){
          if ( e.target == iElement[0] )
          {
            iElement.removeClass('hover');
            setTimeout(function(){iElement.css('display', 'none');}, 300);

            if ( droppable && scope.onLeave )
              scope.onLeave(e);
          }
        }, false);

        parent.addEventListener('dragend', function(e){
          iElement.removeClass('hover');
          iElement.css('display', 'none');
          if ( droppable && scope.onEnd )
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

  var CardEditorController = function($scope, $rootScope, $modalInstance, Session, DB, Noty, recipe, editable){
    var Recipe = function(){
      return {
        id: (Math.random() * 10000)|0,
        title: null,
        authorId: Session.getId(),
        published: false,
        authorName: Session.getName(),
        ingredients: [],
        mainPhoto: null,
        customersAmount: 1,
        steps: []
      };
    };

    var Ingredient = function(){
      return {
        name: null,
        measure: null,
        quantity: null
      };
    };

    var RecipeStep = function(){
      return {
        title: null,
        description: null,
        photo: null
      };
    };

    $scope.userId = Session.getId();

    // Notice that any scope member here to be inherited must be a
    // non basic (numeric, boolean) type of object, and not null
    $scope.recipe = Recipe();
    $scope.newIngredient = Ingredient();

    $scope.showCode = false;
    $scope.recipeCode = '';

    $scope.addingNewIngredient = false;
    $scope.ingredientBeingEdited = null;

    $scope.editor = editable;
    
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

    $scope.setStepPhoto = function(s){
      return function(files){
        if ( files.length == 1 )
        {
          var file = files[0];
          if ( file.type.indexOf('image') != -1 )
          {
            var reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = function(){
              s.photo = reader.result;
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
    };

    $scope.removeMainPhoto = function(){
      $scope.recipe.mainPhoto = null;
    };

    $scope.removeIngredient = function(ingredient){
      var ingredients = $scope.recipe.ingredients;
      var i = ingredients.indexOf(ingredient);
      ingredients.splice(i, 1);

      if ( $scope.ingredientBeingEdited == ingredient )
        $scope.closeIngredientEditor();
    };

    $scope.openIngredientEditor = function(i){
      if ( i )
      {
        $scope.ingredientBeingEdited = i;
        $scope.newIngredient.name = {
          id: i.id,
          text: i.name
        };
        $scope.newIngredient.measure = {
          id: i.measure,
          text: DB.getMeasureTitle(i.measure)
        };
        $scope.newIngredient.quantity = i.quantity;
      }
      
      $scope.addingNewIngredient = true;
    };

    $scope.closeIngredientEditor = function(){
      $scope.addingNewIngredient = false;
      $scope.ingredientBeingEdited = null;
      $scope.newIngredient.name = null;
    };

    $scope.createNewIngredient = function(i){
      if ( $scope.ingredientBeingEdited )
      {
        $scope.ingredientBeingEdited.id = i.name.id;
        $scope.ingredientBeingEdited.name = i.name.text;
        $scope.ingredientBeingEdited.measure = i.measure.id;
        $scope.ingredientBeingEdited.quantity = i.quantity;
      }
      else
      {
        $scope.recipe.ingredients.push({
          id: i.name.id,
          name: i.name.text,
          measure: i.measure.id,
          quantity: i.quantity
        });
      }

      $scope.closeIngredientEditor();
    };

    $scope.downloadRecipeCode = function($event){
      var anchor = $event.currentTarget;
      var data = JSON.stringify($scope.recipe, no$$hashKey);
      // Required as strings with spaces would not be rendered
      // correctly after file being downloaded.
      data = data.replace(' ', '%20');
      anchor.href = 'data:application/json;charset=UTF-8,' + data;
      anchor.download = 'recepte_' + Date.now() + '.json';
    };

    $scope.createRecipeStep = function(){
      $scope.recipe.steps.push(RecipeStep());
    };

    $scope.removeStepPhoto = function(recipeStep){
      recipeStep.photo = null;
    };

    $scope.removeRecipeStep = function(recipeStep){
      var steps = $scope.recipe.steps;
      var i = steps.indexOf(recipeStep);
      steps.splice(i, 1);
    };

    $scope.viewRecipeCode = function(){
      $scope.showCode = true;
      $scope.recipeCode = JSON.stringify($scope.recipe, no$$hashKey);
    };

    $scope.selectText = function($event){
      var element = $event.currentTarget;
      var range = document.createRange();
      range.selectNodeContents(element);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    };

    $scope.saveRecipe = function(){
      var data = JSON.parse(JSON.stringify($scope.recipe, no$$hashKey));
      DB.saveRecipe(data);
      //$modalInstance.close();
      $rootScope.$broadcast('new-recipe', data);

      Noty.good("La recepta s'ha guardat amb éxit.");
    };

    $scope.publishRecipe = function(){
      // Validate user input

      $scope.recipe.published = true;
      var data = JSON.parse(JSON.stringify($scope.recipe, no$$hashKey));
      DB.saveRecipe(data);
      $modalInstance.close();
      $rootScope.$broadcast('new-recipe', data);

      Noty.good("La recepta s'ha publicat.");
    };

    $scope.enableEditor = function(){
      $scope.editor = true;
    };

    $scope.disableEditor = function(){
      $scope.closeIngredientEditor();
      $scope.saveRecipe();
      $scope.editor = false;
    };

    $scope.closeEditor = function(){
      $modalInstance.close();
    };

    if ( recipe )
    {
      $scope.recipe.id = recipe.id;
      $scope.recipe.title = recipe.title;
      $scope.recipe.published = recipe.published;
      $scope.recipe.mainPhoto = recipe.mainPhoto;
      $scope.recipe.customersAmount = recipe.customersAmount;
      $scope.recipe.authorId = recipe.authorId;
      $scope.recipe.authorName = recipe.authorName;

      recipe.ingredients.forEach(function(i){
        $scope.recipe.ingredients.push(i);
      });

      recipe.steps.forEach(function(s){
        $scope.recipe.steps.push(s);
      });
    }
  };

  module.controller('HomeController', function($scope, $location, $log, $modal, DB, Noty, Session){
    $scope.login = false;
    
    $scope.userId = null;
    $scope.userName = null;
    $scope.userAvatar = null;

    $scope.searchText = null;

    $scope.recipes = [];

    var loginWithUsername = null;

    var Card = function(r, i){
      return {
        recipeId: i,
        title: r.title,
        authorId: r.authorId,
        author: r.authorName,
        image: r.mainPhoto,
        data: r
      };
    };

    var onUserLogin = function(){
      $scope.userId = Session.getId();
      $scope.userName = Session.getName();
      $scope.userAvatar = Session.getAvatar();
      $scope.login = true;

      Noty.good('Benvingut, ' + $scope.userName);
    };

    var onUserLoginError = function(reason){
      if ( reason == 'not-valid-user' )
        Noty.error("L'usuari no existeix.");
    };

    $scope.ingredientSelector = {
      query: function(query){
        var data = { results: DB.getIngredientsThatContains(query.term.toLowerCase()) };
        query.callback(data);
      },
      allowClear: true,
      multiple: true
    };

    $scope.searchQuery = {
      ingredients: null
    };

    $scope.viewRecipe = function(data){
      var cardViewer = $modal.open({
        templateUrl: 'lib/receptes/tmpl/card.edit.html',
        windowClass: 'card-view',
        controller: CardEditorController,
        scope: $scope,
        keyboard: false,
        backdrop: 'static',
        resolve: {
          recipe: function(){ return data; },
          editable: function(){ return false; }
        }
      });
    };

    $scope.searchForm = false;
    $scope.toggleSearchForm = function(){
      $scope.searchForm = !$scope.searchForm;
    };

    $scope.openRecipeEditor = function(data){
      var cardViewer = $modal.open({
        templateUrl: 'lib/receptes/tmpl/card.edit.html',
        windowClass: 'card-view',
        controller: CardEditorController,
        keyboard: false,
        backdrop: 'static',
        scope: $scope,
        resolve: {
          recipe: function(){ return data; },
          editable: function(){ return true; }
        }
      });
    };

    $scope.createRecipe = function(){
      $scope.openRecipeEditor();
    };

    $scope.editRecipe = function(data){
      $scope.openRecipeEditor(data);
    };

    $scope.openLoginForm = function(){
      var loginForm = $modal.open({
        templateUrl: 'lib/receptes/tmpl/login.html',
        controller: LogonController
      });

      var promise = loginForm.result;
      promise.then(onUserLogin, onUserLoginError);
    };

    $scope.updateView = function(){
      var recipes = DB.getAllRecipes();
      $scope.recipes = [];
      recipes.forEach(function(r, i){
        $scope.recipes.push(Card(r, i));
      });
    }

    $scope.$on('db-loaded', function(){
      $scope.updateView();

      if ( loginWithUsername )
      {
        var promise = Session.logIn(loginWithUsername);
        promise.then(onUserLogin, onUserLoginError);
      }

      //$scope.createRecipe();
    });

    $scope.$on('new-recipe', function(){
      $scope.updateView();
    });

    $scope.$watch('location.path()', function(){
      var path = $location.path().split('/');
      if ( path && path.length == 3 && path[1] == 'login' )
      {
        loginWithUsername = path[2];
      }
    });
  });

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
  'receptes.directives',
  'ui.bootstrap',
  'ui.select2'
]));
