// Debug
var d;

// Extension to collect to
var editorExtensionId = "jfoccjedookdnmlmbeijagjhloanljan";

// Generate a uuid for the user and put it in the cookie
var uuid = guid();
if (!Cookies.get('uuid')) {
	Cookies.set('uuid', uuid);
}

/*
	Main function
	add additional buttons to gmail
	listen on button click
*/
var main = function() {
	// addBtn("Captured");
	// addBtn("Snap");
	// addBtn("CEdit");
	addBtn2();

	// Listen on the right click (contextmenu)
	$(document).on("contextmenu", "img[class*='snap_img']", function() {
		var check = checkImgOwner(this.alt);
		// Notify the background to update the context menu
		chrome.runtime.sendMessage(editorExtensionId, {
			message: 'update_ContextMenu',
			type: 'destroyBtn',
			isOwner: check,
		});
	});

	// Listen for cedit button click
	$(document).on("click", ".CEdit_btn", function() {
		handleConvertToImg.call(this, 'cedit');
	});

	// Listen for snap button click
	$(document).on("click", ".Snap_btn", function() {
		handleConvertToImg.call(this, 'snap');
	});

	// Listen for captured button click
	$(document).on("click", ".Captured_btn", function() {
		console.log("captured button is pressed");
		chrome.runtime.sendMessage(editorExtensionId, { message: 'captured_Clicked'},
			function(response) {
				console.log(response);
				if (response.img) {
					// Add the image to the email
					insertCapturedImg(response.img);
				} else {
					alert(response.error);
				}
			});
	});

	// Edit text img
	$(document).on("mouseenter", "img[class*='cedit_img']", function() {
		var check = checkImgOwner(this.alt);
		if (check) {
			$(this).css('cursor', 'text');
		}
	});

	// If the user clicks a cedit image
	$(document).on("click", "img[class*='cedit_img']", function(event) {
		console.log("img being clicked");
		var check = checkImgOwner(this.alt);
		// If the image belongs to the reader
		if (check) {
			$(".Lf").css('display', 'none');
			// Save the current context this
			var imgClicked = this;
			// Insert a textarea box
			var input = $('<textarea class="cedit_edit" type="text">').insertAfter(this).focus();
			$(this).css('display', 'none');

			// Get original text content from the backend
			if ($(this).attr('id')) {
				var refid = $(this).attr('id').split(" ")[1];
				getOriginalText(refid).done(function(res) {
					var res = JSON.parse(res);
					$(input).val(res.text);
				});
			}

			// When the input box itself is being clicked, stop removing the input box
			$(input).on('click', function(event) {
				event.stopPropagation();
			});

			// Remove the input box when it loses focus
			$(document.body).on('click', function() {
				$(imgClicked).css('display', 'initial');
				// Remove the input box
				$(input).remove();
			});

			// When the user presses the enter key, send the new updated text to the backend
			$(input).on('keypress', function(event) {
				// Keep the focus
				event.stopPropagation();
				// Finishing editing
				if (event.keyCode === 13 || event.charCode === 13) {
					convertToImg($(input).val(), "sans-serif", 13, refid, $(imgClicked), Cookies.get('uuid'), 'cedit');
					$(input).remove();
					$(imgClicked).css('display', 'initial');
				}
			});

		}
	});
}

/*
	Function to add a button
*/
// function addBtn(btn_name) {
// 	setInterval(function() {
// 		// Selectors specifically for Gmail
// 		// Target the "send" button
// 		var $target = $(`div[data-tooltip*='Enter']:not(.${btn_name}_added)`);
// 		if ($target.length > 0) {
// 			$target.addClass(`${btn_name}_added`);
// 			var btn = document.createElement("div");
// 			btn.innerHTML = btn_name;
// 			btn.className = `T-I J-J5-Ji aoO T-I-atl ${btn_name}_btn`;
// 			$target.after(btn);
// 		}
// 	}, 1000);
// }

function addBtn2() {
	setInterval(function() {
		var $target_container = $($($(`div[data-tooltip*='Formatting options']`).parent().siblings()[2]).children()[0]);
		var btn_options = $('<div class="emailplus-toolbar-options hidden"> \
													<a href="#" class="Snap_btn fa fa-eraser"></a> \
													<a href="#" class="CEdit_btn fa fa-pencil"></a> \
													<a href="#" class="Captured_btn fa fa-window-maximize"></a></div>');
		var btn = $('<div class="emailplus-toolbar btn-toolbar"></div>');
		if (!$target_container.hasClass('emailplus_added')) {
			$target_container.addClass(`emailplus_added`);
			$target_container.prepend(btn_options);
			$target_container.prepend(btn);
			// intiialize the toolbar
			$('.emailplus-toolbar').toolbar({
				content: '.emailplus-toolbar-options',
			});
		}
	}, 1000);
}


