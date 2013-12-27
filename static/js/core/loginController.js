function loginController($scope, $http, $location){
	$("#navTabs").hide();
	$scope.doLogin = function(){
		var httpPromise = $http;
		 if (angular.isUndefined($scope.user) || $scope.user == null){
			$scope.showLoginError = true; 		 
		 }else{
			if(($scope.user.name == '') || ($scope.user.password == '')){
				$scope.showLoginError = true; 	
			}else{
				$scope.showLoginError = false;
				var loginAPI = 'js/common/doLogin.js';
				callServerPOSTAPI(httpPromise, loginAPI, processLogin, $scope.user); 
			}
		 }
	};
	
	function processLogin(data){
		if(data === 'true'){
			$location.url('/home');
		}
	}
}