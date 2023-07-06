//importar axios
const axios = require('axios')
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: { origin: '*' }
})
const comunes =require('./comun')
const { RAE } = require('rae-api');
const { log } = require('console');

const {HMOON_BACKEND_URL} = process.env

const rae = new RAE();
app.get('/', (req,res)=>{
  res.status(200).send({msg: "TODO CORRECTO"})
})

const endpoin ='http://localhost:3001/user/all'
let allUsers = []
let Email = ''
const getAllUsers = async(req, res)=>{
    const {data} = await axios(`${HMOON_BACKEND_URL}/user/all`)
    allUsers = data
}

const postRanking = async (datos)=>{
  console.log(datos);
  
}



let ganador = []

let usersOnline = []

let usersOnlineUnique = []

let currentPlayer = 0;

let coincide = false;

let sila = ''

const silaba = async ()=>{
    const index = Math.trunc(Math.random()*4600)
    const random = await comunes[index]
    sila = random.slice(0,3)
    io.sockets.emit("sil", sila)
}


io.on("connection", (server) =>{

  getAllUsers()

  const idHandShake = server.id;

  const nameRoom = 'sala1'

  server.join(nameRoom)

  console.log(`El dispositivo ${idHandShake} se unio a ${nameRoom}`);
  server.on("generate", ()=>{
    silaba()
  })

  server.on('email', (email)=>{
    Email = email
    const match = allUsers.find(user=>user.email === email)
    if (match){
      return server.emit('val', {name: match.name, email: match.email})
    }
  })

  server.on('sound', ()=>{
    io.sockets.emit('sound')
  })
  
  server.on('palabra', (palabra)=>{
    if(palabra.includes(sila)){
      io.sockets.emit('endturn')
    }else{
      io.sockets.emit('errores')
    }
  })

  server.on('endTurn', () => {
    io.sockets.emit('enpartida')
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

    ganador = []

    currentPlayer = 0;

    coincide = false;

    sila = ''
    io.sockets.emit('endGame')
  })

  server.on('count', (data)=>{
    io.sockets.emit('count', data)
  })

  server.on('inicio', ()=>{
    io.sockets.emit('enpartida')
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
    let name = data.split(' ')
    name = name[0]
    usersOnlineUnique.forEach((person) => {
    if(person.name === name){
      usersOnlineUnique = usersOnlineUnique.filter(person => person.name != name)
      return io.sockets.emit("people", usersOnlineUnique)
    }
  });
  })


  
  const datosReq = async (datos)=>{
    try {
      const {data} = await axios(`${HMOON_BACKEND_URL}/user/group?email=${datos.email}`)
      console.log(data[0]);
      if(data.length){
        const ranking = [
          {userID: data[0]._id, 
          gameID: "649c4dc5282a3385373aa6fd", 
          cohort: data[0].cohort, 
          group: data[0].group, 
          points: 10}
        ]
        try {
          await axios.post(`${HMOON_BACKEND_URL}/ranking/many`, ranking)
          console.log(ranking);
        } catch (error) {
          console.log('error');
        }
      }
      
    } catch (error) {
      console.log('error');
    }
  }

  server.on('ganador', (datos)=>{
    datosReq(datos)
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
    

    let name = data.split(' ')
    name = name[0]
    usersOnlineUnique.push({name: name, vidas: 2, socketId: idHandShake, email: Email })
    usersOnlineUnique = usersOnlineUnique.filter(person => hash[person.name] ? false : hash[person.name] = true )
    io.sockets.emit("people", usersOnlineUnique)
   /*  people.forEach(element => {
      if(element.name === data){
        usersOnline.push({ name: data, vidas: 2 })
        usersOnlineUnique = usersOnline.filter(person => hash[person.name] ? false : hash[person.name] = true )
        server.emit('ingreso')     
        server.emit("user", data)
        io.sockets.emit("people", usersOnlineUnique)
      }
      }); */
    })
  server.on("online", data=>{
    io.sockets.emit("envivo", data)
  })

  server.on('disconnect', ()=>{
    usersOnlineUnique = usersOnlineUnique.filter(person => person.socketId !== idHandShake)
    io.sockets.emit("people", usersOnlineUnique)})
    /* console.log(usersOnlineUnique); */
})


const PORT = 3005;
server.listen(PORT, () => {
  console.log(`Servidor Socket.IO en funcionamiento en el puerto ${PORT}`);
});