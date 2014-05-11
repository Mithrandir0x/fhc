
(function(module){

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
