const net = require("net");

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
  socket.on("data",(data, callback) => {
    let requestBody = data.toString();
    const lines = requestBody.split("\r\n");
    const [method, path] = lines[0].split(" ");
    let headers = {};
    for (let i = 1; i < lines.length; i++) {
        let headerLine = lines[i].split(": ");
        if (headerLine.length === 2) {
            headers[headerLine[0]] = headerLine[1];
        }
    }
    if(method == "GET" && path == "/"){
        socket.write("HTTP/1.1 200 OK\r\n\r\n")
    }
    else if(method == "GET" && path.includes("/echo")){
      const toEcho = path.substring(6)
      const response = `HTTP/1.1 200 OK\r\n` +
      `Content-Type: text/plain\r\n` +
      `Content-Length: ${toEcho.length}\r\n` +
      `\r\n` + 
      `${toEcho}`// Important: Empty line separating headers and body
      socket.write(response)
    }
    else if(method == "GET" && path.includes("/user-agent")){
      let userAgent = headers['User-Agent'] || '';
      console.log('userAgent '+userAgent)
      const response = `HTTP/1.1 200 OK\r\n` +
      `Content-Type: text/plain\r\n` +
      `Content-Length: ${userAgent.length}\r\n` +
      `\r\n` +
      `${userAgent}`
      socket.write(response)
    }
    else{
        socket.write("HTTP/1.1 404 Not Found\r\n\r\n")
    }
    socket.end();
  })
});

server.listen(4221, "localhost");
