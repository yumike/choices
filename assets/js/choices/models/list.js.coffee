define 'choices/models/list', [
  'backbone'
], (Backbone) ->
  class List extends Backbone.Model
    initialize: ->
      @data = new Backbone.Model
