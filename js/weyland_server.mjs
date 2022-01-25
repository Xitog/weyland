import * as http from "http";
import { LANGUAGES, Lexer } from "./heretic.mjs";

const host = 'localhost';
const port = 7000;
var cached_lexers = {};

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
        console.log('------------------------------------------------------------------');
        response.setHeader("Content-Type", "application/json; charset=utf8");
        response.writeHead(200);
        let params_array = queryData.split("&");
        let params_dict = {};
        for (const p of params_array)
        {
            let kv = p.split('=');
            if (kv.length > 1)
            {
                params_dict[kv[0]] = kv[1]
                    .replace(/\+/g, ' ')
                    .replace(/%0A/g, '\n')
                    .replace(/%21/g, '!')
                    .replace(/%22/g, '"')
                    .replace(/%23/g, '#')
                    .replace(/%24/g, '$')
                    .replace(/%25/g, '%')
                    .replace(/%26/g, '&')
                    .replace(/%27/g, "'")
                    .replace(/%28/g, '(')
                    .replace(/%29/g, ')')
                    .replace(/%2A/g, '*')
                    .replace(/%2B/g, '+')
                    .replace(/%2C/g, ',')
                    .replace(/%2D/g, '-')
                    .replace(/%2E/g, '.')
                    .replace(/%2F/g, '/')
                    // 0-9
                    .replace(/%3A/g, ':')
                    .replace(/%3B/g, ';')
                    .replace(/%3C/g, '<')
                    .replace(/%3D/g, '=')
                    .replace(/%3E/g, '>')
                    .replace(/%3F/g, '?')
                    .replace(/%40/g, '@')
                    // A-Z de 41 à 5A
                    .replace(/%5B/g, '[')
                    .replace(/%5C/g, '\\')
                    .replace(/%5D/g, ']')
                    .replace(/%5E/g, '^')
                    .replace(/%5F/g, '_')
                    .replace(/%60/g, '`')
                    // a-z de 61 à 7A
                    .replace(/%7B/g, '{')
                    .replace(/%7C/g, '|')
                    .replace(/%7D/g, '}')
                    .replace(/%7E/g, '~')
                    .replace(/%7F/g, ' ')
                    .replace(/%80/g, '€')
                    // Manque 81
                    .replace(/%82/g, ',')
                    .replace(/%83/g, 'ƒ')
                    // Espace
                    .replace(/%C3%A0/g, 'à')
                    .replace(/%C3%A1/g, 'á')
                    .replace(/%C3%A2/g, 'â')
                    .replace(/%C3%A3/g, 'ã')
                    .replace(/%C3%A4/g, 'ä')
                    .replace(/%C3%A5/g, 'å')
                    .replace(/%C3%A6/g, 'æ')
                    .replace(/%C3%A7/g, 'ç')
                    .replace(/%C3%A8/g, 'è')
                    .replace(/%C3%A9/g, 'é')
                    .replace(/%C3%AA/g, 'ê')
                    .replace(/%C3%AB/g, 'ë')
                    .replace(/%C3%AC/g, 'ì')
                    .replace(/%C3%AD/g, 'í')
                    .replace(/%C3%AE/g, 'î')
                    .replace(/%C3%AF/g, 'ï')
                    .replace(/%C3%B0/g, 'ð')
                    .replace(/%C3%B1/g, 'ñ')
                    .replace(/%C3%B2/g, 'ò')
                    .replace(/%C3%B3/g, 'ó')
                    .replace(/%C3%B4/g, 'ô')
                    .replace(/%C3%B5/g, 'õ')
                    .replace(/%C3%B6/g, 'ö')
                    .replace(/%C3%B7/g, '÷')
                    .replace(/%C3%B8/g, 'ø')
                    .replace(/%C3%B9/g, 'ù')
                    .replace(/%C3%BA/g, 'ú')
                    .replace(/%C3%BB/g, 'û')
                    .replace(/%C3%BC/g, 'ü')
                    .replace(/%C3%BD/g, 'ý')
                    .replace(/%C3%BE/g, 'þ')
                    .replace(/%C3%BF/g, 'ÿ')
                    ;
                console.log(kv[0], '=>', params_dict[kv[0]]);
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
            if (!(lang in LANGUAGES))
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
        if (!(lang in cached_lexers))
        {
            cached_lexers[lang] = new Lexer(LANGUAGES[lang]);
        }
        let lexer =  cached_lexers[lang];
        let tokens = lexer.lex(text);
        let result = lexer.to_html(null, tokens, ['blank']);
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
