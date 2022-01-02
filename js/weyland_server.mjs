import * as http from "http";

const host = 'localhost';
const port = 7000;

const requestListener = function(request, result)
{
    //result.setHeader("Content-Type", "text/html");
    result.setHeader("Content-Type", "application/json");
    result.writeHead(200);
    //result.end("<h1>Hello!<h1>");
    result.end('{"message": "Hello!"}');
};

const server = http.createServer(requestListener);
server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});
