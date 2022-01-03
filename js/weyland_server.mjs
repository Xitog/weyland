import * as http from "http";
import * as url from "url";
import { Regex } from "./weyland.mjs";

const host = 'localhost';
const port = 7000;

const requestListener = function(request, result)
{
    const query = url.parse(request.url, true).query;
    //result.setHeader("Content-Type", "text/html");
    result.setHeader("Content-Type", "application/json; charset=utf8");
    result.writeHead(200);
    //result.end("<h1>Hello!<h1>");
    let id = 0;
    if ("id" in query)
    {
        id = query["id"];
    }
    let name = "undefined";
    if ("name" in query)
    {
        name = query["name"];
    }
    let pattern = null;
    let regex = null;
    let rex = undefined;
    if ("pattern" in query)
    {
        regex = new Regex(query["pattern"], true);
        rex = regex.toString();
    }
    let txt = null;
    if ("txt" in query)
    {
        txt = query["txt"];
    }
    let res = undefined;
    if (regex !== null && txt !== null)
    {
        res = regex.match(txt).toString();
    }
    result.end(JSON.stringify(
            {
                "message": "Hello!",
                "id": id,
                "name": name,
                "regex" : rex,
                "result" : res
            }
        )
    );
};

const server = http.createServer(requestListener);
server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});
