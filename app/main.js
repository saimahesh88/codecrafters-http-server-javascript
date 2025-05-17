const net = require("net");
const fs = require('fs')
const path = require("path"); 

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

const args = process.argv.slice(2);
let directory = null;
for (let i = 0; i < args.length; i++) {
    if (args[i] === '--directory' && i + 1 < args.length) {
        directory = args[i + 1];
        break;
    }
}

// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
  socket.on("data",(data) => {
    let requestBody = data.toString();
    const lines = requestBody.split("\r\n");
    const [method, httpPath] = lines[0].split(" ");
    let headers = {};
    for (let i = 1; i < lines.length; i++) {
        let headerLine = lines[i].split(": ");
        if (headerLine.length === 2) {
            headers[headerLine[0]] = headerLine[1];
        }
    }
    if(method == "GET" && httpPath == "/"){
        socket.write("HTTP/1.1 200 OK\r\n\r\n");
        socket.end()
    }
    else if(method == "GET" && httpPath.includes("/echo")){
      const toEcho = httpPath.substring(6)
      const response = `HTTP/1.1 200 OK\r\n` +
      `Content-Type: text/plain\r\n` +
      `Content-Length: ${toEcho.length}\r\n` +
      `\r\n` + 
      `${toEcho}`// Important: Empty line separating headers and body
      socket.write(response);
      socket.end();
    }
    else if(method == "GET" && httpPath.includes("/user-agent")){
      let userAgent = headers['User-Agent'] || '';
      console.log('userAgent '+userAgent)
      const response = `HTTP/1.1 200 OK\r\n` +
      `Content-Type: text/plain\r\n` +
      `Content-Length: ${userAgent.length}\r\n` +
      `\r\n` +
      `${userAgent}`
      socket.write(response);
      socket.end();
    }
    else if(method == "GET" && httpPath.includes("/files/")){
      let filePath = httpPath.substring(7)
      if(directory){
        filePath = path.join(directory,filePath)
      }
      console.log("directory is ",directory)
      let response = ''
      fs.readFile(filePath, (err, data) => {
        if(err){
          if(err.code == 'ENOENT'){
            response = `HTTP/1.1 404 Not Found\r\n` +
            `\r\n`
          }
          else{
            response = `HTTP/1.1 500 Internal Server Error\r\n` +
            `\r\n`
          }
          socket.write(response);
          socket.end();
        }
        else{
          console.log("File data: ",data);
          response = `HTTP/1.1 200 OK\r\n` +
          `Content-Type: application/octet-stream\r\n` +
          `Content-Length: ${data.length}\r\n` +
          `\r\n` +
          `${data}`
          socket.write(response);
          socket.end();
        }
      })
    }
    else{
        socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
        socket.end();
    }
  })
});

server.listen(4221, "localhost");
