// ==UserScript==
// @name         Slack Folders
// @namespace    http://www.autotrader.com/
// @version      0.1
// @description  Organize Slack Channels into folders
// @author       Eric Wehrly
// @match        https://autotrader-us.slack.com/**
// @require      https://gist.github.com/raw/2625891/waitForKeyElements.js
// @require      http://userscripts.org/scripts/source/107941.user.js
// @grant        none
// ==/UserScript==

// TODO: Finish context menu so the same script is usable without edits
// TODO: Use persistent storage a la http://stackoverflow.com/questions/15730216/how-where-to-store-data-in-a-chrome-tampermonkey-script and http://userscripts-mirror.org/scripts/show/107941
// TODO: Hook into slack's loading complete event rather than statically waiting

// let slack take its sweet time loading
setTimeout(function() {
    waitForKeyElements ("#channel-list", createFolders);
    // createContextMenu(); // Under construnction
}, 2300);

function createFolders() {

    if ( $( ".channel-folder" ).length ) return;

    console.log("Creating folders.");

    var slackFolders = {};
    slackFolders.Dev = {
        "channel_C16MQSUBH" : "rhel7",
        "channel_C07BWSCMT" : "atc-engineering",
        "channel_C0KF1KXKL" : "jokerteam",
        "group_G0ZKLQPTQ"   : "soa-dev",
        "channel_C198VK15J" : "gb-microservices"
    };
    slackFolders.PoC = {
        "channel_C07BWFC87" : "git",
        "channel_C0MPFEVFT" : "jira-chat",
        "channel_C09QP2BSA" : "pipelines"
    };
    slackFolders.Other = {
        "channel_C14R1KE91" : "actional-upgrade",
        "channel_C17RQ4VT2" : "syc-microservices",
        "channel_C0992LRRV" : "splunk",
        "channel_C07BWEH1Q" : "soa",
        "channel_C07BWHRC1" : "test-automation"
    };
    slackFolders.Chat = {
        "channel_C0503U1CB" : "general",
        "group_G06QY3Q5T"   : "cool-kids",
        "channel_C08EARVBK" : "game-night",
        "channel_C0CS6SKFT" : "microservices",
        "channel_C06PSK3BN" : "monitoring"
    };

    for(var slackFolder in slackFolders) { createFolder(slackFolder, slackFolders[slackFolder]); }

    $(".channel-folder").click(function() {

        var folderId = $(this).attr("id");
        folderId = folderId.replace("channel-folder-", "");

        for(var channel in slackFolders[folderId])
        {
            $("." + channel).toggle();
        }
    });

    $(".channel:not(.channel-folder),.group,.member").click(function() {
        setTimeout(function() {
            createFolders();
        }, 50);
    });

    // Hacky fix for inexplicable disappearance
    setInterval(createFolders, 5000);
}

function createFolder(folderName, folderObject) {

    $('#channel-list').prepend(buildLiHtml(folderName));

    // if any of the channels are "active", do not hide the channels by default

    for(var channel in folderObject) {

        $("." + channel)
            .css("display", "none")
            .css("margin-left", "4px")
            .detach()
            .insertAfter("#channel-folder-" + folderName);
    }
}

function buildLiHtml(folderName) {

    return '<li id="channel-folder-' + folderName + '" class="channel channel-folder"><a href="#" class="channel_name" aria-label="' + folderName + ', channel">' +
        '<span class="display_flex"><ts-icon class="ts_icon_folder prefix" style="margin-right: 4px; margin-left: -2px;"></ts-icon> ' + folderName + '</span>' +
        '</a></li>';

    // ts_icon_folder_open
}

function createContextMenu() {

    $("body").append('<ul class="custom-menu"><li data-action="first">First thing</li><li data-action="second">Second thing</li><li data-action="third">Third thing</li></ul>');

    var style = document.createElement('style'),
        css = '.custom-menu {display: none;z-index: 1000;position: absolute;overflow: hidden;border: 1px solid #CCC;white-space: nowrap;font-family: sans-serif;background: #FFF;color: #333;border-radius: 5px;padding: 0;}' +
        '.custom-menu li {padding: 8px 12px;cursor: pointer;list-style-type: none;transition: all .3s ease;}' +
        '.custom-menu li:hover {background-color: #DEF;}';

    style.type = 'text/css';
    if (style.styleSheet){
        style.styleSheet.cssText = css;
    } else {
        style.appendChild(document.createTextNode(css));
    }
    document.head.appendChild(style);

    // bind a different event to document context menu that dismisses the menu if its visible

    $(".channel-folder").bind("contextmenu", function (event) {

        populateFolderContextMenu(event.currentTarget.id);

        event.preventDefault();

        $(".custom-menu").finish().toggle(100).
        css({
            top: event.pageY + "px",
            left: event.pageX + "px"
        });
    });
}

function populateChannelConextMenu() {

    $(".custom-menu").html("");
}

function populateFolderContextMenu(folder) {

    // Was originally going to do an "onclick", but those are executed in page scope
    // These functions are defined in "userscript scope", so must be called from and executed there.
    // $(".custom-menu").html('<li onClick="renameFolder(\'' +  folder + '\');">rename</li>');
    $(".custom-menu").html('<li id="renameFolderItem">rename</li>');

    $("#renameFolderItem").click(renameFolder);
}

function renameFolder(event) {

    var newFolderName = prompt("New folder name:");

    console.log(event);
}
