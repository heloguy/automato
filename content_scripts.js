selection = "";

document.addEventListener('selectionchange', function() {
    selection = window.getSelection().toString().trim();
});

document.addEventListener('mouseup', function() {
    chrome.extension.sendMessage({
        request: 'textSelected',
        selection: selection
    });
});