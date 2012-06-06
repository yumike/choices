define 'choices/models/list', [
  'chaplin/models/model'
], (Model) ->

  class List extends Model
    initialize: ->
      @data = new Model
