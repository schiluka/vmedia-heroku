/* App Module */
var varsityframework = angular.module('varsityframework', []);

varsityframework.config(['$routeProvider', function($routeProvider){
	$routeProvider.when('/home', {
		templateUrl : 'home.html',
		controller : HomeController
	});
	
	$routeProvider.when('/videos', {
		templateUrl : 'videos.html',
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

function videoController(){
	// videos code goes here
	activateTab('videos');
}

function reportsController(){
	// reports code goes here
	activateTab('reports');
}

function activateTab(id){
	$('ul#navTabs li').removeClass('active');
	$('li#'+id).addClass('active');
}

function HomeController($scope,$rootScope, $http){ 
	activateTab('home');	
	var httpPromise = $http;
	var getLabelAPI = 'js/common/selectBoxJson.js';  // -----   /getLabels
	var getVideosApi = 'js/common/video_JSON.js'; // ------    /getVideos
	var saveVideoLabelAPI = '/saveVideo';
	var saveLabelAPI = '/saveLabel';
	callServerGETAPI(httpPromise, getLabelAPI, procesSearch); 
	callServerGETAPI(httpPromise, getVideosApi, procesVideos);  	
	
	function procesSearch(responseData){
		//alert(responseData);
		$scope.selectJSON = responseData;
	}
	$scope.currentvideoId = 0; 
	function procesVideos(responseData){
		$scope.vData = responseData.videos;
		$scope.totalVideos = $scope.vData.length; 		
		$('#heroCarousel').carouFredSel({
			width: 700,
			height: '450',
			prev: '#prev2',
			next: '#next2',
			auto: false,
			scroll: {
				onAfter : function(){
					var $this = $("#heroCarousel"); 
					var items = $this.triggerHandler("currentPosition");
					$scope.currentvideoId = items + parseInt(1);
					console.log($scope.currentvideoId + "---" + $scope.totalVideos)
					if($scope.currentvideoId === $scope.totalVideos){
							
							//callServerGETAPI(httpPromise, getVideosApi, procesNewVideosSet);
					}
				}
			}
		});
	}
	
	function procesNewVideosSet(responseData){
		$.each(responseData.videos, function(key, v){
			$scope.vData.push(this);
		});
		$scope.totalVideos = $scope.vData.length; 
		//console.log(JSON.stringify($scope.vData));
		//console.log($scope.totalVideos)
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
			$scope.selectJSON[getSelectedId - 1].optionValues.push(newLable);
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
			"id" : $scope.selectJSON.length + 1,
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
		for(i=1; i <= $scope.selectJSON.length; i++){
			getValue = $("#cf-" + i).val();
			console.log(getValue);
			if(getValue === ''){
				count = count + 1;
			}
		}
		if(count === $scope.selectJSON.length){
			$scope.selectOneCategory = true;
		}else{
			var formData = $("#test").serializeArray();
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
		}
		
		console.log(forminputData);
		callServerPOSTAPI(httpPromise, saveVideoLabelAPI, procesSaveVideoLabel, forminputData); 
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
		alert(responseData);
	}
}



function callServerGETAPI(httpPromise, apiName, reponseHandler){
	httpPromise.get(apiName).success(reponseHandler); 	
}

function callServerPOSTAPI(httpPromise, apiName, reponseHandler, data){ 	
	httpPromise.post(apiName, data).success(reponseHandler); 	
}

