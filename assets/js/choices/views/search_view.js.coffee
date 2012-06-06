class Choices.SearchView extends Choices.TemplateView
  className: "choices__search"
  template:  "js/choices/templates/search"

  events:
    "keyup input":   "keyup"
    "keydown input": "keydown"

  initialize: ->
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
