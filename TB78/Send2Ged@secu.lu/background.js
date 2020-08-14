async function main() {
    // create a new context menu entry in the message list
    // the function defined in onclick will get passed a OnClickData obj
    // https://thunderbird-webextensions.readthedocs.io/en/latest/menus.html#menus-onclickdata
    messenger.menus.create({
        contexts : ["message_list"],
        id: "Send2Ged@secu.lu",
        onclick : passMsg,
        title: messenger.i18n.getMessage("lang.menuTitle")
    });
}



async function passMsg(OnClickData) {
    if (OnClickData.selectedMessages && OnClickData.selectedMessages.messages.length > 0) {
		// get MessageHeader of first selected messages
        // https://thunderbird-webextensions.readthedocs.io/en/latest/messages.html#messageheader
        let MessageHeader = OnClickData.selectedMessages.messages[0];
        let raw = await messenger.messages.getRaw(MessageHeader.id);
        console.log(raw);
		//	On click, connect to the "gedindexationemail" app.
		var port=browser.runtime.connectNative("gedindexationemail");

		// Listen for messages from the app.
		port.onMessage.addListener((response) => {
		  console.log("Received: " + response);
		});

		// On a click on the browser action, send the indexing app the raw mail content
		
		browser.browserAction.onClicked.addListener(() => {
		  console.log("Sending:  raw message to indexing app");
		  port.postMessage(raw);
		});
		
    } else {
        console.log("No message selected");
    }
}



main();

