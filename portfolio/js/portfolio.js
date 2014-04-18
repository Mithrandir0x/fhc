
(function($){

    $(document).ready(function(){
        var $reviewModal = $('.modal-review');
        var $reviewForm = $('.form-review');
        var $htaSearchRecipeModal = $('.hta-search-recipe');
        
        $('.x-rating-control').rating();
        $('.button-send-review').click(function($event){
            var isValidForm = function(){
                var name = $('.form-control[name="name"]').val();
                var surname = $('.form-control[name="surname"]').val();
                var email = $('.form-control[name="email"]').val();
                var age = parseInt($('.form-control[name="age"]').val());
                var easyNavigationScore = parseInt($('.form-control[name="easy_navigation"]').val());
                var easyMobileUxScore = parseInt($('.form-control[name="easy_mobile_ux"]').val());

                var isValidText = function(t) {
                    return name != undefined && name.length > 3;
                };

                var isValidAge = function(a) {
                    return a != undefined && a >= 18; 
                };

                var isValidEmail = function(e) {
                    return e != undefined && e.length > 0 && /.+@.+\..+/.test(e);
                };

                var isValidRating = function(r) {
                    return r != undefined && r >= 1 && r <= 5;
                };

                return isValidText(name) &&
                    isValidText(surname) &&
                    isValidEmail(email) &&
                    isValidAge(age) &&
                    isValidRating(easyNavigationScore) &&
                    isValidRating(easyMobileUxScore);
            };

            // Serialized data to insert in an AJAX request
            var data = $reviewForm.serialize();
            console.log(data);
            
            $event.preventDefault();
        });

        $('.modal-hta-diagram-button').click(function($event){
            var $this = $(this);
            var modalTarget = $this.attr('data-modal');
            $(modalTarget).modal('show');
        });

        $('.modal-review-button').click(function(){
            $reviewModal.modal('show');
        });

        $('.slick-storyboard').slick({
            dots: true,
            infinite: false
        });

        /* $('.vignette-photo').click(function(){
            alert('Heyoo!');
        }); */
    });

})(jQuery);
