function loginController($scope, $http, $location){
	$("#navTabs").hide();
    $('.navbar-brand').attr('href','javascript:void(0)');
    $scope.showLoginError = false; 
	$scope.doLogin = function(){
		var httpPromise = $http;
		 if (angular.isUndefined($scope.user) || $scope.user == null){
			$scope.showLoginError = true; 		 
		 }else{
             if($scope.user.name == '' || $scope.user.password == '' || angular.isUndefined($scope.user.name) ||                             angular.isUndefined($scope.user.password)){
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