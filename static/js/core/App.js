/* App Module */
var varsityframework = angular.module('varsityframework', []);

varsityframework.config(['$routeProvider', function($routeProvider){
	$routeProvider.when('/login', {
		templateUrl : 'login.html',
		controller : loginController
	});

	$routeProvider.when('/home', {
		templateUrl : '../../../static/partials/home.html',
		controller : HomeController
	});

	$routeProvider.when('/videos', {
		templateUrl : '../../../static/partials/videos.html',
		controller : videoController
	});

	$routeProvider.when('/reports', {
		templateUrl : 'reports.html',
		controller : reportsController
	});

	$routeProvider.otherwise({
    	redirectTo : '/home'
	});
}]);



function reportsController(){
	// reports code goes here
	$("#navTabs").show();
	activateTab('reports');
}

function activateTab(id){
	$('ul#navTabs li').removeClass('active');
	$('li#'+id).addClass('active');
}

function modifyGetLableJSON(responseJSON){
	var myJSON = responseJSON;

		var myNewJSONLables = [];
		$.each(myJSON, function(i, item) {
			var newLabel = {"categoryName" : myJSON[i].category};
			if($.inArray(item.category, myNewJSONLables) === -1){
				myNewJSONLables.push(item.category);
			}
		});
		var myNewJSON = [];

		for(j=0; j < myNewJSONLables.length; j++){
			var newArray = {
				"label" : myNewJSONLables[j],
				"id" : j,
				"optionValues" : []
			};
			myNewJSON.push(newArray);
		}


		$.each(myNewJSON, function(i, item) {
			$.each(myJSON, function(j, itemJson) {
				if(item.label === itemJson.category){
					var optionvalue = {"value" : itemJson.label}
					item.optionValues.push(optionvalue);
				}
			});
		});
		return myNewJSON;
}

