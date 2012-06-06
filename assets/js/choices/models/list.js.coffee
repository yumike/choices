define 'choices/models/list', ->
  class List extends Backbone.Model
    initialize: ->
      @data = new Backbone.Model
