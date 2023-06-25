const { channel } = require('diagnostics_channel');
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: { origin: '*' }
})

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

let counter = 0;

let currentPlayer = 0;

let coincide = false;

let sila = ''
const silaba = async ()=>{
  try {
    const random = await rae.getRandomWord()
    let arr = random.header.split('')
    let num = Math.floor(Math.random()*arr.length-3)
    sila = random.header.slice(num,num+3)
    console.log("silaba: " + sila);
    if(sila === ''){
      return silaba()
    }
    if(sila){
      return io.sockets.emit("sil", sila)
    }
  } catch (error) {
    console.log(error);
  }
}


io.on("connection", (server) =>{

  const idHandShake = server.id;

  const nameRoom = 'sala1'

  server.join(nameRoom)

  console.log(`El dispositivo ${idHandShake} se unio a ${nameRoom}`);
  server.on("generate", ()=>{
  counter++
  return silaba()
  })

  server.on('sound', ()=>{
    io.sockets.emit('sound')
  })

  server.on('endTurn', () => {
    console.log('2 veces');
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

    counter = 0;

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
        console.log(person.name);
        console.log(data);
        usersOnline = usersOnline.filter(person => person.name != data)
      }
    })
    
    usersOnlineUnique.forEach((person) => {
    if(person.name === data){
      console.log(person.name);
      console.log(data);
      usersOnlineUnique = usersOnlineUnique.filter(person => person.name != data)
      return io.sockets.emit("people", usersOnlineUnique)
    }
  });
  })
  
 
  
  let hash = {}

  server.on('val', data=>{
    console.log(usersOnlineUnique.length);
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