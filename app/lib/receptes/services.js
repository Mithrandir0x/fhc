
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
      },
      getRecipesWith: function(title, ingredients){
        var l = db.recipes;
        if ( title )
        {
          title = title.toLowerCase();
          l = l.filter(function(r){
            var recipeTitle = r.title.toLowerCase();
            return recipeTitle.indexOf(title) != -1;
          });
        }

        if ( ingredients && ingredients.length > 0 )
        {
          l = l.filter(function(r){
            var recipeIngredients = r.ingredients;
            
            for ( var i = 0 ; i < recipeIngredients.length ; i++ )
            {
              var recipeIngredient = recipeIngredients[i].name.toLowerCase();

              for ( var j = 0 ; j < ingredients.length ; j++ )
              {
                var ingredient = ingredients[j].toLowerCase();
                if ( ingredient.indexOf(recipeIngredient) != -1 || recipeIngredient.indexOf(ingredient) != -1 )
                  return true;
              }
            }

            return false;
          });
        }

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
