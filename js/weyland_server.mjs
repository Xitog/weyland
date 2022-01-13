import * as http from "http";
import * as url from "url";
import { Regex } from "./weyland.mjs";
import { Lexer } from "./lexer.mjs";
import { Language, INTEGER, IDENTIFIER } from "./languages.mjs";

const host = 'localhost';
const port = 7000;

const requestListener_display = function(request, response)
{
    let queryData = '';
    request.on('data', function(data) {
        queryData += data;
        if(queryData.length > 1e6) {
            queryData = "";
            response.writeHead(413, {'Content-Type': 'text/plain'}).end();
            request.connection.destroy();
        }
    });
    request.on('end', function() {
        response.setHeader("Content-Type", "text/plain");
        response.writeHead(200);
        response.end(queryData);
    });
}


const requestListener_action = function(request, response)
{
    let queryData = '';
    request.on('data', function(data) {
        queryData += data;
        if (queryData.length > 1e6) {
            queryData = "";
            response.writeHead(413, {'Content-Type': 'text/plain'}).end();
            request.connection.destroy();
        }
    });
    request.on('end', function() {
        // const query = url.parse(request.url, true).query;
        //respond.setHeader("Content-Type", "text/html");
        response.setHeader("Content-Type", "application/json; charset=utf8");
        response.writeHead(200);
        //respond.end("<h1>Hello!<h1>");
        let params_array = queryData.split("&");
        let params_dict = {};
        for (const p of params_array)
        {
            let kv = p.split('=');
            params_dict[kv[0]] = kv[1].replace(/\+/g, ' ').replace(/%2B/g, '+');
            console.log(p, '=>', params_dict[kv[0]]);
        }
        // Parameters
        let id = null;
        let method = null;
        let pattern = null;
        let text = null;
        let output = "JSON";
        if ("method" in params_dict)
        {
            switch(params_dict["method"])
            {
                case "regex":
                    method = "regex";
                    break;
                case "lex":
                    method = "lex";
                    break;
            }
        }
        if ("id" in params_dict)
        {
            id = params_dict["id"];
        }
        if ("pattern" in params_dict)
        {
            pattern = params_dict["pattern"];
        }
        if ("text" in params_dict)
        {
            text = params_dict["text"];
            console.log(text);
        }
        if ("output" in params_dict)
        {
            output = params_dict["output"];
        }
        // Checks
        let error = false;
        let error_msg = null;
        if (method === null)
        {
            error = true;
            error_msg = "No method defined.";
        }
        else if (method === "regex")
        {
            if (id === null)
            {
                error = true;
                error_msg = "No id defined for method regex.";
            }
            if (pattern === null)
            {
                error = true;
                error_msg = "No pattern defined for method regex.";
            }
        }
        else if (method === "lex")
        {
            if (id === null)
            {
                error = true;
                error_msg = "No id defined for method lex.";
            }
            if (text === null)
            {
                error = true;
                error_msg = "No text defined for method lex.";
            }
        }
        if (error)
        {
            respond.end(JSON.stringify(
                    {
                        "error": error,
                        "message": error_msg
                    }
                )
            );
            return;
        }
        // Actions
        let result = null;
        if (method === "regex")
        {
            let regex = new Regex(pattern, true);
            // res = regex.match(txt).toString();
            result = regex.toString();
        }
        else if (method === "lex")
        {
            let lang = new Language("Pipo", {'keywords': ['if'], 'int': INTEGER, 'id': IDENTIFIER, 'spaces': ' +', 'operator': ['==', '\\+']});
            let lexer = new Lexer(lang);
            let tokens = lexer.lex(text);
            result = lexer.to_html(null, tokens);
        }
        response.end(
            JSON.stringify(
                {
                    "raw": queryData,
                    "params_array": params_array,
                    "params_dict": params_dict,
                    "method_called": method,
                    "id": id,
                    "result": result
                }
            )
        );
    });
}

const server = http.createServer(requestListener_action);
server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});
