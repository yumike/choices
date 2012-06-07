define 'choices/views/search_view', [
  'choices/views/view'
], (View) ->

  class SearchView extends View
    className: "choices__search"
    template:  "js/choices/templates/search"

    events:
      "keyup input":   "keyup"
      "keydown input": "keydown"

    initialize: ->
      super
      @list = @options.list

    keyup: (event) =>
      clearTimeout @timeoutId if @timeoutId?
      @timeoutId = setTimeout @change, 300

    keydown: (event) =>
      if event.which == 13
        clearTimeout @timeoutId if @timeoutId?
        @change()

    change: =>
      @list.data.set query: @$("input").val()
