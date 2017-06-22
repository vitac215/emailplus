const server = "snapmailimgs.s3.amazonaws.com:443";
var d;

// Right click the chrome icon
chrome.contextMenus.create({
  "id": "capture-screen",
  "title": "Capture",
  "contexts": ["all"]
});

chrome.contextMenus.create({
  "id": "destroy-0",
  "title": "Destroy it immediately",
  "contexts": ["image"]
});

// When the user clicks the menu item "Capture"
chrome.contextMenus.onClicked.addListener(function(info, tab) {
  if (info.menuItemId == "capture-screen") {
    init(tab);
  }
});

// When the user clicks the menu item "Destroy..."
chrome.contextMenus.onClicked.addListener(function(info, tab) {
  d = info;
  if (info.menuItemId == "destroy-0") {
    console.log("destroy");
    var refid = getRefid(info);
    console.log(refid);
    destroyImg(refid, 0);
  }
});

// Listen for capture command
chrome.commands.onCommand.addListener((command) => {
  console.log("Command: "+command);
  if (command === 'capture-screen') {
    chrome.tabs.getSelected(null, (tab) => {
      init(tab);
    })
  }
});

// Initialize
function init(tab) {
  console.log("init");
  // Prevent re-injecting css and js
  chrome.tabs.sendMessage(tab.id, {message: 'init', tab: tab}, (res) => {
    console.log(res);
    if (res) {
      clearTimeout(inject);
    }
  })

  // Inject css and js
  var inject = setTimeout(() => {
    chrome.tabs.insertCSS(tab.id, {file: 'vendor/Jcrop.min.css', runAt: 'document_start'})
    chrome.tabs.insertCSS(tab.id, {file: 'css/capture.min.css', runAt: 'document_start'})

    chrome.tabs.executeScript(tab.id, {file: 'vendor/jquery.min.js', runAt: 'document_start'})
    chrome.tabs.executeScript(tab.id, {file: 'vendor/Jcrop.min.js', runAt: 'document_start'})
    chrome.tabs.executeScript(tab.id, {file: 'js/capture.js', runAt: 'document_start'})

    // Make sure the client side is intiated after the content.js is loaded
    setTimeout(() => {
      // Initialize the client side
      chrome.tabs.sendMessage(tab.id, {message: 'init', tab: tab})
    }, 200);
  }, 200);

}


/*
  Take in info of an image and return the refid
*/
function getRefid(info) {
  var imgUrl = info.srcUrl;
  var refid;
  // Gmail
  if (info.pageUrl.includes("mail.google.com")) {
    var tempArray = imgUrl.split('/');
    console.log(tempArray);
    var index = tempArray.indexOf(server) + 1;
    refid = tempArray[index].split('.jpg')[0];
  }
  return refid;
}

/*
  Destroy a image based on refid
  call API
  params: refid
*/
function destroyImg(refid, time) {
  var api = 'https://boosend.com/destroyImg';
  $.ajax({
	    type: 'POST',
	    url: api,
			crossDomain: true,
			withCredentials: true,
	    data: {
        'refid': refid,
        'time':  time,
	    }
	});
}

// Listen for captured image and send it to email client side
chrome.runtime.onMessage.addListener((req, sender, res) => {
  console.log(req);

  if (req.message === 'captured') {
    // test, to be deleted
    // req.img = 'https://68.media.tumblr.com/avatar_01c7ac507d2a_128.png';
    Cookies.set('captured_img', req.img);
  }
});

/*
  Listen for client-side requests
*/
chrome.runtime.onMessageExternal.addListener(
  function(request, sender, sendResponse) {
    console.log(request.message);

    switch(request.message) {
      case 'captured_Clicked':
        var img = Cookies.get('captured_img');
        // Delete cookie
        Cookies.remove('captured_img');
        if (img) {
          sendResponse({ message: 'image', img: img });
        } else {
          sendResponse({ message: 'image', error: 'Press Alt+C to capture something on the screen!' });
        }
        break;
      // end of case 'captured_Clicked'

      case 'update_ContextMenu':
        if (request.type === 'destroyBtn') {
          // If the user is not the owner of the image, disable the contextMenu
          if (!request.isOwner) {
            console.log("enabled false");
            chrome.contextMenus.update("destroy-0", {
                'title': "Destroy it immediately",
                "contexts": ["image"],
                'enabled': false
            });
          } else {
            console.log("enabled true");
            chrome.contextMenus.update("destroy-0", {
                'title': "Destroy it immediately",
                "contexts": ["image"],
                'enabled': true
            });
          }
        }
        break;
      // end of case 'update_ContextMenu'
    } // end of switch
  }
);
