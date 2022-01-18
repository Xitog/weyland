import * as http from "http";
import { RECOGNIZED_LANGUAGES, LEXERS} from "./heretic.mjs";

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
        response.setHeader("Content-Type", "application/json; charset=utf8");
        response.writeHead(200);
        let params_array = queryData.split("&");
        let params_dict = {};
        for (const p of params_array)
        {
            let kv = p.split('=');
            if (kv.length > 1)
            {
                params_dict[kv[0]] = kv[1].replace(/\+/g, ' ').replace(/%2B/g, '+').replace(/%3D/g, '=');
                console.log(p, '=>', params_dict[kv[0]]);
            }
        }
        // Parameters
        let id = null;
        let text = null;
        let lang = null;
        let output = "JSON";
        if ("id" in params_dict)
        {
            id = params_dict["id"];
            console.log(`Id set to ${id}`);
        }
        if ("text" in params_dict)
        {
            text = params_dict["text"];
            console.log(`Text received: ${text}`);
        }
        if ("output" in params_dict)
        {
            output = params_dict["output"];
            console.log(`Ouput set to ${output}`);
        }
        if ("lang" in params_dict)
        {
            lang = params_dict["lang"];
            console.log(`Lang set to ${lang}`);
        }
        // Checks
        let error = false;
        let error_msg = null;
        if (lang === null)
        {
            error = true;
            error_msg = "No lang defined.";
        } else {
            if (!RECOGNIZED_LANGUAGES.includes(lang))
            {
                error = true;
                error_msg = `Lang ${lang} is not handled.`;
            }
        }
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
        if (error)
        {
            response.end(JSON.stringify(
                    {
                        "error": error,
                        "message": error_msg
                    }
                )
            );
            return;
        }
        // Actions
        let lexer = LEXERS[lang];
        let tokens = lexer.lex(text);
        let result = lexer.to_html(null, tokens);
        response.end(
            JSON.stringify(
                {
                    "raw": queryData,
                    "params_array": params_array,
                    "params_dict": params_dict,
                    "id": id,
                    "lang": lang,
                    "tokens": tokens,
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
