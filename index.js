const followers1 = require('./followers1-100.json')
const followers2 = require('./followers2-100.json')

const following1 = require('./following1-100.json')
const following2 = require('./following2-100.json')
const following3 = require('./following3-100.json')


let followingNames = []
let followersNames = []
let counter = 0
let counter2 = 0

following1.map(user => {
  followingNames.push([user.id, user.url])
  counter++
})
following2.map(user => {
  followingNames.push([user.id, user.url])
  counter++
})
following3.map(user => {
  followingNames.push([user.id, user.url])
  counter++
})

//console.log(followingNames)
followers1.map(user => {
  followersNames.push([user.id, user.url])
  counter2++
})
followers2.map(user => {
  followersNames.push([user.id, user.url])
  counter2++
})


let banned = []
let c1 = 0
let c2 = 0
let position = 0

for (let x = 0; x < followingNames.length; x++) {
  for (let y = 0; y < followersNames.length; y++) {
    if(followingNames[x][1] === followersNames[y][1]) {
      c1++
    }    
  }
  
  if(c1 == 0) {
    banned.push(followingNames[x])
  }
  c1 = 0
}

console.log('followingNames', followingNames.length)
console.log('followersNames', followersNames.length)
console.log('banneds', banned.length)
console.log('They are...', banned)

