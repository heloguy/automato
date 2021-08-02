// ID to manage the context menu entry
var cmid;
rottenSearch = 'http://api.rottentomatoes.com/api/public/v1.0/movies.json?q='
apiKey = 'tfazjxmvr4wqpmtun8fwxxjf';
TRUNCATE_LENGTH = 60;


function validMovie(title) {
	if(title == null || title.length < 2) {
		return false;
	}

	return true;
}

myMovies = {};

function Movie(title, rating, link) {
	this.title = title;
	this.rating = rating;
	this.link = link;
}

function deleteMenuItem() {
	if (cmid != null) {
        chrome.contextMenus.remove(cmid);
        cmid = null; // Invalidate entry now to avoid race conditions
    }
}

function handleNewSelection(msg, sender, sendResponse) {
    if (cmid != null) {
        chrome.contextMenus.remove(cmid);
        cmid = null; // Invalidate entry now to avoid race conditions
    }

    var term = msg.selection;

    if (validMovie(term)) { // Add/update context menu entry 
        if(myMovies[term] != null) {
			var cm_clickHandler = function(clickData, tab) {
				console.log("hello");
			    chrome.tabs.create({"url": movie.link, "selected": true});
			};

        	var movie = myMovies[term];
        	var options = {
		        "title": movie.title+": "+movie.rating+"% by critics",
		        "contexts": ['selection'],
		        "onclick": cm_clickHandler
		    };

			cmid = chrome.contextMenus.create(options);	
			return;	    
        }

        var options = {
            title: "Loading RT rating for "+term+"...",
            contexts: ['selection'],
        };

        cmid = chrome.contextMenus.create(options);

		$.ajax({
		  type: "GET",
		  url: rottenSearch+term+"&apikey="+apiKey,
		  contentType: "application/json; charset=utf-8",
		  dataType: "json",
		  success: function(result) {	
		  		//console.log(result);		
				chrome.extension.sendMessage({
				    request: 'queryReturn',
				    searchTerm: term, 
				    result: result
				});
		  }
		});
    }
}

function handleTomatoReturn(msg, sender, sendResponse) {
	var result = msg.result;
	var total = result.movies.length;    	
	var searchedFor = msg.searchTerm;
	searchedFor = searchedFor.replace(/^\s+|\s+$/g,'');

	deleteMenuItem();

	var title;
	var link;
	var movieIndex = -1;

	for (var i = 0; i < total; i++) {
		if(result.movies[i].title === searchedFor) {
			// Found the exact movie.
			movieIndex = i;
			break;
		}
	}

    if(movieIndex == -1) {
    	if(total > 0) {
    		movieIndex = 0;
    	} else {
    		var options = {
		        title: "Movie '"+searchedFor+"' not found.",
		        contexts: ['selection'],
		    };

		    cmid = chrome.contextMenus.create(options);
		    return;
    	}
    }

	title = result.movies[movieIndex].title+": "+result.movies[movieIndex].ratings.critics_score;+"% by critics";
	link = result.movies[movieIndex].links.alternate;
	myMovies[searchedFor] = new Movie(result.movies[movieIndex].title, result.movies[movieIndex].ratings.critics_score, link);

	if(result.movies[movieIndex].ratings.critics_score == -1) {
		title = result.movies[movieIndex].title+": Not yet rated";
	}

	var cm_clickHandler = function(clickData, tab) {
		console.log("hello");
	    chrome.tabs.create({"url": link, "selected": true});
	};

	var options = {
        title: title,
        contexts: ['selection'],
        onclick: cm_clickHandler
	};

    cmid = chrome.contextMenus.create(options);
}

chrome.extension.onMessage.addListener(function(msg, sender, sendResponse) {
    if (msg.request === 'textSelected') {
    	handleNewSelection(msg, sender, sendResponse);
    } else if (msg.request === 'queryReturn') {
    	handleTomatoReturn(msg, sender, sendResponse);
    }
});
