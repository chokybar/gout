/* @flow */
/* global define */

define(["jquery"], function ($) {
    "use strict";

    var create = function (id, url) {
        $.getJSON(url + "/config.json").then(function (args) {
            var $root = $("#" + id);
            $root.css("background-color", args.color || "black");
            $("p", $root).css("text-align", args.align || "left")
                         .html(Array.isArray(args.text) ? args.text.join("")
                                                        : args.text || "");
        });
    }; // create()

    return create;

});
