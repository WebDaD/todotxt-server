const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const app = express()
const server = require('http').createServer(app)
const config = require('./config.json')

const port = process.env.PORT || config.port
const dropboxApiKey = process.env.DROPBOXAPIKEY || config.dropboxapikey

const dfs = require('dropbox-fs/')({
  apiKey: dropboxApiKey
})

const todotxt = require('todotxt')

app.use(bodyParser.json()) // for parsing application/json

app.use('/', express.static(path.join(__dirname, 'site'))) // Load Page

app.get('/todo.json', function (req, res) { // Display all Todos as JSON
  dfs.readFile('/br/todos/todo.txt', {encoding: 'utf8'}, (err, result) => {
    if (err) {
      res.status(500).send(err)
    } else {
      let tasks = todotxt.parse(result)
      res.json(tasks)
    }
  })
})
app.get('/todo.txt', function (req, res) { // Display all Todos as TXT (eg the File)
  dfs.readFile('/br/todos/todo.txt', {encoding: 'utf8'}, (err, result) => {
    if (err) {
      res.status(500).send(err)
    } else {
      res.send(result)
    }
  })
})

app.get('/projects.json', function (req, res) { // Display all Projects
  dfs.readFile('/br/todos/todo.txt', {encoding: 'utf8'}, (err, result) => {
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
  dfs.readFile('/br/todos/todo.txt', {encoding: 'utf8'}, (err, result) => {
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

app.post('/quick', function (req, res) { // Add a Line to quick.txt
  let data = req.body
  dfs.readFile('/br/todos/quick.txt', {encoding: 'utf8'}, (err, result) => {
    if (err) {
      res.status(500).send(err)
    } else {
      let content = result + '\n' + data
      dfs.writeFile('/br/todos/quick.txt', content, {encoding: 'utf8'}, (err, stat) => {
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
  dfs.readFile('/br/todos/todo.txt', {encoding: 'utf8'}, (err, result) => {
    if (err) {
      res.status(500).send(err)
    } else {
      let tasks = todotxt.parse(result)
      tasks.forEach(function (task) {
        if (task.number === req.params.number) {
          task.complete = true
        }
      })
      let content = todotxt.stringify(tasks)
      dfs.writeFile('/br/todos/todo.txt', content, {encoding: 'utf8'}, (err, stat) => {
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

server.listen(port)

console.log('todotxt-server running on Port ' + port)
