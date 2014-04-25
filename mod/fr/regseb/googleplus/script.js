(function() {
    "use strict";

    var gates = { };

    var create = function(id, url) {
        $.getJSON(url + "/config.json", function(args) {
            $("#" + id).css({
                "background-color": args.color,
                "background-image": "url(\"" + url + "/icon.svg\")"
            });

            gates[id] = {
                "key": args.key,
                "users": Array.isArray(args.user) ? args.user : [ args.user ],
                "size": args.size,
                "updated": true
            };

            setCron(update, args.cron, id);

            if (1 === Object.keys(gates).length)
                document.addEventListener("visibilitychange", function() {
                    for (var id in gates)
                        if (gates[id].updated)
                            update(id);
                });

            update(id);
        });
    }; // create()

    var update = function(id) {
        var args = gates[id];

        // Si la page est cachee : ne pas actualiser les flux et indiquer qu'il
        // faudrait actualiser les flux quand l'utilisateur affichera la page.
        if (document.hidden) {
            args.updated = true;
            return;
        }
        args.updated = false;

        // Recuperer les evenements de chaque flux.
        for (var i in args.users) {
            var user = args.users[i];
            extract(args.key, user, args.size).then(function(data) {
                for (var i in data)
                    add(id, args, i, data[i]);
            });
        }
    }; // update()

    var add = function(id, args, i, data) {
        var $li = $("#" + id + " li[data-guid=\"" + data.guid + "\"]");

        if (!$li.length) { // Si l'evenement n'est pas affiche.
            // Trouver la future position chronologique de l'evenement.
            var pos = -1;
            $("#" + id + " > ul > li").each(function(i) {
                if (data.date <= $(this).data("date"))
                    pos = i;
            });
            if (pos !== args.size - 1) {
                // Supprimer le plus ancien evenement (si la liste est pleine).
                $("#" + id + " > ul > li:eq(" + (args.size - 1) + ")").remove();

                // Creer la ligne du nouvel evenement.
                $li = $("<li>").attr("data-guid", data.guid)
                               .data("date", data.date)
                               .append($("<a>").attr({ "href":   data.link,
                                                       "target": "_blank" })
                                               .text(data.title));
                if ("" !== data.desc)
                    $li.append($("<span>").html(data.desc));

                if (-1 === pos)
                    $("#" + id + " > ul").prepend($li).fadeIn("slow");
                else
                    $("#" + id + " > ul > li:eq(" + pos + ")").after($li)
                                                                .fadeIn("slow");
            }
        } else { // Si l'evenement est deja affiche.
            // Si des elements de l'evenement ont change, les mettre a jour.
            var $a = $("> a", $li);
            if ($a.attr("href") !== data.link)
                $a.attr("href", data.link);
            if ($a.text() !== data.title)
                $a.text(data.title);
            if ($a.next().html() !== data.desc)
                $a.next().html(data.desc);
        }
    }; // add()

    var extract = function(key, user, size) {
        var url = "https://www.googleapis.com/plus/v1/people/" + user +
                  "/activities/public?key=" + key + "&maxResults=" + (5 * size);
        return $.getJSON(url).then(function(data) {
            var events = [];
            for (var i in data.items) {
                var item = data.items[i];
                events.push({
                    "title": item.title,
                    "desc":  "",
                    "link":  item.url,
                    "guid":  item.id,
                    "date":  new Date(item.updated).getTime()
                });
            }
            return events.splice(0, size);
        });
    }; // extract()

    app.mod["fr/regseb/googleplus"] = create;

})();