function HomeController($scope,$rootScope, $http){
	activateTab('home');
	$("#navTabs").show();
	var httpPromise = $http;
	var getLabelAPI = '/getLabels';  // -----   /getLabels
	var getVideosApi = '/getVideos'; // ------    /getVideos
	var saveVideoLabelAPI = '/saveVideo'; // ------ /saveVideo
	var saveLabelAPI = '/saveLabel';
	var counter = 1;
	callServerGETAPI(httpPromise, getLabelAPI, procesSearch);
	callServerGETAPI(httpPromise, getVideosApi, procesVideos);

	function procesSearch(responseData){
		$scope.selectJSON = modifyGetLableJSON(responseData);
	}
	$scope.currentvideoId = 0;
	function procesVideos(responseData){
		$scope.vData = responseData.results.videos;
		$scope.totalVideos = $scope.vData.length;
		//$scope.vData = responseData;
		//$scope.totalVideos = $scope.vData.length;
		$('#heroCarousel').carouFredSel({
			width: 700,
			height: '450',
			prev: '#prev2',
			next: '#next2',
			auto: false,
			scroll: {
				onAfter : function(){
					//var $this = $("#heroCarousel");
					//var items = $this.triggerHandler("currentPosition");
					//$scope.currentvideoId = items + parseInt(1);
					$scope.currentvideoId = $("#heroCarousel li:first").find('video').attr('videoid');
					$("#next2").addClass('disabled');
					$('.toolTip').addClass('disabled');
					$scope.saveLabelMsg = false;
					$('.saveLabelMsg').hide();
					for(i=0; i <= $scope.selectJSON.length; i++){
						$("#cf-" + i).val('');
					}
					var pos = $("#heroCarousel").triggerHandler("currentPosition");
                    pos = pos + parseInt(1);
					if($scope.totalVideos == pos){
                         callServerGETAPI(httpPromise, getVideosApi, procesNewVideosSet);
					}
				}
			}
		});
	}

	function procesNewVideosSet(responseData){
		setTimeout(function(){
            $.each(responseData.results.videos, function(key, v){
                $scope.vData.push(this);
		      });
		      $scope.totalVideos = responseData.results.videos.length;
            counter++;
        }, 1000);
	}


	$scope.addLabel = function(){
		$scope.labelName = '';
		$scope.myLabels = '';
		$('#labelModal').modal('show');
	};

	$scope.addCategory = function(){
		$scope.addNewCategory = '';
		$('#categoryModal').modal('show');
	};

	$scope.saveLabel = function(){
		$scope.displayErrorMsg = false;
		$scope.displayChooseOptionErrorMsg = false;

		var newLable = {"value" : $scope.labelName};
		if(($scope.myLabels === undefined) || ($scope.labelName == '') || ($scope.myLabels === '')){
			$scope.displayChooseOptionErrorMsg = true;
				return;
		};

		$.each($scope.myLabels.selectedValue.optionValues, function(key, v){
			if(v.value === $scope.labelName){
				$scope.displayErrorMsg = true;
				return;
			}
		});


		if($scope.displayErrorMsg === false){
			var getSelectedId = $scope.myLabels.selectedValue.id;
			$scope.selectJSON[getSelectedId].optionValues.push(newLable);
			$('#labelModal').modal('hide');
			var newLabelData = {
				"category": $scope.myLabels.selectedValue.label,
				"label" : $scope.labelName
			};
			callServerPOSTAPI(httpPromise, saveLabelAPI, procesSaveLabel, newLabelData);
		}

	};

	$scope.saveCategory = function(){
		$scope.displayCategoryErrorMsg = false;
		$scope.displayEnterCategoryErrorMsg = false;
		var selectBoxObj = {
			"label" : $scope.addNewCategory,
			"id" : $scope.selectJSON.length,
			"optionValues" :[]
		};

		if($scope.addNewCategory == ''){
			$scope.displayEnterCategoryErrorMsg = true;
			return;
		}
		$.each($scope.selectJSON, function(key, v){
			if(v.label === $scope.addNewCategory){
				$scope.displayCategoryErrorMsg = true;
				return;
			}
		});

		if($scope.displayCategoryErrorMsg === false){
			$scope.selectJSON.push(selectBoxObj);
			$('#categoryModal').modal('hide');
		}


	};

	$scope.applyLabel = function(){
		var count = 0;
		$scope.selectOneCategory = false;
		$scope.saveLabelMsg = false;
		for(i=0; i <= $scope.selectJSON.length; i++){
			getValue = $("#cf-" + i).val();
			if(getValue === ''){
				count = count + 1;
			}
		}
		//console.log("count:" + count + "-- JOSN Length" + $scope.selectJSON.length);
		if(count === $scope.selectJSON.length){
			$scope.selectOneCategory = true;

		}else{
			var formData = $("#test").serializeArray();
			$scope.currentvideoId = $("#heroCarousel li:first").find('video').attr('videoId');
			console.log($scope.currentvideoId);
			var forminputData = {
				"videoId" : $scope.currentvideoId,
				"labels" : []
			};
			$.each(formData, function(key, v){
				if(v.value !== ""){
					forminputData.labels.push(this);
					return;
				}
			});
			callServerPOSTAPI(httpPromise, saveVideoLabelAPI, procesSaveVideoLabel, forminputData);
		}
	};

	function procesSaveLabel(responseData){
		if(responseData === 'true'){
			$('#labelModal').modal('hide');
		}
	}

	function procesSaveCategory(responseData){
		if(responseData === 'true'){

		}
	}

	function procesSaveVideoLabel(responseData){
		if(responseData != ''){
			$scope.saveLabelMsg = true;
			$("#next2").removeClass('disabled');
			$('.toolTip').removeClass('disabled');
			$('.saveLabelMsg p').html(responseData).show();
		}
	}


	$(".showToolTip").hover(function(){
		if($('#next2').hasClass('disabled')){
			$('.tooltip').show();
		}
	}, function(){
		$('.tooltip').hide();
	});

}



function callServerGETAPI(httpPromise, apiName, reponseHandler){
	httpPromise.get(apiName).success(reponseHandler);
}

function callServerPOSTAPI(httpPromise, apiName, reponseHandler, data){
	httpPromise.post(apiName, data).success(reponseHandler);
}

