var $jcrop, selection, placeholder_img, tab, newRound;

var setImage = (done) => {
  placeholder_img = new Image();
  placeholder_img.id = "placeholder-img";
  placeholder_img.src = chrome.runtime.getURL('/images/placeholder.png');
  placeholder_img.onload = () => {
    $('body').append(placeholder_img);
    done();
  }
};

var init = (done) => {
  // Set up the croppable space with Jcrop
  $('#placeholder-img').Jcrop({
    bgColor: 'none',
    onChange: (event) => {
      console.log("onChange");
      selection = event;
    },
    onSelect: (event) => {
      console.log("onSelect");
      selection = event;
      capture();
    },
    onRelease: () => {
      console.log("onRelease");
      selection = null;
    }
  }, function ready() {
    console.log("init ready");
    $jcrop = this;
    // Set up the jcrop broder
    $('.jcrop-hline, .jcrop-vline').css({
      backgroundImage: 'url(' + chrome.runtime.getURL('/images/crop.gif') + ')'
    })
    done();
  });
}

function setSpace(active) {
  console.log("setSpace");
  $('.jcrop-holder')[active ? 'show' : 'hide']();
};

function capture() {
  console.log("capture");
  console.log(selection);
  if (selection) {
    var captured = selection;

    // Reset the selection and space
    selection = null;
    $jcrop.release();
    setSpace(false);

    // Get the website url
    var url = tab.url;
    console.log("url: "+url);

    // Get the coordinates
    // http://deepliquid.com/projects/Jcrop/demos.php?demo=handler
    var x1 = captured.x;
    var y1 = captured.y;
    var x2 = captured.x2;
    var y2 = captured.y2;

    // Get the viewport size
    var width = document.documentElement.clientWidth;
    var height = document.documentElement.clientHeight;

    alert("Please wait for the screenshot to be processed");

    captureScreen(url, x1, y1, x2, y2, width, height, true).done(function(res) {
      var img = JSON.parse(res).img;
      console.log("img src= "+img);
      alert("The captured screen is successfully saved. You can press the 'Captured' button in your email to retrieve it.");
      chrome.runtime.sendMessage({
        message: 'captured',
        img: img
      });
    }); // end captureScreen

  }
}

// Send the coordinates and website url to backend
function captureScreen(url, x1, y1, x2, y2, w, h, return_json) {
  var api = 'https://boosend.com/capture';
  var res;
  return $.ajax({
	    type: 'POST',
	    url: api,
			crossDomain: true,
			withCredentials: true,
	    data: {
        'url': url,
				'x1': x1,
				'y1': y1,
        'x2': x2,
        'y2': y2,
        'w': w,
        'h': h,
        'return_json': return_json
	    },
	    success: function(msg){
        console.log(msg);
				res = msg;
	    }
	});
}

// Listen for initialization
chrome.runtime.onMessage.addListener((req, sender, res) => {
  console.log("init arrives");
  tab = req.tab;
  if (req.message === 'init') {
    // Prevent re-injecting css and js
    res(true);

    if (!placeholder_img) {
      setImage(() => init(() => {
        // done()
        setSpace(true)
        capture()
      }))
    }
    // if the placeholder image has already been set up
    else {
      setSpace(true)
      capture()
    }
  }
})
