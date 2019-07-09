const socket = io()

const $messForm = document.querySelector('#sendMessage')
const $messageFormInput = $messForm.querySelector('input')
const $messageFormButton = $messForm.querySelector('button')
const $locationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messagesbody')
const $locationmessages = document.querySelector('#locationbody')

const messTemplate = document.querySelector('#message-template').innerHTML
const locTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// options

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
  const $newMessage = $messages.lastElementChild

  const newMessageStyles = getComputedStyle($newMessage)
  const newMessageMargin = parseInt(newMessageStyles.marginBottom)

  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
  const visibleHeight = $messages.offsetHeight;

  const containerHeight = $messages.offsetHeight

  const scrollOffset = $messages.scrollTop + visibleHeight
  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight
  }
}
socket.on('message', (mesg)=> {
  console.log(mesg)
  const html = Mustache.render(messTemplate, {
    username: mesg.username,
    mesg: mesg.text,
    createdAt: moment(mesg.createdAt).format('h:mm A')
  })
  $messages.insertAdjacentHTML('beforeend', html)
})

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  })
  document.querySelector('#sidebar').innerHTML = html;
})
socket.on('sentLocation', (url) => {
  console.log(url)
  const html1 = Mustache.render(locTemplate, {
    username: url.username,
    url: url.url,
    createdAt: moment(url.createdAt).format('h:mm A')
  })
  $messages.insertAdjacentHTML('beforeend', html1)
})

$messForm.addEventListener('submit', 
(e) => {
  e.preventDefault()
  $messageFormButton.setAttribute('disabled', 'disabled')
  const message = e.target.elements.message.value;
  socket.emit('sendmessage', message, (meg) => {
    $messageFormButton.removeAttribute('disabled')
    $messageFormInput.value = ''
    $messageFormInput.focus()
     console.log(meg);
    autoscroll()
  })
})

$locationButton.addEventListener('click', () => {
  if (!navigator.geolocation) {
    return alert('Geolocation is not supported')
  }
  $locationButton.setAttribute('disabled', 'disabled')
  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit('send-location-msg', {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    }, () =>{
        $locationButton.removeAttribute('disabled')
        console.log('Location Shared')
    })
  })
})

socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error)
    location.href = '/'
  }
})