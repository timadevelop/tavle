// переминифицыровавть в случае изменения
$(document).on('click','.user', function(){
	var element = $('.user');
	if( element.height() <= 170 ){
		element.height(260);
		element.css('background-color', 'rgba(52, 73, 94, 0.9)');
		
	} else{
		element.height(160);
		element.css('background-color', 'rgba(52, 73, 94, 0.7)');
	}
});

$(document).on('click','.authSettingsB', function(){
	$('.mainSettingsB').removeClass('cheked');
	$('.authSettingsB').addClass('cheked')
	$('#mainSettings').hide(400);
	$('#authSettings').show(400);
});
$(document).on('click','.mainSettingsB', function(){
	$('.authSettingsB').removeClass('cheked');
	$('.mainSettingsB').addClass('cheked')
	$('#authSettings').hide(400);
	$('#mainSettings').show(400);
});
$(document).on('click','#slideMenu', function(e){
	e.preventDefault();
	$('html').toggleClass('nav-active');       
});

$(document).on('click','p#more', function(){
	$('ul#hidden').toggle(100, function () {
		$('p#more').toggle(0);
	});
});
$(document).on('click','p#hideCom', function(){
	$('ul#hidden').toggle(100, function () {
		$('p#more').toggle(0);
	});
});