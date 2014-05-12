
// https://gist.github.com/gdi2290/6703570
function no$$hashKey(key, val){
  if ( key == '$$hashKey' ) return undefined;
  return val;
};

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

    var doCreateSearchChoice = function(term, data) {
      if ( $(data).filter(function() { return this.text.localeCompare(term)===0; }).length===0 )
        return { id:term, text:term };
    };
    
    $scope.nameSelector = {
      createSearchChoice: doCreateSearchChoice,
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
      createSearchChoice: doCreateSearchChoice,
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

    $scope.searchPlaceholderText = 'Cercar receptes';

    $scope.ingredientSelector = {
      createSearchChoice: function(term, data) {
        if ( $(data).filter(function() { return this.text.localeCompare(term)===0; }).length===0 )
          return { id:term, text:term };
      },
      query: function(query){
        var data = { results: DB.getIngredientsThatContains(query.term.toLowerCase()) };
        query.callback(data);
      },
      allowClear: true,
      multiple: true
    };

    $scope.$watch('searchForm', function(enabled){
      if ( enabled )
      {
        $scope.searchPlaceholderText = 'Cercar receptes per títol';
      }
      else
      {
        $scope.searchPlaceholderText = 'Cercar receptes';
      }
    });

    $scope.searchQuery = {
      text: null,
      ingredients: null
    };

    $scope.searchRecipes = function(){
      var title = $scope.searchQuery.text;
      var ingredients = [];

      $scope.searchQuery.ingredients.forEach(function(i){
        ingredients.push(i.text);
      });

      var recipes = DB.getRecipesWith(title, ingredients);
      $scope.updateView(recipes);

      $scope.searchForm = false;
      $scope.searchMatches = recipes.length;
      $scope.searchAppliedCriteria = true;
      $scope.searchQuery.text = null;
      $scope.searchQuery.ingredients = null;
    };

    $scope.removeSearchCriteria = function(){
      $scope.searchAppliedCriteria = false;
      $scope.updateView(DB.getAllRecipes());
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

    $scope.updateView = function(recipes){
      $scope.recipes = [];
      recipes.forEach(function(r, i){
        $scope.recipes.push(Card(r, i));
      });
    };

    $scope.$on('db-loaded', function(){
      $scope.updateView(DB.getAllRecipes());

      if ( loginWithUsername )
      {
        var promise = Session.logIn(loginWithUsername);
        promise.then(onUserLogin, onUserLoginError);
      }

      //$scope.createRecipe();
    });

    $scope.$on('new-recipe', function(){
      if ( !$scope.searchAppliedCriteria )
        $scope.updateView(DB.getAllRecipes());
    });

    $scope.$watch('location.path()', function(){
      var path = $location.path().split('/');
      if ( path && path.length == 3 && path[1] == 'login' )
      {
        loginWithUsername = path[2];
      }
    });
  });

})(angular.module('receptes.controllers', ['receptes.services']));
