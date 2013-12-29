varsityframework.directive('pagination', ['paginationConfig', function(paginationConfig) {
	  return {
		    restrict: 'E',
		    scope: {
		      numPages: '=',
		      currentPage: '=',
		      strP: '@',
		      maxSize: '=',
		      onSelectPage: '&'
		    },
		    templateUrl: '../../../static/partials/pagination.html',
		    replace: true,
		    link: function(scope, element, attrs) {

		      // Setup configuration parameters
		      var boundaryLinks = angular.isDefined(attrs.boundaryLinks) ? scope.$eval(attrs.boundaryLinks) : paginationConfig.boundaryLinks;
		      var directionLinks = angular.isDefined(attrs.directionLinks) ? scope.$eval(attrs.directionLinks) : paginationConfig.directionLinks;
		      var firstText = angular.isDefined(attrs.firstText) ? attrs.firstText : paginationConfig.firstText;
		      var previousText = angular.isDefined(attrs.previousText) ? attrs.previousText : paginationConfig.previousText;
		      var nextText = angular.isDefined(attrs.nextText) ? attrs.nextText : paginationConfig.nextText;
		      var lastText = angular.isDefined(attrs.lastText) ? attrs.lastText : paginationConfig.lastText;

		      // Create page object used in template
		      function makePage(number, text, isActive, isDisabled,orginclass,orgintext) {
		        return {
		        	number: number,
                    text: text,
                    active: isActive,
                    disabled: isDisabled,
                    orginclass: orginclass,
                    orgintext: orgintext
		        };
		      }

		      scope.$watch('numPages + currentPage + maxSize', function() {
		        scope.pages = [];

		        // Default page limits
		        var startPage = 1, endPage = scope.numPages;

		        // recompute if maxSize
		        if ( scope.maxSize && scope.maxSize < scope.numPages ) {

		        	//alert("scope.maxSize");
		          startPage = Math.max(scope.currentPage - Math.floor(scope.maxSize/2), 1);
		          endPage   = startPage + scope.maxSize - 1;

		          // Adjust if limit is exceeded
		          if (endPage > scope.numPages) {
		            endPage   = scope.numPages;
		            startPage = endPage - scope.maxSize + 1;
		          }
		        }

		        // Add page number links
		        for (var number = startPage; number <= endPage; number++) {
		          var page = makePage(number, number, scope.isActive(number), false,'numbers',number);
		          scope.pages.push(page);
		        }

		        // Add previous & next links
		        if (directionLinks) {
		          var previousPage = makePage(scope.currentPage - 1, '', false, scope.noPrevious(),'icon-backward','Previous');
		          scope.pages.unshift(previousPage);

		          var nextPage = makePage(scope.currentPage + 1, '', false, scope.noNext(),'icon-forward','Next');
		          scope.pages.push(nextPage);
		        }

		        // Add first & last links
		        if (boundaryLinks) {
		          var firstPage = makePage(1, '', false, scope.noPrevious(),'icon-fast-backward','First Page');
		          scope.pages.unshift(firstPage);

		          var lastPage = makePage(scope.numPages, '', false, scope.noNext(),'icon-fast-forward','Last Page');
		          scope.pages.push(lastPage);
		        }


		        if ( scope.currentPage > scope.numPages ) {
		          scope.selectPage(scope.numPages);
		        }
		      });
		      scope.noPrevious = function() {
		        return scope.currentPage === 1;
		      };
		      scope.noNext = function() {
		        return scope.currentPage === scope.numPages;
		      };
		      scope.isActive = function(page) {
		        return scope.currentPage === page;
		      };

		      scope.selectPage = function(page) {


		    	 if ( ! scope.isActive(page) && page > 0 && page <= scope.numPages) {

		          scope.currentPage = page;
		          scope.onSelectPage({ page: page });
		        }
		      };
		    }
		  };
		}]);

varsityframework.constant('paginationConfig', {
	  boundaryLinks: false,
	  directionLinks: true,
	  firstText: 'First',
	  previousText: 'Previous',
	  nextText: 'Next',
	  lastText: 'Last'
});

varsityframework.filter('startFrom', function () {
    return function (input, start) {
        if (input) {
            start = +start; //parse to int
            return input.slice(start);
        }
        return [];
    };
});


