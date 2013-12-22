$( "#btnLabel" ).click(function() {
  //alert( "Handler for btnLabel .click() called." );
  $('#labelModal').modal('show');
});

$( "#btnCategory" ).click(function() {
  //alert( "Handler for btnCategory .click() called." );
  $('#categoryModal').modal('show');
});

$( "#btnSaveLabel" ).click(function() {
  var labelValue = $('#txtModalLabel').val();
  $.ajax({ 
  	url: '/saveLabel',
    type: 'POST',
    cache: false, 
    contentType: 'application/json',
    data: JSON.stringify({ labelName: labelValue }), 
    success: function(data){
    	alert(data)
    }
    , error: function(jqXHR, textStatus, err){
    		alert('text status '+textStatus+', err '+err)
    	}
    });
    $('#labelModal').modal('hide');
});   

$( "#btnSaveCategory" ).click(function() {
  var categoryValue = $('#txtModalCategory').val();
  $.ajax({ 
  	url: '/saveCategory',
    type: 'POST',
    cache: false, 
    contentType: 'application/json',
    data: JSON.stringify({ categoryName: categoryValue }), 
    success: function(data){
    	alert(data)
    }
    , error: function(jqXHR, textStatus, err){
    		alert('text status '+textStatus+', err '+err)
    	}
    });
    $('#categoryModal').modal('hide');
});   
