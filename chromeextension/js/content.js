
	// Load jQuery
	var jquery = document.createElement('script');
	jquery.src = chrome.extension.getURL('vendor/jquery.min.js');
	(document.head || document.documentElement).appendChild(jquery);

	// Load js.cookie
	var cookie = document.createElement('script');
	cookie.src = chrome.extension.getURL('vendor/js.cookie.js');
	(document.head || document.documentElement).appendChild(cookie);

	setTimeout(function(){
		// event.js
		var script = document.createElement('script');
		script.src = chrome.extension.getURL('js/event.js');
		(document.head || document.documentElement).appendChild(script);

		// toolbar js
		var toolbarjs = document.createElement('script');
		toolbarjs.src = chrome.extension.getURL('vendor/jquery.toolbar.js');
		(document.head || document.documentElement).appendChild(toolbarjs);

		// font-awesome
		var fontawesomejs = document.createElement('script');
		fontawesomejs.src = chrome.extension.getURL('vendor/fontawesome.js');
		(document.head || document.documentElement).appendChild(fontawesomejs);
	}, 1500);

	// toolbar css
	var toolbarcss = document.createElement('link');
	toolbarcss.href = chrome.extension.getURL('vendor/jquery.toolbar.css');
	toolbarcss.rel = "stylesheet";
	(document.head || document.documentElement).appendChild(toolbarcss);

	// Load the css file
	var css = document.createElement('link');
	css.href = chrome.extension.getURL('css/event.min.css');
	css.rel = "stylesheet";
	(document.head || document.documentElement).appendChild(css);

console.log("content loaded");
