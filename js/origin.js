"use strict";

function setup() {
    document.text_refresher = setInterval(poll_text, 450);
}

function poll_text() {

    var txtdiv = document.getElementById("textframe");
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        var DONE = this.DONE || 4;
        if (this.readyState === DONE) {
            if (this.status >= 300) {
                txtdiv.innerHTML += "<p class='server-error'>Server error: " + this.responseText + "<br>Refreshing the page might help.</p>";
                txtdiv.scrollTop = txtdiv.scrollHeight;
                clearInterval(document.text_refresher);
                return;
            }
            var json = JSON.parse(this.responseText);
            var oob = json["oob"];
            if (oob) {
                if (oob.indexOf("clear") >= 0) {
                    txtdiv.innerHTML = "";
                    txtdiv.scrollTop = 0;
                }
            }

            if (json["text"]) {
                var str = json["text"];

                var newParagraph = document.createElement("p");
                newParagraph.className += "history-output";

                var gid = guid();
                newParagraph.id = 'msg-' + gid;
                txtdiv.appendChild(newParagraph);

                showText("msg-" + gid, str);
            }

        }
    };

    xhr.onerror = function (error) {
        console.log(error);
        txtdiv.innerHTML = "<p class='server-error'>Connection error.<br><br>Close the browser or refresh the page.</p>";
        clearInterval(document.text_refresher);
        var cmd_input = document.getElementById("input-cmd");
        cmd_input.disabled = true;
    };
    xhr.open("GET", "http://localhost:8180", true);
    xhr.withCredentials = true;
    xhr.send(null);
}

function submit_cmd() {
    var cmd_input = document.getElementById("input-cmd");
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        var DONE = this.DONE || 4;
        if (this.readyState === DONE) {
            setTimeout(poll_text, 100);
        }
    };

    xhr.open("POST", "http://localhost:8180", true);
    xhr.withCredentials = true;
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded; charset=UTF-8");
    var encoded_cmd = encodeURIComponent(cmd_input.value);
    xhr.send("input=" + encoded_cmd);
    cmd_input.value = "";
    cmd_input.focus();
    return false;
}

var showText = function (target, message) {

    var index = 0;
    var snippet = "";

    var txtdiv = document.getElementById("textframe");
    var targ = document.getElementById(target);
    var t = document.createTextNode(snippet);

    while (index < message.length) {

        if (message.charAt(index) === '\n') {

            // If snippet has content dump it to existing target and clear it
            t = document.createTextNode(snippet);
            targ.appendChild(t);
            snippet = "";

            var newParagraph = document.createElement("p");
            newParagraph.className += "history-output";

            target = "msg-" + guid();
            newParagraph.id = target;
            txtdiv.appendChild(newParagraph);

            targ = document.getElementById(target);
            index++;

            // A newline character will clear password obfuscation
            if (document.getElementById('input-cmd').type === 'password') {
                document.getElementById('input-cmd').type = 'text';
            }

        } else if (message.charAt(index) === '\v') {

            // If snippet has content dump it to existing target and clear it
            t = document.createTextNode(snippet);
            targ.appendChild(t);
            snippet = "";

            // Just add a line break, no new paragraph
            var br = document.createElement('br');
            targ.appendChild(br);
            index++;
            console.log("made it here");

        } else if (message.charAt(index) === '<') {

            // If snippet has content dump it to existing target and clear it
            t = document.createTextNode(snippet);
            targ.appendChild(t);
            snippet = "";

            // Extract tag
            var tagBegin = index;
            var tagLen = message.indexOf('>', index) - index + 1;
            var tag = message.substr(tagBegin, tagLen);

            console.log("Processing tag " + tag);

            switch (tag) {

                case "<password>":

                    document.getElementById('input-cmd').type = 'password';
                    index += tag.length;
                    break;

                default:

                    document.getElementById('input-cmd').type = 'text';

                    // Form matching end tag
                    var endTag = tag.slice(0, 1) + "/" + tag.slice(1);

                    // Extract tag content
                    var contentBegin = tagBegin + tagLen;
                    var contentEnd = message.indexOf(endTag, contentBegin);
                    var content = message.substr(contentBegin, contentEnd - contentBegin);

                    // Create the span element
                    var itemSpan = document.createElement('span');

                    itemSpan.className += "txt-" + tag.substr(1, tag.length - 2);
                    itemSpan.id = 'span-' + guid();
                    itemSpan.innerHTML = content;

                    // Attach it to the current paragraph
                    var currentParagraph = document.getElementById(target);
                    currentParagraph.appendChild(itemSpan);

                    // Move index to end of now processed tag
                    index += (tag.length + content.length + endTag.length);

                    break;
            }

        } else {
            snippet += message[index++];
        }

    }

    // Dump the last bit of the buffer and scroll to bottom
    t = document.createTextNode(snippet);
    targ.appendChild(t);
    window.scrollTo(0, document.body.scrollHeight || document.documentElement.scrollHeight);

};

function guid() {

    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();

}
