
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

})(angular.module('receptes.filters', []));
