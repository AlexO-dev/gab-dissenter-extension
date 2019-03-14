/**
 * @description - Gab Dissenter - Youtube content script
 */
var GDYoutube = function() {
    //Global scope
    var scope = this;

    /**
     * @description - Finds top bar, appends dissent button next to subscribe buton
     * @function fetchElements
     * @return {Boolean} success
     */
    function fetchElements() {
        //Get bar where subscribe button is
        var topBar = document.querySelector('#top-row.style-scope.ytd-video-secondary-info-renderer');

        //Must exist
        if (!topBar) {
            //If it doesn't exist, it didn't render yet, so wait and try again
            setTimeout(function() {
                fetchElements();
            }, 500);
            return false;
        }

        //Create "Dissent This" button
        var dissentBtn = createDissentBtn();

        //Append to top bar
        topBar.appendChild(dissentBtn);

        //Add event listener
        dissentBtn.onclick = dissentThisVideo;

        //Success
        return true;
    };

    /**
     * @description - Helper to create "Dissent This" button with styles
     * @function createDissentBtn
     * @return {Node}
     */
    function createDissentBtn() {
        //Create container to match the "Subscribe" button container
        var container = document.createElement("div");
        container.style.setProperty("display", 'inline-block', "important");
        container.style.setProperty("width", '120px', "important");
        container.style.setProperty("height", '50px', "important");
        container.style.setProperty("padding", '7px', "important");
        container.style.setProperty("overflow", 'hidden', "important");
        container.style.setProperty("box-sizing", 'border-box', "important");

        //Create button with same general style as "Subscribe" button but with new Gab Dissenter styles
        var button = document.createElement("a");
        button.textContent = "Dissent This";
        button.style.setProperty("display", 'inline-block', "important");
        button.style.setProperty("width", '100%', "important");
        button.style.setProperty("height", '100%', "important");
        button.style.setProperty("padding", '10px', "important");
        button.style.setProperty("background-color", COLOR_GAB_GREEN, "important");
        button.style.setProperty("color", '#fff', "important");
        button.style.setProperty("border-radius", '2px', "important");
        button.style.setProperty("text-align", 'center', "important");
        button.style.setProperty("font-size", '14px', "important");
        button.style.setProperty("box-sizing", 'border-box', "important");
        button.style.setProperty("cursor", 'pointer', "important");

        //Append
        container.appendChild(button);

        //Return container
        return container;
    };

    /**
     * @description - Makes a request to the background to open a new dissenter comment window with current page url
     * @function dissentThisVideo
     */
    function dissentThisVideo() {
        //Get url, height
        var url = window.location.href;
        var height = window.innerHeight;
		
		// TODO: Add to options..
		/*
        //Send message to background to open popup window
        __BROWSER__.runtime.sendMessage({
            action: BACKGROUND_ACTION_OPEN_POPUP,
            url: url,
            height: height
        });*/
		
		
		loadYTComments();
    };

    /**
     * @description - Makes a request to Dissenter and gets the comments.
     * @function loadYTComments
     */
    function loadYTComments() {
		// Only load extension if v exists, which it won't on pages like the home page or settings
		var youtube_url = new URL(window.location.href);
		if (!youtube_url.searchParams.get("v")) return false;
		var v = youtube_url.origin + "/watch?v=" +  youtube_url.searchParams.get("v")
		var commentUrl = BASE_URI + v;
		
		fetch(commentUrl).then(function(response) {return response.text();})
		.then(parseYTComments);
    };

	/**
     * @description - Parses output from Dissenter servers.
     * @function parseYTComments
     */
    function parseYTComments(data) {
		
		// Need fontAwesome to display the votes icons.
		var head = document.getElementsByTagName("head")[0];
		fontAwesome = document.createElement("link");
		fontAwesome.rel = "stylesheet";
		fontAwesome.crossOrigin = "anonymous";
		fontAwesome.href = "https://use.fontawesome.com/releases/v5.7.2/css/all.css";
		fontAwesome.integrity = "sha384-fnmOCqbTlWIlj8LyTjo7mOUStjsKC4pOpQbqyi7RrhN7udi9RwhKkMHpvLbHG9Sr";
		head.appendChild(fontAwesome);
		
		// Only load extension if v exists, which it won't on pages like the home page or settings
		var dissenterPage = strToObj(data)
		var hydraClientJson = JSON.parse(document.evaluate("//script[contains(., 'hydra.client =')]", dissenterPage, null, XPathResult.ANY_TYPE, null ).iterateNext().innerText.slice(87, -3));
		window.hydra = window.hydra || {};
		window.hydra.client = new hydra.HydraClient(hydraClientJson);
		window.hydra.client.connect();
		window.hydra.dissent = new hydra.GabDissent();
		window.hydra.dissent.restoreDrafts();
		
		var reply = dissenterPage.querySelector("#begin-composer-container");
		var dcComments = dissenterPage.querySelector("#ext-comment-list");
		var ytComments = document.getElementById("comments");
		ytComments.parentNode.insertBefore(dcComments, ytComments)
		console.log("Here")
    };
	
    //Global functions
    /**
     * @description - Init script on open
     * @function scope.init
     */
    scope.init = function() {
        fetchElements();
    };
};

//Wait for page to be ready and loaded
ready(function() {
    //Get config keys from background
    __BROWSER__.runtime.sendMessage({
        action: BACKGROUND_ACTION_GET_KEY,
        key: YOUTUBE_BUTTONS_ENABLED
    }, function(enabled) {
        if (!enabled) return false;

        //Delay a bit
        setTimeout(function () {
            //Init new script
            var gdy = new GDYoutube();
            gdy.init();
        }, 250);
    });
});