/*
	Function to handle the whole process of converting text to image
	input: type (cedit, snap)
*/
function handleConvertToImg(type) {
	console.log("handleConvertToImg this", this);
	console.log("handleConvertToImg type", type);
	// var $btn = $(this);
	var $btn = $('.emailplus-toolbar');
	var textbox = $($btn.parents("tbody")[1]).find("[role=textbox]")[0];
	console.log("handleConvertToImg textbox", textbox);
	// Make sure the selected text is on focus when clicking the button
	textbox.focus();
	// CEdit do stuff only if the textbox is not empty
	if ($(textbox).html() != "") {
		var $selectedText = window.getSelection();
		// Get the plain text from the selected text
		var text = $selectedText.toString();
		// If the user selects nothing
		if (text == "") {
			switch (type) {
				case 'cedit':
					alert("Please select things that you want to be able to edit later.");
					break;
				case 'snap':
					alert("Please select things that you want to be able to destroy later.");
					break;
			}
		} else {
			console.log("selected text: "+text);
			// Get the font family of the selected text
			var font_family = $($selectedText.getRangeAt(0).commonAncestorContainer.parentNode).css('font-family');
			font_family = font_family || 'sans-serif';
			console.log('font-family: '+font_family);
			// Get the font size of the selected text  // small = 10, normal = 13, large = 18, huge = 32px
			var font_size = parseInt($($selectedText.getRangeAt(0).commonAncestorContainer.parentNode).css('font-size'));
			font_size = font_size || 13;
			console.log('font-size: '+font_size);

			var range = $selectedText.getRangeAt(0);
			// Check if the selected text containing any images
			var check = validSelectedText(range);
			if (check) {
				// Convert the rest of email into html
				var $imgContainer = convertToHTML(textbox, $selectedText);
				// Send the selected text to background
				convertToImg(text, font_family, font_size, undefined, $imgContainer, Cookies.get('uuid'), type);
			} else {
				alert("Your selection that contains non-text content! Please re-select");
			}
		}
	}
} // end of handleConvertToImg


/*
 	Insert a captured image
*/
function insertCapturedImg(src) {
	var img = createImgContainer('captured');
	img.setAttribute('src', src);
	var textbox = $($(".CEdit_btn").parents("tbody")[1]).find("[role=textbox]")[0];
	textbox.append(img);
}

/*
	Convert txt email to HTML email, except for the part the user selected
	Mark the part before the user selected text for later insertion
*/
function convertToHTML(textbox, $selectedText) {
	// If the selected text is nothing
	if ( $selectedText.toString() == "" ) {
		// do nothing
	} else {
		var range = $selectedText.getRangeAt(0);
		// Convert the selected text into an img tag
		var img = createImgContainer('cedit');
		img.appendChild(range.extractContents());
		range.insertNode(img);
		return $(img);
	}
}

/*
	Check if the selected text if valid (if it contains non-text)
	param: range
	return
*/
function validSelectedText(range) {
	console.log("check selected text");
	var nodes = range.cloneContents().querySelectorAll('*');
	var len = nodes.length;
	for (var i = 0; i < len; i++) {
		// if the node is an image, do nothing
		if (nodes[i].nodeName === "IMG") {
			return false;
		}
	}
	return true;
}

/*
	Create an image container and set image attribute
*/
function createImgContainer(img_type) {
	var img = document.createElement("img");
	img.setAttribute('src', "");
	img.setAttribute('class', img_type);
	img.setAttribute('alt', Cookies.get('uuid'));
	return img;
}

/*
	Send text to and receive the converted img from backend
	call API
	params: text, refid
	internal params: imgContainer, uuid, type
*/
function convertToImg(text, font_family, font_size, refid, $imgContainer, uuid, type) {
	if (text == "") {
		return;
	}
	console.log("convert to img");
	var api = 'https://boosend.com/getImg';
	$.ajax({
	    type: 'POST',
	    url: api,
			crossDomain: true,
			withCredentials: true,
	    data: {
        'text': text,
				'font-family': font_family,
				'font-size': font_size,
				'refid': refid,
				'type': type
	    },
	    success: function(msg){
				msg = JSON.parse(msg);
				console.log(msg);
	    	// Insert the image into the imgContainer
				$imgContainer.attr('src', msg.img);
				$imgContainer.attr('alt', uuid);
				$imgContainer.attr('id', " " + msg.refid);
				$imgContainer.attr('class', `${type}_img`);
	    }
	});
}

/*
	Send refid to and receive the text content from backend
	call API
	params: refid
	internal params: imgContainer
*/
function getOriginalText(refid, new_text) {
	console.log(refid);
	var res;
	var api = 'https://www.boosend.com/getText';
	return $.ajax({
		type: 'GET',
		url: api,
		crossDomain: true,
		withCredentials: true,
		data: {
			'refid': refid
		},
		success: function(msg) {
			res = JSON.parse(msg);
		}
	});
}

/*
	Check if the image belongs to the current user
*/
function checkImgOwner(imgUUID) {
	if (imgUUID === Cookies.get('uuid')) {
		return true;
	} else {
		return false;
	}
}

/*
	Generate a unique uuid
	http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
*/
function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

/*
	Make sure the main script is loaded after the document finishes loading
*/
function refresh(script) {
	console.log(document.readyState);
  if ((document.readyState) !== 'complete') {
		setTimeout(`refresh(${script})`, 10); // depreciated syntax, but it works...
		// setTimeout(refresh(script), 10)  // this will become a infinite loop...
  } else {
      script();
  }
}
refresh(main);
