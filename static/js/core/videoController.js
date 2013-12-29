function videoController($scope,$rootScope, $http){
	activateTab('videos');
	$("#navTabs").show();
	$scope.showResults = false;
	var httpPromise = $http;
	var getLabelAPI = '/getLabels';  // -----   /getLabels
	var searchVideosAPI = '/searchVideos'; //'js/common/searchVideos-output_JSON.js'; // -----SearchVideos API
	callServerGETAPI(httpPromise, getLabelAPI, procesVideoSearch);

	function procesVideoSearch(responseData){
		$scope.selectVJSON = modifyGetLableJSON(responseData);
	}

	function showVideos(responseData){
		$scope.videoData  = responseData.data; //responseData.videos;
		$scope.showResults = true;

		if($scope.resultsFound === $scope.videoData.length){
			$scope.showingFullSet = true;
		}else{
			$scope.showingFullSet = false;
		}

		$scope.currentPage = 1; //current page
		$scope.maxSize = 5; //pagination max size
		$scope.entryLimit = 10; //max rows for data table
		$scope.fullrecordsSet = $scope.videoData.length
		$scope.noOfPages = Math.ceil($scope.videoData.length/$scope.entryLimit);
		$rootScope.totalRecs = JSON.stringify($scope.videoData.length);

		$scope.filterSearch = function(){
			 var st = $scope.currentPage;
			 var StartRec = st-1;
	         var stR = StartRec*10;
	         $scope.strP = stR+1;
	         var endRec = st*10;
	         $scope.endPage = endRec;
	         console.log($scope.strP);
	         $scope.noOfPages = Math.ceil($scope.videoData.length/$scope.entryLimit);
	          	if($scope.currentPage == $scope.noOfPages){
		 				$scope.endPage = $rootScope.totalRecs;
		 	}
		};

		$scope.filterSearch();

		function getElementByAttributeValue(attribute, value){
			var allElements = document.getElementsByTagName('div');
			for (var i = 0; i < allElements.length; i++){
        	  if (allElements[i].getAttribute(attribute) == value){
        		  return allElements[i];
        	  }
			}
        }


    	var k = getElementByAttributeValue('data-src', 'pager');

        k.onclick = function(){
        	setTimeout(function(){$scope.filterSearch();},200);
			$('a.icon-backward').html('&laquo;');
			$('a.icon-forward').html('&raquo;');
        };


		if($scope.videoData.length === 0){
			$scope.getSearchType = 'zeroResults';
		}


		setTimeout(function(){
			$('a.icon-backward').html('&laquo;');
			$('a.icon-forward').html('&raquo;');
		}, 200);

	}

	$scope.searchVideo = function(){
		var sCount = 0;
		$scope.selectOneSearchField = false;
		for(i=0; i <= $scope.selectVJSON.length; i++){
			getValue = $("#cf-" + i).val();
			if(getValue === ''){
				sCount = sCount + 1;
			}
		}
		if(sCount === $scope.selectVJSON.length){
			$scope.selectOneSearchField = true;
		}else{
			var formData = $("#searchVideo").serializeArray();
			var forminputData = {
				"labels" : []
			};
			$.each(formData, function(key, v){
				if(v.value !== ""){
					forminputData.labels.push(this);
					return;
				}
			});

			callServerPOSTAPI(httpPromise, searchVideosAPI, showVideos, forminputData);
		}

		console.log(JSON.stringify(forminputData));
	};
}
