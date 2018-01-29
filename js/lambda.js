exports.handler = function (event, context, callback) {
    if (event.queryStringParameters!=null && event.queryStringParameters.id != null) {
        var id = event.queryStringParameters.id;
        var http = require("https");
        var options = {
            "method": "GET",
            "hostname": "widget.kkbox.com",
            "port": null,
            "path": "/v1/?id=" + id + "&type=song&autoplay=true"
        };

        var req = http.request(options, function (res) {
            var chunks = [];

            res.on("data", function (chunk) {
                chunks.push(chunk);
            });

            res.on("end", function () {
                var body = Buffer.concat(chunks);
                var regex = /&quot;trial_url&quot;:&quot;(.+?)&quot;/g;
                var matchs = body.toString().match(regex);
                var match = RegExp.$1;
                var response = {
                    "statusCode": 200,
                    "headers": { 
                        "Access-Control-Allow-Origin": "*" 
                    },
                    "body": JSON.stringify({resultCode:1,content:match}),
                    "isBase64Encoded": false
                };
                 callback(null, response);
            });
        });
        req.end();
    }else{
         callback(null, {
            "statusCode": 200,
            "headers": { 
                "Access-Control-Allow-Origin": "*" 
            },
            "body": JSON.stringify({resultCode:0}),
            "isBase64Encoded": false
        });
    }
}