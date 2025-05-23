const net = require("net");
const fs = require('fs')
const path = require("path");
var zlib = require('zlib');

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
    let body = lines[lines.length - 1]
    for (let i = 1; i < lines.length; i++) {
        let headerLine = lines[i].split(": ");
        if (headerLine.length === 2) {
            headers[headerLine[0]] = headerLine[1];
        }
    }
    let closeConnection = headers['Connection']==='close'
    if(method == "GET" && httpPath == "/"){
        
        //socket.end()
      if(closeConnection){
        let response = `HTTP/1.1 200 OK\r\n` +
                        `Connection: close\r\n\r\n`
        socket.write(response)
        socket.end()
      }
      socket.write("HTTP/1.1 200 OK\r\n\r\n");
    }
    else if(method == "GET" && httpPath.includes("/echo")){
      const toEcho = httpPath.substring(6);
      let acceptEncoding = headers['Accept-Encoding'] || '';
      let hasGzipEncoding = acceptEncoding.includes('gzip');
      if(hasGzipEncoding){
            zlib.gzip(toEcho, (err, compressedData) => {
                if (err) {
                    // Handle the error appropriately (e.g., send a 500 Internal Server Error)
                    console.error('Gzip compression error:', err);
                    socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\nInternal Server Error');
                    //socket.end();
                    return;
                }
                console.log(`original length `,toEcho.length + `compress length `,compressedData.length);
                if(closeConnection){
                  const response =
                      `HTTP/1.1 200 OK\r\n` +
                      `Content-Type: text/plain\r\n` +
                      `Content-Encoding: gzip\r\n` +
                      `Content-Length: ${compressedData.length}\r\n` +
                      `Connection: close\r\n`+
                      `\r\n` 
                    // Send the compressed data
                  socket.write(response);
                  socket.write(compressedData);
                  socket.end()
                }
                else{
                  const response =
                      `HTTP/1.1 200 OK\r\n` +
                      `Content-Type: text/plain\r\n` +
                      `Content-Encoding: gzip\r\n` +
                      `Content-Length: ${compressedData.length}\r\n` +
                      `\r\n` 
                    // Send the compressed data
                  socket.write(response);
                  socket.write(compressedData);
                  //socket.end();
                }
            });
      }
      else{
        if(closeConnection){
          const response = `HTTP/1.1 200 OK\r\n` +
          `Content-Type: text/plain\r\n` +
          `Content-Length: ${toEcho.length}\r\n` +
          `Connection: close\r\n`+
          `\r\n` + 
          `${toEcho}`// Important: Empty line separating headers and body
          socket.write(response);
          socket.end()
        }
        const response = `HTTP/1.1 200 OK\r\n` +
        `Content-Type: text/plain\r\n` +
        `Content-Length: ${toEcho.length}\r\n` +
        `\r\n` + 
        `${toEcho}`// Important: Empty line separating headers and body
        socket.write(response);
        //socket.end();
      }
    }
    else if(method == "GET" && httpPath.includes("/user-agent")){
      let userAgent = headers['User-Agent'] || '';
      console.log('userAgent '+userAgent)
      if(closeConnection){
        const response = `HTTP/1.1 200 OK\r\n` +
        `Content-Type: text/plain\r\n` +
        `Content-Length: ${userAgent.length}\r\n` +
        `Connection: close\r\n`+
        `\r\n` +
        `${userAgent}`
        socket.write(response);
        socket.end();
      }
      const response = `HTTP/1.1 200 OK\r\n` +
      `Content-Type: text/plain\r\n` +
      `Content-Length: ${userAgent.length}\r\n` +
      `\r\n` +
      `${userAgent}`
      socket.write(response);
      //socket.end();
    }
    else if(method == "GET" && httpPath.includes("/files/")){
      let filePath = httpPath.substring(7)
      if(directory){
        filePath = path.join(directory,filePath)
      }
      let response = ''
      //socket.write and socket.end are within the callback to ensure they are being called after the file has been read
      fs.readFile(filePath, (err, data) => {
        if(err){
          if(err.code == 'ENOENT'){
            response = `HTTP/1.1 404 Not Found\r\n` +
            `\r\n`
            if(closeConnection){
              response = `HTTP/1.1 404 Not Found\r\n` +`Connection: close\r\n`+
            `\r\n`
              socket.end();
            }
          }
          else{
            response = `HTTP/1.1 500 Internal Server Error\r\n` +
            `\r\n`
            if(closeConnection){
              response = `HTTP/1.1 500 Internal Server Error\r\n` +`Connection: close\r\n`+
            `\r\n`
              socket.end();
            }
          }
          socket.write(response);
          //socket.end();
        }
        else{
          console.log("File data: ",data);
          if(closeConnection){
            response = `HTTP/1.1 200 OK\r\n` +
            `Content-Type: application/octet-stream\r\n` +
            `Content-Length: ${data.length}\r\n` +
            `Connection: close\r\n`+
            `\r\n` +
            `${data}`
            socket.write(response);
            socket.end();
          }
          response = `HTTP/1.1 200 OK\r\n` +
          `Content-Type: application/octet-stream\r\n` +
          `Content-Length: ${data.length}\r\n` +
          `\r\n` +
          `${data}`
          socket.write(response);
          //socket.end();
        }
      })
    }
    else if(method == "POST" && httpPath.includes("/files/")){
      let filePath = httpPath.substring(7)
      if(directory){
        filePath = path.join(directory,filePath)
      }
      let response = ''
      fs.writeFile(filePath, body, (err) => {
        if(err){
          response = `HTTP/1.1 500 Internal Server Error\r\n` +
          `\r\n`
          if(closeConnection){
            response = `HTTP/1.1 500 Internal Server Error\r\n` + `Connection: close\r\n`+
            `\r\n`
            socket.write(response);
            socket.end();
          }
          socket.write(response);
          //socket.end();
        }
        else{
          response = `HTTP/1.1 201 Created\r\n\r\n`
          if(closeConnection){
            response = `HTTP/1.1 201 Created\r\n` + `Connection: close\r\n`+
            `\r\n`
            socket.write(response);
            socket.end();
          }
          socket.write(response);
          //socket.end();
        }
      })
    }
    else{
        if(closeConnection){
          socket.write("HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n");
          socket.end();
        }
        socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
        //socket.end();
    }
  })
  /*
  The 'end' event indicates that the server has stopped sending data, but the connection is still open.  The client could potentially send a request.
  The 'close' event would indicate that the client has completely disconnected, and the server should clean up any resources associated with that socket.
*/

    socket.on('error', (err) => {
        console.error('Socket error:', err);
    });
});

server.listen(4221, "localhost");


//https://en.wikipedia.org/wiki/HTTP_compression
//https://web.dev/articles/optimizing-content-efficiency-optimize-encoding-and-transfer