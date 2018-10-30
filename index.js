process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const app = express()
const server = require('http').createServer(app)
let config = {}
try {
  config = require('./config.json')
} catch (e) {
  console.log('No Config File given')
}

const port = process.env.PORT || config.port
const dropboxApiKey = process.env.DROPBOXAPIKEY || config.dropboxapikey
const dropboxFolder = process.env.DROPBOXFOLDER || config.dropboxfolder

const dfs = require('dropbox-fs/')({
  apiKey: dropboxApiKey
})

const todotxt = require('todotxt')

const regexNotes = /notes:(.*)/g

app.use(bodyParser.json()) // for parsing application/json

app.use(function (req, res, next) { // Enable Cors
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

app.use('/', express.static(path.join(__dirname, 'site'))) // Load Page

app.get('/todo.json', function (req, res) { // Display all Todos as JSON
  getTasks(function (err, tasks) {
    if (err) {
      res.status(500).send(err)
    } else {
      res.json(tasks)
    }
  })
})
app.get('/top10.json', function (req, res) { // Display top 10 Tasks: Prio > Number
  getTasks(function (err, tasks) {
    if (err) {
      res.status(500).send(err)
    } else {
      tasks.sort(function (a, b) {
        if (a.priority === '') a.priority = 'Z' // if no prio, use the last one (Z)
        if (b.priority === '') b.priority = 'Z' // if no prio, use the last one (Z)
        if (a.priority === b.priority) {
          return a.number > b.number ? 1 : -1
        } else {
          return a.priority > b.priority ? 1 : -1
        }
      })
      res.json(tasks.slice(0, 10))
    }
  })
})
app.get('/todo.txt', function (req, res) { // Display all Todos as TXT (eg the File)
  dfs.readFile(path.join(dropboxFolder, 'todo.txt'), {encoding: 'utf8'}, (err, result) => {
    if (err) {
      res.status(500).send(err)
    } else {
      res.send(result)
    }
  })
})

app.get('/projects.json', function (req, res) { // Display all Projects
  dfs.readFile(path.join(dropboxFolder, 'todo.txt'), {encoding: 'utf8'}, (err, result) => {
    if (err) {
      res.status(500).send(err)
    } else {
      let tasks = todotxt.parse(result)
      let projects = []
      tasks.forEach(function (task) {
        projects = projects.concat(task.projects)
      })
      res.json([...new Set(projects)])
    }
  })
})

app.get('/contexts.json', function (req, res) { // Display all Contexts
  dfs.readFile(path.join(dropboxFolder, 'todo.txt'), {encoding: 'utf8'}, (err, result) => {
    if (err) {
      res.status(500).send(err)
    } else {
      let tasks = todotxt.parse(result)
      let contexts = []
      tasks.forEach(function (task) {
        contexts = contexts.concat(task.contexts)
      })
      res.json([...new Set(contexts)])
    }
  })
})

app.get('/priorities.json', function (req, res) { // Display all priorities
  dfs.readFile(path.join(dropboxFolder, 'todo.txt'), {encoding: 'utf8'}, (err, result) => {
    if (err) {
      res.status(500).send(err)
    } else {
      let tasks = todotxt.parse(result)
      let priorities = []
      tasks.forEach(function (task) {
        priorities = priorities.concat(task.priority)
      })
      res.json([...new Set(priorities)])
    }
  })
})

app.post('/quick', function (req, res) { // Add a Line to quick.txt
  let data = req.body
  dfs.readFile(path.join(dropboxFolder, 'quick.txt'), {encoding: 'utf8'}, (err, result) => {
    if (err) {
      res.status(500).send(err)
    } else {
      let content = result + '\n' + data
      dfs.writeFile(path.join(dropboxFolder, 'quick.txt'), content, {encoding: 'utf8'}, (err, stat) => {
        if (err) {
          res.status(500).send(err)
        } else {
          res.status(200).end()
        }
      })
      res.send(result)
    }
  })
})

app.put('/done/:number', function (req, res) { // Mark as Done
  dfs.readFile(path.join(dropboxFolder, 'todo.txt'), {encoding: 'utf8'}, (err, result) => {
    if (err) {
      res.status(500).send(err)
    } else {
      let tasks = todotxt.parse(result)
      for (let index = 0; index < tasks.length; index++) {
        const element = tasks[index]
        if (element.number.toString() === req.params.number.toString()) {
          element.complete = true
          break
        }
      }
      let content = todotxt.stringify(tasks)
      dfs.writeFile(path.join(dropboxFolder, 'todo.txt'), content, {encoding: 'utf8'}, (err, stat) => {
        if (err) {
          res.status(500).send(err)
        } else {
          res.status(200).end()
        }
      })
      res.send(tasks)
    }
  })
})

server.listen(port)

console.log('todotxt-server running on Port ' + port)

function getTasks (callback) {
  dfs.readFile(path.join(dropboxFolder, 'todo.txt'), {encoding: 'utf8'}, (err, result) => {
    if (err) {
      callback(err)
    } else {
      let tasks = todotxt.parse(result)
      tasks.forEach(function (task) {
        let m
        while ((m = regexNotes.exec(task.text)) !== null) {
          // This is necessary to avoid infinite loops with zero-width matches
          if (m.index === regexNotes.lastIndex) {
            regexNotes.lastIndex++
          }
          // The result can be accessed through the `m`-variable.
          m.forEach((match, groupIndex) => {
            task.notes = 'https://notes.webdad.eu/#' + match
          })
        }
        task.cleantext = task.text.replace(/(@\S+)/gi, '').replace(/(\+\S+)/gi, '').replace(/(notes:\S+)/gi, '').trim()
      })
      callback(null, tasks)
    }
  })
}
