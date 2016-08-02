// ==UserScript==
// @name         Slack Folders
// @namespace    http://www.autotrader.com/
// @version      0.1
// @description  Organize Slack Channels into folders
// @author       Eric Wehrly
// @match        https://autotrader-us.slack.com/**
// @require      https://gist.github.com/raw/2625891/waitForKeyElements.js
// @require      https://greasyfork.org/scripts/622-super-gm-setvalue-and-gm-getvalue-js/code/Super_GM_setValue_and_GM_getValuejs.js?version=1786
// @grant    GM_getValue
// @grant    GM_setValue
// ==/UserScript==

// TODO: Hook into slack's loading complete event rather than statically waiting
// TODO: Fix folders disappearing / being unloaded intermittently ... or hook into what's doing it ...

var currentFolder = null;
var currentChannel = null;

var slackFolders = GM_SuperValue.get ("SlackFolders", {});

// let slack take its sweet time loading
setTimeout(function() {
    waitForKeyElements ("#channel-list", createFolders);
}, 2300);

function createFolders() {

    if ( $( ".channel-folder" ).length ) return;

    console.log("Creating folders.");

    for(var slackFolder in slackFolders) { createFolder(slackFolder, slackFolders[slackFolder]); }

    bindChannelFolders();

    $(".channel:not(.channel-folder),.group,.member").click(function() {
        setTimeout(function() {
            createFolders();
        }, 50);
    });

    createContextMenu();

    // Hacky fix for inexplicable disappearance
    setInterval(createFolders, 5000);
}

function bindChannelFolders() {

    $(".channel-folder").unbind( "click" );

    $(".channel-folder").click(function() {

        var folderId = $(this).attr("id");
        folderId = folderId.replace("channel-folder-", "");
        console.log(slackFolders[folderId]);

        for(var channel in slackFolders[folderId])
        {
            $("." + channel).toggle();
        }
    });
}

function createFolder(folderName, folderObject) {

    jQuery("#channel-folder-" + folderName).remove();

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

    // TODO: ts_icon_folder_open
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

    // TODO: bind a different event to document context menu that dismisses the menu if its visible

    $(".channel-folder").bind("contextmenu", function (event) {

        currentFolder = this;

        populateFolderContextMenu(event.currentTarget.id);

        event.preventDefault();

        $(".custom-menu").finish().toggle(100).
        css({
            top: event.pageY + "px",
            left: event.pageX + "px"
        });
    });

    // TOOD: Don't link channels that are "in" folders ...
    $(".channel:not(.channel-folder),.group,.member").bind("contextmenu", function (event) {

        currentChannel = this;

        populateChannelConextMenu();

        event.preventDefault();

        $(".custom-menu").finish().toggle(100).
        css({
            top: event.pageY + "px",
            left: event.pageX + "px"
        });
    });
}

function populateChannelConextMenu() {

    $(".custom-menu").html('<li id="addFolderItem">add to new folder</li>');

    $("#addFolderItem").click(function() {

        if("new" in slackFolders) console.log("New dere");
        else slackFolders.new = {};

        addChannelToFolder(currentChannel, "new");

        createFolders();
    });

    for(var slackFolder in slackFolders) {

        $(".custom-menu").prepend('<li>add to ' + slackFolder + '</li>');
        // So this had to get a little bit more complicated than just passing to the click event.
        // I think that may have to do with trying to kind of shim byref vars into byval. Or I don't know how to javascript.
        $(".custom-menu li:first-child").bind('click',
                                              { currentChannel: currentChannel, slackFolder: slackFolder },
                                              function(event) { addChannelToFolder(event.data.currentChannel, event.data.slackFolder); });
    }
}

function addChannelToFolder(channel, folderName) {

    var channelClass = "";
    var channelName = jQuery(channel).text().replace(/0/g, '').trim();
    var classNames = channel.className.split(/\s+/);
    for(var classIndex in classNames) {
        var className = classNames[classIndex];
        if(className.indexOf("group_") > -1 || className.indexOf("channel_") > -1) {
            channelClass = className;
            break;
        }
    }

    slackFolders[folderName][channelClass] = channelName;

    GM_SuperValue.set ("SlackFolders", slackFolders);

    $("." + channelClass)
        .css("display", "none")
        .css("margin-left", "4px")
        .detach()
        .insertAfter("#channel-folder-" + folderName);

    $(".custom-menu").finish().toggle(100);
}

function populateFolderContextMenu(folder) {

    // Was originally going to do an "onclick", but those are executed in page scope
    // These functions are defined in "userscript scope", so must be called from and executed there.
    // $(".custom-menu").html('<li onClick="renameFolder(\'' +  folder + '\');">rename</li>');
    $(".custom-menu").html('<li id="renameFolderItem">rename</li>');

    $("#renameFolderItem").click(renameFolder);
}

function renameFolder(event) {

    var oldFolderName = currentFolder.id.replace("channel-folder-", "");
    var newFolderName = prompt("New folder name:");

    slackFolders[newFolderName] = slackFolders[oldFolderName];
    delete slackFolders[oldFolderName];

    createFolder(newFolderName, slackFolders[newFolderName]);

    bindChannelFolders();

    $(".custom-menu").finish().toggle(100);

    GM_SuperValue.set ("SlackFolders", slackFolders);
}
