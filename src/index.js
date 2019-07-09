const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const { generateMessage, generateLocation } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)
app.use(express.json())

const port = 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

let count = 0

io.on('connection', (socket) => {
  
  socket.on('join', (options, callback) => {
    const { error , user } = addUser({ id: socket.id, ...options })
    if(error) {
      return callback(error)
    }
    socket.join(user.room)
    
    socket.emit('message', generateMessage('Admin','Welcome'))
    socket.broadcast.to(user.room).emit('message', generateMessage('Admin',`${user.username} has joined`))
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    })
    callback()
  })

  socket.on('sendmessage', (message, callback) => { 
    const user = getUser(socket.id)
    io.to(user.room).emit('message', generateMessage(user.username,message));
    callback('Delivered')
  })

  socket.on('send-location-msg', (coords, callback) => {
    const user = getUser(socket.id)
    console.log()
    io.to(user.room).emit('sentLocation', generateLocation(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
    callback()
  })

  socket.on('disconnect', () => {
    const user = removeUser(socket.id)
    if(user) {
      io.emit('message', generateMessage(`${user.username} has left`))
    }
  })
})

server.listen(port, ()=> {
  console.log('Server is running on' + port )
})
