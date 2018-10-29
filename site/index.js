/* global angular */ ;
(function () {
  angular.module('todotxt', ['ngCookies'])
    .config(['$locationProvider', function ($locationProvider) {
      $locationProvider.html5Mode(true)
      $locationProvider.hashPrefix('')
    }])
    .filter('join', function () {
      return function join (array, separator, prop) {
        if (!Array.isArray(array)) {
          return array // if not array return original - can also throw error
        }

        return (!angular.isUndefined(prop) ? array.map(function (item) {
          return item[prop]
        }) : array).join(separator)
      }
    })
    .controller('todotxt-Main', ['$http', '$location', '$cookies', function ($http, $location, $cookies) {
      var self = this
      self.tasks = []
      self.contexts = []
      self.projects = []
      self.priorities = []
      self.filterSettings = ''

      let qs = $location.search()
      self.limit = qs.limit || $cookies.get('todotxt-limit') || undefined //  set default limit to none
      self.hideCompleted = qs.hide || $cookies.get('todotxt-hideCompleted') || false //  set default hide parm
      self.sortType = qs.sort || $cookies.get('todotxt-sort') || 'complete' // set the default sort type
      self.sortReverse = qs.reverse || $cookies.get('todotxt-reverse') || false // set the default sort order
      self.contextFilter = qs.context || $cookies.get('todotxt-context') || '' // set by the default filter
      self.projectFilter = qs.project || $cookies.get('todotxt-project') || '' // set by the default filter
      self.priorityFilter = qs.priority || $cookies.get('todotxt-priority') || '' // set by the default filter

      updateFilterSettings()

      loadContexts()
      loadPriorities()
      loadProjects()
      loadTasks()

      this.complete = function (task) {
        $http({
          method: 'PUT',
          url: '/done/' + task.number
        }).then(function () {
          task.complete = true
          loadTasks()
        }).catch(function (data) {
          self.errorMessage = 'Konnte Informationen nicht speichern'
        })
      }

      this.updateFilter = function () {
        updateFilterSettings()
        $cookies.put('todotxt-limit', self.limit)
        $cookies.put('todotxt-hideCompleted', self.hideCompleted)
        $cookies.put('todotxt-sort', self.sortType)
        $cookies.put('todotxt-reverse', self.sortReverse)
        $cookies.put('todotxt-context', self.contextFilter)
        $cookies.put('todotxt-project', self.projectFilter)
        $cookies.put('todotxt-priority', self.priorityFilter)
      }

      function updateFilterSettings () {
        self.filterSettings = (self.limit && self.limit !== 'null' && self.limit !== undefined) ? self.limit + ' ' : ''
        self.filterSettings += (self.priorityFilter) ? '(' + self.priorityFilter + ') ' : ''
        self.filterSettings += (self.contextFilter) ? '@' + self.contextFilter + ' ' : ''
        self.filterSettings += (self.projectFilter) ? '+' + self.projectFilter + ' ' : ''
      }

      function loadTasks () {
        $http({
          method: 'GET',
          url: '/todo.json'
        }).then(function (tasks) {
          self.tasks = tasks.data
        }).catch(function (data) {
          self.errorMessage = 'Konnte keine Bilder laden.'
        })
      }

      function loadContexts () {
        $http({
          method: 'GET',
          url: '/contexts.json'
        }).then(function (contexts) {
          self.contexts = contexts.data
        }).catch(function (data) {
          self.errorMessage = 'Konnte keine Bilder laden.'
        })
      }

      function loadPriorities () {
        $http({
          method: 'GET',
          url: '/priorities.json'
        }).then(function (priorities) {
          self.priorities = priorities.data
        }).catch(function (data) {
          self.errorMessage = 'Konnte keine Bilder laden.'
        })
      }

      function loadProjects () {
        $http({
          method: 'GET',
          url: '/projects.json'
        }).then(function (projects) {
          self.projects = projects.data
        }).catch(function (data) {
          self.errorMessage = 'Konnte keine Bilder laden.'
        })
      }
    }])
})()
