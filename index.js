
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: { origin: '*' }
})
const comunes =require('./comun')
const { RAE } = require('rae-api');

const rae = new RAE();
app.get('/', (req,res)=>{
  res.status(200).send({msg: "TODO CORRECTO"})
})

const people = [
  { name: 'Aufer' },
  { name: 'Nico' },
  { name: 'Johan' },
  { name: 'Jairo' },
  { name: 'Lien' },
  { name: 'Jose' },
  { name: 'Ernesto'},
  { name: 'Camilo' }
];

let usersOnline = []

let usersOnlineUnique = []

let currentPlayer = 0;

let coincide = false;

let sila = ''

const silaba = async ()=>{
    const index = Math.trunc(Math.random()*4600)
    const random = await comunes[index]
    sila = random.slice(0,3)
    console.log(sila);
    io.sockets.emit("sil", sila)
}


io.on("connection", (server) =>{

  const idHandShake = server.id;

  const nameRoom = 'sala1'

  server.join(nameRoom)

  console.log(`El dispositivo ${idHandShake} se unio a ${nameRoom}`);
  server.on("generate", ()=>{
    silaba()
  })

  server.on('sound', ()=>{
    io.sockets.emit('sound')
  })
  
  server.on('palabra', (palabra)=>{
    console.log(palabra);
    if(palabra.includes(sila)){
      io.sockets.emit('endturn')
    }else{
      io.sockets.emit('errores')
    }
  })

  server.on('endTurn', () => {
    currentPlayer++;
    if (currentPlayer >= usersOnlineUnique.length) {
      currentPlayer = 0;
    }
    // Emitir el evento de cambio de turno a todos los clientes
    io.sockets.emit('changeTurn', usersOnlineUnique[currentPlayer]?.name);
  });

  server.on('updateVidas', (data)=>{
    io.sockets.emit('updateVidas', data)
  })

  server.on('updateNoLive', (data)=>{
    io.sockets.emit('updateNoLive', data)
  })

  server.on('endGame', ()=>{
    usersOnline = []

    usersOnlineUnique = []


    currentPlayer = 0;

    coincide = false;

    sila = ''
    io.sockets.emit('endGame')
  })

  server.on('count', (data)=>{
    io.sockets.emit('count', data)
  })

  server.on('inicio', ()=>{
    io.sockets.emit('changeTurn', usersOnlineUnique[currentPlayer]?.name)
  })

  server.on('reinit', ()=>{
    currentPlayer = 0
    io.sockets.emit('people', usersOnlineUnique)
  })

  server.on('play', ()=>{
    currentPlayer = 0
    io.sockets.emit('initTurn', currentPlayer)
  })

  server.on('salida', (data)=>{

    usersOnline.forEach((person)=>{
      if(person.name === data){
        usersOnline = usersOnline.filter(person => person.name != data)
      }
    })
    
    usersOnlineUnique.forEach((person) => {
    if(person.name === data){
      usersOnlineUnique = usersOnlineUnique.filter(person => person.name != data)
      return io.sockets.emit("people", usersOnlineUnique)
    }
  });
  })
  
 
  
  let hash = {}

  server.on('val', data=>{
    if(usersOnlineUnique.length){
      usersOnlineUnique.forEach((user)=>{
        if(user.name == data){
          coincide = true
        }
      })
      if(coincide){
        coincide = false
        return server.emit('inval')
      }
      return server.emit('val')
    }else{
      return server.emit('val')
    }
  })
  server.on("name", data=>{
    
    people.forEach(element => {
      if(element.name === data){
        usersOnline.push({ name: data, vidas: 2 })
        usersOnlineUnique = usersOnline.filter(person => hash[person.name] ? false : hash[person.name] = true )
        server.emit('ingreso')     
        server.emit("user", data)
        io.sockets.emit("people", usersOnlineUnique)
      }
      });
    })
  server.on("online", data=>{
    io.sockets.emit("envivo", data)
  })

})


const PORT = 3002;
server.listen(PORT, () => {
  console.log(`Servidor Socket.IO en funcionamiento en el puerto ${PORT}`);
});