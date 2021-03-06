/* global document, Promise, Intl, define */

define(["jquery", "scronpt"], function ($, Cron) {
    "use strict";

    const DTF = new Intl.DateTimeFormat("fr-FR", {
        "day": "2-digit", "month": "2-digit", "year": "numeric" });

    const gates = {};

    const extract = function () {
        // Si c'est le week-end (dimanche ou samedi) : ne pas récupérer le sujet
        // de l'émission car il n'y a pas d'émission le week-end.
        const now = new Date();
        if (0 === now.getDay() || 6 === now.getDay()) {
            return Promise.resolve(null);
        }

        const url = "http://www.france5.fr/emissions/c-dans-l-air";
        return $.get(url).then(function (data) {
            const $data = $(".cartouche", data);

            return {
                "title": $("a:first", $data).text(),
                "desc":  $(".accroche p", $data).html(),
                "link":  "http://www.france5.fr" + $("a", $data).attr("href"),
                "date":  $(".sous_titre", $data).text()
            };
        });
    }; // extract()

    const display = function ($root, data) {
        if (null === data) { // Si c'est le week-end.
            $("a", $root).attr("href", "http://www.france5.fr/emissions" +
                                       "/c-dans-l-air")
                         .text("(Pas d'émission le week-end)");
            $("span", $root).html(
                "<em>C dans l'air</em> est diffusée du lundi au vendredi.");
        // Si le sujet du jour n'est pas encore indiqué.
        } else if (-1 === data.date.indexOf(DTF.format(new Date()))) {
            $("a", $root).attr("href", "http://www.france5.fr/emissions" +
                                       "/c-dans-l-air")
                         .text("(Sujet de l'émission non-défini)");
            $("span", $root).text(
                "Le sujet de l'émission est généralement défini en début" +
                " d'après-midi.");
        } else {
            $("a", $root).attr("href", data.link)
                         .text(data.title);
            $("span", $root).html(data.desc);
        }
    }; // display()

    const update = function (id) {
        const args = gates[id];

        // Si la page est cachée : ne pas actualiser les données et indiquer
        // qu'il faudra mettre à jour les données quand l'utilisateur reviendra
        // sur la page.
        if (document.hidden) {
            args.cron.stop();
            return;
        }
        args.cron.start();

        const $root = $("#" + id);
        extract().then(function (data) {
            display($root, data);
        });
    }; // update()

    const create = function (id, url) {
        $.getJSON(url + "/config.json").then(function (args) {
            const $root = $("#" + id);
            $root.css("background-color", args.color || "#9e9e9e");

            gates[id] = {
                // Par défaut, mettre à jour une fois par heure entre 14h et
                // 18h ; et une fois à 1h pour effacer le sujet de l'émission
                // de la veille.
                "cron": new Cron(args.cron || "0 1,14-18 * * *", update, id)
            };

            if (1 === Object.keys(gates).length) {
                document.addEventListener("visibilitychange", function () {
                    for (let id in gates) {
                        if (!gates[id].cron.status()) {
                            update(id);
                        }
                    }
                });
            }

            update(id);
        });
    }; // create()

    return create;
});
